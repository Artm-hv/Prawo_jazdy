const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../js/stats.js');
let content = fs.readFileSync(filePath, 'utf8');

const regex = /const totalQuestionsBank = 2185;[\s\S]*?<!-- SECTION 4: Course Progress Sections/;

const newContent = `const totalQuestionsBank = 2185;
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
        const dateStr = \`\${d}-\${m}-\${y}\`;
        
        pytaniaChartHtml += \`
          <div class="chart-col">
            <div class="chart-bar green" style="height: \${Math.max(5, hCorrect)}%;"><span class="chart-bar-value">\${stats.correct}</span></div>
            <div class="chart-bar red" style="height: \${Math.max(5, hWrong)}%;"><span class="chart-bar-value">\${stats.wrong}</span></div>
            <div class="chart-date">\${dateStr}</div>
          </div>
        \`;
      });
    }
    pytaniaChartHtml += '</div>';

    // Generate Testy Chart HTML (last 5 days)
    const testGroups = {};
    testAttempts.forEach(att => {
      const date = att.attempted_at ? att.attempted_at.split('T')[0] : (window.API && API.getTodayString ? API.getTodayString() : new Date().toISOString().split('T')[0]);
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
        const dateStr = \`\${d}-\${m}-\${y}\`;
        
        testyChartHtml += \`
          <div class="chart-col" style="width: 40px; margin: 0 10px;">
            <div class="chart-bar \${color}" style="height: \${Math.max(10, hTotal)}%; width: 100%;">
              <span class="chart-bar-value" style="top: -22px; font-size: 0.9rem;">\${stats.passed + stats.failed}</span>
            </div>
            <div class="chart-date">\${dateStr}</div>
          </div>
        \`;
      });
    }
    testyChartHtml += '</div>';

    this.container.innerHTML = \`
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
                  <span class="badge-icon">✓</span> Zaliczone testy (\${testsPassed})
                </div>
                <div class="pill-percentage" style="border-radius:12px; padding:4px 12px;">\${passPercentage}%</div>
              </div>
              <div class="gradient-card-red">
                <div>
                  <span class="badge-icon">✕</span> Niezaliczone testy (\${testsFailed})
                </div>
                <div class="pill-percentage" style="border-radius:12px; padding:4px 12px;">\${failPercentage}%</div>
              </div>
            </div>

            <div class="stats-card card-metric">
              <div class="metric-title">Udzielono odpowiedzi na</div>
              <div class="metric-value-row">
                <div class="metric-icon-circle green-tint"><span>💬</span></div>
                <div class="metric-big-number">\${answeredQuestions} <span class="metric-total">z \${totalQuestionsBank} pytań</span></div>
              </div>
              <div class="metric-progress-bg">
                <div class="metric-progress-fill" style="width: \${(answeredQuestions / totalQuestionsBank) * 100}%;"></div>
              </div>
            </div>

            <div class="stats-card card-metric">
              <div class="metric-title">Błędne odpowiedzi</div>
              <div class="metric-value-row">
                <div class="metric-icon-circle red-tint"><span>✕</span></div>
                <div class="metric-big-number">\${wrongPercentage}%</div>
              </div>
              <div class="metric-progress-bg">
                <div class="metric-progress-fill red-fill" style="width: \${wrongPercentage}%;"></div>
              </div>
            </div>

            <div class="stats-card card-metric">
              <div class="metric-title">Poprawne odpowiedzi</div>
              <div class="metric-value-row">
                <div class="metric-icon-circle green-tint"><span>✓</span></div>
                <div class="metric-big-number">\${correctPercentage}%</div>
              </div>
              <div class="metric-progress-bg">
                <div class="metric-progress-fill" style="width: \${correctPercentage}%;"></div>
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
                  <div class="action-count">\${savedQuestionsCount}</div>
                  <a href="#" class="action-link" onclick="event.preventDefault(); window.app.switchTab('kurs'); setTimeout(() => { window.courseEngine.onFilterChange('status', 'saved'); }, 50);">Pokaż pytania →</a>
                </div>
              </div>
            </div>

            <div class="stats-action-card">
              <div class="action-card-left">
                <div class="action-icon-circle red-tint"><span>✕</span></div>
                <div class="action-card-info">
                  <div class="action-title">Pytania z błędną odpowiedzią</div>
                  <div class="action-count">\${wrongCount}</div>
                  <a href="#" class="action-link" onclick="event.preventDefault(); window.app.switchTab('kurs'); setTimeout(() => { window.courseEngine.onFilterChange('status', 'wrong'); }, 50);">Pokaż pytania →</a>
                </div>
              </div>
            </div>

            <div class="stats-action-card">
              <div class="action-card-left">
                <div class="action-icon-circle blue-tint"><span>❓</span></div>
                <div class="action-card-info">
                  <div class="action-title">Pytania na które nie została udzielona odpowiedź</div>
                  <div class="action-count">\${unansweredCount}</div>
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
              \${pytaniaChartHtml}
            </div>

            <div class="stats-history-card stats-card" style="padding: 24px;">
              <h3 class="history-title">Testy</h3>
              <p class="history-sub" style="font-size:0.85rem; color:#666; margin-bottom:12px;">W tym miejscu sprawdzisz ilość i poprawność wykonanych testów.</p>
              \${testyChartHtml}
            </div>
          </div>

          <!-- SECTION 4: Course Progress Sections`;

content = content.replace(regex, newContent);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated stats.js');
