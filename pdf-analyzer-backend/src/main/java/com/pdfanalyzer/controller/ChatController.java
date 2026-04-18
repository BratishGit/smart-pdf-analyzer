package com.pdfanalyzer.controller;

import com.pdfanalyzer.dto.ChatRequest;
import com.pdfanalyzer.dto.ChatResponse;
import com.pdfanalyzer.entity.ChatInteraction;
import com.pdfanalyzer.entity.Document;
import com.pdfanalyzer.entity.User;
import com.pdfanalyzer.repository.ChatInteractionRepository;
import com.pdfanalyzer.repository.DocumentRepository;
import com.pdfanalyzer.repository.UserRepository;
import com.pdfanalyzer.service.AnalyticsService;
import com.pdfanalyzer.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final AnalyticsService analyticsService;
    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final ChatInteractionRepository chatInteractionRepository;

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(
            @RequestBody ChatRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(chatService.chat(user, request));
    }

    // BUG FIX #7: Analytics now requires authentication (has @AuthenticationPrincipal)
    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(analyticsService.getStats());
    }

    @GetMapping("/history/{documentId}")
    public ResponseEntity<List<Map<String, String>>> getHistory(
            @PathVariable Long documentId,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        List<ChatInteraction> interactions =
                chatInteractionRepository.findByDocumentAndUserOrderByCreatedAtDesc(
                        document, user, PageRequest.of(0, 50));

        Collections.reverse(interactions);

        List<Map<String, String>> history = interactions.stream().map(it -> {
            Map<String, String> map = new HashMap<>();
            map.put("question", it.getQuestion());
            map.put("answer", it.getAnswer());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(history);
    }
}
