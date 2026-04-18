package com.pdfanalyzer.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import lombok.extern.slf4j.Slf4j;

import java.util.*;

@Service
@Slf4j
public class GeminiSummarizationService {

    private final RestTemplate restTemplate;
    private final String geminiApiKey;
    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=";

    public GeminiSummarizationService(@Value("${ai.gemini.api-key:}") String geminiApiKey) {
        this.geminiApiKey = geminiApiKey;
        org.springframework.http.client.SimpleClientHttpRequestFactory factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(30000); 
        factory.setReadTimeout(90000);    
        this.restTemplate = new RestTemplate(factory);
        log.info("Gemini Service initialized. API Key present: {}", isConfigured());
    }

    public boolean isConfigured() {
        return geminiApiKey != null && !geminiApiKey.trim().isEmpty();
    }

    /**
     * Phase 2: Basic Summarization
     */
    public String summarizeWithGemini(String text) {
        if (text == null || text.trim().isEmpty()) {
            log.warn("Cannot summarize: Input text is empty.");
            return "Unable to process document: Input text is empty.";
        }

        if (!isConfigured()) {
            log.info("Gemini not configured, returning offline summary.");
            return offlineSummary(text);
        }

        log.info("🚀 Sending summarization request to Gemini (Text length: {})", text.length());
        
        // Phase 5: No advanced chunking for now, just send first 30k chars if too long
        String content = text.length() > 30000 ? text.substring(0, 30000) : text;
        String prompt = "Summarize this document in simple terms:\n\n" + content;

        try {
            String response = callGeminiApi(prompt, 0.5, 1024);
            if (response == null || response.trim().isEmpty()) {
                log.warn("Gemini returned empty response, falling back to offline.");
                return offlineSummary(text);
            }
            log.info("✅ Gemini response received.");
            return response;
        } catch (Exception e) {
            log.error("❌ Gemini summarization failed: {}", e.getMessage());
            return offlineSummary(text);
        }
    }

    /**
     * Phase 3: Basic Q&A
     */
    public String askQuestionAboutDocument(String text, String question) {
        if (text == null || text.trim().isEmpty() || question == null || question.trim().isEmpty()) {
            return "Unable to process: Document text or question is missing.";
        }

        if (!isConfigured()) {
            return offlineQna(text, question);
        }

        log.info("🚀 Sending Q&A request to Gemini. Question: {}", question);

        String content = text.length() > 30000 ? text.substring(0, 30000) : text;
        String prompt = "Answer this question based on the document:\n\nDOCUMENT:\n" + content + "\n\nQUESTION: " + question;

        try {
            String response = callGeminiApi(prompt, 0.3, 1024);
            if (response == null || response.trim().isEmpty()) {
                log.warn("Gemini returned empty Q&A response, falling back to offline.");
                return offlineQna(text, question);
            }
            return response;
        } catch (Exception e) {
            log.error("❌ Gemini Q&A failed: {}", e.getMessage());
            return offlineQna(text, question);
        }
    }

    // Compat method for existing calls
    public String askWithContext(String text, String question, String history, String mode) {
        // Phase 5: Remove complex features like history and mode
        return askQuestionAboutDocument(text, question);
    }

    @SuppressWarnings("unchecked")
    private String callGeminiApi(String prompt, double temperature, int maxOutputTokens) {
        String url = GEMINI_API_URL + geminiApiKey;
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = new HashMap<>();
            
            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", temperature);
            generationConfig.put("maxOutputTokens", maxOutputTokens);
            requestBody.put("generationConfig", generationConfig);
            
            Map<String, String> parts = new HashMap<>();
            parts.put("text", prompt);
            
            Map<String, Object> contents = new HashMap<>();
            contents.put("parts", List.of(parts));
            
            requestBody.put("contents", List.of(contents));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            log.debug("Sending POST request to Gemini API...");
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            Map<String, Object> body = response.getBody();

            if (body != null && body.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<String, Object> candidate = candidates.get(0);
                    if (candidate.containsKey("content")) {
                        Map<String, Object> contentBody = (Map<String, Object>) candidate.get("content");
                        if (contentBody.containsKey("parts")) {
                            List<Map<String, Object>> responseParts = (List<Map<String, Object>>) contentBody.get("parts");
                            if (!responseParts.isEmpty()) {
                                return (String) responseParts.get(0).get("text");
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Gemini API call error: {}", e.getMessage());
        }
        return null;
    }

    // --- PHASE 4: BASIC OFFLINE FALLBACK ---

    private String offlineSummary(String text) {
        log.info("Using offline summary fallback.");
        String[] sentences = text.split("[.!?]\\s+");
        StringBuilder sb = new StringBuilder("OFFLINE SUMMARY:\n");
        int count = 0;
        for (String s : sentences) {
            if (s.trim().length() > 20) {
                sb.append("- ").append(s.trim()).append(".\n");
                count++;
            }
            if (count >= 3) break;
        }
        return sb.toString();
    }

    private String offlineQna(String text, String question) {
        log.info("Using offline Q&A fallback.");
        String[] sentences = text.split("[.!?]\\s+");
        String[] qKeywords = question.toLowerCase().split("\\s+");
        
        for (String s : sentences) {
            String lowerS = s.toLowerCase();
            for (String kw : qKeywords) {
                if (kw.length() > 3 && lowerS.contains(kw)) {
                    return "OFFLINE ANSWER: " + s.trim();
                }
            }
        }
        return "Offline system could not find a relevant answer in the document.";
    }
}
