# Component Reference — Smart PDF Analyzer

This document describes every component in both the backend and frontend layers: what it does, why it exists, what it talks to, and what would break if it were removed.

---

## Backend Components (Spring Boot)

### Entry Point

#### `PdfAnalyzerApplication.java`
The `main()` class. `@SpringBootApplication` triggers auto-scanning of all `@Component`, `@Service`, `@Repository`, and `@Controller` classes in the `com.pdfanalyzer` package tree. `@EnableAsync` activates the async processing capability needed for background document analysis. Removing `@EnableAsync` would cause `@Async` annotations on `DocumentProcessingService` to be silently ignored — uploads would work but documents would never be processed.

---

### Config Layer (`config/`)

#### `ApplicationConfig.java`
Defines three Spring Security beans that the entire authentication system depends on:
- **`UserDetailsService`** — loads a `User` from the database by username. Called by `JwtAuthenticationFilter` on every protected request.
- **`AuthenticationProvider`** (`DaoAuthenticationProvider`) — wires `UserDetailsService` + `BCryptPasswordEncoder` so Spring can verify login credentials.
- **`PasswordEncoder`** (`BCryptPasswordEncoder`) — the BCrypt bean. Used by `AuthService` when registering a user and by `DaoAuthenticationProvider` when verifying login.

Without this file nothing would compile — these beans are injected everywhere.

#### `AsyncConfig.java`
Creates a named `ThreadPoolTaskExecutor` bean called `documentProcessingExecutor`. Configuration:
- Core threads: 2 (always alive)
- Max threads: 5 (spawned under load)
- Queue capacity: 25 (uploads waiting to be processed)
- Thread name prefix: `DocProcess-` (visible in thread dumps)

Without this, `@Async("documentProcessingExecutor")` would fall back to Spring's default simple async executor (unbounded, no queue), which could exhaust server threads under load.

#### `DataSeeder.java`
A `CommandLineRunner` that runs on every startup. Creates demo user `bratish / password` (BCrypt-encoded) if it does not already exist. **Remove or guard with `@Profile("!prod")` before any public deployment** — it creates a known-credentials account.

#### `aws/AwsConfig.java`
Active only when profile is `aws`. Responsibilities:
1. Creates an `S3Client` bean — used by `AwsS3StorageService` for all file operations.
2. Creates an `SsmClient` bean — used to read secrets from AWS Systems Manager Parameter Store.
3. On `@PostConstruct`, reads three SSM parameters (`jwt-secret`, `gemini-api-key`, `db-password`) and injects them into the Spring `Environment` as the highest-priority property source. This means the rest of the app reads `@Value("${app.jwt.secret}")` as normal — it never knows the value came from SSM.

SSM parameter paths expected:
- `/pdfanalyzer/prod/jwt-secret` (SecureString)
- `/pdfanalyzer/prod/gemini-api-key` (SecureString)
- `/pdfanalyzer/prod/db-password` (SecureString, optional)

---

### Security Layer (`security/`)

#### `JwtUtil.java`
Handles all JWT operations using JJWT 0.12.5:
- **`generateToken(UserDetails)`** — builds a JWT with `sub=username`, `iat=now`, `exp=now+86400000ms`. Signed with HMAC-SHA256 using the secret from `application.properties`.
- **`extractUsername(token)`** — parses the `sub` claim.
- **`isTokenValid(token, userDetails)`** — checks username match AND that expiry is in the future. Both must be true.
- **`getSigningKey()`** — converts the secret string to a `SecretKey` via `getBytes(UTF_8)`. (The original double-Base64 encoding bug has been fixed here.)

#### `JwtAuthenticationFilter.java`
Extends `OncePerRequestFilter` — runs exactly once per HTTP request, before any controller. Logic:
1. Read the `Authorization` header.
2. If missing or does not start with `Bearer ` → pass through unauthenticated (the security config will reject if the route requires auth).
3. Extract the JWT, call `JwtUtil.extractUsername()`.
4. If username found and `SecurityContext` is empty → load `UserDetails` from DB, call `isTokenValid()`.
5. If valid → create `UsernamePasswordAuthenticationToken` and set it in `SecurityContextHolder`.
6. Invalid tokens are silently swallowed — the request continues unauthenticated.

