/* ==========================================================================
   Prawo Jazdy LMS - Textbook Engine Module (Podręcznik Kursanta)
   Matches screenshot image_a8c304.jpg
   ========================================================================== */

class TextbookEngine {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.chapters = window.TEXTBOOK_DATA || [];
    this.activeChapterId = 1;
    this.activeTopicIdx = null; // null means showing list of chapters
    window.textbookEngine = this;
  }

  loadTextbook() {
    this.render();
  }

  selectChapter(chapterId) {
    this.activeChapterId = chapterId;
    this.activeTopicIdx = null; // reset to show chapter list
    this.render();
  }

  selectTopic(chapterId, topicIdx) {
    this.activeChapterId = chapterId;
    this.activeTopicIdx = topicIdx;
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
                  <div class="slide-list-item ${this.activeTopicIdx === idx ? 'active-topic' : ''}" onclick="event.stopPropagation(); window.textbookEngine.selectTopic(${chap.id}, ${idx})">
                    <span class="slide-status-circle ${idx < chap.completed_count ? 'completed' : ''}"></span>
                    <span class="slide-item-title">${idx + 1}. ${typeof top === 'object' ? top.title : top}</span>
                  </div>
                `).join('')}
                <button class="btn-pytania-kontrolne" onclick="event.stopPropagation();">
                  Pytania kontrolne - dział ${chap.number.split('.')[0]}
                </button>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    // 2. Main Stage Content HTML
    let mainStageHtml = "";

    if (this.activeTopicIdx !== null) {
      // Show specific lesson content
      const activeChapter = this.chapters.find(c => c.id === this.activeChapterId);
      if (activeChapter && activeChapter.topics[this.activeTopicIdx]) {
        const topic = activeChapter.topics[this.activeTopicIdx];
        const topicTitle = typeof topic === 'object' ? topic.title : topic;
        const topicContent = typeof topic === 'object' && topic.content ? topic.content : '<p>Treść wkrótce...</p>';
        
        mainStageHtml = `
          <div class="podrecznik-lesson-view">
            <div class="lesson-header-row">
              <h2>${topicTitle}</h2>
              <button class="btn-lektor">🔊 Włącz lektora</button>
            </div>
            
            <div class="lesson-checkbox-row">
              <input type="checkbox" id="markReadCheckbox" />
              <label for="markReadCheckbox">Oznacz jako przeczytane</label>
            </div>

            <div class="lesson-html-content">
              ${topicContent}
            </div>

            <div class="lesson-navigation-grid">
              <button class="lesson-nav-btn" onclick="window.textbookEngine.selectTopic(${activeChapter.id}, ${this.activeTopicIdx - 1 > 0 ? this.activeTopicIdx - 1 : 0})">
                ← Poprzedni
              </button>
              <div class="lesson-nav-btn-next-col">
                <button class="lesson-nav-btn" onclick="window.textbookEngine.selectTopic(${activeChapter.id}, ${this.activeTopicIdx + 1})">
                  Następny →
                </button>
                <button class="lesson-nav-btn" onclick="window.textbookEngine.selectTopic(${activeChapter.id}, ${this.activeTopicIdx + 1})">
                  Następny →<br><small>(oznacz jako przeczytane)</small>
                </button>
              </div>
            </div>
          </div>
        `;
      }
    } else {
      // Show default list of chapters
      const chapterCardsHtml = this.chapters.map(chap => {
        return `
          <div class="podrecznik-dzial-card" id="dzial-card-${chap.id}">
            <div class="dzial-card-header">
              <span class="dzial-badge">DZIAŁ ${chap.id}</span>
              <h3 class="dzial-title">${chap.title}</h3>
            </div>
  
            <div class="dzial-card-body">
              <div class="dzial-text-col">
                <p class="dzial-description">${chap.description || 'Tematy do omówienia w tym dziale:'}</p>
                
                <ul class="dzial-topics-list">
                  ${chap.topics.slice(0, 3).map(t => {
                    const title = typeof t === 'object' ? t.title : t;
                    return `<li><span class="bullet-dot">•</span> ${title}</li>`;
                  }).join('')}
                  ${chap.topics.length > 3 ? `<li><span class="bullet-dot">•</span> i ${chap.topics.length - 3} więcej...</li>` : ''}
                </ul>
  
                <button class="btn-start-dzial" onclick="window.textbookEngine.selectTopic(${chap.id}, 0)">
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

      mainStageHtml = `
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
                    <strong>Podręcznik kursanta</strong> to innowacyjna metoda przygotowania kursantów do egzaminu teoretycznego na prawo jazdy.
                  </p>
                </div>

                <div class="intro-feature-item">
                  <span class="feature-check">✓</span>
                  <p class="feature-text">
                    Nie musisz się sztywno dostosowywać do odgórnie ustalonego planu wykładów, ucz się w każdej wolnej chwili.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Section Heading -->
          <div class="podrecznik-heading-box">
            <h2 class="podrecznik-section-title">DZIAŁY TEMATYCZNE</h2>
          </div>

          <!-- Chapters List -->
          <div class="podrecznik-cards-list">
            ${chapterCardsHtml}
          </div>
      `;
    }

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
          ${mainStageHtml}
        </div>
      </div>
    `;
  }
}

window.TextbookEngine = TextbookEngine;
