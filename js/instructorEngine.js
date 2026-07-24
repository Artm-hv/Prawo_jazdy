/* ==========================================================================
   Prawo Jazdy 360 LMS - Szkolenie z Instruktorem Engine
   ========================================================================== */

class InstructorEngine {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.modules = window.INSTRUCTOR_DATA || [];
    this.currentModuleId = 1;
  }

  loadInstructor() {
    this.render();
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  getCurrentModule() {
    return this.modules.find(m => m.id === this.currentModuleId) || this.modules[0];
  }

  selectModule(moduleId) {
    this.currentModuleId = moduleId;
    this.render();
  }

  render() {
    if (!this.container) return;

    const currentModule = this.getCurrentModule();

    // Render Sidebar Chapters List
    const chaptersHtml = this.modules.map((mod, idx) => {
      const isWatched = localStorage.getItem(`instructor_watched_${mod.id}`) === "true";
      const savedTime = parseFloat(localStorage.getItem(`instructor_time_${mod.id}`)) || 0;
      const savedDuration = parseFloat(localStorage.getItem(`instructor_duration_${mod.id}`)) || (15 * 60 + 38);
      let modProgressPct = (savedTime / savedDuration) * 100;
      if (modProgressPct > 100) modProgressPct = 100;
      if (isWatched) modProgressPct = 100;

      return `
        <div class="modern-instructor-card" onclick="window.instructorEngine.selectModule(${mod.id})">
          <div class="modern-instructor-header">
            <span class="modern-instructor-title">${mod.title}</span>
            <span class="modern-instructor-time" id="instructor-time-text-${mod.id}">${this.formatTime(savedTime)}/${this.formatTime(savedDuration)}</span>
          </div>
          <div class="modern-instructor-progress-bg">
            <div class="modern-instructor-progress-fill" id="instructor-progress-fill-${mod.id}" style="width: ${modProgressPct}%;"></div>
          </div>
          <hr style="border: none; border-top: 1px solid rgba(108, 92, 231, 0.2); margin-top: -4px; margin-bottom: 16px;">
          <div class="modern-instructor-list">
            <div class="modern-instructor-list-item">
              <div id="instructor-check-${mod.id}" class="modern-instructor-check ${isWatched ? 'completed' : ''}">
                ${isWatched ? '<svg viewBox="0 0 24 24" width="12" height="12" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
              </div>
              <span>${mod.title}</span>
            </div>
            <div class="modern-instructor-list-item">
              <div class="modern-instructor-check"></div>
              <span>Pytania kontrolne</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const currentCategory = window.app ? window.app.currentCategory : "B";
    let watchedModulesCount = 0;
    this.modules.forEach(mod => {
      if (localStorage.getItem(`instructor_watched_${mod.id}`) === "true") {
        watchedModulesCount++;
      }
    });
    const totalModules = this.modules.length;
    const progressPct = totalModules > 0 ? (watchedModulesCount / totalModules) * 100 : 0;

    this.container.innerHTML = `
      <div class="lectures-layout-grid">
        
        <!-- Left Sidebar: Modules -->
        <div class="lectures-sidebar-col">
          <div class="modern-category-card">
            <div class="modern-category-header">
              <span class="modern-category-title">KATEGORIA</span>
              <span class="modern-category-badge">${currentCategory} ∨</span>
            </div>
            <div class="modern-progress-info">
              POSTĘP: ${progressPct.toFixed(2).replace('.00', '')}%
            </div>
            <div class="modern-progress-bar-bg">
              <div class="modern-progress-bar-fill" style="width: ${progressPct}%;"></div>
            </div>
          </div>

          <div class="chapters-accordion-list">
            ${chaptersHtml}
          </div>
        </div>

        <!-- Right Stage: Video Player -->
        <div class="lectures-stage-col">
          
          <div class="lecture-breadcrumb">
            <span>Szkolenie z instruktorem</span>
            <span class="breadcrumb-sep">&gt;</span>
            <span class="breadcrumb-current">${currentModule ? currentModule.title : 'Wprowadzenie'}</span>
          </div>

          <h2 class="slide-main-heading">${currentModule ? currentModule.title : 'Wprowadzenie'}</h2>

          <div class="slide-player-box" style="padding: 0; overflow: hidden; background: #000; display: flex; justify-content: center; border-radius: 12px;">
            ${currentModule ? `
              <video src="${currentModule.videoUrl}" controls controlslist="nodownload" style="width: 100%; max-height: 600px; object-fit: contain; outline: none;">
                Twoja przeglądarka nie obsługuje tagu wideo.
              </video>
            ` : ''}
          </div>
          
          <div class="slide-explanation-card" style="margin-top: 20px;">
            <p><strong>Porada:</strong> Możesz odtwarzać to wideo na pełnym ekranie klikając ikonę w prawym dolnym rogu odtwarzacza.</p>
          </div>

        </div>

      </div>
    `;

    const videoEl = this.container.querySelector('video');
    if (videoEl) {
      const savedTime = parseFloat(localStorage.getItem(`instructor_time_${this.currentModuleId}`));
      if (savedTime && !isNaN(savedTime)) {
        videoEl.currentTime = savedTime;
      }
      
      videoEl.addEventListener('loadedmetadata', () => {
         const st = parseFloat(localStorage.getItem(`instructor_time_${this.currentModuleId}`));
         if (st && !isNaN(st)) {
           videoEl.currentTime = st;
         }
         localStorage.setItem(`instructor_duration_${this.currentModuleId}`, videoEl.duration);
         const timeEl = this.container.querySelector(`#instructor-time-text-${this.currentModuleId}`);
         if (timeEl) {
           timeEl.textContent = `${this.formatTime(videoEl.currentTime)}/${this.formatTime(videoEl.duration)}`;
         }
      });

      videoEl.addEventListener('timeupdate', () => {
        const currentTime = videoEl.currentTime;
        const duration = videoEl.duration;
        if (!duration) return;
        
        localStorage.setItem(`instructor_time_${this.currentModuleId}`, currentTime);
        localStorage.setItem(`instructor_duration_${this.currentModuleId}`, duration);
        
        let pct = (currentTime / duration) * 100;
        const fillEl = this.container.querySelector(`#instructor-progress-fill-${this.currentModuleId}`);
        if (fillEl) fillEl.style.width = `${pct}%`;
        
        const timeEl = this.container.querySelector(`#instructor-time-text-${this.currentModuleId}`);
        if (timeEl) {
          timeEl.textContent = `${this.formatTime(currentTime)}/${this.formatTime(duration)}`;
        }
        
        if (pct >= 95) {
           localStorage.setItem(`instructor_watched_${this.currentModuleId}`, "true");
           const checkEl = this.container.querySelector(`#instructor-check-${this.currentModuleId}`);
           if (checkEl && !checkEl.classList.contains('completed')) {
             checkEl.classList.add('completed');
             checkEl.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
             if (window.app) window.app.updateCategoryDisplay();
           }
        }
      });
    }
  }
}

window.InstructorEngine = InstructorEngine;
