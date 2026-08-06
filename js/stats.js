/* ==========================================================================
   Prawo Jazdy LMS - Full Statistics Dashboard Module
   Matches screenshots image_46b3ce.jpg & image_46b3ec.jpg
   ========================================================================== */

class StatsDashboard {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  async loadStats() {
    const statsData = await API.fetchUserStats();
    this.render(statsData);
  }

  render(stats) {
    if (!this.container) return;

    // Derived metric values from global StatsManager
    let statsData = {
      totalProgress: 0,
      podrecznikPct: 0,
      podrecznikCompleted: 0,
      podrecznikTotal: 0,
      wykladyPct: 0,
      wykladyCompleted: 0,
      wykladyTotal: 0,
      szkoleniePct: 0,
      szkolenieCompleted: 0,
      szkolenieTotal: 0,
      szkolenieCtrlPct: 0,
      testsTaken: 0,
      testsPassed: 0
    };
    
    if (window.app && window.app.getGlobalProgress) {
      statsData = window.app.getGlobalProgress();
    }

    const totalQuestionsBank = 2185;
    const globalAnswers = window.API && API.getGlobalAnswers ? API.getGlobalAnswers() : {};
    const dailyStats = window.API && API.getDailyStats ? API.getDailyStats() : {};
    
    // Testy stats (from attempts)
    let testsTaken = 0;
    let testsPassed = 0;
    let testAttempts = [];
    try {
      testAttempts = JSON.parse(localStorage.getItem("prawo_jazdy_test_attempts") || "[]");
      testsTaken = testAttempts.length;
      testsPassed = testAttempts.filter(a => a.passed).length;
    } catch(e) {}
    
    const testsFailed = testsTaken - testsPassed;
    const passPercentage = testsTaken > 0 ? Math.round((testsPassed / testsTaken) * 100) : 0;
    const failPercentage = testsTaken > 0 ? Math.round((testsFailed / testsTaken) * 100) : 0;

    // Questions stats (from globalAnswers)
    const answersArr = Object.values(globalAnswers);
    const answeredQuestions = answersArr.length;
    const correctCount = answersArr.filter(a => a.correct).length;
    const wrongCount = answeredQuestions - correctCount;
    
    const correctPercentage = answeredQuestions > 0 ? Math.round((correctCount / answeredQuestions) * 100) : 0;
    const wrongPercentage = answeredQuestions > 0 ? Math.round((wrongCount / answeredQuestions) * 100) : 0;
    const unansweredCount = Math.max(0, totalQuestionsBank - answeredQuestions);

    const totalPodrecznikSections = statsData.podrecznikTotalSections || 14;
    const completedPodrecznikSections = statsData.podrecznikCompletedSections || 0;
    const podrecznikProgressPct = statsData.podrecznikPct || 0;

    const totalLectureSections = statsData.wykladyTotalSections || 12;
    const completedLectureSections = statsData.wykladyCompletedSections || 0;
    const lectureProgressPct = statsData.wykladyPct || 0;

    const totalCourseModules = statsData.szkolenieTotal || 18;
    const watchedModules = statsData.szkolenieCompleted || 0;
    const courseProgressPct = statsData.szkoleniePct || 0;
    
    // Flashcards stats
    const fcStatsStr = localStorage.getItem('flashcard_stats') || '{"known":[],"unknown":[]}';
    const fcStats = JSON.parse(fcStatsStr);
    const knownCount = fcStats.known.length;
    const unknownCount = fcStats.unknown.length;
    const allSignsData = window.TRAFFIC_SIGNS_DATA || [];
    const totalFc = allSignsData.length > 0 ? allSignsData.length : 413; // Fallback to 413 if data isn't loaded
    const fcProgressPct = totalFc > 0 ? Math.round((knownCount / totalFc) * 100) : 0;
    const unseenCount = Math.max(0, totalFc - knownCount - unknownCount);

    const savedQStr = localStorage.getItem('prawoJazdy_savedQuestions');
    const savedQuestionsCount = savedQStr ? JSON.parse(savedQStr).length : 0;

    // Generate Pytania Chart HTML (last 5 days)
    const dailyKeys = Object.keys(dailyStats).sort();
    const last5Days = dailyKeys.slice(-5);
    
    let pytaniaChartHtml = '<div class="history-chart-container">';
    if (last5Days.length === 0) {
      pytaniaChartHtml += '<div class="empty-state-box"><span class="empty-state-text">Brak danych</span></div>';
    } else {
      let maxVals = last5Days.map(d => Math.max(dailyStats[d].correct, dailyStats[d].wrong));
      let maxVal = Math.max(...maxVals, 10); // minimum scale 10
      
      last5Days.forEach(date => {
        const stats = dailyStats[date];
        const hCorrect = (stats.correct / maxVal) * 100;
        const hWrong = (stats.wrong / maxVal) * 100;
        const [y, m, d] = date.split('-');
        const dateStr = `${d}-${m}-${y}`;
        
        pytaniaChartHtml += `
          <div class="chart-col">
            <div class="chart-bar green" style="height: ${Math.max(5, hCorrect)}%;"><span class="chart-bar-value">${stats.correct}</span></div>
            <div class="chart-bar red" style="height: ${Math.max(5, hWrong)}%;"><span class="chart-bar-value">${stats.wrong}</span></div>
            <div class="chart-date">${dateStr}</div>
          </div>
        `;
      });
    }
    pytaniaChartHtml += '</div>';

    // Generate Testy Chart HTML (last 5 days)
    const testGroups = {};
    testAttempts.forEach(att => {
      let date = "2026-08-06";
      if (att.attempted_at) {
         date = att.attempted_at.split('T')[0];
      } else if (window.API && API.getTodayString) {
         date = API.getTodayString();
      }
      if (!testGroups[date]) testGroups[date] = { passed: 0, failed: 0 };
      if (att.passed) testGroups[date].passed++; else testGroups[date].failed++;
    });
    
    const testKeys = Object.keys(testGroups).sort().slice(-5);
    let testyChartHtml = '<div class="history-chart-container">';
    if (testKeys.length === 0) {
      testyChartHtml += '<div class="empty-state-box"><span class="empty-state-text">Brak danych</span></div>';
    } else {
      let maxT = Math.max(...testKeys.map(d => testGroups[d].passed + testGroups[d].failed), 5);
      
      testKeys.forEach(date => {
        const stats = testGroups[date];
        const hTotal = ((stats.passed + stats.failed) / maxT) * 100;
        const color = stats.passed >= stats.failed ? 'green' : 'red'; // Simple coloring logic
        const [y, m, d] = date.split('-');
        const dateStr = `${d}-${m}-${y}`;
        
        testyChartHtml += `
          <div class="chart-col" style="width: 40px; margin: 0 10px;">
            <div class="chart-bar ${color}" style="height: ${Math.max(10, hTotal)}%; width: 100%;">
              <span class="chart-bar-value" style="top: -22px; font-size: 0.9rem;">${stats.passed + stats.failed}</span>
            </div>
            <div class="chart-date">${dateStr}</div>
          </div>
        `;
      });
    }
    testyChartHtml += '</div>';

    this.container.innerHTML = `
      <div class="stats-page-wrapper">
        
        <!-- Header Banner -->
        <div class="stats-header-banner">
          <h1 class="stats-main-title">Statystyki</h1>
        </div>

        <div class="stats-content-inner">
          
          <!-- SECTION 1: TESTY -->
          <div class="stats-section-header">
            <h2 class="stats-section-title">Testy</h2>
            <span class="stats-badge-tag">test</span>
          </div>

          <div class="stats-cards-grid-4">
            
            <div class="stats-card card-pass-fail">
              <div class="gradient-card-green">
                <div>
                  <span class="badge-icon">✓</span> Zaliczone testy (${testsPassed})
                </div>
                <div class="pill-percentage" style="border-radius:12px; padding:4px 12px; font-size:1rem;">${passPercentage}%</div>
              </div>
              <div class="gradient-card-red">
                <div>
                  <span class="badge-icon">✕</span> Niezaliczone testy (${testsFailed})
                </div>
                <div class="pill-percentage" style="border-radius:12px; padding:4px 12px; font-size:1rem;">${failPercentage}%</div>
              </div>
            </div>

            <div class="stats-card card-metric">
              <div class="metric-title">Udzielono odpowiedzi na</div>
              <div class="metric-value-row">
                <div class="metric-icon-circle green-tint"><span>💬</span></div>
                <div class="metric-big-number">${answeredQuestions} <span class="metric-total">z ${totalQuestionsBank} pytań</span></div>
              </div>
              <div class="metric-progress-bg">
                <div class="metric-progress-fill" style="width: ${(answeredQuestions / totalQuestionsBank) * 100}%;"></div>
              </div>
            </div>

            <div class="stats-card card-metric">
              <div class="metric-title">Błędne odpowiedzi</div>
              <div class="metric-value-row">
                <div class="metric-icon-circle red-tint"><span>✕</span></div>
                <div class="metric-big-number">${wrongPercentage}%</div>
              </div>
              <div class="metric-progress-bg">
                <div class="metric-progress-fill red-fill" style="width: ${wrongPercentage}%;"></div>
              </div>
            </div>

            <div class="stats-card card-metric">
              <div class="metric-title">Poprawne odpowiedzi</div>
              <div class="metric-value-row">
                <div class="metric-icon-circle green-tint"><span>✓</span></div>
                <div class="metric-big-number">${correctPercentage}%</div>
              </div>
              <div class="metric-progress-bg">
                <div class="metric-progress-fill" style="width: ${correctPercentage}%;"></div>
              </div>
            </div>

          </div>

          <!-- SECTION 2: Quick Action Cards -->
          <div class="stats-cards-grid-3">
            
            <div class="stats-action-card">
              <div class="action-card-left">
                <div class="action-icon-circle green-tint"><span>🔖</span></div>
                <div class="action-card-info">
                  <div class="action-title">Zapisane pytania</div>
                  <div class="action-count">${savedQuestionsCount}</div>
                  <a href="#" class="action-link" onclick="event.preventDefault(); window.app.switchTab('kurs'); setTimeout(() => { window.courseEngine.onFilterChange('status', 'saved'); }, 50);">Pokaż pytania →</a>
                </div>
              </div>
            </div>

            <div class="stats-action-card">
              <div class="action-card-left">
                <div class="action-icon-circle red-tint"><span>✕</span></div>
                <div class="action-card-info">
                  <div class="action-title">Pytania z błędną odpowiedzią</div>
                  <div class="action-count">${wrongCount}</div>
                  <a href="#" class="action-link" onclick="event.preventDefault(); window.app.switchTab('kurs'); setTimeout(() => { window.courseEngine.onFilterChange('status', 'wrong'); }, 50);">Pokaż pytania →</a>
                </div>
              </div>
            </div>

            <div class="stats-action-card">
              <div class="action-card-left">
                <div class="action-icon-circle blue-tint"><span>❓</span></div>
                <div class="action-card-info">
                  <div class="action-title">Pytania na które nie została udzielona odpowiedź</div>
                  <div class="action-count">${unansweredCount}</div>
                  <a href="#" class="action-link" onclick="event.preventDefault(); window.app.switchTab('kurs'); setTimeout(() => { window.courseEngine.onFilterChange('status', 'unanswered'); }, 50);">Pokaż pytania →</a>
                </div>
              </div>
            </div>

          </div>

          <!-- SECTION 3: Performance History Cards -->
          <div class="stats-history-grid">
            <div class="stats-history-card stats-card" style="padding: 24px;">
              <h3 class="history-title">Pytania</h3>
              <p class="history-sub" style="font-size:0.85rem; color:#666; margin-bottom:12px;">W tym miejscu sprawdzisz poprawność udzielonych odpowiedzi wraz z ilością rozwiązanych pytań.</p>
              ${pytaniaChartHtml}
            </div>

            <div class="stats-history-card stats-card" style="padding: 24px;">
              <h3 class="history-title">Testy</h3>
              <p class="history-sub" style="font-size:0.85rem; color:#666; margin-bottom:12px;">W tym miejscu sprawdzisz ilość i poprawność wykonanych testów.</p>
              ${testyChartHtml}
            </div>
          </div>

          <!-- SECTION 4: Course Progress Sections (Podręcznik, Wykłady, Szkolenie z instruktorem) -->
          <div class="stats-cards-grid-2">
            
            <!-- Wykłady Card (Title fixed to "Wykłady") -->
            <div class="course-section-card">
              <h3 class="course-section-title">Wykłady</h3>
              <div class="course-card-inner">
                <div class="course-progress-header">
                  <span class="progress-label">Postęp: ${lectureProgressPct}%</span>
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${lectureProgressPct}%;"></div>
                  </div>
                </div>

                <div class="course-subcards-grid">
                  <div class="course-subcard">
                    <div class="subcard-title">Zaliczone działy</div>
                    <div class="subcard-val-row">
                      <span class="cat-b-icon">${window.app ? window.app.currentCategory : 'B'}</span>
                      <span class="subcard-val">${completedLectureSections} <small>z ${totalLectureSections}</small></span>
                    </div>
                  </div>
                  
                  <div class="course-subcard">
                    <div class="subcard-title">Zaliczone pytania kontrolne</div>
                    <div class="subcard-val-row">
                      <span class="check-icon">✓</span>
                      <span class="subcard-val">${statsData.wykladyCtrlPct || 0}%</span>
                    </div>
                  </div>
                </div>

                <button class="section-outline-btn" onclick="window.app.switchTab('wyklady')">Wykłady →</button>
              </div>
            </div>

            <!-- Podręcznik Card (Title fixed to "Podręcznik") -->
            <div class="course-section-card">
              <h3 class="course-section-title">Podręcznik</h3>
              <div class="course-card-inner">
                <div class="course-progress-header">
                  <span class="progress-label">Postęp: ${podrecznikProgressPct}%</span>
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${podrecznikProgressPct}%;"></div>
                  </div>
                </div>

                <div class="course-subcards-grid">
                  <div class="course-subcard">
                    <div class="subcard-title">Zaliczone działy</div>
                    <div class="subcard-val-row">
                      <span class="cat-b-icon">${window.app ? window.app.currentCategory : 'B'}</span>
                      <span class="subcard-val">${completedPodrecznikSections} <small>z ${totalPodrecznikSections}</small></span>
                    </div>
                  </div>
                  
                  <div class="course-subcard">
                    <div class="subcard-title">Zaliczone pytania kontrolne</div>
                    <div class="subcard-val-row">
                      <span class="check-icon">✓</span>
                      <span class="subcard-val">${statsData.podrecznikCtrlPct || 0}%</span>
                    </div>
                  </div>
                </div>

                <button class="section-outline-btn" onclick="window.app.switchTab('podrecznik')">Podręcznik →</button>
              </div>
            </div>

          </div>

          <!-- Bottom 2-Column Section -->
          <div class="stats-cards-grid-2" style="margin-top: 24px;">
            <!-- Szkolenie z instruktorem Section -->
            <div class="course-section-card">
              <h3 class="course-section-title">Szkolenie z instruktorem</h3>
              <div class="course-card-inner">
                <div class="course-progress-header">
                  <span class="progress-label">Postęp: ${courseProgressPct}%</span>
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${courseProgressPct}%;"></div>
                  </div>
                </div>

                <div class="course-subcards-grid half-grid">
                  <div class="course-subcard">
                    <div class="subcard-title">Obejrzane lekcje</div>
                    <div class="subcard-val-row">
                      <span class="cat-b-icon">🎬</span>
                      <span class="subcard-val">${watchedModules} <small>z ${totalCourseModules}</small></span>
                    </div>
                    <div class="mini-progress-bg">
                      <div class="mini-progress-fill" style="width: ${courseProgressPct}%;"></div>
                    </div>
                  </div>
                  
                  <div class="course-subcard">
                    <div class="subcard-title">Zaliczone pytania kontrolne</div>
                    <div class="subcard-val-row">
                      <span class="check-icon">✓</span>
                      <span class="subcard-val">${statsData.szkolenieCtrlPct || 0}%</span>
                    </div>
                    <div class="mini-progress-bg">
                      <div class="mini-progress-fill" style="width: ${statsData.szkolenieCtrlPct || 0}%;"></div>
                    </div>
                  </div>
                </div>

                <button class="section-outline-btn" onclick="window.app.switchTab('szkolenie')">Szkolenie z instruktorem →</button>
              </div>
            </div>

            <!-- Flashcards Section -->
            <div class="course-section-card">
              <h3 class="course-section-title">Znaki Drogowe - Fiszki</h3>
            <div class="course-card-inner">
              <div class="course-progress-header">
                <span class="progress-label">Zaliczone znaki: ${fcProgressPct}%</span>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" style="width: ${fcProgressPct}%;"></div>
                </div>
              </div>

              <div class="course-subcards-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                <div class="course-subcard" onclick="window.statsDashboard.launchCustomFlashcards('known')" style="cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                  <div class="subcard-title">Wyuczone znaki (Znane)</div>
                  <div class="subcard-val-row">
                    <span class="check-icon" style="color: #2e7d32;">✓</span>
                    <span class="subcard-val">${knownCount} <small>z ${totalFc}</small></span>
                  </div>
                </div>
                
                <div class="course-subcard" onclick="window.statsDashboard.launchCustomFlashcards('unknown')" style="cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                  <div class="subcard-title">Do powtórki (Nieznane)</div>
                  <div class="subcard-val-row">
                    <span class="check-icon" style="color: #c62828;">✕</span>
                    <span class="subcard-val">${unknownCount}</span>
                  </div>
                </div>

                <div class="course-subcard" onclick="window.statsDashboard.launchCustomFlashcards('unseen')" style="cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                  <div class="subcard-title">Jeszcze nie widziane</div>
                  <div class="subcard-val-row">
                    <span class="check-icon" style="color: #9e9e9e;">−</span>
                    <span class="subcard-val">${unseenCount}</span>
                  </div>
                </div>
              </div>

              <button class="section-outline-btn" onclick="window.statsDashboard.showFlashcardsList()">Przeglądaj listę znaków →</button>
            </div>
          </div>
          </div> <!-- End of stats-cards-grid-2 -->

          <!-- SECTION 5: Pytania Search & Filter Table -->
          <div class="search-questions-card">
            <div class="search-card-header">
              <h3 class="search-title">Pytania</h3>
              <button class="btn-see-course" onclick="window.app.switchTab('kurs')">Zobacz kurs</button>
            </div>

            <div class="search-controls-box">
              <h4 class="search-subtitle">Wybór pytań</h4>
              <div class="search-inputs-grid">
                <div class="input-group">
                  <label class="input-label">Wyszukaj pytanie (po id lub treści)</label>
                  <input type="text" class="search-input" placeholder="Wpisz szukaną frazę..." oninput="window.statsDashboard.filterQuestions(this.value)">
                </div>

                <div class="input-group">
                  <label class="input-label">Grupa pytań</label>
                  <select class="search-select">
                    <option value="all">Wszystkie pytania</option>
                    <option value="basic">Pytania podstawowe</option>
                    <option value="specialist">Pytania specjalistyczne</option>
                    <option value="wrong">Tylko z błędną odpowiedzią</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    `;
  }

