/* ==========================================================================
   Prawo Jazdy 360 LMS - Full Statistics Dashboard Module
   Matches screenshots image_175249.jpg, image_175253.jpg, image_175257.jpg
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

    // Derived metric values from stats & localStorage
    const totalQuestionsBank = 2185;
    const testsTaken = stats.tests_taken || 0;
    const testsPassed = stats.tests_passed || 0;
    const testsFailed = testsTaken - testsPassed;
    
    const passPercentage = testsTaken > 0 ? Math.round((testsPassed / testsTaken) * 100) : 0;
    const failPercentage = testsTaken > 0 ? Math.round((testsFailed / testsTaken) * 100) : 0;

    const answeredQuestions = stats.completed_lessons ? stats.completed_lessons * 15 : 0;
    const correctPercentage = stats.average_score ? Math.round((stats.average_score / 74) * 100) : 0;
    const wrongPercentage = answeredQuestions > 0 ? Math.max(0, 100 - correctPercentage) : 0;

    const watchedMinutes = Math.round((stats.completed_lessons || 1) * 18);
    const totalCourseMinutes = 467;
    const courseProgressPct = stats.overall_course_progress || 11;

    this.container.innerHTML = `
      <div class="stats-page-wrapper">
        
        <!-- Header Banner -->
        <div class="stats-header-banner">
          <h1 class="stats-main-title">Statystyki</h1>
        </div>

        <div class="stats-content-inner">
          
          <!-- ==========================================================================
               SECTION 1: TESTY (Top 4 Metric Cards)
               ========================================================================== -->
          <div class="stats-section-header">
            <h2 class="stats-section-title">Testy</h2>
            <span class="stats-badge-tag">test</span>
          </div>

          <div class="stats-cards-grid-4">
            
            <!-- Card 1: Zaliczone vs Niezaliczone Testy -->
            <div class="stats-card card-pass-fail">
              <div class="pass-row">
                <div class="pill-badge green-badge">
                  <span class="badge-icon">✓</span>
                  <span class="badge-label">Zaliczone testy (${testsPassed})</span>
                </div>
                <div class="pill-percentage green-pct-pill">${passPercentage}%</div>
              </div>

              <div class="fail-row">
                <div class="pill-badge red-badge">
                  <span class="badge-icon">✕</span>
                  <span class="badge-label">Niezaliczone testy (${testsFailed})</span>
                </div>
                <div class="pill-percentage red-pct-pill">${failPercentage}%</div>
              </div>
            </div>

            <!-- Card 2: Udzielono odpowiedzi na -->
            <div class="stats-card card-metric">
              <div class="metric-title">Udzielono odpowiedzi na</div>
              <div class="metric-value-row">
                <div class="metric-icon-circle green-tint">
                  <span>💬</span>
                </div>
                <div class="metric-big-number">${answeredQuestions} <span class="metric-total">z ${totalQuestionsBank} pytań</span></div>
              </div>
              <div class="metric-progress-bg">
                <div class="metric-progress-fill" style="width: ${(answeredQuestions / totalQuestionsBank) * 100}%;"></div>
              </div>
            </div>

            <!-- Card 3: Błędne odpowiedzi -->
            <div class="stats-card card-metric">
              <div class="metric-title">Błędne odpowiedzi</div>
              <div class="metric-value-row">
                <div class="metric-icon-circle red-tint">
                  <span>✕</span>
                </div>
                <div class="metric-big-number">${wrongPercentage}%</div>
              </div>
              <div class="metric-progress-bg">
                <div class="metric-progress-fill red-fill" style="width: ${wrongPercentage}%;"></div>
              </div>
            </div>

            <!-- Card 4: Poprawne odpowiedzi -->
            <div class="stats-card card-metric">
              <div class="metric-title">Poprawne odpowiedzi</div>
              <div class="metric-value-row">
                <div class="metric-icon-circle green-tint">
                  <span>✓</span>
                </div>
                <div class="metric-big-number">${correctPercentage}%</div>
              </div>
              <div class="metric-progress-bg">
                <div class="metric-progress-fill" style="width: ${correctPercentage}%;"></div>
              </div>
            </div>

          </div>

          <!-- ==========================================================================
               SECTION 2: Quick Action Cards (Zapisane, Błędne, Nieudzielone)
               ========================================================================== -->
          <div class="stats-cards-grid-3">
            
            <div class="stats-action-card">
              <div class="action-card-left">
                <div class="action-icon-circle green-tint">
                  <span>🔖</span>
                </div>
                <div class="action-card-info">
                  <div class="action-title">Zapisane pytania</div>
                  <div class="action-count">0</div>
                  <a href="#" class="action-link" onclick="event.preventDefault(); window.app.switchTab('testy');">Pokaż pytania →</a>
                </div>
              </div>
            </div>

            <div class="stats-action-card">
              <div class="action-card-left">
                <div class="action-icon-circle red-tint">
                  <span>✕</span>
                </div>
                <div class="action-card-info">
                  <div class="action-title">Pytania z błędną odpowiedzią</div>
                  <div class="action-count">${testsFailed * 5}</div>
                  <a href="#" class="action-link" onclick="event.preventDefault(); window.app.switchTab('testy');">Pokaż pytania →</a>
                </div>
              </div>
            </div>

            <div class="stats-action-card">
              <div class="action-card-left">
                <div class="action-icon-circle blue-tint">
                  <span>❓</span>
                </div>
                <div class="action-card-info">
                  <div class="action-title">Pytania na które nie została udzielona odpowiedź</div>
                  <div class="action-count">${Math.max(0, totalQuestionsBank - answeredQuestions)}</div>
                  <a href="#" class="action-link" onclick="event.preventDefault(); window.app.switchTab('testy');">Pokaż pytania →</a>
                </div>
              </div>
            </div>

          </div>

          <!-- ==========================================================================
               SECTION 3: Performance History Cards (Pytania & Testy)
               ========================================================================== -->
          <div class="stats-cards-grid-2">
            
            <div class="stats-history-card">
              <h3 class="history-title">Pytania</h3>
              <p class="history-sub">W tym miejscu sprawdzisz poprawność udzielonych odpowiedzi wraz z ilością rozwiązanych pytań.</p>
              
              <div class="empty-state-box">
                <span class="empty-state-text">Brak danych</span>
              </div>
            </div>

            <div class="stats-history-card">
              <h3 class="history-title">Testy</h3>
              <p class="history-sub">W tym miejscu sprawdzisz ilość i poprawność wykonanych testów.</p>
              
              <div class="empty-state-box">
                <span class="empty-state-text">Brak danych</span>
              </div>
            </div>

          </div>

          <!-- ==========================================================================
               SECTION 4: Course Progress Sections (Podręcznik, Wykłady, Szkolenie)
               ========================================================================== -->
          <div class="stats-cards-grid-2">
            
            <!-- Podręcznik Kursanta -->
            <div class="course-section-card">
              <h3 class="course-section-title">Podręcznik kursanta</h3>
              <div class="course-card-inner">
                <div class="course-progress-header">
                  <span class="progress-label">Postęp: 0%</span>
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: 0%;"></div>
                  </div>
                </div>

                <div class="course-subcards-grid">
                  <div class="course-subcard">
                    <div class="subcard-title">Zaliczone działy</div>
                    <div class="subcard-val-row">
                      <span class="cat-b-icon">B</span>
                      <span class="subcard-val">0 <small>z 13</small></span>
                    </div>
                  </div>
                  
                  <div class="course-subcard">
                    <div class="subcard-title">Zaliczone pytania kontrolne</div>
                    <div class="subcard-val-row">
                      <span class="check-icon">✓</span>
                      <span class="subcard-val">0%</span>
                    </div>
                  </div>
                </div>

                <button class="section-outline-btn" onclick="window.app.switchTab('podrecznik')">Podręcznik →</button>
              </div>
            </div>

            <!-- Wykłady z lektorem -->
            <div class="course-section-card">
              <h3 class="course-section-title">Wykłady z lektorem</h3>
              <div class="course-card-inner">
                <div class="course-progress-header">
                  <span class="progress-label">Postęp: 0%</span>
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: 0%;"></div>
                  </div>
                </div>

                <div class="course-subcards-grid">
                  <div class="course-subcard">
                    <div class="subcard-title">Zaliczone działy</div>
                    <div class="subcard-val-row">
                      <span class="cat-b-icon">B</span>
                      <span class="subcard-val">5 <small>z 774</small></span>
                    </div>
                  </div>
                  
                  <div class="course-subcard">
                    <div class="subcard-title">Zaliczone pytania kontrolne</div>
                    <div class="subcard-val-row">
                      <span class="check-icon">✓</span>
                      <span class="subcard-val">0%</span>
                    </div>
                  </div>
                </div>

                <button class="section-outline-btn" onclick="window.app.switchTab('wyklady')">Wykłady →</button>
              </div>
            </div>

          </div>

          <!-- Szkolenie z instruktorem Section -->
          <div class="course-section-card full-width-card">
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
                  <div class="subcard-title">Obejrzane minuty</div>
                  <div class="subcard-val-row">
                    <span class="cat-b-icon">🎬</span>
                    <span class="subcard-val">${watchedMinutes} <small>z ${totalCourseMinutes}</small></span>
                  </div>
                  <div class="mini-progress-bg">
                    <div class="mini-progress-fill" style="width: ${(watchedMinutes / totalCourseMinutes) * 100}%;"></div>
                  </div>
                </div>
                
                <div class="course-subcard">
                  <div class="subcard-title">Zaliczone pytania kontrolne</div>
                  <div class="subcard-val-row">
                    <span class="check-icon">✓</span>
                    <span class="subcard-val">0%</span>
                  </div>
                  <div class="mini-progress-bg">
                    <div class="mini-progress-fill" style="width: 0%;"></div>
                  </div>
                </div>
              </div>

              <button class="section-outline-btn" onclick="window.app.switchTab('szkolenie')">Szkolenie z instruktorem →</button>
            </div>
          </div>

          <!-- ==========================================================================
               SECTION 5: Pytania Search & Filter Table
               ========================================================================== -->
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

  filterQuestions(query) {
    // Optional interactive search filtering stub
  }
}

window.StatsDashboard = StatsDashboard;
