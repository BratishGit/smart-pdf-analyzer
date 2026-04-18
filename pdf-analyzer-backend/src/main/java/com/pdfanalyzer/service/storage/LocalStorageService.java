package com.pdfanalyzer.service.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * LocalStorageService — default + mysql profiles
 *
 * Stores files under:  {app.storage.location}/{username}/{uuid}_{sanitized-filename}
 * storageKey is the full absolute path string.
 */
@Service
@Profile("!aws")   // Active when profile is NOT aws
@Slf4j
public class LocalStorageService implements StorageService {

    @Value("${app.storage.location:./uploads}")
    private String storageRoot;

    @Override
    public String store(MultipartFile file, String username) throws Exception {
        Path userDir = Paths.get(storageRoot, username);
        if (!Files.exists(userDir)) Files.createDirectories(userDir);

        String filename = UUID.randomUUID() + "_" + sanitize(file.getOriginalFilename());
        Path target = userDir.resolve(filename);
        Files.copy(file.getInputStream(), target);
        log.info("Stored file locally: {}", target);
        return target.toString();   // storageKey = full path
    }

    @Override
    public InputStream retrieve(String storageKey) throws Exception {
        return Files.newInputStream(Paths.get(storageKey));
    }

    @Override
    public void delete(String storageKey) {
        try {
            Files.deleteIfExists(Paths.get(storageKey));
            log.info("Deleted local file: {}", storageKey);
        } catch (IOException e) {
            log.warn("Could not delete file: {}", storageKey);
        }
    }

    @Override
    public Path toLocalPath(String storageKey) {
        return Paths.get(storageKey);
    }

    private String sanitize(String name) {
        if (name == null) return "upload.pdf";
        return name.replaceAll("[^a-zA-Z0-9._\\-]", "_");
    }
}
