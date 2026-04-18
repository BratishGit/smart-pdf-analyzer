package com.pdfanalyzer.repository;

import com.pdfanalyzer.entity.Document;
import com.pdfanalyzer.entity.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, Long> {

    List<DocumentChunk> findByDocumentOrderByChunkIndexAsc(Document document);

    // BUG FIX #8: deleteByDocument requires @Transactional + @Modifying
    // Without these, calling this method throws TransactionRequiredException at runtime.
    @Transactional
    @Modifying
    void deleteByDocument(Document document);
}
