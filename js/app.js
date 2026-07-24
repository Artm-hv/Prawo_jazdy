/* ==========================================================================
   Prawo Jazdy LMS - Main Application Orchestrator
   ========================================================================== */

class LMSApp {
  constructor() {
    this.currentCategory = localStorage.getItem("prawo_jazdy_category") || "B";
    this.currentLanguage = localStorage.getItem("prawo_jazdy_lang") || "PL";
    this.isDarkMode = localStorage.getItem("prawo_jazdy_dark_mode") === "true";
    
    this.courses = [];
    this.currentLesson = null;
    this.player = null;
    this.testEngine = null;
    this.signCatalog = null;
    this.statsDashboard = null;
    this.lecturesEngine = null;
    this.textbookEngine = null;
    this.courseEngine = null;
    this.instructorEngine = null;

    this.activeTab = "szkolenie";
  }

  async init() {
    this.initDarkMode();
    
    this.testEngine = new TestEngine("tab-content-container");
    this.signCatalog = new TrafficSignCatalog("tab-content-container");
    this.statsDashboard = new StatsDashboard("tab-content-container");
    this.lecturesEngine = new LecturesEngine("tab-content-container");
    this.textbookEngine = new TextbookEngine("tab-content-container");
    this.courseEngine = new CourseEngine("tab-content-container");
    this.instructorEngine = new InstructorEngine("tab-content-container");
    
    window.testEngine = this.testEngine;
    window.lecturesEngine = this.lecturesEngine;
    window.statsDashboard = this.statsDashboard;
    window.textbookEngine = this.textbookEngine;
    window.courseEngine = this.courseEngine;
    window.instructorEngine = this.instructorEngine;

    this.bindEvents();
    await this.loadCourseData();
    this.updateCategoryDisplay();

    // Trigger initial tab load
    const initialTab = this.activeTab;
    this.activeTab = null;
    this.switchTab(initialTab);
  }

  initDarkMode() {
    if (this.isDarkMode) {
      document.body.classList.add("dark-theme");
      const toggleInput = document.getElementById("dark-mode-toggle");
      if (toggleInput) toggleInput.checked = true;
    } else {
      document.body.classList.remove("dark-theme");
    }
  }

