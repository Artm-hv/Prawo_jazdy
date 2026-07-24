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

    this.activeTab = "szkolenie";
  }

  async init() {
    this.initDarkMode();
    
    this.player = new InstructorPlayer();
    this.testEngine = new TestEngine("tab-content-container");
    this.signCatalog = new TrafficSignCatalog("tab-content-container");
    this.statsDashboard = new StatsDashboard("tab-content-container");
    this.lecturesEngine = new LecturesEngine("tab-content-container");
    this.textbookEngine = new TextbookEngine("tab-content-container");
    
    window.testEngine = this.testEngine;
    window.lecturesEngine = this.lecturesEngine;
    window.statsDashboard = this.statsDashboard;
    window.textbookEngine = this.textbookEngine;

    this.bindEvents();
    await this.loadCourseData();
    this.updateCategoryDisplay();
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
    }
  }

  setLanguage(lang) {
    this.currentLanguage = lang;
    localStorage.setItem("prawo_jazdy_lang", lang);
  }

  updateCategoryDisplay() {
    const sidebarBadge = document.getElementById("sidebar-category-badge");
    if (sidebarBadge) sidebarBadge.textContent = `${this.currentCategory} ▾`;
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

  switchTab(tabName) {
    this.activeTab = tabName;

    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(n => {
      if (n.getAttribute("data-tab") === tabName) {
        n.classList.add("active");
      } else {
        n.classList.remove("active");
      }
    });

    const videoView = document.getElementById("video-lecture-view");
    const tabContentView = document.getElementById("tab-content-container");
    const sidebarEl = document.querySelector(".sidebar");
    const mainLayout = document.getElementById("main-layout-container");

    if (tabName === "szkolenie") {
      videoView.style.display = "flex";
      tabContentView.style.display = "none";
      if (sidebarEl) sidebarEl.style.display = "flex";
      if (mainLayout) mainLayout.style.gridTemplateColumns = "290px minmax(0, 1fr)";
    } else {
      if (sidebarEl) sidebarEl.style.display = "none";
      if (mainLayout) mainLayout.style.gridTemplateColumns = "1fr";

      if (tabName === "kurs") {
        videoView.style.display = "flex";
        tabContentView.style.display = "none";
      } else {
        videoView.style.display = "none";
        tabContentView.style.display = "block";
      }

      if (tabName === "testy") {
        this.testEngine.loadQuestions(this.currentCategory);
      } else if (tabName === "znaki") {
        this.signCatalog.loadSigns();
      } else if (tabName === "statystyki") {
        this.statsDashboard.loadStats();
      } else if (tabName === "wyklady") {
        this.lecturesEngine.loadLectures();
      } else if (tabName === "podrecznik") {
        this.textbookEngine.loadTextbook();
      }
    }
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
