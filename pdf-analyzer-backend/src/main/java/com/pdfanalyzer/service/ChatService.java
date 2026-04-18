package com.pdfanalyzer.service;

import com.pdfanalyzer.dto.ChatRequest;
import com.pdfanalyzer.dto.ChatResponse;
import com.pdfanalyzer.entity.ChatInteraction;
import com.pdfanalyzer.entity.Document;
import com.pdfanalyzer.entity.User;
import com.pdfanalyzer.repository.ChatInteractionRepository;
import com.pdfanalyzer.repository.DocumentRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
public class ChatService {

    private final GeminiSummarizationService geminiService;
    private final ChatInteractionRepository chatRepository;
    private final DocumentRepository documentRepository;

    public ChatService(GeminiSummarizationService geminiService, 
                       ChatInteractionRepository chatRepository,
                       DocumentRepository documentRepository) {
        this.geminiService = geminiService;
        this.chatRepository = chatRepository;
        this.documentRepository = documentRepository;
    }

    @Transactional
    public ChatResponse chat(User user, ChatRequest request) {
        Document document = documentRepository.findById(request.getDocumentId())
                .orElseThrow(() -> new RuntimeException("Document not found"));

        log.info("Processing Q&A for document: {}, Question: {}", document.getOriginalFilename(), request.getQuestion());

        // Phase 5: Remove chat memory and multi-mode. 
        // Just send the full text (or first 30k chars as handled in geminiService) and the question.
        String context = document.getRawText() != null ? document.getRawText() : "";
        
        String answer;
        boolean isOffline = !geminiService.isConfigured();

        try {
            // Phase 6: Log API request sent
            log.info("API request sent to Gemini for question: {}", request.getQuestion());
            
            answer = geminiService.askQuestionAboutDocument(context, request.getQuestion());
            
            // Phase 6: Log API response received
            log.info("API response received.");
        } catch (Exception e) {
            log.error("❌ Chat error: {}", e.getMessage());
            answer = "Sorry, I encountered an error while processing your question.";
            isOffline = true;
        }

        // Store interaction (Minimal)
        ChatInteraction interaction = ChatInteraction.builder()
                .document(document)
                .user(user)
                .question(request.getQuestion())
                .answer(answer)
                .mode(request.getMode())
                .build();
        chatRepository.save(interaction);

        return ChatResponse.builder()
                .answer(answer)
                .explanation("") // Phase 5: Simplified response
                .sourceText("")
                .offlineFallback(isOffline)
                .build();
    }
}
