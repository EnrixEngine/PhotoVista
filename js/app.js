/* ============================================================
   APP.JS — Core application: DB, state, routing, utilities
   ============================================================ */

/* ---- IndexedDB wrapper ---- */
const DB = {
  db: null,
  DB_NAME: 'photovista_db',
  DB_VERSION: 1,

  async init() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('photos')) {
          db.createObjectStore('photos', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('tours')) {
          db.createObjectStore('tours', { keyPath: 'id' });
        }
      };
      req.onsuccess = (e) => { this.db = e.target.result; resolve(); };
      req.onerror = () => reject(req.error);
    });
  },

  async getAll(store) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readonly');
      const req = tx.objectStore(store).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async get(store, id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readonly');
      const req = tx.objectStore(store).get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async put(store, item) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readwrite');
      const req = tx.objectStore(store).put(item);
      req.onsuccess = resolve;
      req.onerror = () => reject(req.error);
    });
  },

  async delete(store, id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readwrite');
      const req = tx.objectStore(store).delete(id);
      req.onsuccess = resolve;
      req.onerror = () => reject(req.error);
    });
  }
};

/* ---- SVG Icons ---- */
const Icons = {
  image: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>`,
  panoramic: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5c2-1.5 4-2 6-1.5C11 4 12 4 13 3.5c2-1 4-.5 5 1.5"/><rect x="2" y="7" width="20" height="12" rx="1"/><circle cx="9" cy="11" r="2"/><polyline points="20,16 15,11 7,18"/></svg>`,
  sphere: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="4" ry="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a14 14 0 0 1 0 20"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  arrowLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15,18 9,12 15,6"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  upload: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16,16 12,12 8,16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>`,
  grid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20,6 9,17 4,12"/></svg>`,
  photos: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  video: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23,7 16,12 23,17"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,
};

/* ---- Helper: type badge HTML ---- */
function typeBadge(type) {
  const labels = { classic: 'Classique', panoramic: 'Panoramique', '360': '360°', video: 'Vidéo' };
  const icons = { classic: Icons.image, panoramic: Icons.panoramic, '360': Icons.sphere, video: Icons.video };
  const cls = type === '360' ? '360' : type;
  return `<span class="badge badge-${cls}">${icons[type]||''} ${labels[type]||type}</span>`;
}

