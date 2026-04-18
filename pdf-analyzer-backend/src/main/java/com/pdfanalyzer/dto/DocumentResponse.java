package com.pdfanalyzer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DocumentResponse {
    private Long id;
    private String filename;
    private String originalFilename;
    private String fileType;
    private Long fileSize;
    private String status;
    private String summary;
    private List<String> keywords;
    private String language;
    private Integer wordCount;
    private Integer sentenceCount;
    private List<String> namedEntities;
    private String title;
    private String author;
    private Integer pageCount;
    private LocalDateTime uploadedAt;
    private LocalDateTime processedAt;
}
