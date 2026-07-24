class FlashcardsEngine {
  constructor() {
    this.modalOverlay = null;
    this.deck = [];
    this.currentIndex = 0;
    this.isFlipped = false;
    this.stats = { total: 0, known: 0, unknown: 0 };
    
    this.initModal();
  }

  initModal() {
    if (document.getElementById('flashcards-overlay')) return;
    
    this.modalOverlay = document.createElement('div');
    this.modalOverlay.id = 'flashcards-overlay';
    this.modalOverlay.className = 'flashcards-modal-overlay';
    
    this.modalOverlay.innerHTML = `
      <div class="flashcards-modal">
        <div class="flashcards-header">
          <h2>🎴 Trening Fiszkami</h2>
          <button class="flashcards-close-btn">&times;</button>
        </div>
        <div class="flashcards-body">
          <div class="flashcards-stats-bar">
            <span>Karta <span id="fc-current-num">0</span> z <span id="fc-total-num">0</span></span>
            <span>Postęp: <span id="fc-progress-pct">0%</span></span>
          </div>
          
          <div class="flashcard-scene" id="fc-scene">
            <div class="flashcard-inner" id="fc-inner">
              <div class="flashcard-face front">
                <img id="fc-img" src="" alt="Znak" />
              </div>
              <div class="flashcard-face back">
                <h3 class="flashcard-back-title" id="fc-title">Tytuł</h3>
                <div class="flashcard-back-desc" id="fc-desc">Opis</div>
              </div>
            </div>
          </div>

          <div class="flashcards-controls" id="fc-controls">
            <button class="flashcard-btn btn-dontknow" id="fc-btn-no">
              <span>✕</span> Nie wiedziałem
            </button>
            <button class="flashcard-btn btn-know" id="fc-btn-yes">
              <span>✓</span> Wiedziałem
            </button>
          </div>
          
          <div class="flashcards-results" id="fc-results" style="display: none;">
            <h3>Koniec sesji!</h3>
            <p>Wyuczone w tej sesji: <span id="fc-res-known">0</span></p>
            <p>Do powtórki: <span id="fc-res-unknown">0</span></p>
            <button class="flashcards-launch-btn" onclick="window.flashcards.closeModal()" style="margin-top: 16px;">Zakończ</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.modalOverlay);
    
    // Close when clicking on the dark background
    this.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) {
        this.closeModal();
      }
    });

    this.modalOverlay.querySelector('.flashcards-close-btn').addEventListener('click', () => this.closeModal());
    this.modalOverlay.querySelector('#fc-scene').addEventListener('click', () => this.flipCard());
    this.modalOverlay.querySelector('#fc-btn-yes').addEventListener('click', () => this.answer(true));
    this.modalOverlay.querySelector('#fc-btn-no').addEventListener('click', () => this.answer(false));
  }

  // categoryId can be a category string, 'all', 'known', 'unknown', or 'unseen'
  startSession(categoryId, allSignsData) {
    let signsToPlay = [];
    const fcStatsStr = localStorage.getItem('flashcard_stats') || '{"known":[],"unknown":[]}';
    const fcStats = JSON.parse(fcStatsStr);
    
    if (categoryId === 'all') {
      signsToPlay = [...allSignsData];
    } else if (categoryId === 'known') {
      signsToPlay = allSignsData.filter(s => fcStats.known.includes(s.code || s.name));
    } else if (categoryId === 'unknown') {
      signsToPlay = allSignsData.filter(s => fcStats.unknown.includes(s.code || s.name));
    } else if (categoryId === 'unseen') {
      signsToPlay = allSignsData.filter(s => !fcStats.known.includes(s.code || s.name) && !fcStats.unknown.includes(s.code || s.name));
    } else {
      const catClean = categoryId.toLowerCase().trim();
      signsToPlay = allSignsData.filter(s => 
        s.category && s.category.toLowerCase().trim().includes(catClean)
      );
    }

    if (signsToPlay.length === 0) {
      alert("Brak znaków w tej kategorii!");
      return;
    }

    // Shuffle
    this.deck = signsToPlay.sort(() => Math.random() - 0.5);
    this.currentIndex = 0;
    this.stats = { total: this.deck.length, known: 0, unknown: 0 };
    this.isFlipped = false;
    this.isAnimating = false;

    // Reset UI
    this.modalOverlay.querySelector('#fc-scene').style.display = 'block';
    this.modalOverlay.querySelector('#fc-results').style.display = 'none';
    this.modalOverlay.querySelector('.flashcards-stats-bar').style.display = 'flex';
    this.modalOverlay.querySelector('#fc-controls').classList.remove('visible');
    
    this.updateCardUI();
    this.modalOverlay.classList.add('active');
  }

  updateCardUI() {
    if (this.currentIndex >= this.deck.length) {
      this.showResults();
      return;
    }

    const currentSign = this.deck[this.currentIndex];
    
    // Set text and image
    const fcFront = this.modalOverlay.querySelector('.flashcard-face.front');
    if (currentSign.image_url) {
      fcFront.innerHTML = `<img id="fc-img" src="${currentSign.image_url}" alt="Znak" />`;
    } else if (currentSign.svg_icon) {
      fcFront.innerHTML = `<div style="transform: scale(2);">${currentSign.svg_icon}</div>`;
    } else {
      fcFront.innerHTML = `<div style="font-size: 48px;">🚏</div>`;
    }

    this.modalOverlay.querySelector('#fc-title').innerText = (currentSign.code ? currentSign.code + ' - ' : '') + currentSign.name;
    this.modalOverlay.querySelector('#fc-desc').innerHTML = currentSign.description || '';
    
    // Set stats
    this.modalOverlay.querySelector('#fc-current-num').innerText = this.currentIndex + 1;
    this.modalOverlay.querySelector('#fc-total-num').innerText = this.stats.total;
    const progress = Math.round((this.currentIndex / this.stats.total) * 100);
    this.modalOverlay.querySelector('#fc-progress-pct').innerText = progress + '%';
    
    // Reset flip
    this.isFlipped = false;
    this.modalOverlay.querySelector('#fc-scene').classList.remove('is-flipped');
    this.modalOverlay.querySelector('#fc-controls').classList.remove('visible');
  }

  flipCard() {
    if (this.isFlipped) return; // already flipped
    this.isFlipped = true;
    this.modalOverlay.querySelector('#fc-scene').classList.add('is-flipped');
    this.modalOverlay.querySelector('#fc-controls').classList.add('visible');
  }

  answer(isKnown) {
    if (this.currentIndex >= this.deck.length) return;
    if (this.isAnimating) return;
    this.isAnimating = true;

    const currentSign = this.deck[this.currentIndex];
    const signId = currentSign.code || currentSign.name;
    
    // Save to global stats (localStorage)
    const storedStatsStr = localStorage.getItem('flashcard_stats') || '{"known":[],"unknown":[]}';
    let storedStats = JSON.parse(storedStatsStr);
    
    // Remove from both to avoid duplicates
    storedStats.known = storedStats.known.filter(id => id !== signId);
    storedStats.unknown = storedStats.unknown.filter(id => id !== signId);
    
    if (isKnown) {
      this.stats.known++;
      storedStats.known.push(signId);
    } else {
      this.stats.unknown++;
      storedStats.unknown.push(signId);
    }
    
    localStorage.setItem('flashcard_stats', JSON.stringify(storedStats));
    
    // Dispatch event to instantly update stats in the background
    window.dispatchEvent(new Event('flashcards_updated'));
    
    this.currentIndex++;
    
    // Animate out and next
    this.modalOverlay.querySelector('#fc-scene').style.transform = 'scale(0.95)';
    this.modalOverlay.querySelector('#fc-scene').style.opacity = '0';
    
    setTimeout(() => {
      this.updateCardUI();
      this.modalOverlay.querySelector('#fc-scene').style.transform = 'scale(1)';
      this.modalOverlay.querySelector('#fc-scene').style.opacity = '1';
      this.isAnimating = false;
    }, 200);
  }

  showResults() {
    this.modalOverlay.querySelector('#fc-scene').style.display = 'none';
    this.modalOverlay.querySelector('.flashcards-stats-bar').style.display = 'none';
    this.modalOverlay.querySelector('#fc-controls').classList.remove('visible');
    
    this.modalOverlay.querySelector('#fc-results').style.display = 'block';
    this.modalOverlay.querySelector('#fc-res-known').innerText = this.stats.known;
    this.modalOverlay.querySelector('#fc-res-unknown').innerText = this.stats.unknown;
    
    // Dispatch event to update stats page if it's open
    window.dispatchEvent(new Event('flashcards_updated'));
  }

  closeModal() {
    this.modalOverlay.classList.remove('active');
    window.dispatchEvent(new Event('flashcards_updated'));
  }
}

window.flashcards = new FlashcardsEngine();
