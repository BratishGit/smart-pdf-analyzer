package com.pdfanalyzer.config.aws;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.ssm.SsmClient;
import software.amazon.awssdk.services.ssm.model.GetParameterRequest;
import software.amazon.awssdk.services.ssm.model.GetParameterResponse;

import jakarta.annotation.PostConstruct;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.HashMap;
import java.util.Map;

/**
 * AwsConfig — Active only when profile = "aws"
 *
 * Responsibilities:
 *  1. Creates the S3Client bean used by AwsS3StorageService for file operations.
 *  2. Creates the SsmClient bean for reading secrets.
 *  3. On @PostConstruct, reads JWT secret + Gemini API key from SSM Parameter
 *     Store and injects them into the Spring Environment so the rest of the app
 *     works exactly the same as in local/mysql mode.
 *
 * SSM Parameter paths expected:
 *   /pdfanalyzer/prod/jwt-secret       (SecureString)
 *   /pdfanalyzer/prod/gemini-api-key   (SecureString)
 *   /pdfanalyzer/prod/db-password      (SecureString) – optional, can use env var
 *
 * Credentials resolution order (AWS SDK default chain):
 *   1. Environment variables:  AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
 *   2. ~/.aws/credentials file
 *   3. EC2 / ECS / Lambda instance role (recommended for deployed environments)
 */
@Configuration
@Profile("aws")
@Slf4j
public class AwsConfig {

    @Value("${cloud.aws.region:ap-south-1}")
    private String awsRegion;

    // Optional static credentials (for local testing against real AWS)
    // Leave blank on EC2/ECS – the instance role will be used automatically
    @Value("${cloud.aws.credentials.access-key:}")
    private String accessKey;

    @Value("${cloud.aws.credentials.secret-key:}")
    private String secretKey;

    @Value("${cloud.aws.s3.bucket}")
    private String bucketName;

    // SSM parameter name prefixes
    private static final String SSM_PREFIX = "/pdfanalyzer/prod/";

    private final ConfigurableEnvironment environment;

    public AwsConfig(ConfigurableEnvironment environment) {
        this.environment = environment;
    }

    // ── S3 Client ─────────────────────────────────────────────────────────────
    @Bean
    public S3Client s3Client() {
        Region region = Region.of(awsRegion);

        // Use static credentials if explicitly provided; otherwise use default chain
        // (env vars → ~/.aws/credentials → EC2 instance role)
        if (!accessKey.isBlank() && !secretKey.isBlank()) {
            log.info("S3Client: using static credentials (local dev / CI mode)");
            return S3Client.builder()
                    .region(region)
                    .credentialsProvider(StaticCredentialsProvider.create(
                            AwsBasicCredentials.create(accessKey, secretKey)))
                    .build();
        }

        log.info("S3Client: using DefaultCredentialsProvider (IAM role / env vars)");
        return S3Client.builder()
                .region(region)
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }

    // ── SSM Client ────────────────────────────────────────────────────────────
    @Bean
    public SsmClient ssmClient() {
        Region region = Region.of(awsRegion);

        if (!accessKey.isBlank() && !secretKey.isBlank()) {
            return SsmClient.builder()
                    .region(region)
                    .credentialsProvider(StaticCredentialsProvider.create(
                            AwsBasicCredentials.create(accessKey, secretKey)))
                    .build();
        }

        return SsmClient.builder()
                .region(region)
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }

    /**
     * After all beans are created, pull secrets from SSM and inject them into
     * the Spring Environment. This happens before any service reads @Value fields,
     * so the rest of the app never knows secrets came from SSM.
     */
    @PostConstruct
    public void loadSecretsFromSsm() {
        log.info("Loading secrets from AWS SSM Parameter Store (region: {})", awsRegion);
        SsmClient ssm = ssmClient();
        Map<String, Object> ssmProps = new HashMap<>();

        ssmProps.put("app.jwt.secret",    fetchSsmParam(ssm, "jwt-secret"));
        ssmProps.put("ai.gemini.api-key", fetchSsmParam(ssm, "gemini-api-key"));

        // Optionally override DB password from SSM (if not already set via env var)
        String dbPassword = fetchSsmParamOptional(ssm, "db-password");
        if (dbPassword != null) {
            ssmProps.put("DB_PASSWORD", dbPassword);
            ssmProps.put("spring.datasource.password", dbPassword);
        }

        // Inject into the HIGHEST priority property source so it overrides everything
        environment.getPropertySources()
                .addFirst(new MapPropertySource("aws-ssm-secrets", ssmProps));

        log.info("SSM secrets loaded successfully. Keys loaded: {}", ssmProps.keySet());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String fetchSsmParam(SsmClient ssm, String paramSuffix) {
        String fullPath = SSM_PREFIX + paramSuffix;
        try {
            GetParameterResponse response = ssm.getParameter(
                    GetParameterRequest.builder()
                            .name(fullPath)
                            .withDecryption(true)   // for SecureString parameters
                            .build()
            );
            String value = response.parameter().value();
            log.debug("SSM: loaded {}", fullPath);
            return value;
        } catch (Exception e) {
            log.error("FATAL: Could not load SSM parameter '{}': {}", fullPath, e.getMessage());
            throw new IllegalStateException(
                    "Required SSM parameter not found: " + fullPath +
                    ". Run: aws ssm put-parameter --name " + fullPath +
                    " --value YOUR_VALUE --type SecureString", e);
        }
    }

    private String fetchSsmParamOptional(SsmClient ssm, String paramSuffix) {
        String fullPath = SSM_PREFIX + paramSuffix;
        try {
            GetParameterResponse response = ssm.getParameter(
                    GetParameterRequest.builder()
                            .name(fullPath)
                            .withDecryption(true)
                            .build()
            );
            return response.parameter().value();
        } catch (Exception e) {
            log.warn("SSM optional parameter not found (skipping): {}", fullPath);
            return null;
        }
    }
}
