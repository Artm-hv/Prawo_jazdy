/* ==========================================================================
   Prawo Jazdy LMS - Official Exam Test Engine Module
   Matches screenshot image_a8c2ff.jpg
   ========================================================================== */

class TestEngine {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.questions = [];
    this.currentIndex = 0;
    this.userAnswers = {};
    this.timerSeconds = 1500; // 25 minutes exam timer (25:00)
    this.timerInterval = null;
    this.questionReadTime = 15; // 15 seconds per question
    this.readTimeInterval = null;
    this.isExamFinished = false;
    this.bookmarkedQuestions = new Set();
  }

  async loadQuestions(category = "B") {
    const fetched = await API.fetchExamQuestions(category, 32);
    if (fetched && fetched.length > 0) {
      this.questions = fetched;
    } else {
      this.questions = window.TEST_QUESTIONS_DATA || [];
    }
    this.currentIndex = 0;
    this.userAnswers = {};
    this.isExamFinished = false;
    this.startExamTimer();
    this.startReadTimer();
    this.render();
  }

  startExamTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.timerSeconds > 0) {
        this.timerSeconds--;
        const timerEl = document.getElementById("exam-time-left");
        if (timerEl) timerEl.textContent = this.formatTime(this.timerSeconds);
      } else {
        this.finishExam();
      }
    }, 1000);
  }

  startReadTimer() {
    this.questionReadTime = 15;
    if (this.readTimeInterval) clearInterval(this.readTimeInterval);
    this.readTimeInterval = setInterval(() => {
      if (this.questionReadTime > 0) {
        this.questionReadTime--;
        const readEl = document.getElementById("read-time-left");
        const readFill = document.getElementById("read-time-fill");
        if (readEl) readEl.textContent = `${this.questionReadTime} s`;
        if (readFill) readFill.style.width = `${(this.questionReadTime / 15) * 100}%`;
      }
    }, 1000);
  }

  formatTime(totalSec) {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  selectAnswer(answerStr) {
    if (this.isExamFinished) return;
    const q = this.questions[this.currentIndex];
    if (!q) return;

    this.userAnswers[q.id] = answerStr;
    this.render();
  }

  nextQuestion() {
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
      this.startReadTimer();
      this.render();
    } else {
      this.finishExam();
    }
  }

  async finishExam() {
    this.isExamFinished = true;
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.readTimeInterval) clearInterval(this.readTimeInterval);

    const answersPayload = Object.entries(this.userAnswers).map(([qid, ans]) => ({
      question_id: parseInt(qid),
      selected_answer: ans
    }));

    const resultData = await API.submitExam(answersPayload, "EXAM");
    this.renderResults(resultData);
  }

  toggleBookmark() {
    const q = this.questions[this.currentIndex];
    if (!q) return;
    if (this.bookmarkedQuestions.has(q.id)) {
      this.bookmarkedQuestions.delete(q.id);
    } else {
      this.bookmarkedQuestions.add(q.id);
    }
    this.render();
  }

  render() {
    if (!this.container || this.questions.length === 0) return;

    const currentCat = window.app ? window.app.currentCategory : "B";
    const q = this.questions[this.currentIndex] || this.questions[0];
    const isBasic = (q.question_type || "BASIC") === "BASIC";
    const selectedAns = this.userAnswers[q.id] || null;

    // Progress counts
    const basicQuestions = this.questions.filter(x => (x.question_type || "BASIC") === "BASIC");
    const specQuestions = this.questions.filter(x => x.question_type === "SPECIALIST");

    const currentBasicNum = isBasic ? Math.min(this.currentIndex + 1, basicQuestions.length) : basicQuestions.length;
    const currentSpecNum = !isBasic ? Math.max(0, this.currentIndex - basicQuestions.length + 1) : 0;

    const isBookmarked = this.bookmarkedQuestions.has(q.id);

    // Media content (Image / Sign / Video placeholder)
    let mediaHtml = '';
    if (q.media_url) {
      mediaHtml = `<img src="${q.media_url}" alt="Ilustracja pytania" class="exam-media-img" />`;
    } else {
      mediaHtml = `
        <div class="exam-media-placeholder">
          <svg viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg" style="width: 180px; height: 160px;">
            <polygon points="50,5 95,85 5,85" fill="#3b82f6" stroke="#1d4ed8" stroke-width="6" stroke-linejoin="round"/>
            <circle cx="50" cy="55" r="14" fill="white"/>
            <path d="M42 55 L58 55 M50 47 L50 63" stroke="#1d4ed8" stroke-width="4"/>
          </svg>
        </div>
      `;
    }

    // Answers Buttons
    let answerButtonsHtml = '';
    if (isBasic) {
      answerButtonsHtml = `
        <div class="exam-answers-row-2">
          <button class="btn-answer-tak ${selectedAns === 'TAK' ? 'selected' : ''}" onclick="window.testEngine.selectAnswer('TAK')">
            Tak
          </button>
          <button class="btn-answer-nie ${selectedAns === 'NIE' ? 'selected' : ''}" onclick="window.testEngine.selectAnswer('NIE')">
            Nie
          </button>
        </div>
      `;
    } else {
      const opts = q.options || { A: "Odpowiedź A", B: "Odpowiedź B", C: "Odpowiedź C" };
      answerButtonsHtml = `
        <div class="exam-answers-col-3">
          ${Object.entries(opts).map(([key, val]) => `
            <button class="btn-answer-spec ${selectedAns === key ? 'selected' : ''}" onclick="window.testEngine.selectAnswer('${key}')">
              <strong>${key}:</strong> ${val}
            </button>
          `).join('')}
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="exam-page-wrapper">
        
        <!-- Header Title Banner -->
        <div class="exam-header-banner">
          <h1 class="exam-main-title">Oficjalne Testy na Prawo Jazdy 2026</h1>
        </div>

        <!-- Badges Bar & Finish Button -->
        <div class="exam-top-controls-bar">
          <div class="exam-badges-left">
            <div class="exam-meta-badge">
              <span class="badge-label-sm">WARTOŚĆ PUNKTOWA PYTANIA</span>
              <span class="badge-val-num">${q.points || 3}</span>
            </div>

            <div class="exam-meta-badge">
              <span class="badge-label-sm">KATEGORIA</span>
              <span class="badge-val-cat">${currentCat} ▾</span>
            </div>

            <div class="exam-meta-badge timer-badge">
              <span class="badge-label-sm">CZAS DO KOŃCA</span>
              <span class="badge-val-timer" id="exam-time-left">${this.formatTime(this.timerSeconds)}</span>
            </div>
          </div>

          <button class="btn-finish-exam" onclick="window.testEngine.finishExam()">
            Zakończ egzamin
          </button>
        </div>

        <!-- Main 2-Column Exam Stage -->
        <div class="exam-layout-grid">
          
          <!-- Left Column: Question Media & Controls -->
          <div class="exam-left-stage">
            <div class="exam-media-card">
              ${mediaHtml}
            </div>

            <div class="exam-question-text-card">
              <p class="question-text">${q.question_text}</p>
            </div>

            <!-- Answer Buttons -->
            ${answerButtonsHtml}
          </div>

          <!-- Right Column: Exam Status & Action Buttons -->
          <div class="exam-right-sidebar">
            
            <!-- Progress Section: Podstawowe / Specjalistyczne -->
            <div class="exam-sidebar-card">
              <div class="progress-counters-grid">
                <div class="counter-box">
                  <span class="counter-title">PYTANIA PODSTAWOWE</span>
                  <span class="counter-val">${currentBasicNum}/${basicQuestions.length || 20}</span>
                  <div class="mini-progress-bg">
                    <div class="mini-progress-fill" style="width: ${(currentBasicNum / (basicQuestions.length || 20)) * 100}%;"></div>
                  </div>
                </div>

                <div class="counter-box">
                  <span class="counter-title">PYTANIA SPECJALISTYCZNE</span>
                  <span class="counter-val">${currentSpecNum}/${specQuestions.length || 12}</span>
                  <div class="mini-progress-bg">
                    <div class="mini-progress-fill" style="width: ${(currentSpecNum / (specQuestions.length || 12)) * 100}%;"></div>
                  </div>
                </div>
              </div>

              <!-- Question Read Timer -->
              <div class="read-timer-box">
                <span class="counter-title">CZAS NA ZAPOZNANIE SIĘ Z PYTANIEM</span>
                <span class="read-timer-val" id="read-time-left">${this.questionReadTime} s</span>
                <div class="mini-progress-bg">
                  <div class="mini-progress-fill" id="read-time-fill" style="width: ${(this.questionReadTime / 15) * 100}%;"></div>
                </div>
              </div>
            </div>

            <!-- Official Question ID Badge -->
            <div class="official-id-card">
              <span class="info-icon">ℹ</span>
              <div class="official-id-text">
                Oficjalne pytanie egzaminacyjne z aktualnej bazy 2026<br>
                <strong>ID PYTANIA: ${q.id || 12776}</strong>
              </div>
            </div>

            <!-- Action Buttons Grid -->
            <div class="exam-actions-list">
              <button class="exam-action-btn ${isBookmarked ? 'active' : ''}" onclick="window.testEngine.toggleBookmark()">
                <span>🔖</span> ${isBookmarked ? 'Zapisano pytanie' : 'Zapisz pytanie'}
              </button>
              
              <button class="exam-action-btn" onclick="window.testEngine.startReadTimer()">
                <span>🔄</span> Odśwież pytanie
              </button>
              
              <button class="exam-action-btn" onclick="alert('Zadaj pytanie instruktorowi online: Pytanie ID ${q.id}')">
                <span>💬</span> Zadaj pytanie
              </button>
              
              <button class="exam-action-btn" onclick="if(document.fullscreenElement){document.exitFullscreen();}else{document.documentElement.requestFullscreen();}">
                <span>⛶</span> Pełny ekran
              </button>
            </div>

            <!-- Next Question Footer Button -->
            <button class="btn-next-question" onclick="window.testEngine.nextQuestion()">
              Następne pytanie →
            </button>

          </div>

        </div>

      </div>
    `;
  }

  renderResults(resultPayload) {
    const attempt = resultPayload ? resultPayload.attempt : { score: 70, max_score: 74, passed: true };
    const passed = attempt.passed;

    this.container.innerHTML = `
      <div class="exam-results-wrapper">
        <div class="results-card ${passed ? 'pass-card' : 'fail-card'}">
          <div class="result-header-icon">${passed ? '🎉' : '❌'}</div>
          <h2 class="result-title">${passed ? 'EGZAMIN ZALICZONY!' : 'EGZAMIN NIEZALICZONY'}</h2>
          <p class="result-score-text">Twój wynik: <strong>${attempt.score}</strong> / ${attempt.max_score || 74} punktów</p>
          <p class="result-subtext">${passed ? 'Moje gratulacje! Spełniłeś wymóg min. 68 punktów.' : 'Wymagane minimum to 68 punktów. Spróbuj ponownie!'}</p>
          
          <button class="btn-restart-exam" onclick="window.testEngine.loadQuestions('${window.app ? window.app.currentCategory : "B"}')">
            Rozpocznij nowy egzamin
          </button>
        </div>
      </div>
    `;
  }
}

window.TestEngine = TestEngine;
