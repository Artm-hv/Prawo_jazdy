# Prawo Jazdy 360 - Learning Management System (LMS)

Production-ready Learning Management System (LMS) designed for driving school platforms, mirroring the structure and visual aesthetics of `prawo-jazdy-360.pl`.

---

## 🏗️ System Architecture

### 1. Static Frontend Architecture (HTML5, Vanilla CSS, JS)
The application runs entirely in the browser as a static web application. It does not require a backend server or a database to run. All data is pre-compiled into static JavaScript files.

- **Data Layer (`js/data/`)**: All courses, modules, lectures, test questions, and traffic signs are stored as JavaScript objects in this folder. 
- **State Management**: User progress (watched seconds, completion flags, flashcard statistics, test scores) is saved locally in the browser's `localStorage`.
- **UI Components**:
  - Modern navbar with category badge (`Category B`), account menu, language selector.
  - Accordion sidebar with category progress (`POSTĘP: 11.97%`), lesson status checkmarks (`✓`), and duration counters.
  - Instructor video player with real-time overlay note cards and SVG traffic sign visualizer (e.g. `A-1 Niebezpieczny zakręt w prawo`).
  - Interactive PWPW Exam Simulator (35 timed questions, 25-min timer, instant grading).
  - Traffic Signs dictionary with category filters and a built-in **3D Flashcards (Fiszki) Mini-game** for memorization.
  - Statistics dashboard with overall completion %, study time log, pass rates, and flashcard progress.

### 2. Data Pipeline & Scripts (`scripts/`)
While the app itself is static, the data was gathered using Python scripts. The `scripts/` folder contains tools used for development and data ingestion:
- **Web Scrapers**: Python scripts using `BeautifulSoup` and `requests` to scrape traffic signs and lecture data.
- **Data Generator (`create_static_data.py`)**: A script that reads raw JSON/SQLite data and generates the formatted `js/data/*.js` files used by the frontend.

---

## 🚀 Getting Started & Execution

### 1. Run the Application
Since the app is purely static, you do NOT need Python, Node.js, or any backend server.
Simply open `index.html` in your web browser, or use a static file server like Live Server (VS Code) or GitHub Pages.

### 2. Update Data (For Developers Only)
If you want to update the courses or signs, you can use the Python scripts in the `scripts/` folder.
```bash
cd scripts
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Example: Generate new static JS files from updated data
python create_static_data.py
```