/* ---- Helper: generate UUID-like ID ---- */
function genId() {
  return Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

/* ---- Helper: format file size ---- */
function fmtSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/* ---- Helper: convert equirectangular to yaw/pitch ---- */
function equirectToYawPitch(relX, relY) {
  return {
    yaw: (relX - 0.5) * 360,
    pitch: -(relY - 0.5) * 180
  };
}

/* ---- App Controller ---- */
const App = {
  state: {
    photos: [],
    tours: [],
    currentView: null,
    currentParams: {},
  },

  async init() {
    try {
      await DB.init();
      this.state.photos = await DB.getAll('photos');
      this.state.tours = await DB.getAll('tours');
    } catch (e) {
      console.error('DB init failed', e);
      this.state.photos = [];
      this.state.tours = [];
    }
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('app').classList.remove('hidden');
    this.navigate('home');
  },

  navigate(view, params = {}) {
    // Clean up any active viewer
    if (typeof Viewer !== 'undefined') Viewer.destroy();
    if (typeof Builder !== 'undefined') Builder.destroy();
    if (typeof Stitcher !== 'undefined') Stitcher.destroy();

    this.state.currentView = view;
    this.state.currentParams = params;

    // Update nav active state
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const navMap = { gallery: 'nav-gallery', tours: 'nav-tours', stitcher: 'nav-stitcher' };
    if (navMap[view]) document.getElementById(navMap[view])?.classList.add('active');

    const main = document.getElementById('app-main');
    main.innerHTML = '';

    switch (view) {
      case 'home': this._renderHome(main); break;
      case 'gallery': this._renderGallery(main); break;
      case 'tours': this._renderTours(main); break;
      case 'builder': this._renderBuilder(main, params); break;
      case 'viewer': this._renderViewer(main, params); break;
      case 'stitcher': this._renderStitcher(main); break;
    }
  },

  _renderHome(main) {
    main.innerHTML = Gallery.renderHome();
  },

  _renderGallery(main) {
    Gallery.render(main);
  },

  _renderTours(main) {
    Tours.render(main);
  },

  _renderBuilder(main, params) {
    Builder.render(main, params);
  },

  _renderViewer(main, params) {
    Viewer.render(main, params);
  },

  _renderStitcher(main) {
    Stitcher.render(main);
  },

  // ---- Photos ----
  async savePhoto(photo) {
    await DB.put('photos', photo);
    const idx = this.state.photos.findIndex(p => p.id === photo.id);
    if (idx >= 0) this.state.photos[idx] = photo;
    else this.state.photos.push(photo);
  },

  async deletePhoto(id) {
    await DB.delete('photos', id);
    this.state.photos = this.state.photos.filter(p => p.id !== id);
    // Remove photo from all tours
    for (const tour of this.state.tours) {
      if (tour.photoIds.includes(id)) {
        tour.photoIds = tour.photoIds.filter(pid => pid !== id);
        if (tour.startPhotoId === id) tour.startPhotoId = tour.photoIds[0] || null;
        delete tour.hotspots[id];
        // Remove hotspots pointing to this photo
        for (const pid in tour.hotspots) {
          tour.hotspots[pid] = tour.hotspots[pid].filter(h => h.targetPhotoId !== id);
        }
        await DB.put('tours', tour);
      }
    }
  },

  getPhoto(id) { return this.state.photos.find(p => p.id === id) || null; },

  // ---- Tours ----
  async saveTour(tour) {
    await DB.put('tours', tour);
    const idx = this.state.tours.findIndex(t => t.id === tour.id);
    if (idx >= 0) this.state.tours[idx] = tour;
    else this.state.tours.push(tour);
  },

  async deleteTour(id) {
    await DB.delete('tours', id);
    this.state.tours = this.state.tours.filter(t => t.id !== id);
  },

  getTour(id) { return this.state.tours.find(t => t.id === id) || null; },

  // ---- Modal ----
  showModal(html, options = {}) {
    document.getElementById('modal-body').innerHTML = html;
    const backdrop = document.getElementById('modal-backdrop');
    backdrop.classList.remove('hidden');
    document.querySelector('.modal-box').style.maxWidth = options.wide ? '700px' : '500px';
  },

  closeModal() {
    if (this._confirmResolve) {
      const r = this._confirmResolve;
      this._confirmResolve = null;
      r(false);
    }
    const backdrop = document.getElementById('modal-backdrop');
    if (backdrop && !backdrop.classList.contains('hidden')) {
      backdrop.classList.add('hidden');
      document.getElementById('modal-body').innerHTML = '';
    }
  },

  // ---- Toast ----
  toast(msg, type = 'success') {
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = msg;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => el.remove(), 3100);
  },

  // ---- Confirmation modal (remplace window.confirm) ----
  _confirmResolve: null,

  showConfirm(msg, opts = {}) {
    return new Promise(resolve => {
      this._confirmResolve = resolve;
      const isDanger = opts.type === 'danger';
      const iconHtml = isDanger
        ? `<div class="confirm-icon confirm-icon-danger">${Icons.trash}</div>`
        : `<div class="confirm-icon confirm-icon-info">${Icons.info}</div>`;
      this.showModal(`
        <div class="confirm-layout">
          ${iconHtml}
          <div class="confirm-body">
            <div class="confirm-title">${escHtml(opts.title || 'Confirmation')}</div>
            <p class="confirm-desc">${escHtml(msg)}</p>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" onclick="App.resolveConfirm(false)">Annuler</button>
          <button class="btn ${isDanger ? 'btn-danger' : 'btn-primary'}" onclick="App.resolveConfirm(true)">
            ${escHtml(opts.confirmText || 'Confirmer')}
          </button>
        </div>
      `);
    });
  },

  resolveConfirm(result) {
    const resolve = this._confirmResolve;
    this._confirmResolve = null;
    // close without triggering resolveConfirm again
    document.getElementById('modal-backdrop').classList.add('hidden');
    document.getElementById('modal-body').innerHTML = '';
    if (resolve) resolve(result);
  },

  // Legacy sync confirm — kept for safety, redirects to browser default
  confirm(msg) { return window.confirm(msg); },
};

