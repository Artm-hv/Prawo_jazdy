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
      return `
        <div class="category-grid-item ${isActive ? 'active' : ''}" data-category="${cat}" onclick="window.signCatalog.setCategory('${escapedCat}')">
          <span class="category-name">${cat}</span>
          <div class="arrow-btn ${isActive ? 'active' : ''}">→</div>
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
            <div class="col-objasnienie">OBJAŚNIENIE</div>
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