#### `SecurityConfig.java`
Configures the Spring Security filter chain:
- **CSRF**: disabled (stateless JWT API — no cookies, no CSRF risk).
- **CORS**: configured from `app.cors.allowed-origins` — allows the React dev servers.
- **Frame Options**: disabled to allow the H2 console (which uses iframes).
- **Route rules**: `/api/auth/**` and `/h2-console/**` are public. Everything else requires authentication.
- **Session**: `STATELESS` — no server-side session, no cookies.
- **Filter order**: `JwtAuthenticationFilter` is inserted before `UsernamePasswordAuthenticationFilter`.

---

### Controller Layer (`controller/`)

#### `AuthController.java`
Maps to `/api/auth`. Both endpoints are public (no JWT needed).
- **`POST /register`** — validates `RegisterRequest` with `@Valid`, calls `AuthService.register()`, returns `AuthResponse` with JWT.
- **`POST /login`** — validates `LoginRequest`, calls `AuthService.login()`, returns `AuthResponse` with JWT. Returns 401 on bad credentials.

#### `DocumentController.java`
Maps to `/api/documents`. All endpoints require a valid JWT. Uses `@AuthenticationPrincipal UserDetails` to get the current user from the `SecurityContext` — Spring injects this automatically after the JWT filter runs.

Endpoints:
- `POST /upload` — accepts `multipart/form-data` with field `file`. Validates content type and PDF magic bytes. Returns `DocumentResponse` immediately while async processing begins in the background.
- `GET /` — returns all documents for the user, newest first.
- `GET /{id}` — returns one document. `findByIdAndUser()` enforces ownership.
- `GET /{id}/text` — returns `{text: "..."}` with the full extracted text.
- `GET /{id}/file` — streams the file as `InputStreamResource` with appropriate `Content-Type`. Works for both local disk and S3 via `StorageService`.
- `DELETE /{id}` — deletes from storage backend and from the database.
- `GET /search?q=term` — delegates to `DocumentRepository.searchByUser()`.
- `POST /{id}/ask` — single-turn Q&A, returns `{answer}`. Does not save the interaction to DB (use `/api/chat` for persistent Q&A).

#### `ChatController.java`
Maps to `/api`.
- **`POST /chat`** — loads the `User` entity (needed to save the `ChatInteraction`), calls `ChatService.chat()`, returns `ChatResponse`. The interaction is persisted to `chat_interactions`.
- **`GET /history/{documentId}`** — returns the last 50 Q&A for a document, in chronological order (fetched as DESC, then reversed in memory).
- **`GET /analytics`** — returns `{totalDocuments, totalQuestions}` system-wide. Requires JWT (authentication enforced by `SecurityConfig`).

---

### Service Layer (`service/`)

#### `StorageService.java` (interface)
Abstracts all file I/O behind four methods:
- `store(file, username)` → returns a `storageKey` string (local absolute path OR S3 object key)
- `retrieve(storageKey)` → returns an `InputStream`
- `delete(storageKey)` → deletes from backend
- `toLocalPath(storageKey)` → returns a `Path` (downloads from S3 to temp file if needed)

`DocumentService` and `DocumentProcessingService` depend only on this interface — they never reference `File`, `Path`, or `S3Client` directly. Switching storage backends requires no code changes in those classes.

#### `LocalStorageService.java`
Active when profile is NOT `aws` (annotated `@Profile("!aws")`). Stores files under `{app.storage.location}/{username}/{uuid}_{filename}`. The `storageKey` is the full absolute path. `toLocalPath()` returns it directly — no download needed.

#### `AwsS3StorageService.java`
Active when profile is `aws`. Stores files at S3 key `uploads/{username}/{uuid}_{filename}` with AES256 server-side encryption. `toLocalPath()` downloads the S3 object to a Java temp file (deleted by the JVM on exit, and explicitly deleted in `DocumentProcessingService.processDocument()`). `isRemote()` returns `true`, which signals callers to delete the temp file after use.

#### `DocumentService.java`
Orchestrates the upload flow and handles all read/delete/search/Q&A operations:
1. Validates file type (content-type header + PDF magic bytes `%PDF`)
2. Calls `storageService.store()` to save the file
3. Calls `parsingService.extractMetadata()` to read PDF title/author/pages
4. Saves a `Document` entity with status `PROCESSING`
5. Calls `processingService.processDocument()` asynchronously (returns immediately)
6. Returns `DocumentResponse` to the controller

