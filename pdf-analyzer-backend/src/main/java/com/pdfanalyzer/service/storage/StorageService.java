package com.pdfanalyzer.service.storage;

import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.file.Path;

/**
 * Abstraction over file storage backends.
 * Implementations:
 *   - LocalStorageService  (profile: default / mysql)
 *   - AwsS3StorageService  (profile: aws)
 *
 * DocumentService calls this interface only — no S3 or File references leak out.
 */
public interface StorageService {

    /**
     * Save an uploaded file and return its storage key/path.
     * @param file     the multipart file from the HTTP request
     * @param username owner of the file (used for namespacing)
     * @return a storage key: local path string OR S3 object key
     */
    String store(MultipartFile file, String username) throws Exception;

    /**
     * Return an InputStream to read the stored file.
     * @param storageKey the value returned by store()
     */
    InputStream retrieve(String storageKey) throws Exception;

    /**
     * Delete the stored file.
     * @param storageKey the value returned by store()
     */
    void delete(String storageKey);

    /**
     * Return a local Path for files that need direct Path access (e.g. PDFBox).
     * S3 implementation downloads to a temp file and returns its path.
     * Caller must delete the temp file when done.
     */
    Path toLocalPath(String storageKey) throws Exception;

    /**
     * Returns true if this is the S3 backend (used for Content-Disposition serving).
     */
    default boolean isRemote() { return false; }
}
