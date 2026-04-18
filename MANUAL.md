# User Manual — Smart PDF Analyzer

This manual explains how to use every feature of the application from a user's perspective.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Creating an Account](#creating-an-account)
3. [Logging In](#logging-in)
4. [Your Dashboard](#your-dashboard)
5. [Uploading a PDF](#uploading-a-pdf)
6. [Understanding the Analysis](#understanding-the-analysis)
   - [Summary Tab](#summary-tab)
   - [Keywords Tab](#keywords-tab)
   - [Entities Tab](#entities-tab)
   - [Raw Text Tab](#raw-text-tab)
   - [Preview Tab](#preview-tab)
   - [AI Q&A Chat Tab](#ai-qa-chat-tab)
7. [Searching Your Documents](#searching-your-documents)
8. [Deleting a Document](#deleting-a-document)
9. [Logging Out](#logging-out)
10. [Troubleshooting](#troubleshooting)
11. [Limitations](#limitations)

---

## Getting Started

Smart PDF Analyzer runs as two processes that must both be running:

| Process | Where to start it | URL |
|---|---|---|
| Backend (Java) | `cd pdf-analyzer-backend && mvn spring-boot:run` | http://localhost:8080 |
| Frontend (React) | `cd react_app_demo && PORT=3001 npm start` | http://localhost:3001 |

**First time only**: run `npm install` inside `react_app_demo/` before starting the frontend.

Open **http://localhost:3001** in your browser once both processes are running.

---

## Creating an Account

1. Click **Register** in the top navigation bar, or **Create Account** on the home page.
2. Fill in the form:
   - **Full Name** — your display name (shown in the dashboard header)
   - **Username** — must be at least 3 characters, letters and numbers only
   - **Email** — must be a valid email format
   - **Password** — minimum 6 characters. The strength bar shows Weak / Fair / Good / Strong as you type.
   - **Confirm Password** — must match the password field exactly
3. Click **Create Account**.
4. You are automatically logged in and taken to your Dashboard.

> A demo account already exists: username `bratish`, password `password`. You can use it to explore the app immediately.

---

## Logging In

1. Click **Login** in the navigation bar.
2. Enter your username and password.
3. Click **Sign In**.

Your session lasts 24 hours. After that you will be redirected to the login page automatically.

---

## Your Dashboard

The Dashboard is your document library. It shows:

- **Header** — your name and avatar, plus buttons for Search, Upload, and Logout.
- **Stats bar** — total documents, number fully processed, total word count across all documents, and how many have extracted keywords.
- **Document cards** — one card per uploaded PDF.

Each card shows:
- File name
- File size and upload date
- A coloured status badge (see table below)
- A short preview of the AI-generated summary (once processed)
- Up to 4 top keywords

**Status badges:**

| Badge | Colour | Meaning |
|---|---|---|
| ⟳ Processing | Yellow, pulsing | The document is being analysed. This is automatic and takes 15–60 seconds. |
| ✓ Done | Green | Analysis is complete. All tabs are available. |
| ✗ Error | Red | Something went wrong during processing. The raw text may still be available. |
| ⚠ Empty | Amber | The PDF contained no extractable text (e.g. a scanned image PDF with no OCR layer). |

Click any card to open the full Document View.

---

## Uploading a PDF

1. Click **+ Upload PDF** from the Dashboard or **Upload** in the navigation bar.
2. Either:
   - **Drag and drop** your PDF file onto the dashed area, or
   - Click **Browse Files** and select a file from your computer.
3. The file name and size are shown once selected. Click **✕ Remove File** to change your choice.
4. Click **Start Analysis Process 🚀**.
5. You are taken directly to the Document View page while processing begins in the background.

**File requirements:**
- Format: PDF only (`.pdf`)
- Maximum size: 50 MB
- The file must be a real PDF (not a renamed `.exe` or `.docx`)

---

## Understanding the Analysis

Once your document has status **✓ Done**, six tabs are available in the Document View.

---

### Summary Tab

Shows an AI-generated summary of the entire document produced by Google Gemini 1.5 Flash.

The summary is written in plain language and covers the main points, key arguments, and conclusions of the document. It is formatted with headings and bullet points where appropriate.

If the Gemini API is not configured on the server, you will see an offline summary showing the first few sentences of the document instead.

**While the document is still processing**, this tab shows a spinner and the current processing stage (e.g. "SUMMARIZING — this usually takes 15–30 seconds…").

---

### Keywords Tab

Shows the 20 most statistically significant terms extracted from the document using the **TF-IDF algorithm** (Term Frequency – Inverse Document Frequency).

- Words that appear frequently in **this** document but rarely across **all** documents score highest.
- Common words like "the", "and", "is" are excluded (stopword filtering).
- Tags are displayed slightly larger for higher-ranked terms.

Use this tab to quickly understand what topics the document is most focused on.

---

### Entities Tab

Shows **named entities** detected in the document — typically people, organisations, places, and proper nouns.

Detection works by finding sequences of two or more consecutive title-case words (e.g., "Albert Einstein", "New York", "World Health Organization"). This is a pattern-based approach, not a trained AI model, so it may include some false positives (e.g., words at the start of a sentence). Up to 30 unique entities are shown.

---

### Raw Text Tab

Shows the complete text extracted from the PDF, exactly as it was read by the parser.

- The text is displayed in a scrollable monospace area.
- The **⧉ Copy Text** button copies the entire extracted text to your clipboard in one click.
- Character count and line count are shown below the text area.

This is useful if you want to:
- Copy a passage from the document
- See what text the AI is working with
- Check whether a scanned page was extracted correctly

---

### Preview Tab

Shows the original PDF file rendered directly in your browser using the browser's built-in PDF viewer.

Features available in the viewer (varies by browser):
- Zoom in/out
- Page navigation
- Text selection and copy
- Print
- Download

> Note: If your browser does not support inline PDF rendering (rare), a download link is shown instead.

---

### AI Q&A Chat Tab

A conversational interface where you can ask any question about the document. The AI reads the full document content and answers based on it.

**Quick-start chips** — when no chat history exists, four suggested questions appear:
- "What is the main topic of this document?"
- "Summarize the key points in bullet form"
- "What are the conclusions or recommendations?"
- "List the most important facts or figures"

Click any chip to pre-fill the input, then send.

**Chat modes** — select before asking your question:

| Mode | Best for |
|---|---|
| **Simple** | Quick, plain-language answers. Good for "what is X?" questions. |
| **Detailed** | In-depth explanations with context. Good for complex topics. |
| **Summary** | A structured summary of the answer. |
| **Key Points** | Bullet-point formatted response. Good for lists of facts or steps. |

**How to ask a question:**
1. Select a mode (default: Detailed)
2. Type your question in the input field
3. Press **Enter** or click the send button (▶)
4. The AI thinks for a few seconds (animated dots appear)
5. The answer appears, formatted as Markdown if applicable

**Chat history** — all your Q&A exchanges are saved. When you return to a document, your previous conversation is reloaded automatically.

**Limitations:**
- The AI works from the extracted text, not from images or tables embedded in the PDF.
- Very long documents (over ~25 pages of dense text) are truncated at ~30,000 characters when sent to the AI. The full text is still stored and searchable.
- The Q&A chat is disabled while the document is still being processed.

---

## Searching Your Documents

1. Click **🔍 Search** from the Dashboard or navigation bar.
2. Type a keyword, phrase, or topic into the search bar.
3. Click **Search** or press **Enter**.

Results show:
- Document name, word count, file size, upload date
- A **snippet** from the document summary with your search term highlighted in purple
- Keywords that match your query are highlighted in a different colour

Click any result to open the Document View for that document.

**What is searched:**
- The file name
- The full extracted text
- The keywords
- The AI summary

Search is case-insensitive. Partial matches are returned (searching "java" will match "JavaScript").

---

## Deleting a Document

From the Dashboard:
1. Hover over a document card.
2. Click the **🗑 Delete** button at the bottom-right of the card.
3. Confirm the deletion in the pop-up dialog.

The document is permanently removed from:
- The database (all metadata, summary, keywords, entities, raw text)
- The file storage (local disk or S3, depending on server configuration)
- All saved chat history for that document

**This action cannot be undone.**

---

## Logging Out

Click the **Logout** button in the Dashboard header. Your session token is cleared from the browser and you are redirected to the login page.

---

## Troubleshooting

**The document stays on "Processing" for a long time**

This is normal for large PDFs (10+ MB) or when the Gemini API is slow. Wait up to 2 minutes. If it still shows Processing after that:
- Check that the backend is still running (`mvn spring-boot:run` output)
- Check the backend logs for an ERROR message
- Try refreshing the page — if status is ERROR, the document failed but raw text may still be available

**I uploaded a PDF but the Keywords and Entities tabs are empty**

This should not happen with the fixed version of the app. If it does:
- Check the document status is `DONE` (not `ERROR`)
- If status is `DONE` but tabs are empty, check the server logs for NLP errors

**The Summary tab shows "OFFLINE SUMMARY" instead of an AI summary**

The Gemini API key is not configured or is invalid. Add your key to `application.properties`:
```
ai.gemini.api-key=YOUR_KEY
```
Get a free key at https://aistudio.google.com/

**The PDF Preview tab is blank**

- Some browsers block PDF rendering in iframes. Try Chrome or Firefox.
- Check that the backend is still running — the file is streamed on demand.

**I get "401 Unauthorized" errors**

Your session has expired (tokens last 24 hours). Log in again.

**Upload fails with "File does not appear to be a valid PDF"**

The file must be a genuine PDF. Renaming a Word document or image to `.pdf` will fail the magic byte check.

**The backend fails to start on port 8080**

Another application is using port 8080. Change it in `application.properties`:
```
server.port=8090
```
Then update the frontend's API URL accordingly (in `react_app_demo/.env`):
```
REACT_APP_API_URL=http://localhost:8090/api
```

---

## Limitations

| Limitation | Detail |
|---|---|
| **PDF only** | Only `.pdf` files are accepted. DOCX and TXT are not supported in the current version. |
| **50 MB max** | Files larger than 50 MB are rejected. |
| **Scanned PDFs** | PDFs that are purely images (no text layer) will show "EMPTY_CONTENT" status. Use an OCR tool first to add a text layer. |
| **AI context limit** | Only the first ~30,000 characters (~25 pages) of text are sent to the Gemini AI for summarization and Q&A. The full text is still stored and searchable. |
| **Search speed** | Search uses database LIKE queries. With hundreds of documents it may become slow. |
| **No file versioning** | Uploading the same PDF twice creates two separate documents. |
| **English only** | TF-IDF stopword filtering and language detection are optimised for English. Other languages will still extract text and keywords but accuracy will be lower. |
