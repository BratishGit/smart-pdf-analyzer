package com.pdfanalyzer.enums;

/**
 * All possible document processing states.
 * Centralised here so backend and any future clients have a single source of truth.
 * BUG FIX #3: Previously status strings were scattered as magic literals,
 * and "PROCESSING" used in frontend never existed in the backend.
 */
public enum DocumentStatus {
    UPLOADING,
    PROCESSING,       // Generic in-progress state — used by frontend for polling
    EXTRACTING_TEXT,
    DETECTING_LANGUAGE,
    SUMMARIZING,
    DONE,
    EMPTY_CONTENT,
    ERROR
}
