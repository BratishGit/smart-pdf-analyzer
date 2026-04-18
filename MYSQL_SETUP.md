# MySQL Setup Guide — Smart PDF Analyzer

This guide covers connecting the backend to MySQL 8 instead of the default embedded H2 database. Use this for local development with a real database, staging environments, or self-hosted production servers. For AWS RDS, see [AWS_SETUP.md](AWS_SETUP.md).

---

## How the MySQL Profile Works

The backend uses Spring Profiles to switch databases without code changes. When you activate the `mysql` profile, Spring loads `application-mysql.properties` on top of the base `application.properties`, overriding only the database-related settings. Everything else (JWT, CORS, Gemini API, logging) stays the same.

The key differences from the default H2 profile:

| Setting | H2 (default) | MySQL |
|---|---|---|
| Database | Embedded, file-based | External MySQL 8 server |
| Driver | `org.h2.Driver` | `com.mysql.cj.jdbc.Driver` |
| Dialect | `H2Dialect` | `MySQL8Dialect` |
| H2 Console | Enabled at `/h2-console` | Disabled |
| Connection pool | Basic | HikariCP tuned (10 max connections) |
| Charset | Default | `utf8mb4` (full Unicode, supports emoji) |

---

## Option A — Local MySQL Installation

### Step 1: Install MySQL 8

**Ubuntu / Debian:**
```bash
sudo apt update
sudo apt install mysql-server -y
sudo systemctl start mysql
sudo systemctl enable mysql     # start automatically on reboot
sudo mysql_secure_installation  # recommended: set root password, remove test DB
```

**macOS (Homebrew):**
```bash
brew install mysql
brew services start mysql
```

**Windows:**
Download and run the MySQL Installer from https://dev.mysql.com/downloads/installer/. Select "MySQL Server 8.0" and "MySQL Workbench" (optional GUI).

Verify the installation:
```bash
mysql --version
# Expected: mysql  Ver 8.0.xx ...
```

### Step 2: Create the Database and User

Connect to MySQL as root:
```bash
mysql -u root -p
```

Run these SQL commands:
```sql
-- Create the database with full Unicode support
CREATE DATABASE pdfanalyzer
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Create a dedicated user (never use root for your application)
CREATE USER 'pdfuser'@'localhost' IDENTIFIED BY 'pdfpass';

-- Grant all privileges on the pdfanalyzer database only
GRANT ALL PRIVILEGES ON pdfanalyzer.* TO 'pdfuser'@'localhost';

-- Apply the changes
FLUSH PRIVILEGES;

-- Verify
SHOW DATABASES;
SELECT user, host FROM mysql.user WHERE user = 'pdfuser';
EXIT;
```

> **Security note**: Change `pdfpass` to a strong password. Use a password manager to generate something like `Xk9#mP2@vL5qR8!`.

### Step 3: Run the Backend with MySQL Profile

```bash
cd pdf-analyzer-backend

# Option A — pass profile as a Maven flag
mvn spring-boot:run -Dspring-boot.run.profiles=mysql

# Option B — set environment variable (persists for the terminal session)
export SPRING_PROFILES_ACTIVE=mysql
mvn spring-boot:run

# Option C — override credentials inline without changing properties files
mvn spring-boot:run \
  -Dspring-boot.run.profiles=mysql \
  -Dspring-boot.run.jvmArguments="-DDB_HOST=localhost -DDB_USERNAME=pdfuser -DDB_PASSWORD=yourpassword"
```

**Windows PowerShell:**
```powershell
$env:SPRING_PROFILES_ACTIVE = "mysql"
$env:DB_PASSWORD = "yourpassword"
mvn spring-boot:run -Dspring-boot.run.profiles=mysql
```

Hibernate will auto-create the four tables (`users`, `documents`, `document_chunks`, `chat_interactions`) on first startup. You will see log lines like:
```
Hibernate: create table users (...)
Hibernate: create table documents (...)
```

---

## Option B — MySQL via Docker (Zero-Install)

If you don't want to install MySQL on your machine, Docker gives you a clean MySQL instance in one command.

**Prerequisites:** Install Docker Desktop from https://www.docker.com/products/docker-desktop/

```bash
# Start a MySQL 8 container
docker run -d \
  --name pdfanalyzer-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpass \
  -e MYSQL_DATABASE=pdfanalyzer \
  -e MYSQL_USER=pdfuser \
  -e MYSQL_PASSWORD=pdfpass \
  -p 3306:3306 \
  --restart unless-stopped \
  mysql:8.0

# Wait until MySQL is ready to accept connections
docker exec pdfanalyzer-mysql mysqladmin ping \
  -u root -prootpass \
  --wait=30 \
  --silent

echo "MySQL is ready"
```