/* ============================================================
   PanoramicViewer — reusable drag-to-pan image viewer
   Used by both Builder and Viewer for panoramic and 360-flat views
   ============================================================ */
class PanoramicViewer {
  constructor(container, src, opts = {}) {
    this.container = container;
    this.src = src;
    this.opts = opts; // { mode: 'view'|'build', onImageClick, pins, onPinClick }
    this.panX = 0;
    this.isDragging = false;
    this._startX = 0;
    this._startPanX = 0;
    this._clickCheck = false;
    this.renderedWidth = 0;
    this.renderedHeight = 0;
    this._imgLoaded = false;
    this._destroyed = false;
    this._boundMouseMove = this._onMouseMove.bind(this);
    this._boundMouseUp = this._onMouseUp.bind(this);
    this._setup();
  }

  _setup() {
    this.container.innerHTML = '';
    this.container.className = 'panoramic-viewer';
    if (this.opts.addingPin) this.container.classList.add('adding-pin');

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'panoramic-wrapper';

    this.img = document.createElement('img');
    this.img.src = this.src;
    this.img.alt = '';
    this.img.draggable = false;

    this.img.onload = () => {
      if (this._destroyed) return;
      this._imgLoaded = true;
      this._onImgLoad();
    };
    if (this.img.complete && this.img.naturalWidth) {
      this._imgLoaded = true;
      setTimeout(() => this._onImgLoad(), 0);
    }

    this.wrapper.appendChild(this.img);
    this.container.appendChild(this.wrapper);
    this._setupEvents();
  }

  _onImgLoad() {
    this.renderedHeight = this.container.clientHeight;
    const scale = this.renderedHeight / this.img.naturalHeight;
    this.renderedWidth = this.img.naturalWidth * scale;
    this.wrapper.style.width = this.renderedWidth + 'px';
    this.wrapper.style.height = this.renderedHeight + 'px';
    // Center image
    const cw = this.container.clientWidth;
    const minPanX = Math.min(0, cw - this.renderedWidth);
    this.panX = Math.max(minPanX, Math.min(0, (cw - this.renderedWidth) / 2));
    this._applyPan();
    // Render pins
    if (this.opts.pins) {
      this.opts.pins.forEach(pin => this.addPin(pin));
    }
  }

  _applyPan() {
    this.wrapper.style.transform = `translateX(${this.panX}px)`;
  }

