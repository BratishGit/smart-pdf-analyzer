package com.pdfanalyzer.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.tika.Tika;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.parser.AutoDetectParser;
import org.apache.tika.parser.ParseContext;
import org.apache.tika.sax.BodyContentHandler;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

/**
 * Document Parsing Engine — uses PDFBox for PDFs and Tika for others.
 */
@Service
@Slf4j
public class DocumentParsingService {

    private final Tika tika = new Tika();

    /**
     * Extract plain text from a file.
     * Phase 1: Use PDFBox for PDFs.
     */
    public String extractText(Path filePath) {
        String fileName = filePath.getFileName().toString().toLowerCase();
        log.info("🔍 Extracting text from: {}", fileName);
        
        if (fileName.endsWith(".pdf")) {
            try (PDDocument document = PDDocument.load(filePath.toFile())) {
                if (document.isEncrypted()) {
                    log.warn("⚠️ PDF is encrypted, might not extract all text.");
                }
                PDFTextStripper stripper = new PDFTextStripper();
                String text = stripper.getText(document);
                log.info("✅ Extracted {} characters using PDFBox", text != null ? text.length() : 0);
                return text != null ? text : "";
            } catch (Exception e) {
                log.error("❌ PDFBox extraction failed for {}: {}", fileName, e.getMessage());
                // Fallback to Tika if PDFBox fails
                return extractTextTika(filePath);
            }
        } else {
            return extractTextTika(filePath);
        }
    }

    private String extractTextTika(Path filePath) {
        try (InputStream is = Files.newInputStream(filePath)) {
            BodyContentHandler handler = new BodyContentHandler(-1);
            Metadata metadata = new Metadata();
            AutoDetectParser parser = new AutoDetectParser();
            parser.parse(is, handler, metadata, new ParseContext());
            String text = handler.toString();
            log.info("✅ Extracted {} characters using Tika", text != null ? text.length() : 0);
            return text != null ? text : "";
        } catch (Exception e) {
            log.error("❌ Tika extraction failed: {}", e.getMessage());
            return "";
        }
    }

    /**
     * Detect MIME type from file content.
     */
    public String detectMimeType(Path filePath) {
        try {
            return tika.detect(filePath);
        } catch (Exception e) {
            return "application/octet-stream";
        }
    }

    /**
     * Extract key-value metadata from document.
     */
    public Map<String, String> extractMetadata(Path filePath) {
        Map<String, String> result = new HashMap<>();
        try (InputStream is = Files.newInputStream(filePath)) {
            Metadata metadata = new Metadata();
            AutoDetectParser parser = new AutoDetectParser();
            BodyContentHandler handler = new BodyContentHandler(-1);
            parser.parse(is, handler, metadata, new ParseContext());
            for (String name : metadata.names()) {
                result.put(name, metadata.get(name));
            }
        } catch (Exception e) {
            log.warn("Could not extract metadata: {}", e.getMessage());
        }
        return result;
    }

    /**
     * Detect language from a text sample (simple heuristic).
     */
    public String detectLanguage(String text) {
        if (text == null || text.isBlank()) return "unknown";
        String sample = text.toLowerCase();
        long englishHits = java.util.Arrays.stream(new String[]{"the","and","is","of","to","in","a","that","it","was"})
                .filter(sample::contains).count();
        return englishHits >= 5 ? "en" : "other";
    }
}
