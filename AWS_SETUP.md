# AWS Deployment Guide — Smart PDF Analyzer

This guide deploys the backend to AWS with:
- **Amazon RDS MySQL 8** — production database (replaces H2/local MySQL)
- **Amazon S3** — file storage (replaces local disk)
- **AWS Systems Manager Parameter Store** — secrets management (JWT key, Gemini API key, DB password)
- **Amazon EC2** — application server running the Spring Boot JAR

When the `aws` Spring profile is active, `AwsConfig.java` automatically reads secrets from SSM and injects them into the application at startup — no secrets are ever written to properties files or environment variables.

---

## Architecture

```
User Browser
     │  HTTPS
     ▼
[Optional: CloudFront CDN + ALB]
     │
     ▼
EC2 t3.micro — Spring Boot JAR (profile=aws)
     │                    │
     │                    │ AWS SDK v2
     │              ┌─────┴──────────────────────┐
     │              │                            │
     ▼              ▼                            ▼
RDS MySQL 8    S3 Bucket               SSM Parameter Store
(documents,    (uploaded PDFs,         (jwt-secret,
 users, chat)   server-side            gemini-api-key,
                encrypted)             db-password)
```

---

## Prerequisites

**AWS CLI v2:**
```bash
# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o awscliv2.zip
unzip awscliv2.zip && sudo ./aws/install

# macOS
brew install awscli

# Windows — download installer from:
# https://aws.amazon.com/cli/
```

**Configure credentials:**
```bash
aws configure
# AWS Access Key ID:     AKIA...
# AWS Secret Access Key: ...
# Default region name:   ap-south-1   (or your preferred region)
# Default output format: json
```

Set your working region:
```bash
export AWS_REGION=ap-south-1
```

---

## Step 1 — Create the S3 Bucket

```bash
# Generate a unique bucket name using your AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export BUCKET_NAME="pdfanalyzer-uploads-${ACCOUNT_ID}"

echo "Bucket name: $BUCKET_NAME"

# Create the bucket
aws s3 mb s3://$BUCKET_NAME --region $AWS_REGION

# Block all public access — files are served through your API, not directly
aws s3api put-public-access-block \
  --bucket $BUCKET_NAME \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Enable versioning — allows recovery of accidentally deleted files
aws s3api put-bucket-versioning \
  --bucket $BUCKET_NAME \
  --versioning-configuration Status=Enabled

# Enable AES-256 server-side encryption by default
aws s3api put-bucket-encryption \
  --bucket $BUCKET_NAME \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"},
      "BucketKeyEnabled": true
    }]
  }'

# Lifecycle rule: abort incomplete multipart uploads after 7 days
aws s3api put-bucket-lifecycle-configuration \
  --bucket $BUCKET_NAME \
  --lifecycle-configuration '{
    "Rules": [{
      "ID": "AbortIncompleteMultipart",
      "Status": "Enabled",
      "Filter": {"Prefix": ""},
      "AbortIncompleteMultipartUpload": {"DaysAfterInitiation": 7}
    }]
  }'

echo "S3 bucket ready: s3://$BUCKET_NAME"
```

---

## Step 2 — Create RDS MySQL

This creates a Free Tier eligible RDS MySQL 8 instance. Production workloads should use `db.t3.small` or larger with Multi-AZ enabled.

```bash
# Generate a strong random password
DB_PASSWORD=$(openssl rand -base64 20 | tr -dc 'A-Za-z0-9' | head -c 20)
echo "Generated DB password: $DB_PASSWORD"
echo "(Save this — you will store it in SSM in the next step)"

# Create the RDS instance
aws rds create-db-instance \
  --db-instance-identifier pdfanalyzer-db \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --engine-version "8.0" \
  --master-username admin \
  --master-user-password "$DB_PASSWORD" \
  --allocated-storage 20 \
  --db-name pdfanalyzer \
  --backup-retention-period 7 \
  --storage-encrypted \
  --no-multi-az \
  --region $AWS_REGION

echo "RDS creation started. This takes 5-10 minutes..."

# Wait until the instance is available
aws rds wait db-instance-available \
  --db-instance-identifier pdfanalyzer-db \
  --region $AWS_REGION

echo "RDS is available"

# Get the endpoint hostname
export DB_HOST=$(aws rds describe-db-instances \
  --db-instance-identifier pdfanalyzer-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text \
  --region $AWS_REGION)

echo "RDS endpoint: $DB_HOST"
```

> **Note on security groups**: By default, the RDS instance is not publicly accessible. In a VPC setup, place both EC2 and RDS in the same VPC and allow port 3306 from the EC2 security group. For a quick test with public access enabled, add `--publicly-accessible` to the create command and add port 3306 to the security group for your IP only.

---

## Step 3 — Store Secrets in SSM Parameter Store

SSM Parameter Store stores secrets encrypted with KMS. The application reads them at startup via `AwsConfig.java` — they are never written to disk or environment variables on the server.

