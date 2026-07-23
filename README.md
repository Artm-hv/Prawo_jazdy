# Prawo Jazdy 360 - Learning Management System (LMS)

Production-ready Learning Management System (LMS) designed for driving school platforms, mirroring the structure and visual aesthetics of `prawo-jazdy-360.pl`.

---

## 🏗️ System Architecture

### 1. Database Schema (Relational Architecture)
- **Users**: User credentials, category enrollment (`B`, `A`, etc.), created timestamps.
- **Courses & Modules**: Hierarchical structure (`Course` -> `Module` -> `Lesson`) supporting ordered chapters, total duration tracking, and video lecture URLs.
- **TrafficSigns**: Comprehensive library of traffic signs (`A-1`, `B-20`, `C-12`, `D-1`) with category, descriptions, and SVG icons.
- **TestQuestions**: Driving exam question bank categorized into `BASIC` (TAK/NIE) and `SPECIALIST` (A/B/C) with point weighting (1, 2, or 3 points) following PWPW guidelines.
- **UserProgress**: Granular tracking per lesson (watched seconds, completion flag, timestamp).
- **TestAttempts**: History of practice and official exam attempts (score, max score, pass threshold: 68/74 points).

### 2. Backend REST API (Python FastAPI & SQLAlchemy)
- `GET /api/v1/courses`: Retrieves courses, modules, and user lesson progress.
- `GET /api/v1/courses/lesson/{id}`: Retrieves specific lesson details.
- `POST /api/v1/progress/lesson/{id}`: Updates video progress and marks completion.
- `GET /api/v1/tests/questions`: Retrieves 35 exam questions (20 basic + 15 specialist).
- `POST /api/v1/tests/submit`: Evaluates test submission and records attempt in DB.
- `GET /api/v1/signs`: Filterable traffic sign catalog API.
- `GET /api/v1/progress/summary`: Analytical statistics dashboard summary.
- `POST /api/v1/admin/ingest/json`: Admin data pipeline upload endpoint.

### 3. Frontend Architecture (HTML5, Vanilla CSS, JS)
- Modern navbar with category badge (`Category B`), account menu, language selector.
- Accordion sidebar with category progress (`POSTĘP: 11.97%`), lesson status checkmarks (`✓`), and duration counters.
- Instructor video player with real-time overlay note cards and SVG traffic sign visualizer (e.g. `A-1 Niebezpieczny zakręt w prawo`).
- Interactive PWPW Exam Simulator (35 timed questions, 25-min timer, instant grading).
- Traffic Signs dictionary with category filters.
- Statistics dashboard with overall completion %, study time log, and pass rates.

---

## 🚀 Getting Started & Execution

### Prerequisites
- Python 3.9+
- Uvicorn & FastAPI

### 1. Install Dependencies & Ingest Data
```bash
cd backend
pip install -r requirements.txt
python ingest_data.py
```

### 2. Run Backend Server
```bash
uvicorn app.main:app --reload --port 8000
```
- Open Swagger API documentation at: `http://localhost:8000/docs`

### 3. Open Frontend Application
Simply open `frontend/index.html` in your web browser or serve it via any static HTTP server / FastAPI root endpoint (`http://localhost:8000`).
