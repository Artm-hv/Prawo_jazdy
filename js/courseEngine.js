/* ==========================================================================
   Prawo Jazdy LMS - Official Course Practice Engine (Wkładka "Kurs")
   Matches screenshots image_c3d7bd.jpg and image_c3d7c5.jpg
   ========================================================================== */

class CourseEngine {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    
    // Parse the newly scraped COURSE_DATA
    this.courseData = window.COURSE_DATA || [];
    this.questions = [];
    this.topicCategories = [];
    
    this.courseData.forEach(mod => {
      this.topicCategories.push({
        id: mod.id,
        name: mod.title,
        count: mod.questions.length,
        completed: 0
      });
      
      mod.questions.forEach((q, idx) => {
        let officialId = `${mod.id}-${idx}`;
        if (q.mediaUrl) {
           const match = q.mediaUrl.match(/\/(\d+)\.(jpg|mp4)/);
           if (match) {
             officialId = match[1];
           }
        }
        
        this.questions.push({
          ...q,
          id: `${mod.id}-${idx}`, // keep generated id for stable storage keys
          officialId: officialId,
          topic_id: mod.id,
          topic_title: mod.title
        });
      });
    });

    this.filteredQuestions = [...this.questions];
    this.currentIndex = 0;
    this.userAnswers = {};
    
    // Filter states
    this.selectedGroup = "all";
    this.selectedStatus = "all";
    this.searchQuery = "";
    this.isFilterCollapsed = false;

    this.isFullscreen = false;
    this.savedQuestions = [];

    window.courseEngine = this;
    
    // Debounce timer for search
    this.searchTimeout = null;
    
