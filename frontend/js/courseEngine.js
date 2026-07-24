/* ==========================================================================
   Prawo Jazdy LMS - Official Course Practice Engine (Wkładka "Kurs")
   Matches screenshots image_c3d7bd.jpg and image_c3d7c5.jpg
   ========================================================================== */

class CourseEngine {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.questions = window.TEST_QUESTIONS_DATA || [];
    this.filteredQuestions = [...this.questions];
    this.currentIndex = 0;
    this.userAnswers = {};
    
    // Filter states
    this.selectedGroup = "all";
    this.selectedStatus = "all";
    this.selectedType = "all";
    this.searchQuery = "";
    this.isFilterCollapsed = false;

    // 14 Basic Topic Categories matching image_c3d7c5.jpg
    this.topicCategories = [
      { id: "znaki_ostrzegawcze", name: "Znaki ostrzegawcze", count: 113, completed: 0 },
      { id: "znaki_zakazu", name: "Znaki zakazu, nakazu", count: 102, completed: 0 },
      { id: "znaki_informacyjne", name: "Znaki informacyjne, kierunku i miejscowości, uzupełniające", count: 82, completed: 0 },
      { id: "znaki_poziome", name: "Znaki drogowe poziome", count: 113, completed: 0 },
      { id: "sygnaly_swietlne", name: "Sygnały świetlne, sygnały dawane przez kierującego ruchem", count: 93, completed: 0 },
      { id: "wlaczanie_do_ruchu", name: "Włączanie się do ruchu, skrzyżowania równorzędne", count: 86, completed: 0 },
      { id: "skrzyzowania_znaki", name: "Skrzyżowania ze znakami określającymi pierwszeństwo przejazdu", count: 127, completed: 0 },
      { id: "skrzyzowania_sygnalizacja", name: "Skrzyżowania z sygnalizacją świetlną", count: 59, completed: 0 },
      { id: "skrzyzowania_piesi", name: "Skrzyżowania lub przejścia dla pieszych z kierującym ruchem, miejsca przystanków", count: 27, completed: 0 },
      { id: "pozycja_pojazdu", name: "Pozycja pojazdu na drodze, wjazd i zjazd ze skrzyżowania, zatrzymanie i postój", count: 145, completed: 1 },
      { id: "zmiana_pasa", name: "Zmiana pasa ruchu, zmiana kierunku jazdy", count: 148, completed: 0 },
      { id: "wyprzedzanie", name: "Wyprzedzanie", count: 164, completed: 0 },
      { id: "omijanie", name: "Omijanie, wymijanie, cofanie", count: 62, completed: 0 },
      { id: "swiatla", name: "Używanie świateł zewnętrznych i sygnałów pojazdu", count: 54, completed: 0 }
    ];

