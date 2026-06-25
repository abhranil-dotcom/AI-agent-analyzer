# AI Resume Analyzer — Week 1 (Friday 1 Deliverable)

Scope for this milestone: upload a PDF resume from React, send it to FastAPI,
extract the text with PyPDF, and display it back in the browser. No AI/LLM
integration yet — that lands in a future week (LangChain, LangGraph, Azure OpenAI).

## Folder Structure

```
resume analyzer agent/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app, CORS, exception handlers, /health
│   │   ├── api/
│   │   │   └── routes/
│   │   │       └── resume.py        # POST /api/resume/upload
│   │   ├── core/
│   │   │   ├── config.py            # Settings (pydantic-settings, env-driven)
│   │   │   └── logging_config.py    # Centralized logging setup
│   │   ├── models/
│   │   │   └── schemas.py           # Pydantic request/response models
│   │   └── services/
│   │       └── pdf_extractor.py     # PyPDF text extraction logic
│   ├── requirements.txt
│   ├── .env.example
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js            # Axios instance + uploadResume()
│   │   ├── components/
│   │   │   ├── ResumeUpload.jsx     # Drag/drop + file picker + submit
│   │   │   └── ExtractedText.jsx    # Displays extracted text + metadata
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   └── .gitignore
└── README.md
```

**Architecture notes:**
- Backend follows a layered structure: `api` (routing/HTTP concerns) → `services`
  (business logic, framework-agnostic) → `models` (data contracts) → `core`
  (cross-cutting config/logging). This mirrors the structure the full project
  will scale into once agents are added under `services/agents`.
- Config is environment-driven via `pydantic-settings` — no hardcoded values.
- All upload failures (bad file type, empty file, oversized file, corrupt PDF,
  encrypted PDF, no extractable text) return proper HTTP status codes with
  clear `detail` messages instead of generic 500s.

## Prerequisites

- Python 3.11+
- Node.js 18+

## Setup

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
copy .env.example .env          # Windows (or: cp .env.example .env)
```

> **Corporate network note:** if `pip install` fails with an SSL
> certificate verification error (common behind corporate proxies), use:
> `pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org -r requirements.txt`

### Frontend

```bash
cd frontend
npm install
copy .env.example .env          # Windows (or: cp .env.example .env)
```

> **Corporate network note:** if `npm install` hangs or fails on SSL/TLS
> errors, temporarily run `npm config set strict-ssl false`, install, then
> run `npm config set strict-ssl true` to restore the default afterward.

## Run

Open two terminals.

**Terminal 1 — Backend** (serves on http://127.0.0.1:8000)
```bash
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Frontend** (serves on http://localhost:5173)
```bash
cd frontend
npm run dev
```

Open http://localhost:5173, upload a PDF resume, and the extracted text will
appear on the page. API docs are available at http://127.0.0.1:8000/docs.

## API

| Method | Path                  | Description                                  |
|--------|-----------------------|-----------------------------------------------|
| GET    | `/health`              | Service health check                         |
| POST   | `/api/resume/upload`   | Upload a PDF, returns extracted text + metadata |

`POST /api/resume/upload` — multipart form, field name `file` (PDF only, max 10MB by default).

Success response:
```json
{
  "filename": "resume.pdf",
  "page_count": 1,
  "character_count": 167,
  "extracted_text": "..."
}
```

Error response (4xx):
```json
{ "detail": "Only PDF files are supported." }
```

## What's deliberately out of scope this week

LangChain, LangGraph, Azure OpenAI, anonymization, ATS scoring, career/interview
agents, and persistence — these come in later milestones per the project plan.