For file serving, it calls `storageService.retrieve()` which returns an `InputStream` — works for both local and S3.

#### `DocumentProcessingService.java`
Annotated `@Async("documentProcessingExecutor")` — runs on the DocProcess thread pool. Steps:
1. `EXTRACTING_TEXT` — calls `storageService.toLocalPath()`, then `parsingService.extractText()`. Cleans up temp file if S3 mode.
2. `DETECTING_LANGUAGE` — heuristic English stopword count.
3. NLP — calls `nlpService.extractKeywords(20)`, `extractNamedEntities()`, `countWords()`, `detectSentences()`.
4. `SUMMARIZING` — calls `summarizationService.summarize()` → Gemini API.
5. Saves all fields to the `Document` entity and sets status to `DONE`.

On any exception: sets status to `ERROR` and saves. The frontend shows the error badge.

#### `DocumentParsingService.java`
Two-phase text extraction:
1. **Phase 1 (PDFBox)**: For `.pdf` files, opens with `PDDocument.load()`, uses `PDFTextStripper.getText()`. More accurate for most PDFs.
2. **Phase 2 (Tika fallback)**: If PDFBox fails (encrypted PDF, corrupted file), falls back to Tika's `AutoDetectParser` which handles the file generically.

Also provides:
- `extractMetadata()` — runs Tika's `AutoDetectParser`, returns all metadata key-value pairs (title, author, page count, etc.)
- `detectLanguage()` — counts how many of 10 common English stopwords appear in the text. Returns `"en"` if ≥ 5 match, else `"other"`.

#### `NlpService.java`
Pure Java NLP — no external library, no paid API:
- **`detectSentences(text)`** — regex-based split on `.`, `!`, `?` followed by uppercase. Has a fallback for texts with inconsistent capitalisation.
- **`tokenize(text)`** — lowercase split on non-alphanumeric characters. Filters tokens shorter than 3 chars and matches against a 100-word stopword list.
- **`extractKeywords(text, topN)`** — computes TF-IDF scores across sentences as pseudo-documents. Returns top N terms sorted by score descending.
  - TF = term count in document / total tokens
  - IDF = log((N+1)/(df+1)) + 1, where N = sentence count, df = sentences containing the term
- **`extractNamedEntities(text)`** — regex `\b([A-Z][a-z]+ [A-Z][a-z]+)\b` finds consecutive title-case word pairs. Returns up to 30 unique matches.
- **`countWords(text)`** — splits on whitespace, returns count.

#### `SummarizationService.java`
A thin facade. Delegates `summarize()` and `askQuestion()` to `GeminiSummarizationService`. Catches all exceptions and returns a generic error string rather than propagating — prevents document processing from failing just because AI is down.

#### `GeminiSummarizationService.java`
Calls the Google Gemini REST API using Spring's `RestTemplate`:
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
- Summarization prompt: `"Summarize this document in simple terms:\n\n{text}"`
- Q&A prompt: `"Answer this question based on the document:\n\nDOCUMENT:\n{text}\n\nQUESTION: {question}"`
- Temperature: `0.5` for summaries (slight creativity), `0.3` for Q&A (more factual)
- Text is truncated to 30,000 characters before sending.

Offline fallbacks (when API key is missing or call fails):
- `offlineSummary()` — returns the first 3 sentences longer than 20 characters
- `offlineQna()` — scans sentences for keywords from the question, returns the first matching sentence

#### `ChatService.java`
Handles the persistent Q&A flow:
1. Loads the `Document` by ID
2. Calls `geminiService.askQuestionAboutDocument(rawText, question)`
3. Saves a `ChatInteraction` (document FK, user FK, question, answer, mode)
4. Returns `ChatResponse`

#### `AuthService.java`
- **`register()`** — checks username/email uniqueness, BCrypt-encodes password, saves `User`, generates and returns JWT.
- **`login()`** — delegates credential verification to `AuthenticationManager` (which uses `DaoAuthenticationProvider` internally), then generates and returns JWT.

#### `AnalyticsService.java`
Returns a `Map` with `totalDocuments` (all documents in DB, all users) and `totalQuestions` (all chat interactions in DB). Simple `repository.count()` calls.

---

### Repository Layer (`repository/`)

