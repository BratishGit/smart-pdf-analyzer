package com.pdfanalyzer.service;

import com.pdfanalyzer.repository.ChatInteractionRepository;
import com.pdfanalyzer.repository.DocumentRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AnalyticsService {

    private final DocumentRepository documentRepository;
    private final ChatInteractionRepository chatRepository;

    public AnalyticsService(DocumentRepository documentRepository, ChatInteractionRepository chatRepository) {
        this.documentRepository = documentRepository;
        this.chatRepository = chatRepository;
    }

    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalDocuments", documentRepository.count());
        stats.put("totalQuestions", chatRepository.count());
        
        // In a real app, you'd perform grouping by mode or other metrics
        return stats;
    }
}
