/* ==========================================================================
   Prawo Jazdy 360 LMS - Lectures & Slide Presentation Module (Wykłady)
   Matches screenshots image_2765be.jpg & image_276602.jpg
   ========================================================================== */

class LecturesEngine {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.chapters = window.LECTURES_DATA || [];
    this.currentChapterId = 1;
    this.currentLessonId = 1;
    this.currentSlideIndex = 2; // Default to Slide 3 ("Kategoria AM") matching screenshot
    this.isPlaying = false;
    this.playTimer = null;
    this.isMuted = false;
  }

  loadLectures() {
    this.render();
  }

  getCurrentChapter() {
    return this.chapters.find(c => c.id === this.currentChapterId) || this.chapters[0];
  }

  getCurrentLesson() {
    const chapter = this.getCurrentChapter();
    return (chapter && chapter.lessons) ? (chapter.lessons.find(l => l.id === this.currentLessonId) || chapter.lessons[0]) : null;
  }

  getCurrentSlide() {
    const lesson = this.getCurrentLesson();
    if (!lesson || !lesson.slides || lesson.slides.length === 0) return null;
    return lesson.slides[this.currentSlideIndex] || lesson.slides[0];
  }

  selectChapter(chapterId) {
    this.currentChapterId = chapterId;
    const chapter = this.getCurrentChapter();
    if (chapter && chapter.lessons && chapter.lessons.length > 0) {
      this.currentLessonId = chapter.lessons[0].id;
      this.currentSlideIndex = 0;
    }
    this.render();
  }

  selectSlide(slideIndex) {
    this.currentSlideIndex = slideIndex;
    this.render();
  }

  nextSlide() {
    const lesson = this.getCurrentLesson();
    if (lesson && lesson.slides && this.currentSlideIndex < lesson.slides.length - 1) {
      this.currentSlideIndex++;
      this.render();
    } else {
      this.togglePlay(false);
    }
  }

  prevSlide() {
    if (this.currentSlideIndex > 0) {
      this.currentSlideIndex--;
      this.render();
    }
  }

  togglePlay(forceState = null) {
    this.isPlaying = forceState !== null ? forceState : !this.isPlaying;
    if (this.isPlaying) {
      if (this.playTimer) clearInterval(this.playTimer);
      this.playTimer = setInterval(() => {
        this.nextSlide();
      }, 5000);
    } else {
      if (this.playTimer) clearInterval(this.playTimer);
    }
    const playBtn = document.getElementById('lecture-play-btn');
    if (playBtn) playBtn.textContent = this.isPlaying ? '⏸' : '▶';
  }

  render() {
    if (!this.container) return;

    const currentChapter = this.getCurrentChapter();
    const currentLesson = this.getCurrentLesson();
    const currentSlide = this.getCurrentSlide();

    const totalLessonSlides = currentLesson ? currentLesson.slides.length : 17;
    const slideNumber = currentSlide ? currentSlide.number : (this.currentSlideIndex + 1);

    // Render Sidebar Chapters List
    const chaptersHtml = this.chapters.map(chap => {
      const isChapterActive = chap.id === this.currentChapterId;
      
      let lessonsContent = '';
      if (isChapterActive && chap.lessons && chap.lessons.length > 0) {
        lessonsContent = chap.lessons.map(les => {
          const slidesListHtml = les.slides.map((s, idx) => {
            const isSlideActive = idx === this.currentSlideIndex;
            return `
              <div class="slide-list-item ${isSlideActive ? 'active' : ''}" onclick="window.lecturesEngine.selectSlide(${idx})">
                <span class="slide-status-circle ${idx <= this.currentSlideIndex ? 'completed' : ''}"></span>
                <span class="slide-item-title">${s.number} - ${s.title}</span>
              </div>
            `;
          }).join('');

          return `
            <div class="active-lesson-box">
              <div class="lesson-header-row">
                <span class="lesson-title-badge">${les.title}</span>
                <span class="lesson-counter-badge">${slideNumber}/${totalLessonSlides}</span>
              </div>
              <div class="slides-sublist">
                ${slidesListHtml}
              </div>
            </div>
          `;
        }).join('');
      }

      return `
        <div class="chapter-accordion-card ${isChapterActive ? 'open' : ''}">
          <div class="chapter-accordion-header" onclick="window.lecturesEngine.selectChapter(${chap.id})">
            <span class="chapter-accordion-title">${chap.title}</span>
            <div class="chapter-meta-right">
              <span class="chapter-count">${chap.completed_count}/${chap.total_count}</span>
              <span class="accordion-arrow">${isChapterActive ? '✕' : '⌵'}</span>
            </div>
          </div>
          ${lessonsContent}
        </div>
      `;
    }).join('');

    // Format explanation text with bullet points
    let formattedExplanation = currentSlide ? currentSlide.explanation : '';
    if (formattedExplanation.includes('•')) {
      const parts = formattedExplanation.split('\n');
      const intro = parts[0];
      const bullets = parts.slice(1).map(p => `<li>${p.replace('•', '').trim()}</li>`).join('');
      formattedExplanation = `<p>${intro}</p><ul class="lecture-bullets">${bullets}</ul>`;
    } else {
      formattedExplanation = `<p>${formattedExplanation}</p>`;
    }

    this.container.innerHTML = `
      <div class="lectures-layout-grid">
        
        <!-- Left Sidebar: Accordion Chapters -->
        <div class="lectures-sidebar-col">
          <div class="wyklady-sidebar-header">
            <h3 class="sidebar-block-title">WYKŁADY NA PRAWO JAZDY</h3>
          </div>
          <div class="chapters-accordion-list">
            ${chaptersHtml}
          </div>
        </div>

        <!-- Right Stage: Presentation Player & Explanation -->
        <div class="lectures-stage-col">
          
          <!-- Breadcrumb Navigation -->
          <div class="lecture-breadcrumb">
            <span>${currentChapter ? currentChapter.title.replace(/Dział \d+ - /, '') : 'Wiadomości wstępne'}</span>
            <span class="breadcrumb-sep">></span>
            <span>${currentLesson ? currentLesson.title.replace(/Lekcja \d+: /, '') : 'Informacje ogólne'}</span>
            <span class="breadcrumb-sep">></span>
            <span class="breadcrumb-current">Slajd ${slideNumber}/${totalLessonSlides}</span>
          </div>

          <!-- Slide Main Title -->
          <h2 class="slide-main-heading">${currentSlide ? currentSlide.title : 'Kategoria AM'}</h2>

          <!-- Slide Presentation Stage Box -->
          <div class="slide-player-box">
            
            <div class="slide-image-stage">
              <img src="${currentSlide ? currentSlide.image_url : 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1000'}" alt="${currentSlide ? currentSlide.title : 'Slajd'}" class="slide-img" />
              
              <!-- Bottom Scrubber Progress Bar inside Image -->
              <div class="slide-scrubber-bar">
                <div class="slide-scrubber-fill" style="width: ${((slideNumber) / totalLessonSlides) * 100}%;"></div>
              </div>
            </div>

            <!-- Slide Control Bar -->
            <div class="slide-controls-bar">
              <div class="control-left-buttons">
                <button class="player-icon-btn" id="lecture-play-btn" onclick="window.lecturesEngine.togglePlay()" title="Start/Stop Slajdów">
                  ${this.isPlaying ? '⏸' : '▶'}
                </button>
                <button class="player-icon-btn" onclick="window.lecturesEngine.prevSlide()" ${this.currentSlideIndex === 0 ? 'disabled' : ''} title="Poprzedni slajd">
                  ◀
                </button>
                <button class="player-icon-btn" onclick="window.lecturesEngine.nextSlide()" ${this.currentSlideIndex >= totalLessonSlides - 1 ? 'disabled' : ''} title="Następny slajd">
                  ▶
                </button>
              </div>

              <div class="control-right-buttons">
                <button class="player-icon-btn toggle-badge-btn active" title="Autoodtwarzanie slajdów">
                  🟢
                </button>
                <button class="player-icon-btn" title="Dźwięk Lektora">
                  🔊
                </button>
                <button class="player-icon-btn" title="Pełny Ekran">
                  ⛶
                </button>
              </div>
            </div>

          </div>

          <!-- Slide Explanation Card -->
          <div class="slide-explanation-card">
            ${formattedExplanation}
          </div>

          <!-- Navigation Footer Buttons -->
          <div class="slide-nav-footer">
            <button class="btn-nav-prev" onclick="window.lecturesEngine.prevSlide()" ${this.currentSlideIndex === 0 ? 'disabled' : ''}>
              ← Poprzedni slajd
            </button>
            <button class="btn-nav-next" onclick="window.lecturesEngine.nextSlide()" ${this.currentSlideIndex >= totalLessonSlides - 1 ? 'disabled' : ''}>
              Następny slajd →
            </button>
          </div>

        </div>

      </div>
    `;
  }
}

window.LecturesEngine = LecturesEngine;