  toggleDarkMode(enabled) {
    this.isDarkMode = enabled !== undefined ? enabled : !this.isDarkMode;
    localStorage.setItem("prawo_jazdy_dark_mode", this.isDarkMode);
    if (this.isDarkMode) {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
  }

  toggleSettingsModal() {
    const modal = document.getElementById("settings-modal");
    if (!modal) return;
    const isHidden = modal.style.display === "none" || !modal.style.display;
    modal.style.display = isHidden ? "flex" : "none";

    if (isHidden) {
      const catSelect = document.getElementById("setting-category-select");
      if (catSelect) catSelect.value = this.currentCategory;
      const langSelect = document.getElementById("setting-language-select");
      if (langSelect) langSelect.value = this.currentLanguage;
      const darkToggle = document.getElementById("dark-mode-toggle");
      if (darkToggle) darkToggle.checked = this.isDarkMode;
    }
  }

  setCategory(category) {
    this.currentCategory = category;
    localStorage.setItem("prawo_jazdy_category", category);
    this.updateCategoryDisplay();
    this.loadCourseData();
    if (this.activeTab === "znaki" && this.signCatalog) {
      this.signCatalog.loadSigns();
    } else if (this.activeTab === "statystyki" && this.statsDashboard) {
      this.statsDashboard.loadStats();
    } else if (this.activeTab === "podrecznik" && this.textbookEngine) {
      this.textbookEngine.loadTextbook();
    } else if (this.activeTab === "kurs" && this.courseEngine) {
      this.courseEngine.loadCourseView();
    }
  }

  setLanguage(lang) {
    this.currentLanguage = lang;
    localStorage.setItem("prawo_jazdy_lang", lang);
  }

  getGlobalProgress() {
    // 1. Podręcznik Progress
    let podrecznikTotal = 0;
    let podrecznikCompleted = 0;
    if (window.TEXTBOOK_DATA) {
      window.TEXTBOOK_DATA.forEach(chap => {
        chap.topics.forEach((_, idx) => {
          podrecznikTotal++;
          if (localStorage.getItem(`textbook_read_${chap.id}_${idx}`) === "true") {
            podrecznikCompleted++;
          }
        });
      });
    }
    const podrecznikPct = Math.min(podrecznikTotal > 0 ? (podrecznikCompleted / podrecznikTotal) * 100 : 0, 100);

    // 2. Wykłady Progress
    let wykladyTotal = 0;
    let wykladyCompleted = 0;
    if (window.LECTURES_DATA) {
      window.LECTURES_DATA.forEach(chap => {
        chap.lessons.forEach(lesson => {
          lesson.slides.forEach((_, slideIdx) => {
            wykladyTotal++;
            if (localStorage.getItem(`lectures_read_${chap.id}_${lesson.id}_${slideIdx}`) === "true") {
              wykladyCompleted++;
            }
          });
        });
      });
    }
    const wykladyPct = Math.min(wykladyTotal > 0 ? (wykladyCompleted / wykladyTotal) * 100 : 0, 100);

    // 3. Szkolenie (Instructor Video) Progress
    let szkolenieTotal = 0;
    let szkolenieCompleted = 0;
    if (window.INSTRUCTOR_DATA) {
      window.INSTRUCTOR_DATA.forEach(mod => {
        szkolenieTotal++;
        if (localStorage.getItem(`instructor_watched_${mod.id}`) === "true") {
          szkolenieCompleted++;
        }
      });
    }
    const szkoleniePct = Math.min(szkolenieTotal > 0 ? (szkolenieCompleted / szkolenieTotal) * 100 : 0, 100);

    // 4. Testy Progress (simplified: based on passed tests vs a target of 100 tests, or just using tests passed percentage if any)
    const testsTaken = parseInt(localStorage.getItem('stats_tests_taken') || '0', 10);
    const testsPassed = parseInt(localStorage.getItem('stats_tests_passed') || '0', 10);
    // Let's say target is 50 passed tests to reach 100% test progress
    const testTarget = 50;
    const testsPct = Math.min((testsPassed / testTarget) * 100, 100);

    // 5. Control Questions (Zaliczone pytania kontrolne)
    const podrecznikCtrlPct = Math.min(parseFloat(localStorage.getItem('ctrl_qst_textbook') || '0'), 100);
    const wykladyCtrlPct = Math.min(parseFloat(localStorage.getItem('ctrl_qst_lecture') || '0'), 100);
    const szkolenieCtrlPct = Math.min(parseFloat(localStorage.getItem('ctrl_qst_instructor') || '0'), 100);

    // Average Progress
    const totalProgress = Math.round((podrecznikPct + wykladyPct + szkoleniePct + testsPct) / 4);
    
    return {
      totalProgress: Math.min(totalProgress, 100),
      podrecznikPct: Math.round(podrecznikPct),
      podrecznikCompleted,
      podrecznikTotal,
      podrecznikCtrlPct: Math.round(podrecznikCtrlPct),
      wykladyPct: Math.round(wykladyPct),
      wykladyCompleted,
      wykladyTotal,
      wykladyCtrlPct: Math.round(wykladyCtrlPct),
      szkoleniePct: Math.round(szkoleniePct),
      szkolenieCompleted,
      szkolenieTotal,
      szkolenieCtrlPct: Math.round(szkolenieCtrlPct),
      testsTaken,
      testsPassed
    };
  }

  updateCategoryDisplay() {
    const sidebarBadge = document.getElementById("sidebar-category-badge");
    if (sidebarBadge) sidebarBadge.textContent = `${this.currentCategory} ▾`;

    const stats = this.getGlobalProgress();
    
    // Update any progress bars globally
    document.querySelectorAll('.progress-bar-fill').forEach(el => {
      // If it's a global progress bar (not a subcard bar)
      if (el.id === 'overall-progress-fill' || el.id === 'podrecznik-progress-fill' || el.closest('.category-card')) {
        el.style.width = `${stats.totalProgress}%`;
      }
    });

    document.querySelectorAll('.progress-info span, #overall-progress-text').forEach(el => {
      if (el.textContent.includes('POSTĘP')) {
        el.textContent = `POSTĘP: ${stats.totalProgress}%`;
      }
    });
    
    // If stats dashboard is active, refresh it silently
    if (this.activeTab === 'statystyki' && this.statsDashboard) {
      this.statsDashboard.loadStats();
    }
  }

  bindEvents() {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
      item.addEventListener("click", (e) => {
        const tab = e.currentTarget.getAttribute("data-tab");
        if (tab) {
          navItems.forEach(n => n.classList.remove("active"));
          e.currentTarget.classList.add("active");
          this.switchTab(tab);
        }
      });
    });
  }

  async loadCourseData() {
    const data = await API.fetchCourses(this.currentCategory);
    if (data && data.length > 0) {
      this.courses = data;
    } else {
      this.courses = [{
        id: 1,
        title: `Kurs Nauki Jazdy - Kategoria ${this.currentCategory}`,
        category: this.currentCategory,
        overall_progress_percentage: 11.97,
        modules: [
          {
            id: 1,
            order_index: 1,
            title: "1. Wprowadzenie",
            total_duration_seconds: 938,
            lessons: [
              { id: 1, order_index: 1, title: "Wprowadzenie", lesson_type: "lecture", duration_seconds: 520, is_completed: true, video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
              { id: 2, order_index: 2, title: "Pytania kontrolne", lesson_type: "quiz", duration_seconds: 418, is_completed: false }
            ]
          },
          {
            id: 2,
            order_index: 2,
            title: "2. Podstawy prawa o ruchu drogowym",
            total_duration_seconds: 2056,
            lessons: [
              { id: 3, order_index: 1, title: "Podstawy prawa o ruchu drogowym", lesson_type: "lecture", duration_seconds: 1500, is_completed: true, video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" },
              { id: 4, order_index: 2, title: "Pytania kontrolne", lesson_type: "quiz", duration_seconds: 556, is_completed: false }
            ]
          },
          {
            id: 3,
            order_index: 3,
            title: "3. Znaki, sygnały i polecenia w ruchu drogowym",
            total_duration_seconds: 6939,
            lessons: [
              { id: 5, order_index: 1, title: "Znaki ostrzegawcze (A-1 do A-34)", lesson_type: "lecture", duration_seconds: 1800, is_completed: false, watched_seconds: 364, featured_sign_code: "A-1", video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", instructor_notes: "Ostrzega o niebezpiecznym zakręcie w kierunku wskazanym na znaku." },
              { id: 6, order_index: 2, title: "Znaki zakazu i nakazu (B-20, C-12)", lesson_type: "lecture", duration_seconds: 2400, is_completed: false, featured_sign_code: "B-20", video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4", instructor_notes: "Obowiązek bezwzględnego zatrzymania się przy znaku STOP." },
              { id: 7, order_index: 3, title: "Sygnały i polecenia kierującego ruchem", lesson_type: "lecture", duration_seconds: 1800, is_completed: false },
              { id: 8, order_index: 4, title: "Pytania kontrolne", lesson_type: "quiz", duration_seconds: 939, is_completed: false }
            ]
          }
        ]
      }];
    }

    this.renderSidebar();
    
    const initialLesson = this.courses[0]?.modules[2]?.lessons[0] || this.courses[0]?.modules[0]?.lessons[0];
    if (initialLesson) {
      this.selectLesson(initialLesson);
    }
  }

  renderSidebar() {
    const sidebarEl = document.getElementById("sidebar-modules");
    const progressFillEl = document.getElementById("overall-progress-fill");
    const progressTextEl = document.getElementById("overall-progress-text");

    if (!sidebarEl || this.courses.length === 0) return;

    const course = this.courses[0];
    const progress = course.overall_progress_percentage || 11.97;

    if (progressFillEl) progressFillEl.style.width = `${progress}%`;
    if (progressTextEl) progressTextEl.textContent = `POSTĘP: ${progress}%`;

    sidebarEl.innerHTML = course.modules.map(mod => {
      const formattedTotal = this.formatDuration(mod.total_duration_seconds);
      const isCurrentModule = mod.lessons.some(l => l.id === this.currentLesson?.id);

      const lessonsHtml = mod.lessons.map(l => {
        const isCompleted = l.is_completed;
        const isActive = l.id === this.currentLesson?.id;

        return `
          <div class="lesson-item ${isActive ? 'active' : ''}" onclick="window.app.onLessonItemClick(${l.id})">
            <div class="status-icon ${isCompleted ? 'completed' : (isActive ? 'playing' : 'uncompleted')}">
              ${isCompleted ? '✓' : (isActive ? '▶' : '')}
            </div>
            <span>${l.title}</span>
          </div>
        `;
      }).join('');

      return `
        <div class="module-card ${isCurrentModule ? 'active' : ''}">
          <div class="module-header">
            <div class="module-header-title">${mod.title}</div>
            <div class="module-meta">
              <span>Czas trwania: ${formattedTotal}</span>
            </div>
            <div class="module-mini-progress">
              <div class="module-mini-fill" style="width: ${isCurrentModule ? '30%' : (mod.order_index < 3 ? '100%' : '0%')};"></div>
            </div>
          </div>
          <div class="lesson-sublist">
            ${lessonsHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  onLessonItemClick(lessonId) {
    for (const mod of this.courses[0].modules) {
      const found = mod.lessons.find(l => l.id === lessonId);
      if (found) {
        if (found.lesson_type === "quiz") {
          this.switchTab("testy");
        } else {
          this.selectLesson(found);
          this.switchTab("szkolenie");
        }
        break;
      }
    }
  }

  selectLesson(lesson) {
    this.currentLesson = lesson;
    this.renderSidebar();
    if (this.player) {
      this.player.loadLesson(lesson);
    }
  }

  async switchTab(tabName) {
    if (this.activeTab === tabName) return;
    this.activeTab = tabName;

    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(n => {
      if (n.getAttribute("data-tab") === tabName) {
        n.classList.add("active");
      } else {
        n.classList.remove("active");
      }
    });

    const tabContentView = document.getElementById("tab-content-container");
    const mainLayout = document.getElementById("main-layout-container");

    // Start fade out
    if (tabContentView) tabContentView.classList.add("fade-out");

    // Wait for fade out transition (150ms based on --transition-fast)
    await new Promise(r => setTimeout(r, 150));

    if (mainLayout) mainLayout.style.gridTemplateColumns = "1fr";
    if (tabContentView) {
      tabContentView.style.display = "block";
      tabContentView.innerHTML = '';
    }

    if (tabName === "testy") this.testEngine.loadQuestions(this.currentCategory);
    else if (tabName === "znaki") this.signCatalog.loadSigns();
    else if (tabName === "statystyki") this.statsDashboard.loadStats();
    else if (tabName === "wyklady") this.lecturesEngine.loadLectures();
    else if (tabName === "podrecznik") this.textbookEngine.loadTextbook();
    else if (tabName === "kurs") this.courseEngine.loadCourseView();
    else if (tabName === "szkolenie") this.instructorEngine.loadInstructor();

    // Remove fade out
    if (tabContentView) tabContentView.classList.remove("fade-out");
  }

  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.app = new LMSApp();
  window.app.init();
});
