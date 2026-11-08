# MIKASA v5.0 — Document Intelligence

This is a full replacement-file upgrade bundle based on the supplied MIKASA v4.0 source package. It adds local document ingestion and retrieval while preserving the existing SQLite database tables and all v4 features.

## New capabilities
- Upload PDF, DOCX and TXT files (15 MB maximum per file).
- Extract PDF page text, Word paragraphs/tables, and text files.
- Split extracted content into searchable sections and store it in the existing SQLite database.
- Ask questions across all indexed documents or selected documents.
- Request summaries by asking for a summary in natural language.
- Responses are grounded in retrieved excerpts and include source filename plus PDF page/document section labels.
- Delete documents and their extracted sections from the knowledge base.

## Important limitations
- Scanned/image-only PDFs are not OCR-processed in this release. They return a clear extraction error.
- DOCX citations identify the document section, not Word page numbers.
- Retrieval is lightweight lexical matching, not embeddings/vector search.
- Original uploaded files are not retained; extracted text and section metadata are stored in SQLite. Keep your own originals.
- This remains a local-development service. Do not expose it publicly without authentication, upload controls and additional security review.

## Install / upgrade
1. Back up the entire existing `mikasa` project folder and especially `backend/mikasa_memory.db`.
2. Stop the backend with Ctrl+C.
3. Extract this bundle into the existing project folder, preserving folder structure and allowing replacement of matching files. Do not delete your database, `.env`, `venv`, or `node_modules`.
4. In the VS Code backend terminal:
   ```powershell
   cd "C:\Users\Alok Thakur\Desktop\mikasa\backend"
   .\venv\Scripts\Activate.ps1
   python -m pip install -r requirements.txt
   ```
5. Start backend:
   ```powershell
   python -m uvicorn main:app --reload
   ```
6. In a second VS Code terminal start frontend:
   ```powershell
   cd "C:\Users\Alok Thakur\Desktop\mikasa\frontend"
   npm run dev
   ```
7. Open `http://localhost:5173`, select **Document Intelligence**, and upload a PDF, DOCX or TXT file.

## API endpoints
- `GET /api/documents` — list indexed documents
- `POST /api/documents/upload` — upload and index a document (multipart field: `file`)
- `POST /api/documents/ask` — ask a question (JSON: `question`, optional `document_ids`)
- `DELETE /api/documents/{document_id}` — remove a document and its chunks

The existing conversations, messages and memories tables are left intact. Document tables are created automatically at backend startup.
