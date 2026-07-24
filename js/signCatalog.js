/* ==========================================================================
   Comprehensive Traffic Signs Catalog & Detailed Table Module
   ========================================================================== */

class TrafficSignCatalog {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.allSigns = [];
    this.activeCategory = "Znaki nakazu";
    
    // Expose globally so onclick handlers in rendered HTML can access it
    window.signCatalog = this;
    
    window.addEventListener('flashcards_updated', () => {
      if (window.app && window.app.activeTab === 'znaki') {
        this.render();
      }
    });
  }

  async loadSigns() {
    await this.fetchCategorySigns(this.activeCategory);
  }

  async fetchCategorySigns(category) {
    this.activeCategory = category;
    
    // Show loading state immediately
    if (this.container) {
      const existingBody = this.container.querySelector('.sign-table-body');
      if (existingBody) {
        existingBody.innerHTML = '<div style="padding: 40px; text-align: center; color: #64748b;">Ładowanie znaków...</div>';
      }
      // Update pill active states immediately
      const pills = this.container.querySelectorAll('.category-grid-item');
      pills.forEach(pill => {
        const name = pill.querySelector('.category-name');
        if (name && name.textContent.trim() === category.trim()) {
          pill.classList.add('active');
        } else {
          pill.classList.remove('active');
        }
      });
    }
    
    // 1. Fetch from API (which resolves 100% locally from window.TRAFFIC_SIGNS_DATA)
    let data = await API.fetchTrafficSigns(category);
    
    if (data && data.length > 0) {
      this.allSigns = data;
    } else {
      // 2. Direct fallback from window.TRAFFIC_SIGNS_DATA
      const allData = window.TRAFFIC_SIGNS_DATA || [];
      const catClean = category.toLowerCase().trim();
      this.allSigns = allData.filter(s => 
        s.category && s.category.toLowerCase().trim().includes(catClean)
      );
    }
    
    this.render();
  }

  async setCategory(category) {
    await this.fetchCategorySigns(category);
  }

  getCategoryStats(category) {
    const allData = window.TRAFFIC_SIGNS_DATA || [];
    const catClean = category.toLowerCase().trim();
    const catSigns = allData.filter(s => s.category && s.category.toLowerCase().trim().includes(catClean));
    
    const fcStatsStr = localStorage.getItem('flashcard_stats') || '{"known":[],"unknown":[]}';
    const fcStats = JSON.parse(fcStatsStr);
    
    let known = 0;
    let unknown = 0;
    
    catSigns.forEach(s => {
      const signId = s.code || s.name;
      if (fcStats.known.includes(signId)) known++;
      if (fcStats.unknown.includes(signId)) unknown++;
    });
    
    const total = catSigns.length || 1; // avoid division by zero
    const pct = Math.round((known / total) * 100);
    
    return { known, unknown, total: catSigns.length, pct };
  }

  launchCategoryFiltered(type) {
    if (!window.flashcards || !window.TRAFFIC_SIGNS_DATA) return;
    const allData = window.TRAFFIC_SIGNS_DATA;
    const catClean = this.activeCategory.toLowerCase().trim();
    const catSigns = allData.filter(s => s.category && s.category.toLowerCase().trim().includes(catClean));
    
    window.flashcards.startSession(type, catSigns);
  }

  render() {
    if (!this.container) return;

    // 12 exact categories matching Prawo Jazdy 360
    const categoryList = [
      "Znaki nakazu",
      "Znaki zakazu",
      "Znaki poziome",
      "Znaki dodatkowe",
      "Kontrolki pojazdu",
      "Znaki informacyjne",
      "Znaki ostrzegawcze",
      "Znaki uzupełniające",
      "Sygnalizacja świetlna",
      "Osoba kierująca ruchem",
      "Tabliczki do znaków drogowych",
      "Znaki kierunku i miejscowości"
    ];

    // Category count descriptions
    const categoryCounts = {
      "Znaki nakazu": 21,
      "Znaki zakazu": 52,
      "Znaki poziome": 29,
      "Znaki dodatkowe": 9,
      "Kontrolki pojazdu": 36,
      "Znaki informacyjne": 75,
      "Znaki ostrzegawcze": 42,
      "Znaki uzupełniające": 27,
      "Sygnalizacja świetlna": 15,
      "Osoba kierująca ruchem": 12,
      "Tabliczki do znaków drogowych": 51,
      "Znaki kierunku i miejscowości": 44
    };

    // Category Selector Top Grid
    const selectorPillsHtml = categoryList.map(cat => {
      const isActive = this.activeCategory.toLowerCase().trim() === cat.toLowerCase().trim();
      const escapedCat = cat.replace(/'/g, "\\'");
      const catStats = this.getCategoryStats(cat);
      
      return `
        <div class="category-grid-item ${isActive ? 'active' : ''}" data-category="${cat}" onclick="window.signCatalog.setCategory('${escapedCat}')" style="flex-direction: column; align-items: flex-start; padding: 12px 16px;">
          <div style="display: flex; justify-content: space-between; width: 100%; align-items: center; margin-bottom: 8px;">
            <span class="category-name">${cat}</span>
            <div class="arrow-btn ${isActive ? 'active' : ''}">→</div>
          </div>
          <div style="width: 100%;">
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: ${isActive ? '#e0e7ff' : '#64748b'}; margin-bottom: 4px;">
              <span>Wyuczone: ${catStats.known}/${catStats.total}</span>
              <span>${catStats.pct}%</span>
            </div>
            <div style="width: 100%; height: 4px; background: ${isActive ? 'rgba(255,255,255,0.2)' : '#e2e8f0'}; border-radius: 2px; overflow: hidden;">
              <div style="width: ${catStats.pct}%; height: 100%; background: ${isActive ? '#fff' : '#6C5CE7'}; border-radius: 2px;"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Render Table Rows (SYMBOL | WYGLĄD | ZNACZENIE | OBJAŚNIENIE)
    const tableRowsHtml = this.allSigns.map((sign) => {
      let imageContent = "";
      if (sign.image_url) {
        imageContent = `<img src="${sign.image_url}" alt="${sign.code || ''} ${sign.name || ''}" class="sign-table-img" loading="lazy" onerror="this.style.display='none';" />`;
      } else if (sign.svg_icon) {
        imageContent = `<div class="sign-table-svg">${sign.svg_icon}</div>`;
      } else {
        imageContent = `<div class="sign-placeholder-icon">🚏</div>`;
      }

      return `
        <div class="sign-table-row">
          <div class="col-symbol">
            <span class="symbol-badge">${sign.code || '—'}</span>
          </div>
          <div class="col-wyglad">
            ${imageContent}
          </div>
          <div class="col-znaczenie">
            <h4 class="sign-meaning-title">${sign.name || ''}</h4>
          </div>
          <div class="col-objasnienie">
            <p class="sign-explanation-text">${sign.description || sign.name || ''}</p>
          </div>
        </div>
      `;
    }).join('');

    const displayCount = this.allSigns.length || categoryCounts[this.activeCategory] || 0;

    this.container.innerHTML = `
      <div class="signs-page-wrapper">
        
        <!-- Top 12 Category Selector Grid -->
        <div class="category-pills-grid">
          ${selectorPillsHtml}
        </div>

        <!-- Flashcards Control Box -->
        <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; align-items: center;">
          
          <div style="background: #fff; padding: 16px 24px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); width: 100%; max-width: 600px; display: flex; flex-direction: column; gap: 12px; border: 1px solid #eee;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 600; color: #333;">Postęp w "${this.activeCategory}"</span>
              <span style="font-size: 14px; font-weight: 700; color: #6C5CE7;">${(() => { const st = this.getCategoryStats(this.activeCategory); return st.known + '/' + st.total + ' (' + st.pct + '%)'; })()}</span>
            </div>
            <div style="width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
              <div style="width: ${this.getCategoryStats(this.activeCategory).pct}%; height: 100%; background: linear-gradient(90deg, #6C5CE7, #a29bfe); border-radius: 4px;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #64748b;">
              <span onclick="window.signCatalog.launchCategoryFiltered('known')" style="color: #2e7d32; cursor: pointer; padding: 4px; border-radius: 4px; transition: background 0.2s;" onmouseover="this.style.background='#e8f5e9'" onmouseout="this.style.background='transparent'">Wyuczone: ${this.getCategoryStats(this.activeCategory).known}</span>
              <span onclick="window.signCatalog.launchCategoryFiltered('unknown')" style="color: #c62828; cursor: pointer; padding: 4px; border-radius: 4px; transition: background 0.2s;" onmouseover="this.style.background='#ffebee'" onmouseout="this.style.background='transparent'">Do powtórki: ${this.getCategoryStats(this.activeCategory).unknown}</span>
              <span onclick="window.signCatalog.launchCategoryFiltered('unseen')" style="cursor: pointer; padding: 4px; border-radius: 4px; transition: background 0.2s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'">Nie widziane: ${this.getCategoryStats(this.activeCategory).total - this.getCategoryStats(this.activeCategory).known - this.getCategoryStats(this.activeCategory).unknown}</span>
            </div>
          </div>

          <div style="display: flex; gap: 16px; justify-content: center;">
            <button class="flashcards-launch-btn" onclick="window.flashcards.startSession('${this.activeCategory}', window.TRAFFIC_SIGNS_DATA || [])">
              🎴 Trenuj z Fiszkami (${this.activeCategory})
            </button>
            <button class="flashcards-launch-btn" onclick="window.flashcards.startSession('all', window.TRAFFIC_SIGNS_DATA || [])" style="background: #fff; color: #6C5CE7; border: 2px solid #6C5CE7;">
              🎴 Trenuj Wszystkie Znaki
            </button>
          </div>
        </div>

        <!-- Category Title & Description Banner -->
        <div class="category-banner-box">
          <h2 class="banner-title">${this.activeCategory}</h2>
          <p class="banner-description">
            Sprawdź wszystkie ${this.activeCategory.toLowerCase()} (${displayCount}) - zasady i przepisy obowiązujące w polskim prawie o ruchu drogowym 2026.
          </p>
        </div>

        <!-- Signs Table Container (SYMBOL | WYGLĄD | ZNACZENIE | OBJAŚNIENIE) -->
        <div class="signs-table-container">
          <div class="sign-table-header">
            <div class="col-symbol">SYMBOL</div>
            <div class="col-wyglad">WYGLĄD</div>
            <div class="col-znaczenie">ZNACZENIE</div>
            <div>OBJAŚNIENIE</div>
          </div>
          
          <div class="sign-table-body">
            ${this.allSigns.length > 0 ? tableRowsHtml : `
              <div style="padding: 40px; text-align: center; color: #64748b;">
                Brak znaków w tej kategorii.
              </div>
            `}
          </div>
        </div>

      </div>
    `;
  }
}

window.TrafficSignCatalog = TrafficSignCatalog;
