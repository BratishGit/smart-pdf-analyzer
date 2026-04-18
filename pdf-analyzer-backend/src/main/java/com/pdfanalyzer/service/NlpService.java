package com.pdfanalyzer.service;

import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * NLP Processing Engine — uses pure Java NLP techniques.
 * No paid APIs or heavy models needed.
 *
 * Features:
 *  - Sentence detection
 *  - Tokenization
 *  - TF-IDF keyword extraction
 *  - Simple named entity recognition (capitalised runs heuristic)
 */
@Service
public class NlpService {

    // Common English stop-words to ignore during keyword extraction
    private static final Set<String> STOP_WORDS = new HashSet<>(Arrays.asList(
        "the","a","an","and","or","but","in","on","at","to","for","of","with",
        "by","from","up","about","into","through","during","is","are","was","were",
        "be","been","being","have","has","had","do","does","did","will","would",
        "could","should","may","might","shall","can","this","that","these","those",
        "i","you","he","she","it","we","they","what","which","who","whom","when",
        "where","why","how","all","each","every","both","few","more","most","other",
        "some","such","no","not","only","same","so","than","too","very","s","t",
        "just","don","as","if","then","also","its","their","our","your","his","her",
        "my","me","him","us","them","there","here","now","new","one","two","also",
        "any","said","say","get","got","go","going","come","came","take","make",
        "know","think","see","look","want","give","use","find","tell","ask","work",
        "seem","feel","try","leave","call","keep"
    ));

    public List<String> detectSentences(String text) {
        if (text == null || text.isBlank()) return Collections.emptyList();
        
        // Handle PDF newlines acting as boundaries: if a line ends with a word and next line starts with a capital letter
        String preProcessed = text.replaceAll("([a-z0-9])\\s*[\\r\\n]+\\s*([A-Z])", "$1. $2");
        preProcessed = preProcessed.replaceAll("[\\r\\n\\t]+", " ");

        // Split on ". ", "! ", "? " followed by uppercase or quote, plus allow just a standard period split fallback
        String[] raw = preProcessed.split("(?<=[.!?])\\s+(?=[A-Z\"'])");
        List<String> sentences = new ArrayList<>();
        
        for (String s : raw) {
            String trimmed = s.trim();
            if (trimmed.length() > 10) sentences.add(trimmed);
        }
        
        // Fallback: If Tika extraction had no capital letters after punctuation, forced aggressive split
        if (sentences.size() < 5 && preProcessed.length() > 400) {
            sentences.clear();
            raw = preProcessed.split("(?<=[.!?])\\s+");
            for (String s : raw) {
                String trimmed = s.trim();
                if (trimmed.length() > 15) sentences.add(trimmed);
            }
        }
        
        return sentences;
    }

    /**
     * Tokenize text into lowercase words, removing punctuation.
     */
    public List<String> tokenize(String text) {
        if (text == null || text.isBlank()) return Collections.emptyList();
        String[] tokens = text.toLowerCase().split("[^a-zA-Z0-9']+");
        return Arrays.stream(tokens)
                .filter(t -> t.length() > 2)
                .filter(t -> !STOP_WORDS.contains(t))
                .collect(Collectors.toList());
    }

    /**
     * Extract top N keywords using TF-IDF across sentences as "documents".
     */
    public List<String> extractKeywords(String text, int topN) {
        if (text == null || text.isBlank()) return Collections.emptyList();

        List<String> sentences = detectSentences(text);
        if (sentences.isEmpty()) sentences = List.of(text);

        // Term Frequency per whole document
        List<String> allTokens = tokenize(text);
        Map<String, Integer> tf = new HashMap<>();
        for (String token : allTokens) {
            tf.merge(token, 1, Integer::sum);
        }

        // IDF — number of sentences containing the term
        Map<String, Integer> df = new HashMap<>();
        for (String sentence : sentences) {
            Set<String> sentTokens = new HashSet<>(tokenize(sentence));
            for (String token : sentTokens) {
                df.merge(token, 1, Integer::sum);
            }
        }

        int N = sentences.size();
        Map<String, Double> tfidf = new HashMap<>();
        for (Map.Entry<String, Integer> entry : tf.entrySet()) {
            String term = entry.getKey();
            double termFreq = (double) entry.getValue() / allTokens.size();
            double idf = Math.log((double)(N + 1) / (df.getOrDefault(term, 0) + 1)) + 1;
            tfidf.put(term, termFreq * idf);
        }

        return tfidf.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(topN)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    /**
     * Simple named entity recognition using capitalisation heuristic.
     * Extracts consecutive capitalised words (e.g. "John Smith", "New York").
     */
    public List<String> extractNamedEntities(String text) {
        if (text == null || text.isBlank()) return Collections.emptyList();

        Pattern pattern = Pattern.compile("\\b([A-Z][a-z]+(?:\\s[A-Z][a-z]+)+)\\b");
        Matcher matcher = pattern.matcher(text);
        Set<String> entities = new LinkedHashSet<>();
        while (matcher.find()) {
            String entity = matcher.group(1).trim();
            if (entity.length() > 3) entities.add(entity);
        }
        return new ArrayList<>(entities).subList(0, Math.min(entities.size(), 30));
    }

    /**
     * Count words in text.
     */
    public int countWords(String text) {
        if (text == null || text.isBlank()) return 0;
        return text.trim().split("\\s+").length;
    }
}