  _setupEvents() {
    this.container.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      this._clickCheck = true;
      this.isDragging = false;
      this._startX = e.clientX;
      this._startPanX = this.panX;
      this.container.classList.add('grabbing');
      e.preventDefault();
    });
    window.addEventListener('mousemove', this._boundMouseMove);
    window.addEventListener('mouseup', this._boundMouseUp);

    // Touch
    this.container.addEventListener('touchstart', (e) => {
      this._clickCheck = true;
      this.isDragging = false;
      this._startX = e.touches[0].clientX;
      this._startPanX = this.panX;
    }, { passive: true });

    this.container.addEventListener('touchmove', (e) => {
      if (!this._clickCheck) return;
      const dx = e.touches[0].clientX - this._startX;
      if (Math.abs(dx) > 5) this.isDragging = true;
      if (!this.isDragging) return;
      this._pan(this._startPanX + dx);
    }, { passive: true });

    this.container.addEventListener('touchend', () => {
      this._clickCheck = false;
      this.container.classList.remove('grabbing');
    });
  }

  _onMouseMove(e) {
    if (!this._clickCheck) return;
    const dx = e.clientX - this._startX;
    if (Math.abs(dx) > 5) this.isDragging = true;
    if (!this.isDragging) return;
    this._pan(this._startPanX + dx);
  }

  _onMouseUp(e) {
    if (!this._clickCheck) return;
    const wasDragging = this.isDragging;
    this._clickCheck = false;
    this.isDragging = false;
    this.container.classList.remove('grabbing');

    if (!wasDragging && this.opts.onImageClick && this._imgLoaded) {
      const rect = this.container.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const imgX = cx - this.panX;
      const relX = imgX / this.renderedWidth;
      const relY = cy / this.renderedHeight;
      if (relX >= 0 && relX <= 1 && relY >= 0 && relY <= 1) {
        this.opts.onImageClick(relX, relY);
      }
    }
  }

  _pan(newX) {
    const cw = this.container.clientWidth;
    const minPanX = Math.min(0, cw - this.renderedWidth);
    this.panX = Math.max(minPanX, Math.min(0, newX));
    this._applyPan();
  }

  addPin(pin) {
    // pin: { id, relX, relY, label, targetPhotoId, onClick, isGhost }
    const el = document.createElement('div');
    el.className = 'pin-marker' + (pin.isGhost ? ' pin-ghost' : '') + (pin.builderMode ? ' builder-mode' : '');
    el.dataset.pinId = pin.id;

    el.innerHTML = `
      <div class="pin-icon-wrap">
        <div class="pin-icon-inner">${Icons.pin}</div>
      </div>
      ${pin.label ? `<span class="pin-label-bubble">${escHtml(pin.label)}</span>` : ''}
    `;

    if (pin.onClick && !pin.isGhost) {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        pin.onClick(pin);
      });
    }

    // Position will be updated once image is loaded
    const updatePos = () => {
      if (this.renderedWidth > 0) {
        const px = pin.relX * this.renderedWidth;
        const py = pin.relY * this.renderedHeight;
        el.style.left = px + 'px';
        el.style.top = py + 'px';
      }
    };

    if (this._imgLoaded) updatePos();
    else this.img.addEventListener('load', updatePos, { once: true });

    this.wrapper.appendChild(el);
    return el;
  }

  removePin(id) {
    const el = this.wrapper.querySelector(`[data-pin-id="${id}"]`);
    if (el) el.remove();
  }

  clearPins() {
    this.wrapper.querySelectorAll('.pin-marker, .pin-ghost').forEach(el => el.remove());
  }

  setAddingPin(active) {
    this.container.classList.toggle('adding-pin', active);
    this.opts.onImageClick = active ? this.opts.onImageClick : null;
  }

  destroy() {
    this._destroyed = true;
    window.removeEventListener('mousemove', this._boundMouseMove);
    window.removeEventListener('mouseup', this._boundMouseUp);
  }
}

/* ---- ClassicViewer — utility for computing pin positions ---- */
const ClassicViewer = {
  getImgBounds(img) {
    const cw = img.parentElement.clientWidth;
    const ch = img.parentElement.clientHeight;
    const iw = img.naturalWidth || img.videoWidth || 0;
    const ih = img.naturalHeight || img.videoHeight || 0;
    if (!iw || !ih) return null;
    const imgRatio = iw / ih;
    const conRatio = cw / ch;
    let rw, rh, rx, ry;
    if (imgRatio > conRatio) {
      rw = cw; rh = cw / imgRatio;
      rx = 0; ry = (ch - rh) / 2;
    } else {
      rh = ch; rw = ch * imgRatio;
      rx = (cw - rw) / 2; ry = 0;
    }
    return { x: rx, y: ry, w: rw, h: rh };
  }
};

