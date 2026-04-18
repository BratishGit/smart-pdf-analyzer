package com.pdfanalyzer.service;

import com.pdfanalyzer.dto.DocumentResponse;
import com.pdfanalyzer.entity.Document;
import com.pdfanalyzer.entity.User;
import com.pdfanalyzer.repository.DocumentRepository;
import com.pdfanalyzer.repository.UserRepository;
import com.pdfanalyzer.service.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private final DocumentRepository       documentRepository;
    private final UserRepository           userRepository;
    private final DocumentProcessingService processingService;
    private final DocumentParsingService   parsingService;
    private final SummarizationService     summarizationService;
    // StorageService is injected as LocalStorageService or AwsS3StorageService
    // depending on the active Spring profile — DocumentService never knows which.
    private final StorageService           storageService;

    // ── Upload ────────────────────────────────────────────────────────────────
    public DocumentResponse uploadDocument(MultipartFile file, String username) throws Exception {
        if (file == null || file.isEmpty())
            throw new IllegalArgumentException("File is empty or missing");

        if (!"application/pdf".equalsIgnoreCase(file.getContentType()))
            throw new IllegalArgumentException("Only PDF files are allowed. Received: " + file.getContentType());

        // Verify PDF magic bytes (%PDF) — prevents renamed .exe files
        byte[] header = file.getBytes();
        if (header.length < 4 || !(header[0]=='%' && header[1]=='P' && header[2]=='D' && header[3]=='F'))
            throw new IllegalArgumentException("File does not appear to be a valid PDF.");

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        // Delegate storage to the active StorageService (local or S3)
        String storageKey = storageService.store(file, username);

        // Extract PDF metadata via Tika (needs a local path)
        Path localPath = storageService.toLocalPath(storageKey);
        var metadata   = parsingService.extractMetadata(localPath);
        // Clean up temp file if S3 mode created one
        if (storageService.isRemote()) {
            try { java.nio.file.Files.deleteIfExists(localPath); } catch (Exception ignored) {}
        }

        String title      = coalesce(metadata.get("dc:title"), metadata.get("title"), file.getOriginalFilename());
        String author     = coalesce(metadata.get("dc:creator"), metadata.get("creator"), "Unknown");
        Integer pageCount = parseInt(metadata.get("xmpTPg:NPages"), 0);

        Document doc = Document.builder()
                .filename(file.getOriginalFilename())
                .originalFilename(file.getOriginalFilename())
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .filePath(storageKey)   // filePath holds either local path or S3 key
                .title(title.isBlank() ? file.getOriginalFilename() : title)
                .author(author)
                .pageCount(pageCount)
                .status("PROCESSING")
                .user(user)
                .build();

        doc = documentRepository.save(doc);
        processingService.processDocument(doc.getId(), storageKey);

        return mapToResponse(doc);
    }

    // ── Read ──────────────────────────────────────────────────────────────────
    public List<DocumentResponse> getUserDocuments(String username) {
        User user = findUser(username);
        return documentRepository.findByUserOrderByUploadedAtDesc(user)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public DocumentResponse getDocument(Long id, String username) {
        return mapToResponse(findDoc(id, username));
    }

    public String getDocumentText(Long id, String username) {
        Document doc = findDoc(id, username);
        return doc.getRawText() != null ? doc.getRawText() : "Text is still being extracted...";
    }

    // ── File serving ──────────────────────────────────────────────────────────
    public Resource getDocumentResource(Long id, String username) throws Exception {
        Document doc = findDoc(id, username);
        return new InputStreamResource(storageService.retrieve(doc.getFilePath()));
    }

    // ── Delete ────────────────────────────────────────────────────────────────
    public void deleteDocument(Long id, String username) {
        Document doc = findDoc(id, username);
        storageService.delete(doc.getFilePath());
        documentRepository.delete(doc);
        log.info("Deleted document id={} for user={}", id, username);
    }

    // ── Search ────────────────────────────────────────────────────────────────
    public List<DocumentResponse> searchDocuments(String query, String username) {
        User user = findUser(username);
        return documentRepository.searchByUser(user, query)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // ── Q&A ───────────────────────────────────────────────────────────────────
    public String askQuestion(Long id, String question, String username) {
        Document doc = findDoc(id, username);
        if (doc.getRawText() == null || doc.getRawText().isBlank())
            return "The document has not been processed yet. Please wait and try again.";
        return summarizationService.askQuestion(doc.getRawText(), question);
    }

    // ── Private helpers ───────────────────────────────────────────────────────
    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }

    private Document findDoc(Long id, String username) {
        return documentRepository.findByIdAndUser(id, findUser(username))
                .orElseThrow(() -> new RuntimeException("Document not found: " + id));
    }

    private String coalesce(String... values) {
        for (String v : values) if (v != null && !v.isBlank()) return v;
        return "";
    }

    private int parseInt(String s, int fallback) {
        try { return s != null ? Integer.parseInt(s) : fallback; }
        catch (NumberFormatException e) { return fallback; }
    }

    private DocumentResponse mapToResponse(Document doc) {
        return DocumentResponse.builder()
                .id(doc.getId())
                .filename(doc.getFilename())
                .originalFilename(doc.getOriginalFilename())
                .fileType(doc.getFileType())
                .fileSize(doc.getFileSize())
                .status(doc.getStatus())
                .summary(doc.getSummary())
                .language(doc.getLanguage())
                .wordCount(doc.getWordCount())
                .sentenceCount(doc.getSentenceCount())
                .title(doc.getTitle())
                .author(doc.getAuthor())
                .pageCount(doc.getPageCount())
                .keywords(doc.getKeywords() != null
                        ? Arrays.asList(doc.getKeywords().split(","))
                        : Collections.emptyList())
                .namedEntities(doc.getNamedEntities() != null
                        ? Arrays.asList(doc.getNamedEntities().split("\\|"))
                        : Collections.emptyList())
                .uploadedAt(doc.getUploadedAt())
                .processedAt(doc.getProcessedAt())
                .build();
    }
}
