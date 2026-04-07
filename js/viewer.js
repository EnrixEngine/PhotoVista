/* ============================================================
   VIEWER.JS — Virtual tour viewer (classic, panoramic, 360°)
   ============================================================ */

const Viewer = {
  tour: null,
  currentPhotoId: null,
  panoViewer: null,
  pannellumViewer: null,
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
  },

  destroy() {
    this._destroyed = true;
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
    if (this.panoViewer) { this.panoViewer.destroy(); this.panoViewer = null; }
    if (this.pannellumViewer) {
      try { this.pannellumViewer.destroy(); } catch(e) {}
      this.pannellumViewer = null;
    }
  },

  _clearResizeHandler() {
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
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
      layer.innerHTML = '';
      const bounds = ClassicViewer.getImgBounds(img);
      if (!bounds) return;
      const hotspots = this._getHotspots(photo.id);
      hotspots.forEach(h => {
        const target = App.getPhoto(h.targetPhotoId);
        if (!target) return;
        const px = bounds.x + h.relX * bounds.w;
        const py = bounds.y + h.relY * bounds.h;
        const el = document.createElement('div');
        el.className = 'pin-marker';
        el.style.left = px + 'px';
        el.style.top = py + 'px';
        el.title = h.label || target.name;
        el.innerHTML = `
          <div class="pin-icon-wrap">
            <div class="pin-icon-inner">${Icons.pin}</div>
          </div>
          <span class="pin-label-bubble">${escHtml(h.label || target.name)}</span>
        `;
        el.addEventListener('click', () => Viewer._navigateTo(h.targetPhotoId));
        layer.appendChild(el);
      });
    };

    if (img.complete && img.naturalWidth) renderPins();
    else img.addEventListener('load', renderPins, { once: true });

    this._clearResizeHandler();
    this._resizeHandler = debounce(renderPins, 150);
    window.addEventListener('resize', this._resizeHandler);
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
      layer.innerHTML = '';
      const bounds = ClassicViewer.getImgBounds(vid);
      if (!bounds) return;
      const hotspots = this._getHotspots(photo.id);
      hotspots.forEach(h => {
        const target = App.getPhoto(h.targetPhotoId);
        if (!target) return;
        const px = bounds.x + h.relX * bounds.w;
        const py = bounds.y + h.relY * bounds.h;
        const el = document.createElement('div');
        el.className = 'pin-marker';
        el.style.left = px + 'px';
        el.style.top = py + 'px';
        el.title = h.label || target.name;
        el.innerHTML = `
          <div class="pin-icon-wrap">
            <div class="pin-icon-inner">${Icons.pin}</div>
          </div>
          <span class="pin-label-bubble">${escHtml(h.label || target.name)}</span>
        `;
        el.addEventListener('click', () => Viewer._navigateTo(h.targetPhotoId));
        layer.appendChild(el);
      });
    };

    if (vid.readyState >= 1) renderPins();
    else vid.addEventListener('loadedmetadata', renderPins, { once: true });

    this._clearResizeHandler();
    this._resizeHandler = debounce(renderPins, 150);
    window.addEventListener('resize', this._resizeHandler);
  },

  /* ---- Panoramic viewer ---- */
  _loadPanoramic(display, photo) {
    display.innerHTML = `<div id="viewer-pano-mount" style="width:100%;height:100%;"></div>`;
    const mount = document.getElementById('viewer-pano-mount');
    if (!mount) return;

    const hotspots = this._getHotspots(photo.id);
    const pins = hotspots
      .filter(h => App.getPhoto(h.targetPhotoId))
      .map(h => ({
        id: h.id,
        relX: h.relX,
        relY: h.relY,
        label: h.label || App.getPhoto(h.targetPhotoId)?.name || '',
        targetPhotoId: h.targetPhotoId,
        onClick: (pin) => Viewer._navigateTo(pin.targetPhotoId),
      }));

    this.panoViewer = new PanoramicViewer(mount, photo.src, { mode: 'view', pins });
  },

  /* ---- 360° viewer (Pannellum) ---- */
  _load360(display, photo) {
    display.innerHTML = `<div id="pannellum-container" style="width:100%;height:100%;"></div>`;

    const hotspots = this._getHotspots(photo.id);
    const pannellumHotspots = hotspots
      .filter(h => App.getPhoto(h.targetPhotoId))
      .map(h => {
        const target = App.getPhoto(h.targetPhotoId);
        const { yaw, pitch } = equirectToYawPitch(h.relX, h.relY);
        return {
          pitch: h.pitch !== undefined ? h.pitch : pitch,
          yaw: h.yaw !== undefined ? h.yaw : yaw,
          type: 'custom',
          cssClass: 'custom-hotspot',
          createTooltipFunc: (hotSpotDiv, args) => {
            hotSpotDiv.innerHTML = `
              <div class="pin-icon-wrap" title="${escHtml(args.label || target.name)}">
                <div class="pin-icon-inner">${Icons.pin}</div>
              </div>
              <span class="pin-label-bubble">${escHtml(args.label || target.name)}</span>
            `;
          },
          createTooltipArgs: { label: h.label, targetPhotoId: h.targetPhotoId },
          clickHandlerFunc: (_e, args) => {
            Viewer._navigateTo(args.targetPhotoId);
          },
          clickHandlerArgs: { targetPhotoId: h.targetPhotoId },
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
    // Fade transition
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