    window.courseEngine = this;
  }

  loadCourseView() {
    this.applyFilters();
    this.render();
  }

  applyFilters() {
    let result = [...this.questions];

    if (this.selectedGroup !== "all") {
      result = result.filter(q => q.topic_id === this.selectedGroup || q.category === this.selectedGroup);
    }

    if (this.selectedType === "basic") {
      result = result.filter(q => (q.question_type || "BASIC") === "BASIC");
    } else if (this.selectedType === "specialist") {
      result = result.filter(q => q.question_type === "SPECIALIST");
    }

    if (this.selectedStatus === "unanswered") {
      result = result.filter(q => !this.userAnswers[q.id]);
    } else if (this.selectedStatus === "wrong") {
      result = result.filter(q => this.userAnswers[q.id] && !this.checkAnswerCorrect(q, this.userAnswers[q.id]));
    } else if (this.selectedStatus === "passed") {
      result = result.filter(q => this.userAnswers[q.id] && this.checkAnswerCorrect(q, this.userAnswers[q.id]));
    }

    if (this.searchQuery.trim() !== "") {
      const qLower = this.searchQuery.toLowerCase();
      result = result.filter(q => 
        String(q.id).includes(qLower) || 
        q.question_text.toLowerCase().includes(qLower)
      );
    }

    this.filteredQuestions = result.length > 0 ? result : this.questions;
    if (this.currentIndex >= this.filteredQuestions.length) {
      this.currentIndex = 0;
    }
  }

  checkAnswerCorrect(question, answer) {
    return question.correct_answer === answer;
  }

  selectTopicGroup(groupId) {
    this.selectedGroup = groupId;
    this.applyFilters();
    this.currentIndex = 0;
    this.render();
    const stage = document.getElementById("course-practice-stage");
    if (stage) stage.scrollIntoView({ behavior: "smooth" });
  }

  onFilterChange(type, value) {
    if (type === "group") this.selectedGroup = value;
    if (type === "status") this.selectedStatus = value;
    if (type === "type") this.selectedType = value;
    if (type === "search") this.searchQuery = value;

    this.applyFilters();
    this.render();
  }

  toggleFilterCollapse() {
    this.isFilterCollapsed = !this.isFilterCollapsed;
    this.render();
  }

  selectAnswer(answerStr) {
    const currentQ = this.filteredQuestions[this.currentIndex] || this.questions[0];
    if (!currentQ) return;

    this.userAnswers[currentQ.id] = answerStr;
    this.render();
  }

  nextQuestion() {
    if (this.currentIndex < this.filteredQuestions.length - 1) {
      this.currentIndex++;
      this.render();
    }
  }

  prevQuestion() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.render();
    }
  }

  render() {
    if (!this.container) return;

    const currentCat = window.app ? window.app.currentCategory : "B";
    const currentQ = this.filteredQuestions[this.currentIndex] || this.questions[0];
    const isBasic = (currentQ.question_type || "BASIC") === "BASIC";
    const userAns = this.userAnswers[currentQ.id] || null;

    const totalBank = 2185;
    const totalAnswered = Object.keys(this.userAnswers).length || 1;

    // Answer Buttons HTML
    let answerButtonsHtml = '';
    if (isBasic) {
      answerButtonsHtml = `
        <div class="exam-answers-row-2">
          <button class="btn-answer-tak ${userAns === 'TAK' ? 'selected' : ''}" onclick="window.courseEngine.selectAnswer('TAK')">
            Tak
          </button>
          <button class="btn-answer-nie ${userAns === 'NIE' ? 'selected' : ''}" onclick="window.courseEngine.selectAnswer('NIE')">
            Nie
          </button>
        </div>
      `;
    } else {
      const opts = currentQ.options || { A: "Odpowiedź A", B: "Odpowiedź B", C: "Odpowiedź C" };
      answerButtonsHtml = `
        <div class="exam-answers-col-3">
          ${Object.entries(opts).map(([key, val]) => `
            <button class="btn-answer-spec ${userAns === key ? 'selected' : ''}" onclick="window.courseEngine.selectAnswer('${key}')">
              <strong>${key}:</strong> ${val}
            </button>
          `).join('')}
        </div>
      `;
    }

    // Media HTML
    let mediaHtml = '';
    if (currentQ.media_url) {
      mediaHtml = `<img src="${currentQ.media_url}" alt="Ilustracja pytania" class="exam-media-img" />`;
    } else {
      mediaHtml = `
        <div class="exam-media-placeholder">
          <svg viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg" style="width: 220px; height: 180px;">
            <polygon points="50,5 95,85 5,85" fill="#eab308" stroke="#ca8a04" stroke-width="6" stroke-linejoin="round"/>
            <path d="M42 65 C42 45 60 45 60 30" fill="none" stroke="#000000" stroke-width="7" stroke-linecap="round"/>
            <polygon points="60,24 67,34 53,34" fill="#000000"/>
          </svg>
        </div>
      `;
    }

    // Twoje Postępy Grid HTML matching image_c3d7c5.jpg
    const topicCardsHtml = this.topicCategories.map(cat => {
      const isCurrentSelected = this.selectedGroup === cat.id;
      return `
        <div class="course-postepy-card ${isCurrentSelected ? 'active' : ''}">
          <div class="postepy-card-info">
            <h4 class="postepy-title">${cat.name}</h4>
            <a href="#course-practice-stage" class="postepy-link" onclick="window.courseEngine.selectTopicGroup('${cat.id}')">
              Pokaż wszystkie
            </a>
          </div>

          <div class="postepy-card-right">
            <span class="postepy-count-badge">${cat.completed}/${cat.count}</span>
            <button class="btn-pokaz-pytania" onclick="window.courseEngine.selectTopicGroup('${cat.id}')">
              Pokaż pytania →
            </button>
          </div>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="course-page-wrapper">
        
        <!-- Main Title Header -->
        <div class="course-header-banner">
          <h1 class="course-main-title">Oficjalny kurs teoretyczny na prawo jazdy</h1>
        </div>

        <!-- 1. Filtry Section (Matching image_c3d7bd.jpg) -->
        <div class="course-filters-card">
          <div class="filters-card-header">
            <h3 class="filters-title">Filtry</h3>
          </div>

          ${!this.isFilterCollapsed ? `
            <div class="filters-grid">
              
              <!-- Dropdown 1: Grupa pytań -->
              <div class="input-group">
                <label class="input-label">Grupa pytań</label>
                <select class="setting-select" onchange="window.courseEngine.onFilterChange('group', this.value)">
                  <option value="all" ${this.selectedGroup === 'all' ? 'selected' : ''}>Wszystkie pytania</option>
                  ${this.topicCategories.map(t => `<option value="${t.id}" ${this.selectedGroup === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
                </select>
              </div>

              <!-- Dropdown 2: Status pytania -->
              <div class="input-group">
                <label class="input-label">Status pytania</label>
                <select class="setting-select" onchange="window.courseEngine.onFilterChange('status', this.value)">
                  <option value="unanswered" ${this.selectedStatus === 'unanswered' ? 'selected' : ''}>Na które jeszcze nie została udzielona odpowiedź</option>
                  <option value="wrong" ${this.selectedStatus === 'wrong' ? 'selected' : ''}>Z błędną odpowiedzią</option>
                  <option value="passed" ${this.selectedStatus === 'passed' ? 'selected' : ''}>Zaliczone</option>
                  <option value="all" ${this.selectedStatus === 'all' ? 'selected' : ''}>Wszystkie</option>
                </select>
              </div>

              <!-- Radio Group: Typ pytania -->
              <div class="input-group">
                <label class="input-label">Typ pytania</label>
                <div class="radio-options-row">
                  <label class="radio-item">
                    <input type="radio" name="typ_pytania" value="all" ${this.selectedType === 'all' ? 'checked' : ''} onchange="window.courseEngine.onFilterChange('type', this.value)">
                    <span>Wszystkie</span>
                  </label>
                  <label class="radio-item">
                    <input type="radio" name="typ_pytania" value="basic" ${this.selectedType === 'basic' ? 'checked' : ''} onchange="window.courseEngine.onFilterChange('type', this.value)">
                    <span>Tylko podstawowe</span>
                  </label>
                  <label class="radio-item">
                    <input type="radio" name="typ_pytania" value="specialist" ${this.selectedType === 'specialist' ? 'checked' : ''} onchange="window.courseEngine.onFilterChange('type', this.value)">
                    <span>Tylko specjalistyczne</span>
                  </label>
                </div>
              </div>

              <!-- Search Box: Wyszukaj pytanie -->
              <div class="input-group">
                <label class="input-label">Wyszukaj pytanie (po id lub treści)</label>
                <div class="search-input-wrapper">
                  <span class="search-icon">🔍</span>
                  <input type="text" class="search-input-field" placeholder="Szukaj..." value="${this.searchQuery}" oninput="window.courseEngine.onFilterChange('search', this.value)">
                </div>
              </div>

            </div>
          ` : ''}

          <button class="btn-toggle-filters" onclick="window.courseEngine.toggleFilterCollapse()">
            ${this.isFilterCollapsed ? 'Rozwiń ⌵' : 'Zwiń ⌃'}
          </button>
        </div>

        <!-- 2. Question Practice Stage (Matching image_c3d7bd.jpg) -->
        <div class="exam-layout-grid" id="course-practice-stage">
          
          <!-- Left Column: Question Media & Options -->
          <div class="exam-left-stage">
            <div class="exam-media-card">
              ${mediaHtml}
            </div>

            <div class="exam-question-text-card">
              <p class="question-text">${currentQ.question_text}</p>
            </div>

            ${answerButtonsHtml}
          </div>

          <!-- Right Column: Status & Counter Sidebar -->
          <div class="exam-right-sidebar">
            <div class="exam-sidebar-card">
              
              <div class="counter-box">
                <span class="counter-title">KATEGORIA</span>
                <span class="category-badge-selector">${currentCat} ▾</span>
              </div>

              <div class="counter-box" style="margin-top: 12px;">
                <span class="counter-title">ODPOWIEDZIANO NA ${totalAnswered} Z ${totalBank} PYTAŃ</span>
                <div class="mini-progress-bg">
                  <div class="mini-progress-fill" style="width: ${(totalAnswered / totalBank) * 100}%;"></div>
                </div>
              </div>

              <div class="counter-box" style="margin-top: 12px;">
                <span class="counter-title">PYTANIE ${this.currentIndex + 1} Z ${this.filteredQuestions.length}</span>
                <div class="mini-progress-bg">
                  <div class="mini-progress-fill" style="width: ${((this.currentIndex + 1) / this.filteredQuestions.length) * 100}%;"></div>
                </div>
              </div>

            </div>

            <!-- Official ID Card -->
            <div class="official-id-card">
              <span class="info-icon">ℹ</span>
              <div class="official-id-text">
                Oficjalne pytanie egzaminacyjne z aktualnej bazy 2026<br>
                <strong>ID PYTANIA: ${currentQ.id || 3456}</strong>
              </div>
            </div>

            <!-- User Answer Status Badge -->
            <div class="user-answer-status-card">
              <span class="status-label">TWOJE ODPOWIEDZI:</span>
              <span class="status-val ${userAns ? 'answered' : ''}">
                ${userAns ? `UDZIELONO ODPOWIEDZI: ${userAns}` : 'BRAK ODPOWIEDZI NA TO PYTANIE'}
              </span>
            </div>

            <!-- Navigation Buttons -->
            <div style="display: flex; gap: 10px; margin-top: 8px;">
              <button class="btn-next-question" style="flex: 1;" onclick="window.courseEngine.prevQuestion()" ${this.currentIndex === 0 ? 'disabled' : ''}>
                ← Poprzednie
              </button>
              <button class="btn-next-question" style="flex: 1;" onclick="window.courseEngine.nextQuestion()">
                Następne →
              </button>
            </div>
          </div>

        </div>

        <!-- 3. Twoje Postępy Grid (Matching image_c3d7c5.jpg) -->
        <div class="course-postepy-section">
          <div class="postepy-header-row">
            <h2 class="postepy-main-title">Twoje postępy</h2>
            <button class="btn-see-full-stats" onclick="window.app.switchTab('statystyki')">
              Zobacz pełne statystyki →
            </button>
          </div>

          <h3 class="postepy-sub-title">Pytania podstawowe</h3>

          <div class="postepy-cards-grid">
            ${topicCardsHtml}
          </div>
        </div>

      </div>
    `;
  }
}

window.CourseEngine = CourseEngine;
