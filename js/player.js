/* ==========================================================================
   Instructor Video Player & Dynamic Sign Visualizer Module
   ========================================================================== */

class InstructorPlayer {
  constructor() {
    this.videoEl = document.getElementById("main-video");
    this.playBtn = document.getElementById("center-play-btn");
    this.controlPlayBtn = document.getElementById("ctrl-play-btn");
    this.timelineScrubber = document.getElementById("timeline-scrubber");
    this.timelineProgress = document.getElementById("timeline-progress");
    this.timeDisplay = document.getElementById("time-display");
    
    // Dynamic overlay sign elements
    this.signCard = document.getElementById("sign-display-card");
    this.signCodeBadge = document.getElementById("sign-code-badge");
    this.signSvgWrapper = document.getElementById("sign-svg-wrapper");
    this.signTitleLabel = document.getElementById("sign-title-label");
    this.overlaySubtitle = document.getElementById("overlay-subtitle");

    this.currentLesson = null;
    this.isPlaying = false;
    this.updateInterval = null;

    this.initEvents();
  }

  initEvents() {
    if (!this.videoEl) return;

    this.playBtn.addEventListener("click", () => this.togglePlay());
    this.controlPlayBtn.addEventListener("click", () => this.togglePlay());

    this.videoEl.addEventListener("timeupdate", () => this.onTimeUpdate());
    this.videoEl.addEventListener("ended", () => this.onEnded());

    this.timelineScrubber.addEventListener("click", (e) => {
      const rect = this.timelineScrubber.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      if (this.videoEl.duration) {
        this.videoEl.currentTime = pos * this.videoEl.duration;
      }
    });
  }

  loadLesson(lesson, featuredSign = null) {
    this.currentLesson = lesson;
    if (this.videoEl) {
      this.videoEl.src = lesson.video_url || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
      if (lesson.watched_seconds > 0) {
        this.videoEl.currentTime = lesson.watched_seconds;
      }
    }

    // Set subtitle/notes overlay
    if (this.overlaySubtitle) {
      this.overlaySubtitle.textContent = lesson.instructor_notes || "Ostrzega o niebezpiecznym zakręcie w kierunku wskazanym na znaku.";
    }

    // Render traffic sign overlay card if present or specified
    const signCode = lesson.featured_sign_code || "A-1";
    this.renderSignOverlay(signCode, featuredSign);
  }

  renderSignOverlay(signCode, customSign = null) {
    if (!this.signCard) return;

    const signDataMap = {
      "A-1": {
        code: "A-1",
        name: "Niebezpieczny zakręt w prawo",
        svg: "<svg viewBox='0 0 100 90' xmlns='http://www.w3.org/2000/svg'><polygon points='50,5 95,85 5,85' fill='#ffcc00' stroke='#cc0000' stroke-width='8' stroke-linejoin='round'/><path d='M42 65 C42 45 60 45 60 30' fill='none' stroke='#000000' stroke-width='7' stroke-linecap='round'/><polygon points='60,24 67,34 53,34' fill='#000000'/></svg>"
      },
      "B-20": {
        code: "B-20",
        name: "Stop",
        svg: "<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><polygon points='30,5 70,5 95,30 95,70 70,95 30,95 5,70 5,30' fill='#cc0000' stroke='#ffffff' stroke-width='3'/><text x='50' y='60' font-size='24' font-weight='bold' fill='#ffffff' text-anchor='middle' font-family='sans-serif'>STOP</text></svg>"
      },
      "C-12": {
        code: "C-12",
        name: "Ruch okrężny",
        svg: "<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><circle cx='50' cy='50' r='44' fill='#0066cc' stroke='#ffffff' stroke-width='3'/><path d='M30 50 A20 20 0 0 1 65 35' fill='none' stroke='#ffffff' stroke-width='5'/></svg>"
      },
      "A-7": {
        code: "A-7",
        name: "Ustąp pierwszeństwa",
        svg: "<svg viewBox='0 0 100 90' xmlns='http://www.w3.org/2000/svg'><polygon points='5,5 95,5 50,85' fill='#ffffff' stroke='#cc0000' stroke-width='8' stroke-linejoin='round'/></svg>"
      }
    };

    const sign = customSign || signDataMap[signCode] || signDataMap["A-1"];
    
    this.signCodeBadge.textContent = sign.code;
    this.signSvgWrapper.innerHTML = sign.svg || sign.svg_icon;
    this.signTitleLabel.textContent = sign.name;
    this.signCard.style.display = "flex";
  }

  togglePlay() {
    if (!this.videoEl) return;
    if (this.videoEl.paused) {
      this.videoEl.play();
      this.isPlaying = true;
      this.playBtn.style.display = "none";
      this.controlPlayBtn.innerHTML = "❚❚";
    } else {
      this.videoEl.pause();
      this.isPlaying = false;
      this.playBtn.style.display = "flex";
      this.controlPlayBtn.innerHTML = "▶";
    }
  }

  onTimeUpdate() {
    if (!this.videoEl) return;
    const cur = this.videoEl.currentTime;
    const dur = this.videoEl.duration || 1;
    const pct = (cur / dur) * 100;
    this.timelineProgress.style.width = `${pct}%`;

    const curFormatted = this.formatTime(cur);
    const durFormatted = this.formatTime(dur);
    this.timeDisplay.textContent = `${curFormatted} / ${durFormatted}`;

    // Periodically sync progress to API every 10 seconds
    if (Math.floor(cur) % 10 === 0 && Math.floor(cur) > 0 && this.currentLesson) {
      API.updateProgress(this.currentLesson.id, Math.floor(cur), false);
    }
  }

  onEnded() {
    this.isPlaying = false;
    this.playBtn.style.display = "flex";
    this.controlPlayBtn.innerHTML = "▶";
    if (this.currentLesson) {
      API.updateProgress(this.currentLesson.id, Math.floor(this.videoEl.duration), true);
      if (window.onLessonCompleted) {
        window.onLessonCompleted(this.currentLesson.id);
      }
    }
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

window.InstructorPlayer = InstructorPlayer;