  filterQuestions(query) {}

  showFlashcardsList() {
    const fcStatsStr = localStorage.getItem('flashcard_stats') || '{"known":[],"unknown":[]}';
    const fcStats = JSON.parse(fcStatsStr);
    
    let modal = document.getElementById('fc-list-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'fc-list-modal';
      modal.className = 'flashcards-modal-overlay';
      document.body.appendChild(modal);
    }
    
    const knownHtml = fcStats.known.map(id => `<span style="display:inline-block; background:#e8f5e9; color:#2e7d32; padding:4px 8px; border-radius:4px; margin:4px; font-weight:600;">${id}</span>`).join('');
    const unknownHtml = fcStats.unknown.map(id => `<span style="display:inline-block; background:#ffebee; color:#c62828; padding:4px 8px; border-radius:4px; margin:4px; font-weight:600;">${id}</span>`).join('');
    
    modal.innerHTML = `
      <div class="flashcards-modal" style="padding: 24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <h2 style="margin:0;">Zaliczone Znaki</h2>
          <button onclick="document.getElementById('fc-list-modal').classList.remove('active')" style="background:none; border:none; font-size:24px; cursor:pointer;">&times;</button>
        </div>
        <div style="overflow-y:auto; max-height:60vh;">
          <h3 style="color:#2e7d32; font-size:16px;">Wyuczone (${fcStats.known.length})</h3>
          <div style="margin-bottom:24px;">${knownHtml || 'Brak wyuczonych znaków'}</div>
          
          <h3 style="color:#c62828; font-size:16px;">Do powtórki (${fcStats.unknown.length})</h3>
          <div>${unknownHtml || 'Brak znaków do powtórki'}</div>
        </div>
      </div>
    `;
    
    // Tiny delay to allow CSS transition
    setTimeout(() => modal.classList.add('active'), 10);
  }

  launchCustomFlashcards(type) {
    if (!window.flashcards || !window.TRAFFIC_SIGNS_DATA) return;
    
    // Switch to signs tab (optional, but good for context)
    window.app.switchTab('znaki');
    
    // Launch flashcards with the special type
    window.flashcards.startSession(type, window.TRAFFIC_SIGNS_DATA);
  }
}

window.StatsDashboard = StatsDashboard;
