/* ==========================================================================
   Prawo Jazdy LMS - Textbook Engine Module (Podręcznik Kursanta)
   Matches screenshot image_a8c304.jpg
   ========================================================================== */

class TextbookEngine {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.chapters = window.TEXTBOOK_DATA || [];
    this.activeChapterId = 1;
    window.textbookEngine = this;
  }

  loadTextbook() {
    this.render();
  }

  selectChapter(chapterId) {
    this.activeChapterId = chapterId;
    this.render();
  }

  render() {
    if (!this.container) return;

    const currentCategory = window.app ? window.app.currentCategory : "B";

    // 1. Sidebar 14 Chapters Accordion HTML
    const sidebarChaptersHtml = this.chapters.map(chap => {
      const isActive = chap.id === this.activeChapterId;
      return `
        <div class="chapter-accordion-card ${isActive ? 'open' : ''}">
          <div class="chapter-accordion-header" onclick="window.textbookEngine.selectChapter(${chap.id})">
            <span class="chapter-accordion-title">${chap.number} ${chap.title}</span>
            <div class="chapter-meta-right">
              <span class="chapter-count">${chap.completed_count}/${chap.total_count}</span>
              <span class="accordion-arrow">${isActive ? '✕' : '⌵'}</span>
            </div>
          </div>
          ${isActive ? `
            <div class="active-lesson-box">
              <div class="slides-sublist">
                ${chap.topics.map((top, idx) => `
                  <div class="slide-list-item">
                    <span class="slide-status-circle ${idx < chap.completed_count ? 'completed' : ''}"></span>
                    <span class="slide-item-title">${top}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    // 2. Main Stage Content HTML
    const chapterCardsHtml = this.chapters.map(chap => {
      return `
        <div class="podrecznik-dzial-card" id="dzial-card-${chap.id}">
          <div class="dzial-card-header">
            <span class="dzial-badge">DZIAŁ ${chap.id}</span>
            <h3 class="dzial-title">${chap.title}</h3>
          </div>

          <div class="dzial-card-body">
            <div class="dzial-text-col">
              <p class="dzial-description">${chap.description}</p>
              
              <ul class="dzial-topics-list">
                ${chap.topics.map(t => `<li><span class="bullet-dot">•</span> ${t}</li>`).join('')}
              </ul>

              <button class="btn-start-dzial" onclick="window.textbookEngine.selectChapter(${chap.id})">
                Rozpocznij naukę →
              </button>
            </div>

            <div class="dzial-img-col">
              <img src="${chap.image_url}" alt="${chap.title}" class="dzial-img" loading="lazy" />
            </div>
          </div>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="lectures-layout-grid">
        
        <!-- Left Sidebar: 14 Chapters Accordion -->
        <div class="lectures-sidebar-col">
          <div class="category-card" style="margin-bottom: 12px;">
            <div class="category-header">
              <span class="category-title">KATEGORIA</span>
              <span class="category-badge-selector">${currentCategory} ▾</span>
            </div>
            <div class="progress-info">
              <span>POSTĘP: 4%</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: 4%;"></div>
            </div>
          </div>

          <div class="wyklady-sidebar-header">
            <h3 class="sidebar-block-title">PODRĘCZNIK KURSANTA NA PRAWO JAZDY 2026</h3>
          </div>

          <div class="chapters-accordion-list">
            ${sidebarChaptersHtml}
          </div>
        </div>

        <!-- Right Main Stage Content -->
        <div class="lectures-stage-col">
          
          <!-- Banner Intro Card -->
          <div class="podrecznik-intro-card">
            <div class="intro-card-inner">
              <div class="intro-img-col">
                <img src="https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=500&auto=format&fit=crop" alt="Podręcznik Kursanta" class="intro-laptop-img" />
              </div>
              <div class="intro-text-col">
                <h2 class="intro-title">Podręcznik kursanta zawiera:</h2>
                
                <div class="intro-feature-item">
                  <span class="feature-check">✓</span>
                  <p class="feature-text">
                    <strong>Podręcznik kursanta</strong> to innowacyjna metoda przygotowania kursantów do egzaminu teoretycznego na prawo jazdy. Dzięki niemu każdy użytkownik naszego serwisu może zaoszczędzić swój czas, ponieważ może uczyć się, kiedy tylko ma na to wolną chwilę i gdzie tylko chce.
                  </p>
                </div>

                <div class="intro-feature-item">
                  <span class="feature-check">✓</span>
                  <p class="feature-text">
                    Nie musisz się sztywno dostosowywać do odgórnie ustalonego planu wykładów, bo dzięki naszemu podręcznikowi kurs może być przeprowadzany w dowolnym miejscu np. w trakcie podróży do pracy, a ponadto, w każdej chwili możesz powrócić do przerobionego już materiału, aby go sobie utrwalić.
                  </p>
                </div>

                <div class="intro-feature-item">
                  <span class="feature-check">✓</span>
                  <p class="feature-text">
                    Podręcznik kursanta jest bardzo przejrzysty i łatwo się w nim odnaleźć. Składa się z 14 różnorodnych działów, a po każdym z nich następuje 10 pytań kontrolnych, na które należy udzielić prawidłowej odpowiedzi. W ten sposób kursant ma możliwość weryfikacji tego czy w odpowiednim stopniu przyswoił materiał zawarty w danym dziale tematycznym.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Section Heading -->
          <div class="podrecznik-heading-box">
            <h2 class="podrecznik-section-title">
              Co zawierają <span class="highlight-green">poszczególne działy?</span>
            </h2>
          </div>

          <!-- Chapter Cards Stack -->
          <div class="podrecznik-cards-stack">
            ${chapterCardsHtml}
          </div>

        </div>

      </div>
    `;
  }
}

window.TextbookEngine = TextbookEngine;