```bash
# JWT signing secret — generate a strong 64-character random key
JWT_SECRET=$(openssl rand -base64 64 | tr -dc 'A-Za-z0-9' | head -c 64)

aws ssm put-parameter \
  --name "/pdfanalyzer/prod/jwt-secret" \
  --value "$JWT_SECRET" \
  --type SecureString \
  --description "JWT HMAC-SHA256 signing secret" \
  --region $AWS_REGION

# Google Gemini API key — get yours at https://aistudio.google.com/
aws ssm put-parameter \
  --name "/pdfanalyzer/prod/gemini-api-key" \
  --value "AIzaSy_REPLACE_WITH_YOUR_KEY" \
  --type SecureString \
  --description "Google Gemini 1.5 Flash API key" \
  --region $AWS_REGION

# RDS password — use the password generated in Step 2
aws ssm put-parameter \
  --name "/pdfanalyzer/prod/db-password" \
  --value "$DB_PASSWORD" \
  --type SecureString \
  --description "RDS MySQL master password" \
  --region $AWS_REGION

echo "All secrets stored in SSM"

# Verify
aws ssm describe-parameters \
  --filters "Key=Path,Values=/pdfanalyzer/" \
  --region $AWS_REGION
```

---

## Step 4 — Create the IAM Role

The EC2 instance needs an IAM role to access S3 and SSM without hardcoded credentials.

```bash
# Create trust policy (allows EC2 to assume this role)
cat > /tmp/ec2-trust-policy.json << 'JSON'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "ec2.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
JSON

# Create the role
aws iam create-role \
  --role-name PdfAnalyzerAppRole \
  --assume-role-policy-document file:///tmp/ec2-trust-policy.json \
  --description "Role for Smart PDF Analyzer EC2 instances"

# Create the permissions policy
cat > /tmp/pdfanalyzer-policy.json << JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3ReadWrite",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
    },
    {
      "Sid": "S3List",
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::${BUCKET_NAME}"
    },
    {
      "Sid": "SSMReadSecrets",
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters"
      ],
      "Resource": "arn:aws:ssm:${AWS_REGION}:${ACCOUNT_ID}:parameter/pdfanalyzer/*"
    },
    {
      "Sid": "KMSDecrypt",
      "Effect": "Allow",
      "Action": ["kms:Decrypt"],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "kms:ViaService": "ssm.${AWS_REGION}.amazonaws.com"
        }
      }
    }
  ]
}
JSON

# Attach the policy to the role
aws iam put-role-policy \
  --role-name PdfAnalyzerAppRole \
  --policy-name PdfAnalyzerPermissions \
  --policy-document file:///tmp/pdfanalyzer-policy.json

# Create instance profile and attach role
aws iam create-instance-profile \
  --instance-profile-name PdfAnalyzerInstanceProfile

aws iam add-role-to-instance-profile \
  --instance-profile-name PdfAnalyzerInstanceProfile \
  --role-name PdfAnalyzerAppRole

echo "IAM role and instance profile created"
```

---

## Step 5 — Build the JAR

Build on your local machine and upload the JAR to EC2. This avoids installing Maven on the server.

```bash
cd pdf-analyzer-backend

# Build (skip tests to speed things up)
mvn clean package -DskipTests

# Verify the JAR was created
ls -lh target/pdf-analyzer-backend-1.0.0.jar
```

---

## Step 6 — Launch and Configure EC2

```bash
# Launch EC2 (Amazon Linux 2023, t3.micro = Free Tier)
# Replace YOUR_KEY_PAIR with your EC2 key pair name
# Replace sg-xxxxxxxxx with your security group ID

INSTANCE_ID=$(aws ec2 run-instances \
  --image-id ami-0f58b397bc5c1f2e8 \
  --instance-type t3.micro \
  --iam-instance-profile Name=PdfAnalyzerInstanceProfile \
  --key-name YOUR_KEY_PAIR \
  --security-group-ids sg-xxxxxxxxx \
  --region $AWS_REGION \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=pdfanalyzer-app}]' \
  --query 'Instances[0].InstanceId' \
  --output text)

echo "Launched EC2: $INSTANCE_ID"

# Wait until running
aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $AWS_REGION

# Get public IP
EC2_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text \
  --region $AWS_REGION)

echo "EC2 public IP: $EC2_IP"
```

**Configure the security group:**
```bash
# The security group needs these inbound rules:
# Port 22   (SSH)   — your IP only, for deployment
# Port 8080 (HTTP)  — from your frontend IP, or 0.0.0.0/0 if using CloudFront

# Get your current public IP
MY_IP=$(curl -s https://checkip.amazonaws.com)

aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp --port 22 \
  --cidr "${MY_IP}/32"

aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp --port 8080 \
  --cidr "0.0.0.0/0"
```

---

## Step 7 — Deploy and Run

