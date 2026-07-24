/* ==========================================================================
   Progress & Analytics Dashboard Module
   ========================================================================== */

class StatsDashboard {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  async loadStats() {
    const data = await API.fetchUserStats();
    const stats = data || {
      overall_course_progress: 11.97,
      completed_lessons: 2,
      total_lessons: 10,
      total_study_time_formatted: "00:46:18",
      tests_taken: 3,
      tests_passed: 2,
      average_score: 69.5,
      last_exam_passed: true
    };
    this.render(stats);
  }

  render(stats) {
    if (!this.container) return;

    const passRate = stats.tests_taken > 0 ? roundPct((stats.tests_passed / stats.tests_taken) * 100) : 0;

    this.container.innerHTML = `
      <div>
        <h2 class="section-title" style="margin-bottom: 20px;">Twoje Statystyki i Postępy w Nauce</h2>
        
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">Postęp Kursu Teoretycznego</span>
            <span class="stat-value" style="color: var(--primary-green);">${stats.overall_course_progress}%</span>
            <span class="stat-badge">${stats.completed_lessons} / ${stats.total_lessons} lekcji ukończonych</span>
          </div>

          <div class="stat-card">
            <span class="stat-label">Czas Spędzony na Nauce</span>
            <span class="stat-value">${stats.total_study_time_formatted}</span>
            <span class="stat-badge">Godziny : Minuty : Sekundy</span>
          </div>

          <div class="stat-card">
            <span class="stat-label">Zdawalność Egzaminów Probnych</span>
            <span class="stat-value">${passRate}%</span>
            <span class="stat-badge">${stats.tests_passed} z ${stats.tests_taken} zaliczonych</span>
          </div>

          <div class="stat-card">
            <span class="stat-label">Średni Wynik Egzaminu</span>
            <span class="stat-value">${stats.average_score} <span style="font-size: 16px; font-weight: 500;">/ 74 pkt</span></span>
            <span class="stat-badge" style="color: ${stats.last_exam_passed ? 'var(--primary-green)' : '#ef4444'};">
              ${stats.last_exam_passed ? 'Ostatni egzamin ZALICZONY' : 'Próg zdawalności: 68 pkt'}
            </span>
          </div>
        </div>

        <div style="margin-top: 32px; background: var(--bg-card); border-radius: var(--radius-md); padding: 24px; border: 1px solid var(--border-color);">
          <h3 style="font-size: 18px; font-weight: 800; margin-bottom: 16px;">Podsumowanie Wymagań Egzaminacyjnych (Kategoria B)</h3>
          <ul style="list-style: none; display: flex; flex-direction: column; gap: 12px; font-size: 14px;">
            <li style="display: flex; align-items: center; gap: 10px;">
              <span style="width: 24px; height: 24px; border-radius: 50%; background: var(--primary-green-light); color: var(--primary-green); display: flex; align-items: center; justify-content: center; font-weight: 800;">✓</span>
              <strong>Egzamin teoretyczny trwa 25 minut</strong> i składa się z 35 pytań.
            </li>
            <li style="display: flex; align-items: center; gap: 10px;">
              <span style="width: 24px; height: 24px; border-radius: 50%; background: var(--primary-green-light); color: var(--primary-green); display: flex; align-items: center; justify-content: center; font-weight: 800;">✓</span>
              <strong>Maksymalna liczba punktów wynosi 74.</strong> Aby zdać egzamin państwowy, należy uzyskać co najmniej <strong>68 punktów</strong>.
            </li>
            <li style="display: flex; align-items: center; gap: 10px;">
              <span style="width: 24px; height: 24px; border-radius: 50%; background: var(--primary-green-light); color: var(--primary-green); display: flex; align-items: center; justify-content: center; font-weight: 800;">✓</span>
              Pytania podstawowe: 20 pytań (TAK/NIE), czas na przeczytanie: 20s, czas na odpowiedź: 15s.
            </li>
            <li style="display: flex; align-items: center; gap: 10px;">
              <span style="width: 24px; height: 24px; border-radius: 50%; background: var(--primary-green-light); color: var(--primary-green); display: flex; align-items: center; justify-content: center; font-weight: 800;">✓</span>
              Pytania specjalistyczne: 15 pytań (A/B/C), czas na przeczytanie i odpowiedź: 50s.
            </li>
          </ul>
        </div>
      </div>
    `;
  }
}

function roundPct(val) {
  return Math.round(val * 10) / 10;
}

window.StatsDashboard = StatsDashboard;
