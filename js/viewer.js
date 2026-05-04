/* ============================================================
   VIEWER.JS — Virtual tour viewer (classic, panoramic, 360°)
   ============================================================ */

const Viewer = {
  tour: null,
  currentPhotoId: null,
  panoViewer: null,
  pannellumViewer: null,
  audio: null,
  _destroyed: false,
  _resizeHandler: null,

  render(main, params) {
    const tour = App.getTour(params.tourId);
    if (!tour || tour.photoIds.length === 0) {
      main.innerHTML = `
        <div class="empty-state" style="padding:80px 24px;">
          ${Icons.info}
          <h3>Visite indisponible</h3>
          <p>Cette visite ne contient aucune photo.</p>
          <button class="btn btn-primary" onclick="App.navigate('tours')">Retour aux visites</button>
        </div>`;
      return;
    }

    this.tour = tour;
    this._destroyed = false;
    this.currentPhotoId = params.photoId || tour.startPhotoId || tour.photoIds[0];

    main.innerHTML = `
      <div class="viewer-page" id="viewer-page">
        <!-- Photo display area -->
        <div id="viewer-display" style="width:100%;height:100%;position:absolute;inset:0;"></div>

        <!-- UI overlay -->
        <div class="viewer-overlay">
          <div class="viewer-top-bar">
            <button class="viewer-back-btn" onclick="App.navigate('tours')">
              ${Icons.arrowLeft} Visites
            </button>
            <div class="viewer-tour-info">
              <div class="viewer-tour-name">${escHtml(tour.name)}</div>
              <div class="viewer-photo-name" id="viewer-photo-name">
                ${escHtml(App.getPhoto(this.currentPhotoId)?.name || '')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this._loadPhoto(this.currentPhotoId);

    if (tour.music) this._initMusic(tour.music);
  },

  destroy() {
    this._destroyed = true;
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
    if (this.audio) { this.audio.pause(); this.audio = null; }
    if (this.panoViewer) { this.panoViewer.destroy(); this.panoViewer = null; }
    if (this.pannellumViewer) {
      try { this.pannellumViewer.destroy(); } catch(e) {}
      this.pannellumViewer = null;
    }
  },

  _initMusic(music) {
    this.audio = new Audio(music.src);
    this.audio.loop = true;
    this.audio.volume = music.volume ?? 0.7;

    const overlay = document.querySelector('.viewer-overlay');
    if (!overlay) return;

    const bar = document.createElement('div');
    bar.className = 'viewer-music-bar';
    bar.id = 'viewer-music-bar';
    bar.innerHTML = `
      <button class="music-play-btn" id="music-play-btn" onclick="Viewer.toggleMusic()" title="Lecture / Pause">
        ${Icons.play}
      </button>
      <div class="music-info">
        <span class="music-name">${escHtml(music.name.replace(/\.[^.]+$/, ''))}</span>
      </div>
      <div class="music-volume-wrap">
        ${Icons.volume}
        <input type="range" class="music-volume-slider" id="music-volume-slider"
          min="0" max="1" step="0.02" value="${music.volume ?? 0.7}"
          oninput="Viewer.setVolume(this.value)" title="Volume">
      </div>
    `;
    overlay.appendChild(bar);

    this.audio.play().then(() => this._updateMusicBtn()).catch(() => this._updateMusicBtn());
  },

  toggleMusic() {
    if (!this.audio) return;
    if (this.audio.paused) this.audio.play(); else this.audio.pause();
    this._updateMusicBtn();
  },

  setVolume(val) {
    if (this.audio) this.audio.volume = parseFloat(val);
  },

  _updateMusicBtn() {
    const btn = document.getElementById('music-play-btn');
    if (!btn || !this.audio) return;
    btn.innerHTML = this.audio.paused ? Icons.play : Icons.pause;
  },

  _showTextPinPopup(pin) {
    document.getElementById('text-pin-popup')?.remove();
    const overlay = document.querySelector('.viewer-overlay');
    if (!overlay) return;
    const popup = document.createElement('div');
    popup.id = 'text-pin-popup';
    popup.className = 'text-pin-popup';
    popup.innerHTML = `
      <div class="text-pin-popup-header">
        <span class="text-pin-popup-title">${escHtml(pin.label || 'Information')}</span>
        <button class="text-pin-popup-close" onclick="document.getElementById('text-pin-popup').remove()" title="Fermer">
          ${Icons.x}
        </button>
      </div>
      <div class="text-pin-popup-body">${escHtml(pin.text || '')}</div>
    `;
    overlay.appendChild(popup);
  },

  _loadPhoto(photoId) {
    if (this._destroyed) return;
    const photo = App.getPhoto(photoId);
    if (!photo) return;

    // Cleanup previous viewer
    if (this.panoViewer) { this.panoViewer.destroy(); this.panoViewer = null; }
    if (this.pannellumViewer) {
      try { this.pannellumViewer.destroy(); } catch(e) {}
      this.pannellumViewer = null;
    }

    this.currentPhotoId = photoId;

    // Update photo name in overlay
    const nameEl = document.getElementById('viewer-photo-name');
    if (nameEl) nameEl.textContent = photo.name;

    const display = document.getElementById('viewer-display');
    if (!display) return;

    if (photo.type === 'classic') {
      this._loadClassic(display, photo);
    } else if (photo.type === 'video') {
      this._loadVideo(display, photo);
    } else if (photo.type === 'panoramic') {
      this._loadPanoramic(display, photo);
    } else if (photo.type === '360') {
      this._load360(display, photo);
    }
  },

  _getHotspots(photoId) {
    return (this.tour.hotspots && this.tour.hotspots[photoId]) || [];
  },

  /* ---- Classic viewer ---- */
  _loadClassic(display, photo) {
    display.innerHTML = `
      <div class="classic-viewer" id="viewer-classic" style="width:100%;height:100%;background:#000;">
        <img class="classic-viewer-img" id="viewer-classic-img" src="${photo.src}" alt="${escHtml(photo.name)}"
          draggable="false" style="max-width:100%;max-height:100%;object-fit:contain;pointer-events:none;user-select:none;">
        <div id="viewer-pin-layer" class="classic-pin-layer"></div>
      </div>
    `;

    const img = document.getElementById('viewer-classic-img');
    const renderPins = () => {
      if (this._destroyed) return;
      const layer = document.getElementById('viewer-pin-layer');
      if (!layer || !img.parentElement) return;
      const bounds = ClassicViewer.getImgBounds(img);
      if (!bounds) { layer.innerHTML = ''; return; }
      const hotspots = this._getHotspots(photo.id);
      const frag = document.createDocumentFragment();
      hotspots.forEach(h => {
        const isText = h.type === 'text';
        const target = isText ? null : App.getPhoto(h.targetPhotoId);
        if (!isText && !target) return;
        const px = bounds.x + h.relX * bounds.w;
        const py = bounds.y + h.relY * bounds.h;
        const el = document.createElement('div');
        el.className = 'pin-marker' + (isText ? ' pin-text' : '');
        el.style.left = px + 'px';
        el.style.top = py + 'px';
        const displayLabel = h.label || (isText ? 'Info' : target.name);
        el.title = displayLabel;
        el.innerHTML = `
          <div class="pin-icon-wrap">
            <div class="pin-icon-inner">${isText ? Icons.messageText : Icons.pin}</div>
          </div>
          <span class="pin-label-bubble">${escHtml(displayLabel)}</span>
        `;
        el.addEventListener('click', () => isText ? Viewer._showTextPinPopup(h) : Viewer._navigateTo(h.targetPhotoId));
        frag.appendChild(el);
      });
      layer.innerHTML = '';
      layer.appendChild(frag);
    };

    if (img.complete && img.naturalWidth) renderPins();
    else img.addEventListener('load', renderPins, { once: true });

    if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler);
    let _rt;
    this._resizeHandler = () => { clearTimeout(_rt); _rt = setTimeout(renderPins, 80); };
    window.addEventListener('resize', this._resizeHandler, { passive: true });
  },

  /* ---- Video viewer ---- */
  _loadVideo(display, photo) {
    display.innerHTML = `
      <div class="classic-viewer" id="viewer-classic" style="width:100%;height:100%;background:#000;">
        <video class="classic-viewer-img" id="viewer-classic-img" src="${photo.src}"
          controls autoplay muted loop
          style="max-width:100%;max-height:100%;object-fit:contain;pointer-events:auto;">
        </video>
        <div id="viewer-pin-layer" class="classic-pin-layer"></div>
      </div>
    `;

    const vid = document.getElementById('viewer-classic-img');
    const renderPins = () => {
      if (this._destroyed) return;
      const layer = document.getElementById('viewer-pin-layer');
      if (!layer || !vid.parentElement) return;
      const bounds = ClassicViewer.getImgBounds(vid);
      if (!bounds) { layer.innerHTML = ''; return; }
      const hotspots = this._getHotspots(photo.id);
      const frag = document.createDocumentFragment();
      hotspots.forEach(h => {
        const isText = h.type === 'text';
        const target = isText ? null : App.getPhoto(h.targetPhotoId);
        if (!isText && !target) return;
        const px = bounds.x + h.relX * bounds.w;
        const py = bounds.y + h.relY * bounds.h;
        const el = document.createElement('div');
        el.className = 'pin-marker' + (isText ? ' pin-text' : '');
        el.style.left = px + 'px';
        el.style.top = py + 'px';
        const displayLabel = h.label || (isText ? 'Info' : target.name);
        el.title = displayLabel;
        el.innerHTML = `
          <div class="pin-icon-wrap">
            <div class="pin-icon-inner">${isText ? Icons.messageText : Icons.pin}</div>
          </div>
          <span class="pin-label-bubble">${escHtml(displayLabel)}</span>
        `;
        el.addEventListener('click', () => isText ? Viewer._showTextPinPopup(h) : Viewer._navigateTo(h.targetPhotoId));
        frag.appendChild(el);
      });
      layer.innerHTML = '';
      layer.appendChild(frag);
    };

    if (vid.readyState >= 1) renderPins();
    else vid.addEventListener('loadedmetadata', renderPins, { once: true });

    if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler);
    let _rt2;
    this._resizeHandler = () => { clearTimeout(_rt2); _rt2 = setTimeout(renderPins, 80); };
    window.addEventListener('resize', this._resizeHandler, { passive: true });
  },

  /* ---- Panoramic viewer ---- */
  _loadPanoramic(display, photo) {
    display.innerHTML = `<div id="viewer-pano-mount" style="width:100%;height:100%;"></div>`;
    const mount = document.getElementById('viewer-pano-mount');
    if (!mount) return;

    const hotspots = this._getHotspots(photo.id);
    const pins = hotspots
      .filter(h => h.type === 'text' || !!App.getPhoto(h.targetPhotoId))
      .map(h => {
        const isText = h.type === 'text';
        return {
          id: h.id,
          type: h.type,
          relX: h.relX,
          relY: h.relY,
          label: h.label || (isText ? 'Info' : (App.getPhoto(h.targetPhotoId)?.name || '')),
          targetPhotoId: h.targetPhotoId,
          text: h.text,
          onClick: (pin) => {
            if (pin.type === 'text') Viewer._showTextPinPopup(pin);
            else Viewer._navigateTo(pin.targetPhotoId);
          },
        };
      });

    this.panoViewer = new PanoramicViewer(mount, photo.src, { mode: 'view', pins });
  },

  /* ---- 360° viewer (Pannellum) ---- */
  _load360(display, photo) {
    display.innerHTML = `<div id="pannellum-container" style="width:100%;height:100%;"></div>`;

    const hotspots = this._getHotspots(photo.id);
    const pannellumHotspots = hotspots
      .filter(h => h.type === 'text' || !!App.getPhoto(h.targetPhotoId))
      .map(h => {
        const isText = h.type === 'text';
        const target = isText ? null : App.getPhoto(h.targetPhotoId);
        const { yaw, pitch } = equirectToYawPitch(h.relX, h.relY);
        const displayLabel = h.label || (isText ? 'Info' : (target?.name || ''));
        return {
          pitch: h.pitch !== undefined ? h.pitch : pitch,
          yaw: h.yaw !== undefined ? h.yaw : yaw,
          type: 'custom',
          cssClass: 'custom-hotspot' + (isText ? ' custom-hotspot-text' : ''),
          createTooltipFunc: (hotSpotDiv, args) => {
            hotSpotDiv.innerHTML = `
              <div class="pin-icon-wrap" title="${escHtml(args.label)}">
                <div class="pin-icon-inner">${args.isText ? Icons.messageText : Icons.pin}</div>
              </div>
              <span class="pin-label-bubble">${escHtml(args.label)}</span>
            `;
          },
          createTooltipArgs: { label: displayLabel, isText },
          clickHandlerFunc: (_e, args) => {
            if (args.isText) Viewer._showTextPinPopup(args);
            else Viewer._navigateTo(args.targetPhotoId);
          },
          clickHandlerArgs: { targetPhotoId: h.targetPhotoId, isText, label: displayLabel, text: h.text },
        };
      });

    try {
      this.pannellumViewer = pannellum.viewer('pannellum-container', {
        type: 'equirectangular',
        panorama: photo.src,
        autoLoad: true,
        showControls: true,
        compass: false,
        hotSpots: pannellumHotspots,
        hfov: 100,
      });
    } catch (e) {
      console.error('Pannellum error', e);
      display.innerHTML = `
        <div class="empty-state" style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:rgba(255,255,255,.6);">
          ${Icons.info}
          <p>Erreur lors du chargement de la photo 360°.</p>
        </div>`;
    }
  },

  _navigateTo(photoId) {
    if (this._destroyed) return;
    if (!this.tour.photoIds.includes(photoId)) return;
    document.getElementById('text-pin-popup')?.remove();
    const display = document.getElementById('viewer-display');
    if (display) {
      display.style.transition = 'opacity .25s';
      display.style.opacity = '0';
      setTimeout(() => {
        if (this._destroyed) return;
        display.style.opacity = '1';
        this._loadPhoto(photoId);
      }, 250);
    } else {
      this._loadPhoto(photoId);
    }
  },
};
