package com.pdfanalyzer.controller;

import com.pdfanalyzer.dto.DocumentResponse;
import com.pdfanalyzer.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping("/upload")
    public ResponseEntity<?> upload(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            DocumentResponse response = documentService.uploadDocument(file, userDetails.getUsername());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Upload failed: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<DocumentResponse>> getMyDocuments(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(documentService.getUserDocuments(userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            return ResponseEntity.ok(documentService.getDocument(id, userDetails.getUsername()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/text")
    public ResponseEntity<?> getDocumentText(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            return ResponseEntity.ok(Map.of("text", documentService.getDocumentText(id, userDetails.getUsername())));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            documentService.deleteDocument(id, userDetails.getUsername());
            return ResponseEntity.ok(Map.of("message", "Document deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<DocumentResponse>> search(
            @RequestParam("q") String query,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(documentService.searchDocuments(query, userDetails.getUsername()));
    }

    /**
     * Serve the file for in-browser preview.
     * Works for both local disk and S3 — DocumentService returns an InputStream-backed Resource.
     */
    @GetMapping("/{id}/file")
    public ResponseEntity<Resource> serveFile(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            Resource resource = documentService.getDocumentResource(id, userDetails.getUsername());
            DocumentResponse doc = documentService.getDocument(id, userDetails.getUsername());

            String contentType = "application/octet-stream";
            if ("application/pdf".equals(doc.getFileType())) contentType = "application/pdf";
            else if (doc.getFileType() != null && doc.getFileType().contains("text")) contentType = "text/plain";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + doc.getOriginalFilename() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    /** Legacy single-turn Q&A endpoint */
    @PostMapping("/{id}/ask")
    public ResponseEntity<?> askQuestion(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        String question = body.get("question");
        if (question == null || question.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "Question cannot be empty"));
        try {
            String answer = documentService.askQuestion(id, question, userDetails.getUsername());
            return ResponseEntity.ok(Map.of("answer", answer));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