/* ---- Escape HTML ---- */
function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ---- Debounce ---- */
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/* ---- Tours view (simple, defined here for convenience) ---- */
const Tours = {
  render(main) {
    const tours = App.state.tours;
    main.innerHTML = `
      <div class="page-header">
        <div class="page-header-inner">
          <h1 class="page-title">Visites Virtuelles <span>${tours.length} visite${tours.length !== 1 ? 's' : ''}</span></h1>
          <button class="btn btn-primary" onclick="Tours.showCreateModal()">
            ${Icons.plus} Créer une visite
          </button>
        </div>
      </div>
      <div class="tours-page-content">
        ${tours.length === 0 ? this._emptyState() : `<div class="tours-grid">${tours.map(t => this._tourCard(t)).join('')}</div>`}
      </div>
    `;
  },

  _emptyState() {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">${Icons.photos}</div>
        <h3>Aucune visite pour l'instant</h3>
        <p>Créez votre première visite virtuelle et ajoutez-y des photos avec des pins de navigation.</p>
        <button class="btn btn-primary" onclick="Tours.showCreateModal()">
          ${Icons.plus} Créer une visite
        </button>
      </div>
    `;
  },

  _tourCard(tour) {
    const photos = tour.photoIds.map(id => App.getPhoto(id)).filter(Boolean);
    const coverPhoto = photos[0];
    const hotspotCount = Object.values(tour.hotspots || {}).reduce((acc, hs) => acc + hs.length, 0);
    return `
      <div class="tour-card">
        <div class="tour-thumb">
          ${coverPhoto
            ? `<img src="${escHtml(coverPhoto.src)}" alt="${escHtml(coverPhoto.name)}">`
            : `<div class="tour-thumb-placeholder">${Icons.grid}</div>`}
          <div class="tour-thumb-badge">${typeBadge(tour.type)}</div>
        </div>
        <div class="tour-body">
          <div class="tour-name">${escHtml(tour.name)}</div>
          <div class="tour-desc">${tour.description ? escHtml(tour.description) : '&nbsp;'}</div>
          <div class="tour-stats">
            <span class="tour-stat">${Icons.image} ${photos.length} photo${photos.length !== 1 ? 's' : ''}</span>
            <span class="tour-stat">${Icons.pin} ${hotspotCount} pin${hotspotCount !== 1 ? 's' : ''}</span>
          </div>
          <div class="tour-actions">
            <button class="btn btn-secondary btn-sm" onclick="App.navigate('builder',{tourId:'${tour.id}'})">
              ${Icons.edit} Modifier
            </button>
            ${tour.photoIds.length > 0
              ? `<button class="btn btn-primary btn-sm" onclick="App.navigate('viewer',{tourId:'${tour.id}'})">
                  ${Icons.eye} Lancer
                </button>`
              : ''}
            <button class="btn btn-icon btn-sm" title="Supprimer" onclick="Tours.deleteTour('${tour.id}')">
              ${Icons.trash}
            </button>
          </div>
        </div>
      </div>
    `;
  },

  showCreateModal() {
    App.showModal(`
      <div class="modal-title">Créer une visite virtuelle</div>
      <div class="form-group" style="margin-bottom:16px;">
        <label class="form-label">Nom de la visite *</label>
        <input type="text" id="tour-name-input" class="form-input" placeholder="Ex: Visite de la maison" maxlength="80">
      </div>
      <div class="form-group" style="margin-bottom:16px;">
        <label class="form-label">Type de photos *</label>
        <div class="type-selector">
          <label>
            <input type="radio" name="tour-type" class="type-option" value="classic" checked>
            <span class="type-label">${Icons.image} Classique</span>
          </label>
          <label>
            <input type="radio" name="tour-type" class="type-option" value="panoramic">
            <span class="type-label">${Icons.panoramic} Panoramique</span>
          </label>
          <label>
            <input type="radio" name="tour-type" class="type-option" value="360">
            <span class="type-label">${Icons.sphere} 360°</span>
          </label>
          <label>
            <input type="radio" name="tour-type" class="type-option" value="video">
            <span class="type-label">${Icons.video} Vidéo</span>
          </label>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <input type="text" id="tour-desc-input" class="form-input" placeholder="(optionnel)" maxlength="200">
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="App.closeModal()">Annuler</button>
        <button class="btn btn-primary" onclick="Tours.createTour()">Créer et modifier</button>
      </div>
    `);
    document.getElementById('tour-name-input').focus();
  },

  async createTour() {
    const name = document.getElementById('tour-name-input').value.trim();
    if (!name) { App.toast('Veuillez saisir un nom.', 'error'); return; }
    const type = document.querySelector('input[name="tour-type"]:checked').value;

    const tour = {
      id: genId(),
      name,
      type,
      description: document.getElementById('tour-desc-input').value.trim(),
      photoIds: [],
      startPhotoId: null,
      hotspots: {},
      createdAt: Date.now(),
    };

    await App.saveTour(tour);
    App.closeModal();
    App.toast('Visite créée !');
    App.navigate('builder', { tourId: tour.id });
  },

  async deleteTour(id) {
    const tour = App.getTour(id);
    const ok = await App.showConfirm(
      `Supprimer la visite "${tour?.name || ''}" ? Cette action est irréversible et supprimera tous ses pins.`,
      { type: 'danger', title: 'Supprimer la visite ?', confirmText: 'Supprimer' }
    );
    if (!ok) return;
    await App.deleteTour(id);
    App.toast('Visite supprimée.', 'info');
    App.navigate('tours');
  },
};

/* ---- App init ---- */
document.addEventListener('DOMContentLoaded', () => App.init());
