package com.pdfanalyzer.service;

import com.pdfanalyzer.entity.Document;
import com.pdfanalyzer.repository.DocumentRepository;
import com.pdfanalyzer.service.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentProcessingService {

    private final DocumentRepository documentRepository;
    private final DocumentParsingService parsingService;
    private final SummarizationService summarizationService;
    private final NlpService nlpService;
    private final StorageService storageService;

    /**
     * @param documentId database ID of the document
     * @param storageKey local file path (local mode) OR S3 object key (aws mode)
     */
    @Async("documentProcessingExecutor")
    public void processDocument(Long documentId, String storageKey) {
        log.info("Starting processing for document ID: {}", documentId);
        Path tempFile = null;

        documentRepository.findById(documentId).ifPresent(doc -> {
            Path localPath = null;
            boolean isTempFile = false;

            try {
                doc.setStatus("EXTRACTING_TEXT");
                documentRepository.save(doc);

                // Resolve a local path (downloads from S3 to temp if needed)
                localPath = storageService.toLocalPath(storageKey);
                isTempFile = storageService.isRemote();

                log.info("Step 1: Extracting text from {}", doc.getOriginalFilename());
                String rawText = parsingService.extractText(localPath);

                if (rawText == null || rawText.isBlank()) {
                    log.warn("Document ID {} has no extractable text.", documentId);
                    doc.setStatus("EMPTY_CONTENT");
                    documentRepository.save(doc);
                    return;
                }
                log.info("Extracted {} characters.", rawText.length());

                String cleanedText = cleanText(rawText);

                // Language detection
                doc.setStatus("DETECTING_LANGUAGE");
                documentRepository.save(doc);
                String language = parsingService.detectLanguage(cleanedText);

                // NLP — keywords, entities, stats
                log.info("Step 2: Running NLP analysis...");
                List<String> keywords     = nlpService.extractKeywords(cleanedText, 20);
                List<String> entities     = nlpService.extractNamedEntities(cleanedText);
                int          wordCount    = nlpService.countWords(cleanedText);
                int          sentenceCount= nlpService.detectSentences(cleanedText).size();

                // AI Summarization
                doc.setStatus("SUMMARIZING");
                documentRepository.save(doc);
                log.info("Step 3: Generating AI summary...");
                String summary = summarizationService.summarize(cleanedText, 5);

                // Persist
                doc.setRawText(cleanedText);
                doc.setLanguage(language);
                doc.setSummary(summary);
                doc.setKeywords(String.join(",", keywords));
                doc.setNamedEntities(String.join("|", entities));
                doc.setWordCount(wordCount);
                doc.setSentenceCount(sentenceCount);
                doc.setStatus("DONE");
                doc.setProcessedAt(LocalDateTime.now());
                documentRepository.save(doc);

                log.info("Processed document ID:{} | words={} sentences={} keywords={} entities={}",
                        documentId, wordCount, sentenceCount, keywords.size(), entities.size());

            } catch (Exception e) {
                log.error("ERROR processing document ID: {}", documentId, e);
                doc.setStatus("ERROR");
                documentRepository.save(doc);
            } finally {
                // Clean up temp file downloaded from S3
                if (isTempFile && localPath != null) {
                    try { Files.deleteIfExists(localPath); }
                    catch (Exception ignored) {}
                }
            }
        });
    }

    private String cleanText(String text) {
        if (text == null) return "";
        return text.replaceAll("\r\n", "\n")
                   .replaceAll("\r", "\n")
                   .replaceAll("\t", " ")
                   .replaceAll("\n{3,}", "\n\n")
                   .replaceAll(" {2,}", " ")
                   .trim();
    }
}
