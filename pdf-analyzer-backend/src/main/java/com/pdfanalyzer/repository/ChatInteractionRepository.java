package com.pdfanalyzer.repository;

import com.pdfanalyzer.entity.ChatInteraction;
import com.pdfanalyzer.entity.Document;
import com.pdfanalyzer.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatInteractionRepository extends JpaRepository<ChatInteraction, Long> {
    List<ChatInteraction> findByDocumentAndUserOrderByCreatedAtDesc(Document document, User user, Pageable pageable);
}