| Repository | Key custom method |
|---|---|
| `UserRepository` | `findByUsername`, `existsByUsername`, `existsByEmail` |
| `DocumentRepository` | `findByUserOrderByUploadedAtDesc`, `findByIdAndUser` (ownership), `searchByUser` (JPQL LIKE) |
| `ChatInteractionRepository` | `findByDocumentAndUserOrderByCreatedAtDesc` with `Pageable` |
| `DocumentChunkRepository` | `@Transactional @Modifying void deleteByDocument` |

`findByIdAndUser()` is the ownership enforcement mechanism — a user can never access another user's document because both the ID and the User entity must match.

`searchByUser()` JPQL:
```sql
SELECT d FROM Document d WHERE d.user = :user AND (
  LOWER(d.originalFilename) LIKE LOWER(CONCAT('%', :query, '%')) OR
  LOWER(d.rawText)          LIKE LOWER(CONCAT('%', :query, '%')) OR
  LOWER(d.keywords)         LIKE LOWER(CONCAT('%', :query, '%')) OR
  LOWER(d.summary)          LIKE LOWER(CONCAT('%', :query, '%'))
)
```

---

### DTO Layer (`dto/`)

DTOs are the contract between the API and its callers. Entities are never returned directly.

| DTO | Direction | Fields |
|---|---|---|
| `LoginRequest` | → backend | username, password |
| `RegisterRequest` | → backend | username, email, password, fullName |
| `AuthResponse` | backend → | token, username, email, fullName |
| `DocumentResponse` | backend → | id, filename, originalFilename, fileType, fileSize, status, title, author, pageCount, language, wordCount, sentenceCount, summary, keywords (List), namedEntities (List), uploadedAt, processedAt |
| `ChatRequest` | → backend | documentId, question, mode |
| `ChatResponse` | backend → | answer, explanation, sourceText, offlineFallback |

---

### Exception Handling (`exception/`)

#### `GlobalExceptionHandler.java`
`@RestControllerAdvice` — intercepts exceptions thrown from any controller. Handlers are ordered most-specific to least-specific (fixed from original AI-generated code):

1. `MethodArgumentNotValidException` → 400 with field-level error map
2. `BadCredentialsException` → 401 `"Invalid username or password"`
3. `UsernameNotFoundException` → 404
4. `MaxUploadSizeExceededException` → 413 `"Maximum upload size is 50MB"`
5. `IllegalArgumentException` → 400
6. `RuntimeException` → 400
7. `Exception` → 500 (catch-all)

---

## Frontend Components (React)

### Core Files

#### `api.js`
Central Axios instance configured with:
- `baseURL` from `process.env.REACT_APP_API_URL` (falls back to `http://localhost:8080/api`)
- **Request interceptor**: reads JWT from `localStorage.getItem('token')` and adds `Authorization: Bearer <token>` header to every request automatically.
- **Response interceptor**: on HTTP 401, clears `localStorage` and redirects to `/login`. Handles expired tokens transparently.

Exported helper functions used by pages:
- `chatWithDocument(documentId, question, mode)` — POST /api/chat
- `getDocumentChatHistory(documentId)` — GET /api/history/{id}
- `getSystemAnalytics()` — GET /api/analytics

#### `App.js`
Defines all client-side routes via React Router v6:

| Path | Component |
|---|---|
| `/` | Home |
| `/login` | Login |
| `/register` | Register |
| `/contact` | Contact |
| `/about` | About |
| `/dashboard` | Dashboard |
| `/upload` | Upload |
| `/document/:id` | DocumentView |
| `/search` | Search |
| `*` | 404 page |

`Navbar` and `Footer` are rendered outside `<Routes>` so they appear on every page.

---

### Pages

#### `Login.jsx`
- Client-side validation before any API call (empty field checks)
- `POST /api/auth/login` with `{username, password}`
- On success: stores `token` and `{username, email, fullName}` in `localStorage`, navigates to `/dashboard`
- On 401: displays `"Invalid credentials"` error inline

#### `Register.jsx`
- Full client-side validation: fullName required, username ≥ 3 chars, valid email format, password ≥ 6 chars, confirm match
- Real-time password strength bar (Weak / Fair / Good / Strong) based on length, uppercase, digit, special char
- **Bug fix**: only sends `{fullName, username, email, password}` to the API — the `confirm` field is destructured away before the call
- On success: same localStorage + navigate flow as Login