```bash
# Copy the JAR to EC2
scp -i YOUR_KEY.pem \
  pdf-analyzer-backend/target/pdf-analyzer-backend-1.0.0.jar \
  ec2-user@$EC2_IP:/home/ec2-user/

# SSH to the server and start the application
ssh -i YOUR_KEY.pem ec2-user@$EC2_IP << REMOTE

# Install Java 17 (Amazon Corretto)
sudo dnf install -y java-17-amazon-corretto-headless

# Verify
java -version

# Create a startup script
cat > /home/ec2-user/start.sh << 'SCRIPT'
#!/bin/bash
export SPRING_PROFILES_ACTIVE=aws
export AWS_REGION=ap-south-1
export DB_HOST=REPLACE_WITH_YOUR_RDS_ENDPOINT
export DB_USERNAME=admin
export S3_BUCKET_NAME=REPLACE_WITH_YOUR_BUCKET_NAME

nohup java -Xms256m -Xmx512m \
  -jar /home/ec2-user/pdf-analyzer-backend-1.0.0.jar \
  > /home/ec2-user/app.log 2>&1 &

echo "Started with PID: \$!"
SCRIPT

chmod +x /home/ec2-user/start.sh

# Edit the script with your actual values, then run it
# Replace REPLACE_WITH_YOUR_RDS_ENDPOINT and REPLACE_WITH_YOUR_BUCKET_NAME
nano /home/ec2-user/start.sh

# Start the application
/home/ec2-user/start.sh

# Tail the logs to confirm startup
sleep 10
tail -50 /home/ec2-user/app.log

REMOTE
```

You should see log output ending with something like:
```
Started PdfAnalyzerApplication in 12.3 seconds
Tomcat started on port(s): 8080
```

Test the API:
```bash
curl http://$EC2_IP:8080/actuator/health
# Expected: {"status":"UP"}
```

---

## Step 8 — Configure the Frontend for Production

Update the React app's API URL to point to your EC2 instance:

```bash
cd react_app_demo
echo "REACT_APP_API_URL=http://$EC2_IP:8080/api" > .env.production
npm run build
```

The `build/` folder contains a static site. Host it on:
- **S3 + CloudFront** (recommended, free tier eligible)
- **Netlify / Vercel** (simplest option)
- **The same EC2** using nginx to serve static files

---

## Useful Operations

**View live logs:**
```bash
ssh -i YOUR_KEY.pem ec2-user@$EC2_IP
tail -f /home/ec2-user/app.log
```

**Restart the application:**
```bash
ssh -i YOUR_KEY.pem ec2-user@$EC2_IP
pkill -f pdf-analyzer-backend
sleep 3
/home/ec2-user/start.sh
```

**List uploaded files in S3:**
```bash
aws s3 ls s3://$BUCKET_NAME/uploads/ --recursive --human-readable --summarize
```

**Connect to RDS from your local machine (if publicly accessible):**
```bash
mysql -h $DB_HOST -u admin -p pdfanalyzer
```

**Update a secret in SSM:**
```bash
aws ssm put-parameter \
  --name "/pdfanalyzer/prod/gemini-api-key" \
  --value "new-key-value" \
  --type SecureString \
  --overwrite \
  --region $AWS_REGION

# Then restart the app for the new value to take effect
```

**Get all SSM parameters for this app:**
```bash
aws ssm get-parameters-by-path \
  --path "/pdfanalyzer/prod/" \
  --with-decryption \
  --region $AWS_REGION
```

---

## Running Locally Against Real AWS (Hybrid Mode)

You can run the backend on your laptop while using a real S3 bucket and SSM parameters. Useful for testing the AWS integration without deploying.

```bash
export SPRING_PROFILES_ACTIVE=aws
export AWS_REGION=ap-south-1
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=...
export DB_HOST=pdfanalyzer-db.xxxx.rds.amazonaws.com
export DB_USERNAME=admin
export S3_BUCKET_NAME=$BUCKET_NAME
# DB_PASSWORD, JWT secret, Gemini key are read from SSM automatically

cd pdf-analyzer-backend
mvn spring-boot:run -Dspring-boot.run.profiles=aws
```

---

## Cost Estimate (ap-south-1, Free Tier)

| Service | Free Tier | Estimated cost after free tier |
|---|---|---|
| EC2 t3.micro | 750 hours/month for 12 months | ~$8/month |
| RDS db.t3.micro | 750 hours/month for 12 months | ~$15/month |
| RDS storage 20GB | 20GB for 12 months | ~$2.40/month |
| S3 storage | 5GB for 12 months | ~$0.10/GB/month |
| SSM Parameter Store | Free for standard parameters | Free |
| Data transfer | 1GB/month free | ~$0.09/GB after |

Total ongoing cost (after free tier): approximately **$25–30/month** for a light workload.

---

## Security Checklist

- [ ] S3 bucket has **Block All Public Access** enabled — files are served via your API, never directly
- [ ] RDS is **not publicly accessible** — only reachable from EC2 in the same VPC
- [ ] SSH port 22 is restricted to **your IP only** — not `0.0.0.0/0`
- [ ] Secrets are in **SSM SecureString** — not in environment variables, `.env` files, or properties files
- [ ] IAM role uses **least privilege** — only the S3 and SSM permissions actually needed
- [ ] `DataSeeder.java` is disabled (add `@Profile("dev")`) — demo user not created in production
- [ ] `spring.jpa.hibernate.ddl-auto=validate` — schema not auto-modified in production
- [ ] HTTPS configured via CloudFront or an ALB with an ACM certificate
- [ ] Backend `app.cors.allowed-origins` set to your actual frontend domain, not `localhost`