    this.loadProgress();
  }

  saveProgress() {
    const progress = {
      userAnswers: this.userAnswers,
      currentIndex: this.currentIndex,
      selectedGroup: this.selectedGroup,
      selectedStatus: this.selectedStatus
    };
    localStorage.setItem('prawoJazdy_courseProgress', JSON.stringify(progress));
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem('prawoJazdy_courseProgress');
      if (saved) {
        const progress = JSON.parse(saved);
        this.userAnswers = progress.userAnswers || {};
        this.currentIndex = progress.currentIndex || 0;
        this.selectedGroup = progress.selectedGroup || "all";
        this.selectedStatus = progress.selectedStatus || "all";
        this.recalculateCompleted();
      }

      const savedQ = localStorage.getItem('prawoJazdy_savedQuestions');
      if (savedQ) {
        this.savedQuestions = JSON.parse(savedQ);
      }
    } catch (e) {
      console.error("Error loading course progress", e);
    }
  }

  toggleSaveQuestion() {
    const currentQ = this.filteredQuestions[this.currentIndex];
    if (!currentQ) return;
    
    const idx = this.savedQuestions.indexOf(currentQ.id);
    if (idx === -1) {
      this.savedQuestions.push(currentQ.id);
    } else {
      this.savedQuestions.splice(idx, 1);
    }
    localStorage.setItem('prawoJazdy_savedQuestions', JSON.stringify(this.savedQuestions));
    this.render();
  }

  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
    const wrapper = document.getElementById("course-practice-stage");
    if (this.isFullscreen) {
      if (wrapper) wrapper.classList.add("fullscreen-mode");
    } else {
      if (wrapper) wrapper.classList.remove("fullscreen-mode");
    }
    this.render();
  }

  recalculateCompleted() {
    this.topicCategories.forEach(cat => {
      cat.completed = 0;
    });
    this.questions.forEach(q => {
      if (this.userAnswers[q.id] !== undefined) {
        const cat = this.topicCategories.find(c => c.id === q.topic_id);
        if (cat) {
          cat.completed++;
        }
      }
    });
  }

  loadCourseView() {
    this.applyFilters();
    this.render();
  }



  getMixedQuestions() {
    if (!this.mixedOrderIds) {
      let stored = localStorage.getItem('prawoJazdy_mixedOrder');
      if (stored) {
        this.mixedOrderIds = JSON.parse(stored);
      } else {
        let ids = this.questions.map(q => q.id);
        for (let i = ids.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [ids[i], ids[j]] = [ids[j], ids[i]];
        }
        this.mixedOrderIds = ids;
        localStorage.setItem('prawoJazdy_mixedOrder', JSON.stringify(this.mixedOrderIds));
      }
    }
    
    if (!this.questionsMap) {
      this.questionsMap = {};
      this.questions.forEach(q => this.questionsMap[q.id] = q);
    }
    
    return this.mixedOrderIds.map(id => this.questionsMap[id]).filter(Boolean);
  }

  applyFilters() {
    let result = this.selectedGroup === "all" ? this.getMixedQuestions() : [...this.questions];

    if (this.selectedGroup !== "all") {
      result = result.filter(q => q.topic_id == this.selectedGroup);
    }

    if (this.selectedStatus === "unanswered") {
      result = result.filter(q => this.userAnswers[q.id] === undefined);
    } else if (this.selectedStatus === "wrong") {
      result = result.filter(q => this.userAnswers[q.id] !== undefined && !this.checkAnswerCorrect(q, this.userAnswers[q.id]));
    } else if (this.selectedStatus === "passed") {
      result = result.filter(q => this.userAnswers[q.id] !== undefined && this.checkAnswerCorrect(q, this.userAnswers[q.id]));
    } else if (this.selectedStatus === "saved") {
      result = result.filter(q => this.savedQuestions.includes(q.id));
    }

    if (this.searchQuery.trim() !== "") {
      const qLower = this.searchQuery.toLowerCase();
      result = result.filter(q => 
        String(q.id).includes(qLower) || 
        q.title.toLowerCase().includes(qLower)
      );
    }

    this.filteredQuestions = result.length > 0 ? result : this.questions;
    if (this.currentIndex >= this.filteredQuestions.length) {
      this.currentIndex = 0;
    }
  }

  checkAnswerCorrect(question, answerIdx) {
    return question.answers[answerIdx] && question.answers[answerIdx].isCorrect;
  }

  selectTopicGroup(groupId) {
    this.selectedGroup = groupId;
    this.applyFilters();
    this.currentIndex = 0;
    this.saveProgress();
    this.render();
    const stage = document.getElementById("course-practice-stage");
    if (stage) stage.scrollIntoView({ behavior: "smooth" });
  }

  onFilterChange(type, value) {
    if (type === "search") {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.searchQuery = value;
        this.applyFilters();
        this.triggerStageTransition();
      }, 300); // 300ms debounce
      return;
    }

    if (type === "group") this.selectedGroup = value;
    if (type === "status") this.selectedStatus = value;

    this.currentIndex = 0; // Reset index when explicitly changing filters
    this.applyFilters();
    this.saveProgress();
    this.triggerStageTransition();
  }

  async triggerStageTransition() {
    const stage = document.getElementById("course-practice-stage");
    if (stage) stage.classList.add("fade-out");
    await new Promise(r => setTimeout(r, 150));
    this.render();
    const newStage = document.getElementById("course-practice-stage");
    if (newStage) {
      void newStage.offsetHeight;
      newStage.classList.remove("fade-out");
    }
  }

  toggleFilterCollapse() {
    this.isFilterCollapsed = !this.isFilterCollapsed;
    this.render();
  }

  selectAnswer(answerIdx) {
    const currentQ = this.filteredQuestions[this.currentIndex] || this.questions[0];
    if (!currentQ) return;

    if (this.userAnswers[currentQ.id] !== undefined) return; // already answered

    this.userAnswers[currentQ.id] = answerIdx;
    this.recalculateCompleted();
    this.saveProgress();
    this.render(); // Immediate render for answer selection feedback (no fade needed)
  }

  nextQuestion() {
    if (this.currentIndex < this.filteredQuestions.length - 1) {
      this.currentIndex++;
      this.saveProgress();
      this.triggerStageTransition();
    }
  }

  prevQuestion() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.saveProgress();
      this.triggerStageTransition();
    }
  }

  render() {
    if (!this.container) return;

    const currentCat = window.app ? window.app.currentCategory : "B";
    const currentQ = this.filteredQuestions[this.currentIndex];
    if (!currentQ) {
      this.container.innerHTML = `<div class="course-page-wrapper"><h3>Brak pytań spełniających kryteria.</h3></div>`;
      return;
    }
    const userAnsIdx = this.userAnswers[currentQ.id];
    const isAnswered = userAnsIdx !== undefined;

    const totalBank = this.questions.length;
    const totalAnswered = Object.keys(this.userAnswers).length;

    // Answer Buttons HTML
    const isYesNo = currentQ.answers.length === 2 && currentQ.answers.every(a => a.text.toLowerCase() === 'tak' || a.text.toLowerCase() === 'nie');
    const containerClass = isYesNo ? 'exam-answers-row-2' : 'exam-answers-col-3';

    let answerButtonsHtml = `
      <div class="${containerClass}">
        ${currentQ.answers.map((ans, idx) => {
          let btnClass = isYesNo ? 'btn-answer-tak' : 'btn-answer-spec';
          let icon = "";
          if (isAnswered) {
            if (ans.isCorrect) {
              btnClass += " correct";
              icon = "✓ ";
            } else if (idx === userAnsIdx && !ans.isCorrect) {
              btnClass += " wrong";
              icon = "✕ ";
            }
          }
          if (isAnswered && idx === userAnsIdx) {
            btnClass += " selected";
          }
          
          return `
            <button class="${btnClass}" onclick="window.courseEngine.selectAnswer(${idx})" ${isAnswered ? 'disabled' : ''}>
              ${icon} ${ans.text}
            </button>
          `;
        }).join('')}
      </div>
    `;

    // Media HTML
    let mediaHtml = '';
    if (currentQ.mediaType === 'video') {
      mediaHtml = `
        <video src="${currentQ.mediaUrl}" controls autoplay muted style="width:100%; border-radius:12px; max-height:400px; object-fit:cover;"></video>
      `;
    } else if (currentQ.mediaType === 'image') {
      mediaHtml = `<img src="${currentQ.mediaUrl}" alt="Ilustracja pytania" class="exam-media-img" style="width:100%; border-radius:12px; object-fit:cover;" />`;
    } else {
      mediaHtml = `
        <div class="exam-media-placeholder">
          Brak multimediów
        </div>
      `;
    }

    let explanationHtml = '';
    if (isAnswered && currentQ.explanation) {
      explanationHtml = `
        <div class="explanation-box" style="margin-top: 20px; padding: 20px; background: rgba(108, 92, 231, 0.05); border-left: 4px solid #6C5CE7; border-radius: 8px;">
          <h4 style="margin:0 0 10px 0; color:#6C5CE7;">Objaśnienie</h4>
          ${currentQ.explanation}
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
                  ${this.topicCategories.map(t => `<option value="${t.id}" ${this.selectedGroup == t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
                </select>
              </div>

              <!-- Dropdown 2: Status pytania -->
              <div class="input-group">
                <label class="input-label">Status pytania</label>
                <select class="setting-select" onchange="window.courseEngine.onFilterChange('status', this.value)">
                  <option value="unanswered" ${this.selectedStatus === 'unanswered' ? 'selected' : ''}>Na które jeszcze nie została udzielona odpowiedź</option>
                  <option value="wrong" ${this.selectedStatus === 'wrong' ? 'selected' : ''}>Z błędną odpowiedzią</option>
                  <option value="passed" ${this.selectedStatus === 'passed' ? 'selected' : ''}>Zaliczone</option>
                  <option value="saved" ${this.selectedStatus === 'saved' ? 'selected' : ''}>Zapisane (додані в закладки)</option>
                  <option value="all" ${this.selectedStatus === 'all' ? 'selected' : ''}>Wszystkie</option>
                </select>
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
        <div class="exam-layout-grid view-transition-wrapper" id="course-practice-stage">
          
          <!-- Left Column: Question Media & Options -->
          <div class="exam-left-stage">
            <div class="exam-media-card">
              ${mediaHtml}
            </div>

            <div class="exam-question-text-card">
              <p class="question-text">${currentQ.title}</p>
            </div>

            ${answerButtonsHtml}
            ${explanationHtml}
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
                <strong>ID PYTANIA: ${currentQ.officialId || currentQ.id}</strong>
              </div>
            </div>

            <!-- User Answer Status Badge -->
            <div class="user-answer-status-card">
              <span class="status-label">TWOJE ODPOWIEDZI:</span>
              <span class="status-val ${isAnswered ? 'answered' : ''}">
                ${isAnswered ? (this.checkAnswerCorrect(currentQ, userAnsIdx) ? 'POPRAWNA ODPOWIEDŹ' : 'BŁĘDNA ODPOWIEDŹ') : 'BRAK ODPOWIEDZI NA TO PYTANIE'}
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

            <!-- Action Buttons -->
            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 16px;">
              ${(() => {
                const isSaved = this.savedQuestions.includes(currentQ.id);
                return `
                  <button class="exam-action-btn ${isSaved ? 'saved' : ''}" onclick="window.courseEngine.toggleSaveQuestion()">
                    <i>🔖</i> ${isSaved ? 'Usuń z zapisanych' : 'Zapisz pytanie'}
                  </button>
                `;
              })()}
              <button class="exam-action-btn" onclick="window.courseEngine.toggleFullscreen()">
                <i>⛶</i> ${this.isFullscreen ? 'Zamknij pełny ekran' : 'Pełny ekran'}
              </button>
            </div>
          </div>

        </div>

        ${this.isFullscreen ? `
          <button class="btn-close-fullscreen" onclick="window.courseEngine.toggleFullscreen()">
            ⛶ ZAMKNIJ PEŁNY EKRAN
          </button>
        ` : ''}

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
