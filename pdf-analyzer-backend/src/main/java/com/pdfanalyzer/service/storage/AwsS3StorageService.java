package com.pdfanalyzer.service.storage;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

/**
 * AwsS3StorageService — aws profile only
 *
 * storageKey = S3 object key:  "uploads/{username}/{uuid}_{sanitized-filename}"
 *
 * Files are NEVER stored on local disk (except temp files for PDFBox parsing).
 */
@Service
@Profile("aws")
@RequiredArgsConstructor
@Slf4j
public class AwsS3StorageService implements StorageService {

    private final S3Client s3Client;

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    @Override
    public boolean isRemote() { return true; }

    @Override
    public String store(MultipartFile file, String username) throws Exception {
        String key = "uploads/" + username + "/" + UUID.randomUUID() + "_" + sanitize(file.getOriginalFilename());

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(file.getContentType())
                .contentLength(file.getSize())
                .serverSideEncryption(ServerSideEncryption.AES256) // encrypt at rest
                .build();

        s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        log.info("Uploaded to S3: s3://{}/{}", bucket, key);
        return key;  // storageKey = S3 object key
    }

    @Override
    public InputStream retrieve(String storageKey) {
        GetObjectRequest request = GetObjectRequest.builder()
                .bucket(bucket)
                .key(storageKey)
                .build();
        ResponseInputStream<GetObjectResponse> s3Object = s3Client.getObject(request);
        log.info("Streaming from S3: s3://{}/{}", bucket, storageKey);
        return s3Object;
    }

    @Override
    public void delete(String storageKey) {
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(storageKey)
                    .build());
            log.info("Deleted from S3: s3://{}/{}", bucket, storageKey);
        } catch (Exception e) {
            log.warn("Could not delete S3 object {}: {}", storageKey, e.getMessage());
        }
    }

    /**
     * For PDFBox and Tika which need a local Path, download to a temp file.
     * The caller MUST delete the temp file after use to avoid disk exhaustion.
     */
    @Override
    public Path toLocalPath(String storageKey) throws Exception {
        String filename = storageKey.substring(storageKey.lastIndexOf('/') + 1);
        Path tmp = Files.createTempFile("pdfanalyzer-", "-" + filename);
        tmp.toFile().deleteOnExit();  // safety net

        try (InputStream in = retrieve(storageKey)) {
            Files.copy(in, tmp, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
        }
        log.debug("Downloaded S3 object to temp path: {}", tmp);
        return tmp;
    }

    private String sanitize(String name) {
        if (name == null) return "upload.pdf";
        return name.replaceAll("[^a-zA-Z0-9._\\-]", "_");
    }
}
