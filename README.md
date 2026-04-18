# Smart PDF Analyzer

A full-stack AI-powered document intelligence platform. Upload a PDF and get an AI-generated summary, TF-IDF keyword extraction, named entity detection, copyable raw text, an in-browser PDF preview, and a Gemini-powered Q&A chat — all behind JWT authentication.

---

## Table of Contents

1. [Features](#features)
2. [Prerequisites](#prerequisites)
3. [Quick Start — H2 (no setup)](#quick-start--h2-no-setup)
4. [Running with MySQL](#running-with-mysql)
5. [Running with AWS (RDS + S3)](#running-with-aws-rds--s3)
6. [Environment Variables](#environment-variables)
7. [Project Structure](#project-structure)
8. [API Reference](#api-reference)
9. [Database Schema](#database-schema)
10. [Architecture](#architecture)
11. [Bug Fixes Applied](#bug-fixes-applied)
12. [Known Limitations](#known-limitations)

---

## Features

| Feature | Description |
|---|---|
| **AI Summary** | Google Gemini 1.5 Flash generates a concise summary of the full document. Falls back to extractive summarization if Gemini is unavailable. |
| **Keyword Extraction** | TF-IDF algorithm ranks the 20 most significant terms in the document. Results are shown as a tag cloud. |
| **Named Entity Detection** | Heuristic regex pattern identifies consecutive capitalised words (people, places, organisations). |
| **Raw Text** | Full extracted text displayed in a monospace viewer with a one-click copy button. |
| **PDF Preview** | In-browser iframe preview using the browser's native PDF renderer. |
| **AI Q&A Chat** | Conversational interface backed by Gemini. Supports four modes: Simple, Detailed, Summary, Key Points. Chat history is saved and reloaded per document. |
| **Smart Search** | Full-text search across filename, extracted text, keywords, and summary using JPQL LIKE queries. Results highlight the matching term safely (no XSS). |
| **JWT Auth** | Stateless authentication. Tokens are signed with HMAC-SHA256 and expire after 24 hours. |
| **Three Storage Backends** | H2 + local disk (development), MySQL + local disk (staging), RDS MySQL + S3 (production). |

---

## Prerequisites

| Tool | Minimum Version | Check |
|---|---|---|
| Java JDK | 17 | `java -version` |
| Maven | 3.8 | `mvn -version` |
| Node.js | 18 | `node -version` |
| npm | 9 | `npm -version` |

Optional for production:
- MySQL 8.0 (or Docker)
- AWS CLI v2 + an AWS account

---

## Quick Start — H2 (no setup)

No database installation needed. H2 runs embedded and stores data in `./data/pdfanalyzer.mv.db`.

**Step 1 — Start the backend**

```bash
cd pdf-analyzer-backend
mvn spring-boot:run
```

The server starts at **http://localhost:8080**.
H2 web console is available at **http://localhost:8080/h2-console**
- JDBC URL: `jdbc:h2:file:./data/pdfanalyzer`
- Username: `sa`
- Password: *(leave blank)*

**Step 2 — Start the frontend**

```bash
cd react_app_demo
npm install          # first time only
```

```bash
# Windows (PowerShell)
$env:PORT=3001; npm start

# macOS / Linux
PORT=3001 npm start
```

The app opens at **http://localhost:3001**.

**Step 3 — Log in**

A demo user is created automatically on first startup:
- Username: `bratish`
- Password: `password`

Or create your own account via the Register page.

**Step 4 — Add your Gemini API key (optional but recommended)**

Without a key the app falls back to offline extractive summarization (first 3 sentences). For full AI summaries and Q&A:

1. Get a free key at https://aistudio.google.com/
2. Open `pdf-analyzer-backend/src/main/resources/application.properties`
3. Set `ai.gemini.api-key=YOUR_KEY_HERE`
4. Restart the backend

---

## Running with MySQL

See **[MYSQL_SETUP.md](MYSQL_SETUP.md)** for full instructions.

Short version:

```bash
# Start MySQL and create the database (see MYSQL_SETUP.md)

# Set credentials
export DB_HOST=localhost
export DB_USERNAME=pdfuser
export DB_PASSWORD=pdfpass

# Run with MySQL profile
cd pdf-analyzer-backend
mvn spring-boot:run -Dspring-boot.run.profiles=mysql
```

Hibernate auto-creates all four tables on first run.

---

## Running with AWS (RDS + S3)

See **[AWS_SETUP.md](AWS_SETUP.md)** for full instructions including IAM policy, SSM secrets, and EC2 deployment.

Short version:

```bash
export SPRING_PROFILES_ACTIVE=aws
export AWS_REGION=ap-south-1
export DB_HOST=your-rds-endpoint.rds.amazonaws.com
export DB_USERNAME=admin
export S3_BUCKET_NAME=your-bucket-name
# JWT secret and Gemini key are read from SSM Parameter Store automatically

java -jar target/pdf-analyzer-backend-1.0.0.jar
```

---

## Environment Variables

### Backend

| Variable | Profile | Default | Description |
|---|---|---|---|
| `DB_HOST` | mysql, aws | `localhost` | Database host |
| `DB_PORT` | mysql, aws | `3306` | Database port |
| `DB_NAME` | mysql, aws | `pdfanalyzer` | Database name |
| `DB_USERNAME` | mysql, aws | `pdfuser` | Database username |
| `DB_PASSWORD` | mysql, aws | `pdfpass` | Database password |
| `S3_BUCKET_NAME` | aws | *(required)* | S3 bucket for file uploads |
| `AWS_REGION` | aws | `ap-south-1` | AWS region |
| `AWS_ACCESS_KEY_ID` | aws | *(IAM role)* | Explicit credentials (optional if using instance role) |
| `AWS_SECRET_ACCESS_KEY` | aws | *(IAM role)* | Explicit credentials (optional if using instance role) |
| `SPRING_PROFILES_ACTIVE` | all | *(default/H2)* | Set to `mysql` or `aws` |

In the `aws` profile, `app.jwt.secret` and `ai.gemini.api-key` are read from SSM Parameter Store by `AwsConfig.java` — do not put them in environment variables or properties files.

### Frontend

| Variable | Default | Description |
|---|---|---|
| `REACT_APP_API_URL` | `http://localhost:8080/api` | Backend base URL. Set this for production builds. |
| `PORT` | `3000` | Dev server port. Set to `3001` to avoid conflicts. |

Create a `.env` file in `react_app_demo/` to persist these:

```
REACT_APP_API_URL=http://localhost:8080/api
PORT=3001
```

---

## Project Structure

```
smart-pdf-analyzer/
│
├── README.md                        ← You are here
├── MYSQL_SETUP.md                   ← MySQL local + Docker setup guide
├── AWS_SETUP.md                     ← Full AWS deployment walkthrough
├── COMPONENTS.md                    ← Component-level technical reference
├── MANUAL.md                        ← End-user feature guide
├── mock-document.pdf                ← Sample PDF for testing
│
├── pdf-analyzer-backend/            ← Spring Boot application
│   ├── pom.xml                      ← Maven deps: Spring, Tika, PDFBox, JWT, MySQL, AWS SDK
│   └── src/main/
│       ├── resources/
│       │   ├── application.properties          ← H2 defaults, applies to all profiles
│       │   ├── application-mysql.properties    ← MySQL overrides
│       │   └── application-aws.properties      ← RDS + S3 + SSM overrides
│       └── java/com/pdfanalyzer/
│           ├── PdfAnalyzerApplication.java     ← Entry point, @EnableAsync
│           ├── config/
│           │   ├── ApplicationConfig.java      ← UserDetailsService, BCrypt, AuthenticationProvider
│           │   ├── AsyncConfig.java            ← ThreadPoolTaskExecutor (2–5 threads)
│           │   ├── DataSeeder.java             ← Creates demo user 'bratish' on first run
│           │   └── aws/
│           │       └── AwsConfig.java          ← S3Client, SsmClient, SSM secret injection
│           ├── controller/
│           │   ├── AuthController.java         ← POST /api/auth/register, /api/auth/login
│           │   ├── DocumentController.java     ← /api/documents/** (upload, list, get, delete, search, file, ask)
│           │   └── ChatController.java         ← POST /api/chat, GET /api/history/{id}, GET /api/analytics
│           ├── service/
│           │   ├── storage/
│           │   │   ├── StorageService.java         ← Interface: store, retrieve, delete, toLocalPath
│           │   │   ├── LocalStorageService.java    ← Disk implementation (profiles: default, mysql)
│           │   │   └── AwsS3StorageService.java    ← S3 implementation (profile: aws)
│           │   ├── DocumentService.java            ← Upload orchestration, read, delete, search, Q&A
│           │   ├── DocumentProcessingService.java  ← @Async: extract → NLP → summarize → save
│           │   ├── DocumentParsingService.java     ← PDFBox text extraction + Tika metadata + language detect
│           │   ├── NlpService.java                 ← TF-IDF keywords, named entities, word/sentence count
│           │   ├── SummarizationService.java       ← Facade delegating to GeminiSummarizationService
│           │   ├── GeminiSummarizationService.java ← Gemini REST API calls + offline fallback
│           │   ├── ChatService.java                ← Q&A with ChatInteraction DB persistence
│           │   └── AnalyticsService.java           ← Total document and Q&A counts
│           ├── entity/
│           │   ├── User.java               ← id, username, email, password, fullName, createdAt
│           │   ├── Document.java           ← full document record including rawText, summary, keywords
│           │   ├── DocumentChunk.java      ← infrastructure for future RAG implementation
│           │   └── ChatInteraction.java    ← stores every Q&A exchange per document per user
│           ├── repository/
│           │   ├── UserRepository.java               ← findByUsername, existsByEmail, etc.
│           │   ├── DocumentRepository.java           ← findByUser, searchByUser (JPQL full-text)
│           │   ├── ChatInteractionRepository.java    ← findByDocumentAndUser with Pageable
│           │   └── DocumentChunkRepository.java      ← @Transactional @Modifying deleteByDocument
│           ├── security/
│           │   ├── JwtUtil.java                  ← generate, extract, validate HMAC-SHA256 JWTs
│           │   ├── JwtAuthenticationFilter.java  ← OncePerRequestFilter, sets SecurityContext
│           │   └── SecurityConfig.java           ← filter chain, CORS, public vs protected routes
│           ├── dto/
│           │   ├── LoginRequest.java      ← username, password (@NotBlank)
│           │   ├── RegisterRequest.java   ← username, email, password, fullName (validated)
│           │   ├── AuthResponse.java      ← token, username, email, fullName
│           │   ├── DocumentResponse.java  ← full document projection for frontend
│           │   ├── ChatRequest.java       ← documentId, question, mode
│           │   └── ChatResponse.java      ← answer, explanation, sourceText, offlineFallback
│           ├── enums/
│           │   └── DocumentStatus.java   ← PROCESSING, EXTRACTING_TEXT, SUMMARIZING, DONE, ERROR, etc.
│           └── exception/
│               └── GlobalExceptionHandler.java  ← @RestControllerAdvice, ordered most→least specific
│
└── react_app_demo/                  ← React frontend
    ├── package.json                 ← deps: react, react-router-dom, axios, react-markdown, tailwindcss
    ├── tailwind.config.js           ← custom dark theme tokens
    └── src/
        ├── api.js                   ← Axios instance, JWT request interceptor, 401 redirect interceptor
        ├── App.js                   ← BrowserRouter with all 9 routes
        ├── index.css                ← CSS variables for dark theme (bgDark, accent, border, etc.)
        ├── pages/
        │   ├── Login.jsx            ← form validation, stores token + user in localStorage
        │   ├── Register.jsx         ← strips 'confirm' field before API call (bug fix)
        │   ├── Dashboard.jsx        ← document grid, stats bar, handles all processing statuses
        │   ├── Upload.jsx           ← drag-and-drop, PDF magic byte check, 50MB limit
        │   ├── DocumentView.jsx     ← 6 tabs: Summary, Keywords, Entities, Raw Text, Preview, AI Q&A
        │   ├── Search.jsx           ← XSS-safe highlight via React component (not dangerouslySetInnerHTML)
        │   ├── Home.jsx             ← marketing landing page
        │   ├── About.jsx            ← static about page
        │   └── Contact.jsx          ← static contact page
        └── components/
            ├── Navbar.jsx           ← auth-aware navigation, shows Dashboard/Upload when logged in
            ├── Avatar.jsx           ← initials avatar fallback
            ├── Footer.jsx
            ├── HeroSection.jsx
            ├── FeatureCard.jsx
            ├── StatsCard.jsx
            ├── FAQ.jsx
            ├── TestimonialCard.jsx
            ├── Timeline.jsx
            ├── TeamSection.jsx
            ├── NewsFeed.jsx
            └── MissionStatement.jsx
```

---

## API Reference

All protected endpoints require the header: `Authorization: Bearer <token>`

### Auth

| Method | Endpoint | Body | Response |
|---|---|---|---|
| POST | `/api/auth/register` | `{username, email, password, fullName}` | `{token, username, email, fullName}` |
| POST | `/api/auth/login` | `{username, password}` | `{token, username, email, fullName}` |

### Documents

| Method | Endpoint | Notes |
|---|---|---|
| POST | `/api/documents/upload` | `multipart/form-data`, field name `file`. PDF only. Max 50MB. |
| GET | `/api/documents` | Returns all documents for the logged-in user, newest first. |
| GET | `/api/documents/{id}` | Returns full DocumentResponse. Enforces ownership. |
| GET | `/api/documents/{id}/text` | Returns `{text: "..."}`. The full extracted raw text. |
| GET | `/api/documents/{id}/file` | Streams the original PDF as `application/pdf` with `Content-Disposition: inline`. |
| DELETE | `/api/documents/{id}` | Deletes from DB and from storage (disk or S3). |
| GET | `/api/documents/search?q=term` | Searches filename, rawText, keywords, summary with LIKE. |
| POST | `/api/documents/{id}/ask` | Body: `{question}`. Single-turn Q&A. Returns `{answer}`. |

### Chat

| Method | Endpoint | Body | Notes |
|---|---|---|---|
| POST | `/api/chat` | `{documentId, question, mode}` | mode: `simple` / `detailed` / `summary` / `keypoints`. Saves interaction to DB. |
| GET | `/api/history/{documentId}` | — | Returns last 50 Q&A for the document, chronological. |
| GET | `/api/analytics` | — | Returns `{totalDocuments, totalQuestions}`. |

### DocumentResponse shape

```json
{
  "id": 1,
  "originalFilename": "Java Notes.pdf",
  "fileType": "application/pdf",
  "fileSize": 13892222,
  "status": "DONE",
  "title": "Java Programming Notes",
  "author": "John Doe",
  "pageCount": 240,
  "language": "en",
  "wordCount": 42000,
  "sentenceCount": 1800,
  "summary": "This document covers Java fundamentals including...",
  "keywords": ["java", "inheritance", "polymorphism", "generics"],
  "namedEntities": ["James Gosling", "Sun Microsystems", "Oracle"],
  "uploadedAt": "2026-04-14T22:44:00",
  "processedAt": "2026-04-14T22:44:35"
}
```

---

## Database Schema

### `users`
| Column | Type | Constraint |
|---|---|---|
| id | BIGINT | PK, auto-increment |
| username | VARCHAR(100) | UNIQUE, NOT NULL |
| email | VARCHAR(150) | UNIQUE, NOT NULL |
| password | VARCHAR(255) | BCrypt hash |
| full_name | VARCHAR(200) | nullable |
| created_at | TIMESTAMP | set by @PrePersist |

### `documents`
| Column | Type | Notes |
|---|---|---|
| id | BIGINT | PK |
| user_id | BIGINT | FK → users.id |
| filename | VARCHAR(255) | stored filename (UUID-prefixed or S3 key) |
| original_filename | VARCHAR(255) | user's original name |
| file_type | VARCHAR(50) | e.g. `application/pdf` |
| file_size | BIGINT | bytes |
| file_path | VARCHAR(255) | local absolute path OR S3 object key |
| status | VARCHAR(30) | PROCESSING → EXTRACTING_TEXT → SUMMARIZING → DONE |
| title | VARCHAR(255) | from PDF metadata |
| author | VARCHAR(255) | from PDF metadata |
| page_count | INT | from PDF metadata |
| raw_text | CLOB | full extracted text |
| summary | CLOB | Gemini-generated summary |
| keywords | VARCHAR(2000) | comma-separated TF-IDF terms |
| language | VARCHAR(20) | `en` or `other` |
| word_count | INT | |
| sentence_count | INT | |
| named_entities | CLOB | pipe-separated entity strings |
| uploaded_at | TIMESTAMP | @PrePersist |
| processed_at | TIMESTAMP | set when status = DONE |

### `chat_interactions`
| Column | Type | Notes |
|---|---|---|
| id | BIGINT | PK |
| document_id | BIGINT | FK → documents.id |
| user_id | BIGINT | FK → users.id |
| question | CLOB | user's question |
| answer | CLOB | AI response |
| mode | VARCHAR(20) | simple / detailed / summary / keypoints |
| created_at | TIMESTAMP | @PrePersist |

### `document_chunks`
| Column | Type | Notes |
|---|---|---|
| id | BIGINT | PK |
| document_id | BIGINT | FK → documents.id |
| content | TEXT | chunk text |
| chunk_index | INT | ordering |
| keywords | TEXT | chunk-level keywords |

> `document_chunks` is infrastructure for a future RAG (Retrieval-Augmented Generation) implementation. It is not currently populated.

---

## Architecture

```
Browser (React 18)
     │  HTTP + Bearer JWT
     ▼
Spring Boot 3.2  (:8080)
     │
     ├── JwtAuthenticationFilter  (every request)
     ├── SecurityConfig           (route rules, CORS)
     │
     ├── AuthController           → AuthService → UserRepository
     │
     ├── DocumentController
     │        │
     │        ├── DocumentService
     │        │       ├── StorageService ──┬── LocalStorageService  (profiles: default, mysql)
     │        │       │                   └── AwsS3StorageService   (profile: aws)
     │        │       ├── DocumentParsingService  (PDFBox → Tika fallback)
     │        │       └── [async] DocumentProcessingService
     │        │                   ├── NlpService         (TF-IDF, NER, word count)
     │        │                   └── SummarizationService → GeminiSummarizationService
     │        └── DocumentRepository
     │
     ├── ChatController           → ChatService → GeminiSummarizationService
     │                                         → ChatInteractionRepository
     │
     └── Database
           ├── H2 file-based  (profile: default)
           ├── MySQL local    (profile: mysql)
           └── AWS RDS MySQL  (profile: aws)
```

---

## Bug Fixes Applied

| # | Bug | Fix |
|---|---|---|
| 1 | PDFBox used but not declared in pom.xml | Added explicit `pdfbox 3.0.1` dependency |
| 2 | `NlpService` written but never called — keywords/entities/wordCount always null | Injected into `DocumentProcessingService`, called after text extraction |
| 3 | Frontend polled for status `"PROCESSING"` which backend never set | Initial upload status is now `"PROCESSING"`; frontend `isProcessing()` handles all intermediate statuses |
| 4 | `@Value("${upload.path}")` didn't match `app.storage.location` in properties | Aligned key in both places; abstracted behind `StorageService` |
| 5 | `Register.jsx` sent `confirm` password field to backend | Destructure before `api.post()` — only `{fullName, username, email, password}` sent |
| 6 | `GlobalExceptionHandler` had `Exception` handler before `RuntimeException` | Reordered: most-specific first |
| 7 | `/api/analytics` had no `@AuthenticationPrincipal` | Added auth parameter |
| 8 | `deleteByDocument` in repository missing `@Transactional @Modifying` | Both annotations added |
| 9 | `JwtUtil` double Base64 encode→decode roundtrip | Replaced with direct `getBytes(UTF_8)` |
| 10 | Dead `/api/docs/**` public route in `SecurityConfig` | Removed |
| 11 | XSS via `dangerouslySetInnerHTML` in `Search.jsx` | Replaced with `<SafeHighlight>` React component |
| 12 | Hardcoded `localhost:8080` in frontend | Uses `REACT_APP_API_URL` env var with fallback |

---

## Known Limitations

- **PDF only**: The upload validation restricts to `application/pdf`. DOCX and TXT are parsed by Tika internally but the UI and validation only accepts PDF.
- **Search is LIKE-based**: Full-text search uses SQL `LIKE '%term%'` which is a full table scan. For large document libraries, replace with Elasticsearch or PostgreSQL full-text search.
- **30,000 character Gemini limit**: Documents longer than ~25 pages have their text truncated before being sent to Gemini. The full text is still stored and searchable.
- **NER is heuristic**: Named entity recognition uses a capitalisation pattern (`[A-Z][a-z]+ [A-Z][a-z]+`) — not a trained ML model. It produces false positives for sentence-starting words.
- **No RAG**: The `document_chunks` table exists but chunking and vector similarity search are not implemented. Long documents get truncated rather than intelligently queried.
- **DataSeeder in production**: `DataSeeder.java` creates user `bratish/password` on every startup. Annotate it with `@Profile("!prod")` before going to production.