Run the backend:
```bash
export SPRING_PROFILES_ACTIVE=mysql
export DB_HOST=localhost
export DB_USERNAME=pdfuser
export DB_PASSWORD=pdfpass
cd pdf-analyzer-backend
mvn spring-boot:run -Dspring-boot.run.profiles=mysql
```

Useful Docker commands:
```bash
# Check if the container is running
docker ps | grep pdfanalyzer-mysql

# View MySQL logs
docker logs pdfanalyzer-mysql

# Connect to MySQL inside the container
docker exec -it pdfanalyzer-mysql mysql -u pdfuser -ppdfpass pdfanalyzer

# Stop the container (data is preserved in the Docker volume)
docker stop pdfanalyzer-mysql

# Start it again later
docker start pdfanalyzer-mysql

# Delete the container and all data (irreversible)
docker rm -f pdfanalyzer-mysql
```

---

## Environment Variables Reference

Set these as environment variables instead of editing `application-mysql.properties` — this keeps credentials out of source control.

| Variable | Default in properties | Description |
|---|---|---|
| `DB_HOST` | `localhost` | Hostname or IP of the MySQL server |
| `DB_PORT` | `3306` | MySQL port |
| `DB_NAME` | `pdfanalyzer` | Database name |
| `DB_USERNAME` | `pdfuser` | MySQL username |
| `DB_PASSWORD` | `pdfpass` | MySQL password |
| `SPRING_PROFILES_ACTIVE` | *(unset)* | Set to `mysql` to activate this profile |

---

## Verifying the Setup

After starting the backend with the MySQL profile, connect to MySQL and check the tables:

```sql
mysql -u pdfuser -ppdfpass pdfanalyzer

SHOW TABLES;
```

Expected output:
```
+------------------------+
| Tables_in_pdfanalyzer  |
+------------------------+
| chat_interactions      |
| document_chunks        |
| documents              |
| users                  |
+------------------------+
```

Check the documents table structure:
```sql
DESCRIBE documents;
```

Verify the demo user was seeded:
```sql
SELECT id, username, email, created_at FROM users;
```

---

## HikariCP Connection Pool Settings

The MySQL profile uses HikariCP (Spring Boot's default connection pool) with these settings in `application-mysql.properties`:

| Setting | Value | Why |
|---|---|---|
| `maximum-pool-size` | 10 | Max concurrent database connections. Each Spring thread can hold one. |
| `minimum-idle` | 2 | Keep 2 connections open always, avoiding cold-start latency. |
| `idle-timeout` | 300000ms (5 min) | Close idle connections after 5 minutes to free MySQL resources. |
| `connection-timeout` | 20000ms (20s) | Fail fast if MySQL is unreachable rather than hanging indefinitely. |
| `max-lifetime` | 1200000ms (20 min) | Recycle connections before MySQL's `wait_timeout` closes them. |
| `keepalive-time` | 60000ms (1 min) | Send a `SELECT 1` keepalive to prevent idle connections being dropped by firewalls. |
| `connection-test-query` | `SELECT 1` | Validates a connection is alive before using it. |

These settings are appropriate for a single-server deployment. For high-traffic production, increase `maximum-pool-size` (but check your MySQL `max_connections` first — default is 151).

---

## Production Checklist

Before deploying to a production MySQL server:

- [ ] Change `spring.jpa.hibernate.ddl-auto` from `update` to `validate` in `application-mysql.properties`. This prevents Hibernate from modifying your production schema automatically. Manage schema changes with Flyway migrations instead.
- [ ] Add Flyway for schema migrations: create `src/main/resources/db/migration/V1__init.sql` and add the `flyway-core` dependency to `pom.xml`.
- [ ] Use a strong, unique password — not `pdfpass`.
- [ ] Restrict the MySQL user to only needed operations: `GRANT SELECT, INSERT, UPDATE, DELETE ON pdfanalyzer.* TO 'pdfuser'@'%'` (remove `CREATE`, `DROP`, `ALTER`).
- [ ] Enable SSL on the JDBC connection: the URL in `application-mysql.properties` already has `useSSL=false` for local dev — change to `useSSL=true&requireSSL=true` for production.
- [ ] Set up automated backups: `mysqldump pdfanalyzer | gzip > backup_$(date +%F).sql.gz` in a cron job, or use your hosting provider's backup feature.
- [ ] Store the DB password in an environment variable or secret manager — never commit it to source control.
- [ ] Remove or disable `DataSeeder.java` (add `@Profile("dev")`) so the demo user is not created in production.
