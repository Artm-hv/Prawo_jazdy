/* ==========================================================================
   Prawo Jazdy 360 LMS - Lectures & Slide Presentation Module (Wykłady)
   Matches screenshots image_2765be.jpg & image_276602.jpg
   ========================================================================== */

class LecturesEngine {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.chapters = window.LECTURES_DATA || [];
    
    // Assign IDs if missing
    this.chapters.forEach((chap, cIdx) => {
      chap.id = chap.id || (cIdx + 1);
      if (chap.lessons) {
        chap.lessons.forEach((les, lIdx) => {
          les.id = les.id || (lIdx + 1);
        });
      }
    });

    this.currentChapterId = 1;
    this.currentLessonId = 1;
    this.currentSlideIndex = 0; 
    this.isPlaying = false;
    this.playTimer = null;
    this.isMuted = false;
    this.completedSlides = new Set();
  }

  loadLectures() {
    this.render();
  }

  getCurrentChapter() {
    return this.chapters.find(c => c.id === this.currentChapterId) || null;
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
    if (this.currentChapterId === chapterId) {
      // Close the current chapter
      this.currentChapterId = null;
    } else {
      this.currentChapterId = chapterId;
      const chapter = this.getCurrentChapter();
      if (chapter && chapter.lessons && chapter.lessons.length > 0) {
        this.currentLessonId = chapter.lessons[0].id;
        this.currentSlideIndex = 0;
      }
    }
    this.render();
  }

  selectLesson(lessonId) {
    this.currentLessonId = lessonId;
    this.currentSlideIndex = 0;
    this.render();
  }

  selectSlide(lessonId, slideIdx) {
    this.currentLessonId = lessonId;
    this.currentSlideIndex = slideIdx;
    this.markCurrentSlideCompleted();
    this.render();
  }

  markCurrentSlideCompleted() {
    const chapter = this.getCurrentChapter();
    const lesson = this.getCurrentLesson();
    if (chapter && lesson) {
      localStorage.setItem(`lectures_read_${chapter.id}_${lesson.id}_${this.currentSlideIndex}`, "true");
      if (window.app) window.app.updateCategoryDisplay();
    }
  }

  nextSlide() {
    const currentLesson = this.getCurrentLesson();
    if (currentLesson && this.currentSlideIndex < currentLesson.slides.length - 1) {
      this.markCurrentSlideCompleted();
      this.currentSlideIndex++;
      this.markCurrentSlideCompleted();
      this.render();
    } else {
      // Go to next lesson
      const chapter = this.getCurrentChapter();
      if (chapter && chapter.lessons) {
        const lessonIndex = chapter.lessons.findIndex(l => l.id === this.currentLessonId);
        if (lessonIndex < chapter.lessons.length - 1) {
          const chap = this.getCurrentChapter();
          if (chap) {
             this.completedSlides.add(`${chap.id}-${this.currentLessonId}-${this.currentSlideIndex}`);
          }
          this.currentLessonId = chapter.lessons[lessonIndex + 1].id;
          this.currentSlideIndex = 0;
          this.render();
        } else {
          this.togglePlay(false);
        }
      }
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
    const slideNumber = this.currentSlideIndex + 1;

      // Progress for this chapter
      const chapProgressPct = actualTotalCount > 0 ? (actualCompletedCount / actualTotalCount) * 100 : 0;

      return `
        <div class="chapter-accordion-card ${isChapterActive ? 'open' : ''}">
          <div class="chapter-accordion-header" onclick="window.lecturesEngine.selectChapter(${chap.id})">
            <div class="chapter-header-top">
              <span class="chapter-accordion-title">${chap.title}</span>
              <div class="chapter-meta-right">
                <span class="chapter-count">${actualCompletedCount}/${actualTotalCount}</span>
                <span class="accordion-close-btn">${isChapterActive ? '✕' : '⌵'}</span>
              </div>
            </div>
            ${isChapterActive ? `
            <div class="chapter-progress-bg">
              <div class="chapter-progress-fill" style="width: ${chapProgressPct}%;"></div>
            </div>
            ` : ''}
          </div>
          ${isChapterActive && chap.lessons ? `
            <div class="active-lesson-box" style="padding-top: 8px;">
              ${chap.lessons.map(les => {
                const isActiveLesson = les.id === this.currentLessonId;
                
                // Calculate completion for this specific lesson
                let lessonCompleted = 0;
                les.slides.forEach((_, idx) => {
                  if (localStorage.getItem(`lectures_read_${chap.id}_${les.id}_${idx}`) === "true") {
                    lessonCompleted++;
                  }
                });
                const isLessonFullyCompleted = lessonCompleted === les.slides.length;

                const displayLessonTitle = les.title.replace('\\n', '<br>');
                const lessonTitleParts = les.title.split('\\n');
                const mainTitle = lessonTitleParts[0] || '';
                const subTitle = lessonTitleParts.length > 1 ? lessonTitleParts[1] : '';

                return `
                  <div class="lesson-card-wrapper ${isActiveLesson ? 'active' : ''}" style="${isActiveLesson ? 'background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); padding: 12px 0 0 0; margin-bottom: 8px;' : 'margin-bottom: 4px; padding: 8px; cursor: pointer; border-radius: 8px; transition: background 0.15s;'}" ${!isActiveLesson ? `onclick="window.lecturesEngine.selectLesson(${les.id})"` : ''}>
                    
                    <div class="lesson-header-row" style="display: flex; align-items: center; justify-content: space-between; padding: 0 12px; margin-bottom: ${isActiveLesson ? '12px' : '0'}; border-radius: 0; background: transparent; cursor: ${isActiveLesson ? 'default' : 'pointer'};">
                      <div style="display: flex; align-items: center; gap: 12px;">
                        <span class="lesson-status-circle" style="width: 20px; height: 20px; min-width: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; ${isLessonFullyCompleted ? 'background: #6C5CE7;' : 'background: #c4bbf0;'}">
                          ${isLessonFullyCompleted ? '<svg viewBox="0 0 24 24" width="14" height="14" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
                        </span>
                        <div style="display: flex; flex-direction: column;">
                          <span style="font-size: 13px; font-weight: 700; color: #111;">${mainTitle}</span>
                          ${subTitle ? `<span style="font-size: 12px; font-weight: 500; color: #555;">${subTitle}</span>` : ''}
                        </div>
                      </div>
                      <span class="lesson-counter-badge" style="font-size: 12px; font-weight: 600; color: #111;">${lessonCompleted}/${les.slides.length}</span>
                    </div>

                    ${isActiveLesson ? `
                    <div class="slides-sublist" style="padding: 0 8px 12px 8px; border-top: 1px solid rgba(108, 92, 231, 0.1); padding-top: 12px;">
                      ${les.slides.map((s, idx) => {
                        const isSlideActive = (idx === this.currentSlideIndex);
                        const isCompleted = this.completedSlides.has(chap.id + '-' + les.id + '-' + idx);
                        return `
                          <div class="slide-list-item ${isSlideActive ? 'active' : ''}" onclick="window.lecturesEngine.selectSlide(${les.id}, ${idx})" style="padding: 6px 12px; gap: 10px; font-size: 12.5px; ${isSlideActive ? 'background: rgba(108, 92, 231, 0.08); box-shadow: none; border-radius: 6px;' : ''}">
                            <span style="width: 10px; height: 10px; border-radius: 50%; background: ${isCompleted ? '#6C5CE7' : 'rgba(108, 92, 231, 0.3)'}; flex-shrink: 0;"></span>
                            <span style="color: ${isSlideActive ? '#6C5CE7' : '#555'}; font-weight: ${isSlideActive ? '700' : '500'};">${idx + 1} - ${s.title}</span>
                          </div>
                        `;
                      }).join('')}
                      <div class="slide-list-item pytania-kontrolne-item" onclick="event.stopPropagation();" style="display: flex; justify-content: space-between; margin-top: 12px; border-radius: 6px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                          <span style="width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(108, 92, 231, 0.4); flex-shrink: 0;"></span>
                          <span style="font-size: 12.5px; font-weight: 500;">Pytania kontrolne</span>
                        </div>
                        <span style="font-size: 11px; font-weight: 600; color: #555;">0/8</span>
                      </div>
                    </div>
                    ` : ''}

                  </div>
                `;
              }).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    // Format explanation text with bullet points
    let formattedExplanation = currentSlide ? currentSlide.contentHtml : '';

    this.container.innerHTML = `
      <div class="lectures-layout-grid">
        
        <!-- Left Sidebar: Accordion Chapters -->
        <div class="lectures-sidebar-col">

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
              ${currentSlide && currentSlide.mediaType === 'video' ? 
                `<video src="${currentSlide.mediaUrl}" controls autoplay style="width:100%; max-height:450px; border-radius:12px; object-fit:cover;"></video>` :
                `<img src="${currentSlide && currentSlide.mediaUrl ? currentSlide.mediaUrl : 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1000'}" alt="${currentSlide ? currentSlide.title : 'Slajd'}" class="slide-img" style="width:100%; max-height:450px; border-radius:12px; object-fit:cover;" />`
              }
              
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
