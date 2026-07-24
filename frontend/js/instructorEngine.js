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

  getCurrentModule() {
    return this.modules.find(m => m.id === this.currentModuleId) || this.modules[0];
  }

  selectModule(moduleId) {
    this.currentModuleId = moduleId;
    // Mark as watched
    localStorage.setItem(`instructor_watched_${moduleId}`, "true");
    if (window.app) window.app.updateCategoryDisplay();
    
    this.updateUI();
  }

  updateUI() {
    if (!this.container) return;

    const currentModule = this.getCurrentModule();
    if (!currentModule) return;

    // Update Sidebar Active States
    const chapters = this.container.querySelectorAll('.chapter-accordion-card');
    chapters.forEach((card, idx) => {
      const mod = this.modules[idx];
      const isActive = mod.id === this.currentModuleId;
      
      const titleSpan = card.querySelector('.chapter-accordion-title');
      const arrowSpan = card.querySelector('.accordion-arrow');

      if (isActive) {
        card.classList.add('open');
        titleSpan.style.color = '#6C5CE7';
        titleSpan.style.fontWeight = 'bold';
        arrowSpan.textContent = '●';
      } else {
        card.classList.remove('open');
        titleSpan.style.color = '';
        titleSpan.style.fontWeight = '';
        arrowSpan.textContent = '○';
      }
    });

    // Update Stage Details
    const breadcrumb = this.container.querySelector('.breadcrumb-current');
    if (breadcrumb) breadcrumb.textContent = currentModule.title;

    const heading = this.container.querySelector('.slide-main-heading');
    if (heading) heading.textContent = currentModule.title;

    // Update Video safely
    const videoEl = this.container.querySelector('video');
    if (videoEl) {
      if (videoEl.src !== currentModule.videoUrl) {
        videoEl.src = currentModule.videoUrl;
        videoEl.load();
        videoEl.play().catch(e => console.log('Auto-play prevented:', e));
      }
    }
  }

  render() {
    if (!this.container) return;

    const currentModule = this.getCurrentModule();

    // Render Sidebar Chapters List
    const chaptersHtml = this.modules.map((mod, idx) => {
      const isActive = mod.id === this.currentModuleId;

      return `
        <div class="chapter-accordion-card ${isActive ? 'open' : ''}">
          <div class="chapter-accordion-header" onclick="window.instructorEngine.selectModule(${mod.id})">
            <span class="chapter-accordion-title" style="${isActive ? 'color: #6C5CE7; font-weight: bold;' : ''}">${mod.title}</span>
            <div class="chapter-meta-right">
              <span class="accordion-arrow">${isActive ? '●' : '○'}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="lectures-layout-grid">
        
        <!-- Left Sidebar: Modules -->
        <div class="lectures-sidebar-col">
          <div class="wyklady-sidebar-header">
            <h3 class="sidebar-block-title">SZKOLENIE Z INSTRUKTOREM</h3>
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
              <video src="${currentModule.videoUrl}" controls autoplay controlslist="nodownload" style="width: 100%; max-height: 600px; object-fit: contain; outline: none;">
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
  }
}

window.InstructorEngine = InstructorEngine;
