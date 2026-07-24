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

  countLocalStorageItems(prefix) {
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix) && localStorage.getItem(key) === "true") {
        count++;
      }
    }
    return count;
  }

  getGlobalProgress() {
    // =========================================================================
    // Progress % = (read_items / total_items) * 100 — per topic/slide.
    // Each individual topic or slide adds to the percentage proportionally.
    // Completed sections count is tracked separately for "Zaliczone działy" display.
    // All percentages are strictly capped at 100 via Math.min.
    // =========================================================================

    // 1. Podręcznik: 14 sections, 57 total topics.
    //    Progress = (read_topics / 57) * 100
    //    Completed sections = count of sections where ALL topics are read.
    const PODRECZNIK_TOTAL_SECTIONS = 14;
    let podrecznikCompletedSections = 0;
    let podrecznikReadTopics = 0;
    let podrecznikTotalTopics = 0;
    if (window.TEXTBOOK_DATA) {
      window.TEXTBOOK_DATA.forEach(chap => {
        const topicCount = chap.topics.length;
        podrecznikTotalTopics += topicCount;
        let readInThisSection = 0;
        chap.topics.forEach((_, idx) => {
          if (localStorage.getItem(`textbook_read_${chap.id}_${idx}`) === "true") {
            readInThisSection++;
            podrecznikReadTopics++;
          }
        });
        if (topicCount > 0 && readInThisSection === topicCount) {
          podrecznikCompletedSections++;
        }
      });
    }
    // Per-topic progress (each topic contributes proportionally)
    const podrecznikPct = podrecznikTotalTopics > 0
      ? Math.min(Math.round((podrecznikReadTopics / podrecznikTotalTopics) * 100), 100)
      : 0;

    // 2. Wykłady: 12 sections, 837 total slides.
    //    Progress = (read_slides / 837) * 100
    //    Completed sections = count of sections where ALL slides are viewed.
    const WYKLADY_TOTAL_SECTIONS = 12;
    let wykladyCompletedSections = 0;
    let wykladyReadSlides = 0;
    let wykladyTotalSlides = 0;
    if (window.LECTURES_DATA) {
      window.LECTURES_DATA.forEach((chap, chapIdx) => {
        const chapId = chap.id || (chapIdx + 1);
        let allSlidesInSection = 0;
        let readSlidesInSection = 0;
        chap.lessons.forEach(lesson => {
          const lessonId = lesson.id || lesson.title;
          lesson.slides.forEach((_, slideIdx) => {
            allSlidesInSection++;
            wykladyTotalSlides++;
            if (localStorage.getItem(`lectures_read_${chapId}_${lessonId}_${slideIdx}`) === "true") {
              readSlidesInSection++;
              wykladyReadSlides++;
            }
          });
        });
        if (allSlidesInSection > 0 && readSlidesInSection === allSlidesInSection) {
          wykladyCompletedSections++;
        }
      });
    }
    // Per-slide progress (each slide contributes proportionally)
    const wykladyPct = wykladyTotalSlides > 0
      ? Math.min(Math.round((wykladyReadSlides / wykladyTotalSlides) * 100), 100)
      : 0;

    // 3. Szkolenie z instruktorem: 18 video modules.
    const SZKOLENIE_TOTAL_MODULES = 18;
    let szkolenieCompleted = 0;
    if (window.INSTRUCTOR_DATA) {
      window.INSTRUCTOR_DATA.forEach(mod => {
        if (localStorage.getItem(`instructor_watched_${mod.id}`) === "true") {
          szkolenieCompleted++;
        }
      });
    }
    const szkoleniePct = Math.min(
      Math.round((szkolenieCompleted / SZKOLENIE_TOTAL_MODULES) * 100), 100
    );

    // 4. Testy Progress
    const testsTaken = parseInt(localStorage.getItem('stats_tests_taken') || '0', 10);
    const testsPassed = parseInt(localStorage.getItem('stats_tests_passed') || '0', 10);
    const testTarget = 50;
    const testsPct = Math.min(Math.round((testsPassed / testTarget) * 100), 100);

    // 5. Control Questions
    const podrecznikCtrlPct = Math.min(parseFloat(localStorage.getItem('ctrl_qst_textbook') || '0'), 100);
    const wykladyCtrlPct = Math.min(parseFloat(localStorage.getItem('ctrl_qst_lecture') || '0'), 100);
    const szkolenieCtrlPct = Math.min(parseFloat(localStorage.getItem('ctrl_qst_instructor') || '0'), 100);

    // Global average of the three main learning modules
    const totalProgress = Math.min(
      Math.round((podrecznikPct + wykladyPct + szkoleniePct) / 3), 100
    );
    
    return {
      totalProgress,
      podrecznikPct,
      podrecznikCompletedSections,
      podrecznikTotalSections: PODRECZNIK_TOTAL_SECTIONS,
      podrecznikReadTopics,
      podrecznikTotalTopics,
      podrecznikCtrlPct: Math.round(podrecznikCtrlPct),
      wykladyPct,
      wykladyCompletedSections,
      wykladyTotalSections: WYKLADY_TOTAL_SECTIONS,
      wykladyReadSlides,
      wykladyTotalSlides,
      wykladyCtrlPct: Math.round(wykladyCtrlPct),
      szkoleniePct,
      szkolenieCompleted,
      szkolenieTotal: SZKOLENIE_TOTAL_MODULES,
      szkolenieCtrlPct: Math.round(szkolenieCtrlPct),
      testsTaken,
      testsPassed
    };
  }

  updateCategoryDisplay() {
    const sidebarBadge = document.getElementById("sidebar-category-badge");
    if (sidebarBadge) sidebarBadge.textContent = `${this.currentCategory} ▾`;

    // Only update the Kurs tab sidebar progress (overall-progress-fill).
    // Do NOT touch .category-card progress bars — those belong to
    // Textbook/Lectures tabs and are rendered by their own engines.
    const stats = this.getGlobalProgress();
    const overallFill = document.getElementById('overall-progress-fill');
    const overallText = document.getElementById('overall-progress-text');
    if (overallFill) overallFill.style.width = `${stats.totalProgress}%`;
    if (overallText) overallText.textContent = `POSTĘP: ${stats.totalProgress}%`;
    
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