#### `Dashboard.jsx`
- Requires auth: redirects to `/login` if no token in `localStorage`
- Fetches `GET /api/documents` on mount
- Displays a stats bar: total documents, processed count, total words, documents with keywords
- Document grid with cards showing: filename, file size, upload date, status badge, summary snippet, top 4 keywords
- Status badge handles ALL processing statuses (`PROCESSING`, `UPLOADING`, `EXTRACTING_TEXT`, `DETECTING_LANGUAGE`, `SUMMARIZING`, `DONE`, `ERROR`, `EMPTY_CONTENT`)
- Delete with `window.confirm` confirmation

#### `Upload.jsx`
- Drag-and-drop zone using HTML5 drag events (`onDrop`, `onDragOver`, `onDragLeave`)
- Validates: file type must be `application/pdf` or `.pdf` extension; size ≤ 50MB
- Sends `FormData` with field `file` to `POST /api/documents/upload`
- On success: navigates directly to `/document/{id}`

#### `DocumentView.jsx`
The most complex page. Handles its own polling logic using `useRef` to store the interval ID (avoids stale closure bugs). On mount, loads the document + chat history in parallel via `Promise.all`.

Six tabs:

| Tab | Content |
|---|---|
| **📝 Summary** | Gemini AI summary rendered as Markdown via `ReactMarkdown` + `remark-gfm`. Shows a spinner during processing. |
| **🔑 Keywords** | Tag cloud of TF-IDF keywords. Tags are sized slightly by rank. |
| **🏷️ Entities** | Named entity chips in green. |
| **📄 Raw Text** | Full extracted text in monospace scrollable area. Loaded lazily (only when tab is clicked). `CopyButton` copies the entire text to clipboard. Shows character and line count. |
| **👁️ Preview** | PDF loaded as a Blob via `GET /api/documents/{id}/file`, then `URL.createObjectURL()` for the iframe `src`. Blob URL revoked on unmount (`useEffect` cleanup). |
| **💬 AI Q&A** | Full chat interface. Mode selector (Simple / Detailed / Summary / Key Points). Quick-question chips when history is empty. AI responses rendered as Markdown. Bouncing dot loading indicator. Auto-scrolls to latest message. Saves history to DB via `/api/chat`. Reloads history on mount. |

Polling logic: `isProcessing(status)` returns true for any of `PROCESSING`, `UPLOADING`, `EXTRACTING_TEXT`, `DETECTING_LANGUAGE`, `SUMMARIZING`. The interval is stored in `useRef` and cleared in the `useEffect` cleanup function — preventing memory leaks when the user navigates away.

#### `Search.jsx`
- `GET /api/documents/search?q=term`
- `SafeHighlight` component — splits text on the search query and wraps matches in `<mark>` elements using React's reconciler. **No `dangerouslySetInnerHTML`** — XSS is impossible.
- Shows matched keywords highlighted in accent colour
- Result cards navigate to `DocumentView` on click

---

### Components

| Component | Purpose |
|---|---|
| `Navbar.jsx` | Auth-aware navigation. When `localStorage.getItem('token')` is truthy, shows Dashboard, Upload, and username. Otherwise shows Login and Register. Fully responsive with hamburger menu. |
| `Avatar.jsx` | Circular avatar. Shows initials (first letter of each word in `name`) when no `src` is provided. Used in Dashboard header and chat messages. |
| `Footer.jsx` | Static footer with links. |
| `HeroSection.jsx` | Full-width hero banner on the Home page. |
| `FeatureCard.jsx` | Feature highlight card for the Home page features grid. |
| `StatsCard.jsx` | Animated number stat card (e.g., "10,000+ Documents"). |
| `FAQ.jsx` | Accordion-style Q&A section. |
| `TestimonialCard.jsx` | User testimonial with avatar and quote. |
| `Timeline.jsx` | Vertical timeline for product history or roadmap. |
| `TeamSection.jsx` | Team member cards using avatar images from `public/avatars/`. |
| `NewsFeed.jsx` | News or updates list component. |
| `MissionStatement.jsx` | Text block for mission/vision section. |
| `InputField.jsx` | Reusable form field with label, value, onChange, and error state. Includes ARIA attributes (`aria-required`, `aria-invalid`, `aria-describedby`). |
