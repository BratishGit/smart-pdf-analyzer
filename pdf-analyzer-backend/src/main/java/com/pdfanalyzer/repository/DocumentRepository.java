package com.pdfanalyzer.repository;

import com.pdfanalyzer.entity.Document;
import com.pdfanalyzer.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByUserOrderByUploadedAtDesc(User user);
    Optional<Document> findByIdAndUser(Long id, User user);

    @Query("SELECT d FROM Document d WHERE d.user = :user AND " +
           "(LOWER(d.originalFilename) LIKE LOWER(CONCAT('%',:query,'%')) OR " +
           " LOWER(d.rawText) LIKE LOWER(CONCAT('%',:query,'%')) OR " +
           " LOWER(d.keywords) LIKE LOWER(CONCAT('%',:query,'%')) OR " +
           " LOWER(d.summary) LIKE LOWER(CONCAT('%',:query,'%')))")
    List<Document> searchByUser(@Param("user") User user, @Param("query") String query);
}
