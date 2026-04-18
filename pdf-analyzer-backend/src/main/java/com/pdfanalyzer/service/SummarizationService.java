package com.pdfanalyzer.service;

import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class SummarizationService {

    private final GeminiSummarizationService geminiService;

    public SummarizationService(GeminiSummarizationService geminiService) {
        this.geminiService = geminiService;
    }

    /**
     * Phase 2: Generate a summary.
     */
    public String summarize(String text, int maxSents) {
        if (text == null || text.isBlank()) {
            return "The document is empty.";
        }

        log.info("Generating summary for document (length: {})", text.length());

        try {
            return geminiService.summarizeWithGemini(text);
        } catch (Exception e) {
            log.error("Summary generation failed: {}", e.getMessage());
            return "Error generating summary.";
        }
    }

    /**
     * Phase 3: Ask a question.
     */
    public String askQuestion(String text, String question) {
        if (text == null || text.isBlank()) return "The document is empty.";
        if (question == null || question.isBlank()) return "Please provide a valid question.";

        log.info("Processing question about document.");

        try {
            return geminiService.askQuestionAboutDocument(text, question);
        } catch (Exception e) {
            log.error("Question answering failed: {}", e.getMessage());
            return "Error answering question.";
        }
    }
}
