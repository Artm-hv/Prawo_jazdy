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
    if (this.activeChapterId === chapterId) {
      this.activeChapterId = null;
    } else {
      this.activeChapterId = chapterId;
    }
    this.activeTopicIdx = null; // reset to show chapter list
    this.render();
  }

  selectTopic(chapterId, topicIdx) {
    this.activeChapterId = chapterId;
    this.activeTopicIdx = topicIdx;
    this.render();
  }

  toggleReadStatus(chapterId, topicIdx, isRead) {
    const chapter = this.chapters.find(c => c.id === chapterId);
    if (!chapter) return;
    
    const localStorageKey = `textbook_read_${chapterId}_${topicIdx}`;
    
    if (isRead) {
      localStorage.setItem(localStorageKey, "true");
    } else {
      localStorage.removeItem(localStorageKey);
    }
    // Single render pass — progress bar inside render() reads fresh localStorage
    this.render();
  }

  render() {
    if (!this.container) return;

    const currentCategory = window.app ? window.app.currentCategory : "B";
    // Compute progress ONCE per render pass to avoid stale values
    const progressPct = window.app ? window.app.getGlobalProgress().podrecznikPct : 0;

    // 1. Sidebar 14 Chapters Accordion HTML
    const sidebarChaptersHtml = this.chapters.map(chap => {
      const isActive = chap.id === this.activeChapterId;
      
      // Dynamically compute completed count for this chapter
      let computedCompletedCount = 0;
      chap.topics.forEach((_, idx) => {
        if (localStorage.getItem(`textbook_read_${chap.id}_${idx}`) === "true") {
          computedCompletedCount++;
        }
      });
      
      return `
        <div style="margin-bottom: 8px;">
          <div class="modern-accordion-item ${isActive ? 'active' : ''}" onclick="window.textbookEngine.selectChapter(${chap.id})">
            <span class="modern-accordion-title">${chap.number.split(' ')[0]} ${chap.title}</span>
            <div class="modern-accordion-meta">
              <span class="modern-accordion-count">${computedCompletedCount}/${chap.total_count}</span>
              <span class="modern-accordion-chevron">${isActive ? '∧' : '∨'}</span>
            </div>
          </div>
          ${isActive ? `
            <div class="active-lesson-box" style="padding-top: 0; background: #ffffff; border: 1px solid rgba(108, 92, 231, 0.3); border-top: none; border-radius: 0 0 8px 8px; padding-bottom: 12px; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(108, 92, 231, 0.05);">
              <div style="padding: 12px 16px 0 16px;">
                <div class="modern-instructor-progress-bg" style="margin-bottom: 8px;">
                  <div class="modern-instructor-progress-fill" style="width: ${chap.total_count > 0 ? (computedCompletedCount / chap.total_count) * 100 : 0}%;"></div>
                </div>
                <hr style="border: none; border-top: 1px solid rgba(108, 92, 231, 0.2); margin-top: 0; margin-bottom: 12px;">
              </div>
              <div class="slides-sublist" style="padding: 0 12px;">
                ${chap.topics.map((top, idx) => {
                  const isRead = localStorage.getItem(`textbook_read_${chap.id}_${idx}`) === "true";
                  const isActiveTopic = this.activeTopicIdx === idx;
                  return `
                  <div class="slide-list-item ${isActiveTopic ? 'active-topic' : ''}" onclick="event.stopPropagation(); window.textbookEngine.selectTopic(${chap.id}, ${idx})" style="padding: 6px 8px;">
                    <span class="modern-instructor-check ${isRead ? 'completed' : ''}" style="width: 16px; height: 16px; margin-right: 8px;">
                      ${isRead ? '<svg viewBox="0 0 24 24" width="10" height="10" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
                    </span>
                    <span class="slide-item-title">${idx + 1}. ${typeof top === 'object' ? top.title : top}</span>
                  </div>
                `}).join('')}
                <div class="slide-list-item pytania-kontrolne-item" onclick="event.stopPropagation();" style="padding: 6px 8px; margin-top: 8px;">
                  <span class="modern-instructor-check" style="width: 16px; height: 16px; margin-right: 8px;"></span>
                  <span class="slide-item-title">Pytania kontrolne - dział ${chap.number.split('.')[0]}</span>
                </div>
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
        let topicContent = typeof topic === 'object' && topic.content ? topic.content : '<p>Treść wkrótce...</p>';
        
        // Clean up scraped HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(topicContent, 'text/html');
        
        // Remove duplicated header
        const header = doc.querySelector('.header');
        if (header) header.remove();
        
        // Remove scraped empty checkbox
        const readCheck = doc.querySelector('.elearning-read');
        if (readCheck) readCheck.remove();
        
        topicContent = doc.body.innerHTML;

        const isRead = localStorage.getItem(`textbook_read_${activeChapter.id}_${this.activeTopicIdx}`) === "true";
        
        mainStageHtml = `
          <div class="podrecznik-lesson-view">
            <div class="lesson-header-row">
              <h2>${topicTitle}</h2>
            </div>
            
            <div class="lesson-html-content">
              ${topicContent}
            </div>

            <div class="lesson-checkbox-row" style="margin: 24px 0 16px 0;">
              <input type="checkbox" id="markReadCheckbox" ${isRead ? 'checked' : ''} onchange="window.textbookEngine.toggleReadStatus(${activeChapter.id}, ${this.activeTopicIdx}, this.checked)" />
              <label for="markReadCheckbox">Oznacz jako przeczytane</label>
            </div>

            <div class="lesson-navigation-grid" style="display: flex; gap: 16px;">
              <button class="lesson-nav-btn" onclick="window.textbookEngine.selectTopic(${activeChapter.id}, ${this.activeTopicIdx > 0 ? this.activeTopicIdx - 1 : 0})" style="flex: 1; padding: 12px; border: 1px solid var(--primary-purple); background: transparent; color: var(--text-dark); border-radius: 6px; cursor: pointer; transition: background 0.15s;">
                ← Poprzedni
              </button>
              <button class="lesson-nav-btn" onclick="window.textbookEngine.selectTopic(${activeChapter.id}, ${this.activeTopicIdx + 1})" style="flex: 1; padding: 12px; border: 1px solid var(--primary-purple); background: transparent; color: var(--text-dark); border-radius: 6px; cursor: pointer; transition: background 0.15s;">
                Następny →
              </button>
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
    const oldSidebar = this.container.querySelector('.lectures-sidebar-col');
    const oldScrollTop = oldSidebar ? oldSidebar.scrollTop : 0;

    this.container.innerHTML = `
      <div class="lectures-layout-grid">
        
        <!-- Left Sidebar: 14 Chapters Accordion -->
        <div class="lectures-sidebar-col">
          <div class="modern-category-card">
            <div class="modern-category-header">
              <span class="modern-category-title">KATEGORIA</span>
              <span class="modern-category-badge">${currentCategory} ∨</span>
            </div>
            <div class="modern-progress-info">
              POSTĘP: ${Math.round(progressPct)}%
            </div>
            <div class="modern-progress-bar-bg">
              <div class="modern-progress-bar-fill" style="width: ${progressPct}%;"></div>
            </div>
          </div>

          <h3 class="modern-sidebar-title">PODRĘCZNIK KURSANTA NA PRAWO JAZDY 2026</h3>

          <div class="chapters-accordion-list">
            ${sidebarChaptersHtml}
          </div>
        </div>

        <!-- Right Main Stage Content -->
        <div class="lectures-stage-col">
          ${mainStageHtml}
        </div>
    `;

    const newSidebar = this.container.querySelector('.lectures-sidebar-col');
    if (newSidebar) {
      newSidebar.scrollTop = oldScrollTop;
    }

    setTimeout(() => {
      if (!this.container || !newSidebar) return;
      const activeTopic = this.container.querySelector('.slide-list-item.active-topic');
      const activeChapter = this.container.querySelector('.modern-accordion-item.active');
      const target = activeTopic || activeChapter;

      if (target) {
        const sidebarRect = newSidebar.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        
        if (targetRect.top < sidebarRect.top + 40 || targetRect.bottom > sidebarRect.bottom - 40) {
          const offset = targetRect.top - sidebarRect.top;
          newSidebar.scrollTo({
            top: newSidebar.scrollTop + offset - (sidebarRect.height / 2) + (targetRect.height / 2),
            behavior: 'smooth'
          });
        }
      }
    }, 10);
  }
}

window.TextbookEngine = TextbookEngine;
