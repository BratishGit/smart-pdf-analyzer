package com.pdfanalyzer.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "documents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String filename;

    @Column(name = "original_filename", nullable = false)
    private String originalFilename;

    @Column(name = "file_type", length = 50)
    private String fileType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "file_path")
    private String filePath;

    @Column(name = "status", length = 30)
    @Builder.Default
    private String status = "UPLOADED";

    @Column(name = "title")
    private String title;

    @Column(name = "author")
    private String author;

    @Column(name = "page_count")
    private Integer pageCount;

    @Column(name = "raw_text", columnDefinition = "CLOB")
    private String rawText;

    @Column(name = "summary", columnDefinition = "CLOB")
    private String summary;

    @Column(name = "keywords", length = 2000)
    private String keywords;

    @Column(name = "language", length = 20)
    private String language;

    @Column(name = "word_count")
    private Integer wordCount;

    @Column(name = "sentence_count")
    private Integer sentenceCount;

    @Column(name = "named_entities", columnDefinition = "CLOB")
    private String namedEntities;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DocumentChunk> chunks = new java.util.ArrayList<>();

    @Column(name = "uploaded_at", updatable = false)
    private LocalDateTime uploadedAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @PrePersist
    protected void onCreate() {
        uploadedAt = LocalDateTime.now();
    }
}
