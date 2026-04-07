/* ============================================================
   BUILDER.JS — Virtual tour builder with pin management
   ============================================================ */

const Builder = {
  tour: null,
  selectedPhotoId: null,
  addingPin: false,
  panoViewer: null,
  pannellumViewer: null,
  ghostPin: null,
  pendingPin: null,
  _savedTimer: null,
  _resizeHandler: null,

  render(main, params) {
    const tour = App.getTour(params.tourId);
    if (!tour) {
      main.innerHTML = `<div class="empty-state" style="padding:80px 24px;">${Icons.info}<h3>Visite introuvable</h3><button class="btn btn-primary" onclick="App.navigate('tours')">Retour</button></div>`;
      return;
    }
    this.tour = tour;
    this.selectedPhotoId = tour.startPhotoId || tour.photoIds[0] || null;
    this.addingPin = false;

    main.innerHTML = `
      <div class="builder-layout">
        <!-- Sidebar -->
        <aside class="builder-sidebar" id="builder-sidebar">
          <div class="sidebar-header">
            <div class="sidebar-back" onclick="App.navigate('tours')">
              ${Icons.arrowLeft} Retour aux visites
            </div>
            <div style="margin-bottom:8px;">${typeBadge(tour.type)}</div>
            <div class="sidebar-tour-name">${escHtml(tour.name)}</div>
            <div class="sidebar-tour-type">${tour.description ? escHtml(tour.description) : 'Cliquez sur une photo pour la modifier'}</div>
          </div>
          <div class="sidebar-photos" id="sidebar-photo-list">
            ${this._renderSidebarPhotos()}
          </div>
          <!-- Guide d'utilisation -->
          <div class="builder-guide">
            <div class="builder-guide-step">
              <div class="guide-step-num">1</div>
              <span>Ajoutez des photos via le bouton ci-dessous</span>
            </div>
            <div class="builder-guide-step">
              <div class="guide-step-num">2</div>
              <span>Cliquez sur une photo dans cette liste pour la sélectionner</span>
            </div>
            <div class="builder-guide-step">
              <div class="guide-step-num">3</div>
              <span>Cliquez sur <strong>Ajouter un pin</strong> puis cliquez sur l'image pour placer un point de navigation</span>
            </div>
            <div class="builder-guide-step">
              <div class="guide-step-num">4</div>
              <span>Cliquez sur <strong>Terminer</strong> pour lancer la visite</span>
            </div>
          </div>
          <div class="sidebar-footer">
            <button class="btn btn-secondary" style="width:100%;margin-bottom:8px;" onclick="Builder.showAddPhotosModal()">
              ${Icons.plus} Ajouter des photos
            </button>
            <button class="btn btn-ghost" style="width:100%;font-size:.8rem;" onclick="Builder.finishTour()">
              ${Icons.arrowLeft} Retour aux visites
            </button>
          </div>
        </aside>

        <!-- Main canvas area -->
        <div class="builder-main">
          <div class="builder-toolbar" id="builder-toolbar">
            <span class="builder-toolbar-title" id="toolbar-photo-name">
              ${this.selectedPhotoId ? escHtml(App.getPhoto(this.selectedPhotoId)?.name || '') : 'Aucune photo sélectionnée'}
            </span>
            <div class="toolbar-sep"></div>
            <button class="btn btn-secondary btn-sm" id="btn-add-pin" onclick="Builder.toggleAddPin()"
              ${!this.selectedPhotoId ? 'disabled' : ''}
              title="Cliquez pour activer le mode placement de pin, puis cliquez sur la photo">
              ${Icons.pin} Ajouter un pin
            </button>
            <button class="btn btn-secondary btn-sm" id="btn-set-start" onclick="Builder.setStartPhoto()"
              ${!this.selectedPhotoId ? 'disabled' : ''}
              title="Définir cette photo comme point d'entrée de la visite">
              ${Icons.photos} Photo de départ
            </button>
            <div style="flex:1;"></div>
            <div class="autosave-indicator" id="autosave-indicator">
              ${Icons.check} Sauvegardé
            </div>
            <button class="btn btn-primary btn-sm" onclick="Builder.finishTour()" title="Terminer l'édition et retourner à la liste des visites">
              ${Icons.eye} Terminer
            </button>
          </div>
          <div class="builder-canvas" id="builder-canvas">
            <div id="builder-viewer-wrap" style="width:100%;height:100%;position:relative;">
              ${this._renderCanvasContent()}
            </div>
          </div>
        </div>
      </div>
    `;

    this._initViewer();
  },

  destroy() {
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
    if (this.panoViewer) { this.panoViewer.destroy(); this.panoViewer = null; }
    if (this.pannellumViewer) { try { this.pannellumViewer.destroy(); } catch(e){} this.pannellumViewer = null; }
    clearTimeout(this._savedTimer);
    this.addingPin = false;
    this.ghostPin = null;
  },

  // Affiche l'indicateur "Sauvegardé" dans la toolbar
  _showSaved() {
    const el = document.getElementById('autosave-indicator');
    if (!el) return;
    el.classList.add('visible');
    clearTimeout(this._savedTimer);
    this._savedTimer = setTimeout(() => el.classList.remove('visible'), 2800);
  },

  // Bouton "Terminer" — retour à la liste des visites
  finishTour() {
    App.navigate('tours');
  },

  _renderCanvasContent() {
    if (!this.selectedPhotoId) {
      return `
        <div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:32px;text-align:center;">
          <div style="width:72px;height:72px;border-radius:20px;background:rgba(255,255,255,.08);color:rgba(255,255,255,.4);display:flex;align-items:center;justify-content:center;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="width:34px;height:34px;"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>
          </div>
          <h3 style="color:rgba(255,255,255,.7);font-size:1rem;font-weight:700;margin:0;">Aucune photo sélectionnée</h3>
          <p style="color:rgba(255,255,255,.4);font-size:.85rem;line-height:1.6;max-width:280px;margin:0;">
            Ajoutez des photos dans la colonne de gauche via <strong style="color:rgba(255,255,255,.6);">Ajouter des photos</strong>, puis cliquez dessus pour la sélectionner et placer des pins.
          </p>
          <button class="btn btn-secondary btn-sm" onclick="Builder.showAddPhotosModal()" style="margin-top:4px;">
            ${Icons.plus} Ajouter des photos
          </button>
        </div>
      `;
    }
    const photo = App.getPhoto(this.selectedPhotoId);
    if (!photo) return '<div class="empty-state">Photo introuvable</div>';

    if (photo.type === 'classic') {
      return `
        <div class="classic-viewer" id="classic-viewer-container">
          <img class="classic-viewer-img" id="classic-viewer-img" src="${photo.src}" alt="${escHtml(photo.name)}"
            onload="Builder._onClassicImgLoad()" draggable="false">
          <div class="classic-pin-layer" id="classic-pin-layer"></div>
          <div class="add-pin-hint hidden" id="add-pin-hint">Cliquez sur l'image pour placer un pin</div>
        </div>
      `;
    }

    if (photo.type === 'video') {
      return `
        <div class="classic-viewer" id="classic-viewer-container">
          <video class="classic-viewer-img" id="classic-viewer-img" src="${photo.src}"
            controls muted loop onloadedmetadata="Builder._onClassicImgLoad()"
            style="max-width:100%;max-height:100%;object-fit:contain;"></video>
          <div id="video-pin-overlay" class="video-pin-overlay"></div>
          <div class="classic-pin-layer" id="classic-pin-layer"></div>
          <div class="add-pin-hint hidden" id="add-pin-hint">Cliquez sur la vidéo pour placer un pin</div>
        </div>
      `;
    }

    if (photo.type === 'panoramic' || photo.type === '360') {
      return `
        <div id="pano-viewer-mount" style="width:100%;height:100%;"></div>
        <div class="add-pin-hint hidden" id="add-pin-hint">Cliquez sur l'image pour placer un pin</div>
      `;
    }

    return '<div class="empty-state">Type inconnu</div>';
  },

  _initViewer() {
    if (!this.selectedPhotoId) return;
    const photo = App.getPhoto(this.selectedPhotoId);
    if (!photo) return;

    if (photo.type === 'classic' || photo.type === 'video') {
      this._initClassicEvents();
    } else {
      const mount = document.getElementById('pano-viewer-mount');
      if (!mount) return;
      const pins = this._getPinsForPhoto(this.selectedPhotoId);

      this.panoViewer = new PanoramicViewer(mount, photo.src, {
        mode: 'build',
        pins: pins.map(h => ({
          id: h.id,
          relX: h.relX,
          relY: h.relY,
          label: h.label,
          builderMode: true,
          onClick: (pin) => Builder.selectPin(pin.id),
        })),
        onImageClick: null, // set when adding pin
      });
    }
  },

  _initClassicEvents() {
    const container = document.getElementById('classic-viewer-container');
    const img = document.getElementById('classic-viewer-img');
    if (!container) return;

    const renderPins = () => {
      const layer = document.getElementById('classic-pin-layer');
      if (!layer) return;
      layer.innerHTML = '';
      const pins = this._getPinsForPhoto(this.selectedPhotoId);
      const bounds = ClassicViewer.getImgBounds(img);
      if (!bounds) return;
      pins.forEach(h => {
        const px = bounds.x + h.relX * bounds.w;
        const py = bounds.y + h.relY * bounds.h;
        const el = document.createElement('div');
        el.className = 'pin-marker builder-mode';
        el.dataset.pinId = h.id;
        el.style.left = px + 'px';
        el.style.top = py + 'px';
        el.innerHTML = `
          <div class="pin-icon-wrap">
            <div class="pin-icon-inner">${Icons.pin}</div>
          </div>
          ${h.label ? `<span class="pin-label-bubble">${escHtml(h.label)}</span>` : ''}
        `;
        el.addEventListener('click', (e) => { e.stopPropagation(); Builder.selectPin(h.id); });
        layer.appendChild(el);
      });
    };

    if (img.tagName === 'VIDEO') {
      if (img.readyState >= 1) renderPins();
      else img.addEventListener('loadedmetadata', renderPins, { once: true });
    } else {
      if (img.complete && img.naturalWidth) renderPins();
      else img.addEventListener('load', renderPins, { once: true });
    }

    container.addEventListener('click', (e) => {
      if (!this.addingPin) return;
      const img2 = document.getElementById('classic-viewer-img');
      if (!img2) return;
      const bounds = ClassicViewer.getImgBounds(img2);
      if (!bounds) return;
      const rect = container.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const relX = (cx - bounds.x) / bounds.w;
      const relY = (cy - bounds.y) / bounds.h;
      if (relX < 0 || relX > 1 || relY < 0 || relY > 1) return;
      this._placeGhostPin(relX, relY);
      this._showPinModal(relX, relY, null, null);
    });

    if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler);
    this._resizeHandler = debounce(renderPins, 150);
    window.addEventListener('resize', this._resizeHandler);
  },

  _onClassicImgLoad() {
    // Re-render pins after image loads
    const img = document.getElementById('classic-viewer-img');
    const layer = document.getElementById('classic-pin-layer');
    if (!img || !layer) return;
    layer.innerHTML = '';
    const pins = this._getPinsForPhoto(this.selectedPhotoId);
    const bounds = ClassicViewer.getImgBounds(img);
    if (!bounds) return;
    pins.forEach(h => {
      const px = bounds.x + h.relX * bounds.w;
      const py = bounds.y + h.relY * bounds.h;
      const el = document.createElement('div');
      el.className = 'pin-marker builder-mode';
      el.dataset.pinId = h.id;
      el.style.left = px + 'px';
      el.style.top = py + 'px';
      el.innerHTML = `
        <div class="pin-icon-wrap">
          <div class="pin-icon-inner">${Icons.pin}</div>
        </div>
        ${h.label ? `<span class="pin-label-bubble">${escHtml(h.label)}</span>` : ''}
      `;
      el.addEventListener('click', (e) => { e.stopPropagation(); Builder.selectPin(h.id); });
      layer.appendChild(el);
    });
  },

  _getPinsForPhoto(photoId) {
    return (this.tour.hotspots && this.tour.hotspots[photoId]) || [];
  },

  _renderSidebarPhotos() {
    const photos = this.tour.photoIds.map(id => App.getPhoto(id)).filter(Boolean);
    if (photos.length === 0) {
      return `
        <div style="padding:20px 14px;text-align:center;">
          <div style="width:48px;height:48px;border-radius:12px;background:var(--primary-light);color:var(--primary);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">
            ${Icons.image}
          </div>
          <p style="font-size:.82rem;color:var(--text-muted);line-height:1.6;margin-bottom:12px;">
            Aucune photo dans cette visite.<br>
            Cliquez sur <strong style="color:var(--text);">Ajouter des photos</strong> ci-dessous pour commencer.
          </p>
        </div>`;
    }
    return photos.map(p => {
      const pinCount = this._getPinsForPhoto(p.id).length;
      const isSelected = p.id === this.selectedPhotoId;
      const isStart = p.id === this.tour.startPhotoId;
      return `
        <div class="sidebar-photo-item ${isSelected ? 'selected' : ''}" id="sidebar-item-${p.id}"
          onclick="Builder.selectPhoto('${p.id}')">
          <div class="sidebar-photo-thumb">
            <img src="${p.type === 'video' ? (p.thumbnail || p.src) : p.src}" alt="${escHtml(p.name)}" loading="lazy">
            ${p.type === 'video' ? `<div class="sidebar-video-badge">${Icons.video}</div>` : ''}
          </div>
          <div class="sidebar-photo-info">
            <div class="sidebar-photo-name">${escHtml(p.name)}${isStart ? ' <span style="color:var(--primary);font-size:.7rem;">• Départ</span>' : ''}</div>
            <div class="sidebar-photo-count">${pinCount} pin${pinCount !== 1 ? 's' : ''}</div>
          </div>
          <button class="sidebar-photo-remove" title="Retirer" onclick="event.stopPropagation(); Builder.removePhoto('${p.id}')">
            ${Icons.x}
          </button>
        </div>
      `;
    }).join('');
  },

  selectPhoto(photoId) {
    if (this.selectedPhotoId === photoId) return;
    this.addingPin = false;
    if (this.panoViewer) { this.panoViewer.destroy(); this.panoViewer = null; }
    if (this.pannellumViewer) { try { this.pannellumViewer.destroy(); } catch(e){} this.pannellumViewer = null; }

    this.selectedPhotoId = photoId;

    // Update sidebar selection
    document.querySelectorAll('.sidebar-photo-item').forEach(el => el.classList.remove('selected'));
    document.getElementById(`sidebar-item-${photoId}`)?.classList.add('selected');

    // Update toolbar
    const photo = App.getPhoto(photoId);
    const titleEl = document.getElementById('toolbar-photo-name');
    if (titleEl && photo) titleEl.textContent = photo.name;

    // Reset add pin button
    const btnPin = document.getElementById('btn-add-pin');
    if (btnPin) { btnPin.classList.remove('btn-active'); btnPin.disabled = false; }
    const btnStart = document.getElementById('btn-set-start');
    if (btnStart) btnStart.disabled = false;

    // Render new content
    const wrap = document.getElementById('builder-viewer-wrap');
    if (wrap) {
      wrap.innerHTML = this._renderCanvasContent();
      this._initViewer();
    }
  },

  toggleAddPin() {
    if (!this.selectedPhotoId) return;
    this.addingPin = !this.addingPin;

    const btn = document.getElementById('btn-add-pin');
    const hint = document.getElementById('add-pin-hint');

    if (btn) btn.classList.toggle('btn-active', this.addingPin);
    if (hint) hint.classList.toggle('hidden', !this.addingPin);

    const photo = App.getPhoto(this.selectedPhotoId);
    if (!photo) return;

    if (photo.type === 'classic' || photo.type === 'video') {
      const container = document.getElementById('classic-viewer-container');
      if (container) container.style.cursor = this.addingPin ? 'crosshair' : 'default';
      const overlay = document.getElementById('video-pin-overlay');
      if (overlay) overlay.style.pointerEvents = this.addingPin ? 'auto' : 'none';
    } else if (this.panoViewer) {
      this.panoViewer.container.classList.toggle('adding-pin', this.addingPin);
      if (this.addingPin) {
        this.panoViewer.opts.onImageClick = (relX, relY) => {
          Builder._placeGhostPin(relX, relY);
          Builder._showPinModal(relX, relY, null, null);
        };
      } else {
        this.panoViewer.opts.onImageClick = null;
      }
    }
  },

  _placeGhostPin(relX, relY) {
    // Remove previous ghost
    document.querySelectorAll('.pin-ghost').forEach(el => el.remove());

    const photo = App.getPhoto(this.selectedPhotoId);
    if (!photo) return;

    if (photo.type === 'classic') {
      const img = document.getElementById('classic-viewer-img');
      const layer = document.getElementById('classic-pin-layer');
      if (!img || !layer) return;
      const bounds = ClassicViewer.getImgBounds(img);
      if (!bounds) return;
      const px = bounds.x + relX * bounds.w;
      const py = bounds.y + relY * bounds.h;
      const ghost = document.createElement('div');
      ghost.className = 'pin-ghost pin-marker';
      ghost.style.left = px + 'px';
      ghost.style.top = py + 'px';
      ghost.innerHTML = `<div class="pin-icon-wrap"><div class="pin-icon-inner">${Icons.pin}</div></div>`;
      layer.appendChild(ghost);
    } else if (this.panoViewer) {
      this.panoViewer.addPin({ id: 'ghost', relX, relY, isGhost: true });
    }
  },

  _showPinModal(relX, relY, yaw, pitch) {
    const otherPhotos = this.tour.photoIds
      .filter(id => id !== this.selectedPhotoId)
      .map(id => App.getPhoto(id))
      .filter(Boolean);

    if (otherPhotos.length === 0) {
      App.closeModal();
      // Clean ghost
      document.querySelectorAll('.pin-ghost').forEach(el => el.remove());
      if (this.panoViewer) this.panoViewer.removePin('ghost');
      App.toast('Ajoutez d\'abord d\'autres photos à la visite.', 'error');
      this.addingPin = false;
      document.getElementById('btn-add-pin')?.classList.remove('btn-active');
      document.getElementById('add-pin-hint')?.classList.add('hidden');
      return;
    }

    // Store pending pin coords
    this.pendingPin = { relX, relY, yaw: yaw ?? equirectToYawPitch(relX, relY).yaw, pitch: pitch ?? equirectToYawPitch(relX, relY).pitch };

    App.showModal(`
      <div class="modal-title">${Icons.pin} Configurer le pin</div>
      <div class="form-group" style="margin-bottom:16px;">
        <label class="form-label">Destination *</label>
        <p style="font-size:.82rem;color:var(--text-muted);margin-bottom:10px;">Choisissez la photo vers laquelle ce pin doit naviguer.</p>
        <div class="target-photo-list" id="target-photo-list">
          ${otherPhotos.map(p => `
            <div class="target-photo-item" id="target-item-${p.id}" onclick="Builder._selectTarget('${p.id}')">
              <img src="${p.src}" alt="${escHtml(p.name)}">
              <span>${escHtml(p.name)}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Libellé (optionnel)</label>
        <input type="text" id="pin-label-input" class="form-input" placeholder="Ex: Cuisine, Couloir..." maxlength="40">
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="Builder._cancelPinModal()">Annuler</button>
        <button class="btn btn-primary" id="btn-save-pin" onclick="Builder._confirmPin()" disabled>Enregistrer</button>
      </div>
    `);

    this._selectedTargetId = null;
  },

  _selectTarget(photoId) {
    document.querySelectorAll('.target-photo-item').forEach(el => el.classList.remove('selected'));
    document.getElementById(`target-item-${photoId}`)?.classList.add('selected');
    this._selectedTargetId = photoId;
    document.getElementById('btn-save-pin').disabled = false;
  },

  _cancelPinModal() {
    App.closeModal();
    document.querySelectorAll('.pin-ghost').forEach(el => el.remove());
    if (this.panoViewer) this.panoViewer.removePin('ghost');
    this.pendingPin = null;
    this._selectedTargetId = null;
  },

  async _confirmPin() {
    if (!this._selectedTargetId || !this.pendingPin) return;
    const label = document.getElementById('pin-label-input').value.trim();
    const { relX, relY, yaw, pitch } = this.pendingPin;

    const pin = {
      id: genId(),
      relX, relY, yaw, pitch,
      targetPhotoId: this._selectedTargetId,
      label,
    };

    if (!this.tour.hotspots) this.tour.hotspots = {};
    if (!this.tour.hotspots[this.selectedPhotoId]) this.tour.hotspots[this.selectedPhotoId] = [];
    this.tour.hotspots[this.selectedPhotoId].push(pin);

    await App.saveTour(this.tour);
    this._showSaved();
    App.closeModal();
    App.toast('Pin ajouté !');

    this.pendingPin = null;
    this._selectedTargetId = null;
    this.addingPin = false;
    document.getElementById('btn-add-pin')?.classList.remove('btn-active');
    document.getElementById('add-pin-hint')?.classList.add('hidden');

    // Refresh viewer
    this._refreshViewer();
  },

  selectPin(pinId) {
    // Show pin details/delete option
    const pins = this._getPinsForPhoto(this.selectedPhotoId);
    const pin = pins.find(p => p.id === pinId);
    if (!pin) return;

    const target = App.getPhoto(pin.targetPhotoId);
    App.showModal(`
      <div class="modal-title">${Icons.pin} Détails du pin</div>
      <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg);border-radius:var(--r-md);margin-bottom:16px;">
        ${target ? `<img src="${target.src}" style="width:72px;height:52px;object-fit:cover;border-radius:var(--r-sm);">` : ''}
        <div>
          <div style="font-weight:600;font-size:.9rem;">Destination : ${target ? escHtml(target.name) : 'Photo supprimée'}</div>
          ${pin.label ? `<div style="font-size:.82rem;color:var(--text-muted);">Libellé : ${escHtml(pin.label)}</div>` : ''}
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="App.closeModal()">Fermer</button>
        <button class="btn btn-danger" onclick="Builder.deletePin('${pinId}')">
          ${Icons.trash} Supprimer
        </button>
      </div>
    `);
  },

  async deletePin(pinId) {
    if (!this.tour.hotspots || !this.tour.hotspots[this.selectedPhotoId]) return;
    const ok = await App.showConfirm('Supprimer ce pin de navigation ?', {
      type: 'danger', title: 'Supprimer le pin ?', confirmText: 'Supprimer',
    });
    if (!ok) return;
    this.tour.hotspots[this.selectedPhotoId] = this.tour.hotspots[this.selectedPhotoId].filter(p => p.id !== pinId);
    await App.saveTour(this.tour);
    this._showSaved();
    App.toast('Pin supprimé.', 'info');
    this._refreshViewer();
    this._refreshSidebarItem(this.selectedPhotoId);
  },

  _refreshViewer() {
    if (this.panoViewer) { this.panoViewer.destroy(); this.panoViewer = null; }
    const wrap = document.getElementById('builder-viewer-wrap');
    if (wrap) {
      wrap.innerHTML = this._renderCanvasContent();
      this._initViewer();
    }
    this._refreshSidebarItem(this.selectedPhotoId);
  },

  _refreshSidebarItem(photoId) {
    const el = document.getElementById(`sidebar-item-${photoId}`);
    if (!el) return;
    const pinCount = this._getPinsForPhoto(photoId).length;
    const countEl = el.querySelector('.sidebar-photo-count');
    if (countEl) countEl.textContent = `${pinCount} pin${pinCount !== 1 ? 's' : ''}`;
  },

  async setStartPhoto() {
    if (!this.selectedPhotoId) return;
    this.tour.startPhotoId = this.selectedPhotoId;
    await App.saveTour(this.tour);
    this._showSaved();
    App.toast('Photo de départ définie.');
    // Refresh sidebar
    document.getElementById('sidebar-photo-list').innerHTML = this._renderSidebarPhotos();
  },

  showAddPhotosModal() {
    const availablePhotos = App.state.photos.filter(p => p.type === this.tour.type && !this.tour.photoIds.includes(p.id));

    if (availablePhotos.length === 0) {
      App.showModal(`
        <div class="modal-title">Ajouter des photos</div>
        <div class="empty-state" style="padding:40px 0;">
          ${Icons.upload}
          <h3>Aucune photo disponible</h3>
          <p>Importez d'abord des médias de type "${this.tour.type === '360' ? '360°' : this.tour.type === 'panoramic' ? 'panoramique' : this.tour.type === 'video' ? 'vidéo' : 'classique'}" dans la galerie.</p>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" onclick="App.closeModal()">Fermer</button>
          <button class="btn btn-primary" onclick="App.closeModal(); App.navigate('gallery')">
            ${Icons.upload} Aller à la galerie
          </button>
        </div>
      `);
      return;
    }

    this._modalSelectedPhotos = new Set();

    App.showModal(`
      <div class="modal-title">Ajouter des photos à la visite</div>
      <p style="font-size:.85rem;color:var(--text-muted);margin-bottom:14px;">
        Photos de type <strong>${typeBadge(this.tour.type)}</strong> — cliquez pour sélectionner
      </p>
      <div class="photo-selector-grid" id="photo-selector-grid">
        ${availablePhotos.map(p => `
          <div class="photo-selector-item" id="sel-${p.id}" onclick="Builder._toggleSelectPhoto('${p.id}')">
            <img src="${p.src}" alt="${escHtml(p.name)}" loading="lazy">
            <span>${escHtml(p.name)}</span>
            <div class="photo-selector-check">${Icons.check}</div>
          </div>
        `).join('')}
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="App.closeModal()">Annuler</button>
        <button class="btn btn-primary" id="btn-add-selected" onclick="Builder._addSelectedPhotos()" disabled>
          ${Icons.plus} Ajouter
        </button>
      </div>
    `, { wide: true });
  },

  _toggleSelectPhoto(id) {
    const el = document.getElementById(`sel-${id}`);
    if (!el) return;
    if (this._modalSelectedPhotos.has(id)) {
      this._modalSelectedPhotos.delete(id);
      el.classList.remove('selected');
    } else {
      this._modalSelectedPhotos.add(id);
      el.classList.add('selected');
    }
    document.getElementById('btn-add-selected').disabled = this._modalSelectedPhotos.size === 0;
  },

  async _addSelectedPhotos() {
    if (!this._modalSelectedPhotos || this._modalSelectedPhotos.size === 0) return;
    const newIds = Array.from(this._modalSelectedPhotos);
    this.tour.photoIds.push(...newIds);
    if (!this.tour.startPhotoId && this.tour.photoIds.length > 0) {
      this.tour.startPhotoId = this.tour.photoIds[0];
    }
    await App.saveTour(this.tour);
    this._showSaved();
    App.closeModal();
    App.toast(`${newIds.length} photo${newIds.length > 1 ? 's' : ''} ajoutée${newIds.length > 1 ? 's' : ''}.`);

    // Refresh sidebar
    document.getElementById('sidebar-photo-list').innerHTML = this._renderSidebarPhotos();

    // Select first added if nothing selected
    if (!this.selectedPhotoId) {
      this.selectPhoto(newIds[0]);
    }
  },

  async removePhoto(photoId) {
    const photo = App.getPhoto(photoId);
    const ok = await App.showConfirm(
      `Retirer "${photo?.name || 'cette photo'}" de la visite ? Les pins associés seront aussi supprimés.`,
      { type: 'danger', title: 'Retirer la photo ?', confirmText: 'Retirer' }
    );
    if (!ok) return;
    this.tour.photoIds = this.tour.photoIds.filter(id => id !== photoId);
    if (this.tour.startPhotoId === photoId) this.tour.startPhotoId = this.tour.photoIds[0] || null;
    delete (this.tour.hotspots || {})[photoId];
    // Remove pins pointing to this photo
    for (const pid in this.tour.hotspots) {
      this.tour.hotspots[pid] = this.tour.hotspots[pid].filter(h => h.targetPhotoId !== photoId);
    }
    await App.saveTour(this.tour);
    this._showSaved();
    App.toast('Photo retirée.', 'info');

    if (this.selectedPhotoId === photoId) {
      this.selectedPhotoId = this.tour.photoIds[0] || null;
      if (this.panoViewer) { this.panoViewer.destroy(); this.panoViewer = null; }
      const wrap = document.getElementById('builder-viewer-wrap');
      if (wrap) { wrap.innerHTML = this._renderCanvasContent(); this._initViewer(); }
    }
    document.getElementById('sidebar-photo-list').innerHTML = this._renderSidebarPhotos();
  },
};
