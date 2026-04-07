/* ============================================================
   GALLERY.JS — Photo upload and management
   ============================================================ */

const Gallery = {
  currentFilter: 'all',

  renderHome() {
    const totalPhotos = App.state.photos.length;
    const totalTours  = App.state.tours.length;
    const totalPins   = App.state.tours.reduce((acc, t) =>
      acc + Object.values(t.hotspots || {}).reduce((a, hs) => a + hs.length, 0), 0);

    const arrowRight = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9,18 15,12 9,6"/></svg>`;

    return `
      <div class="home-page">

        <!-- ===== HERO ===== -->
        <div class="hero">
          <div class="hero-blobs">
            <div class="hero-blob hero-blob-1"></div>
            <div class="hero-blob hero-blob-2"></div>
            <div class="hero-blob hero-blob-3"></div>
          </div>

          <div class="hero-logo-wrap">
            <div class="hero-logo-inner">
              <div class="hero-logo-ring"></div>
              <div class="hero-logo">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
                <circle cx="24" cy="24" r="19" stroke="currentColor" stroke-width="2.5"/>
                <ellipse cx="24" cy="24" rx="8" ry="19" stroke="currentColor" stroke-width="2"/>
                <path d="M5 24 Q24 17 43 24" stroke="currentColor" stroke-width="2" fill="none"/>
                <path d="M5 24 Q24 31 43 24" stroke="currentColor" stroke-width="2" fill="none"/>
                <circle cx="24" cy="24" r="3.5" fill="currentColor"/>
              </svg>
            </div>
            </div><!-- /.hero-logo-inner -->
          </div>

          <div class="hero-free-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            100% Gratuit — aucun compte requis
          </div>

          <h1>Créez vos <span class="gradient-text">visites virtuelles</span> en quelques clics</h1>
          <p class="hero-description">
            PhotoVista vous permet de transformer vos photos en parcours interactifs.
            Importez vos images, placez des <strong>points de navigation</strong> (pins) et laissez vos visiteurs
            explorer librement — comme une visite guidée, mais entièrement à votre façon.
          </p>

          <div class="hero-pills">
            <span class="hero-pill">${Icons.image} Photos classiques</span>
            <span class="hero-pill hero-pill-pano">${Icons.panoramic} Panoramiques</span>
            <span class="hero-pill hero-pill-360">${Icons.sphere} 360°</span>
            <span class="hero-pill hero-pill-video">${Icons.video} Vidéos</span>
          </div>

          <div class="hero-actions">
            <button class="btn btn-primary btn-lg" onclick="App.navigate('gallery')">
              ${Icons.upload} Commencer maintenant
            </button>
            <button class="btn btn-secondary btn-lg" onclick="App.navigate('tours')">
              ${Icons.eye} Voir mes visites
            </button>
          </div>

          <div class="hero-stat-bar">
            <div class="hero-stat">
              <div class="hero-stat-num">${totalPhotos}</div>
              <div class="hero-stat-label">Média${totalPhotos !== 1 ? 's' : ''} importé${totalPhotos !== 1 ? 's' : ''}</div>
            </div>
            <div class="hero-stat-divider"></div>
            <div class="hero-stat">
              <div class="hero-stat-num">${totalTours}</div>
              <div class="hero-stat-label">Visite${totalTours !== 1 ? 's' : ''} créée${totalTours !== 1 ? 's' : ''}</div>
            </div>
            <div class="hero-stat-divider"></div>
            <div class="hero-stat">
              <div class="hero-stat-num">${totalPins}</div>
              <div class="hero-stat-label">Pin${totalPins !== 1 ? 's' : ''} de navigation</div>
            </div>
          </div>
        </div>

        <!-- ===== COMMENT CA MARCHE ===== -->
        <div class="home-section">
          <div class="section-header">
            <div class="section-tag">Prise en main</div>
            <h2 class="section-title">Comment ça marche ?</h2>
            <p class="section-subtitle">
              Trois étapes suffisent pour créer votre première visite virtuelle.
              Pas d'installation, pas d'inscription — tout se passe dans votre navigateur.
            </p>
          </div>
          <div class="steps-grid">
            <div class="step-card" onclick="App.navigate('gallery')">
              <div class="step-number">1</div>
              <div class="step-icon step-icon-blue">
                ${Icons.upload}
              </div>
              <h3>Importez vos photos</h3>
              <p>
                Glissez-déposez ou sélectionnez vos images depuis votre appareil.
                Choisissez leur type : <strong>classique</strong>, <strong>panoramique</strong> ou <strong>360°</strong>.
                Vos photos restent stockées localement sur votre appareil.
              </p>
              <div class="step-link">Aller à la galerie ${arrowRight}</div>
            </div>
            <div class="step-connector">
              ${arrowRight}
            </div>
            <div class="step-card" onclick="App.navigate('tours')">
              <div class="step-number">2</div>
              <div class="step-icon step-icon-purple">
                ${Icons.pin}
              </div>
              <h3>Créez une visite et placez des pins</h3>
              <p>
                Créez une visite, ajoutez-y vos photos et placez des <strong>pins interactifs</strong>
                à l'endroit de votre choix sur chaque image.
                Chaque pin peut pointer vers une autre photo de la visite.
              </p>
              <div class="step-link">Créer une visite ${arrowRight}</div>
            </div>
            <div class="step-connector">
              ${arrowRight}
            </div>
            <div class="step-card">
              <div class="step-number">3</div>
              <div class="step-icon step-icon-green">
                ${Icons.eye}
              </div>
              <h3>Naviguez et partagez</h3>
              <p>
                Lancez votre visite et naviguez de photo en photo en cliquant sur les pins.
                Les visites 360° s'affichent avec un rendu sphérique immersif.
                Hébergez le site gratuitement pour la partager.
              </p>
              <div class="step-link" style="opacity:.5;cursor:default;">Votre visite est prête</div>
            </div>
          </div>
        </div>

        <!-- ===== TYPES DE PHOTOS ===== -->
        <div class="home-section">
          <div class="section-header">
            <div class="section-tag">Compatibilité</div>
            <h2 class="section-title">Quatre formats supportés</h2>
            <p class="section-subtitle">
              Chaque visite utilise un seul type de média pour garantir une expérience cohérente.
              Il n'est pas possible de mélanger des classiques avec des 360° dans une même visite.
            </p>
          </div>
          <div class="features-grid features-grid-4">
            <div class="feature-card feature-card-classic" onclick="App.navigate('gallery')">
              <div class="feature-icon feature-icon-classic">${Icons.image}</div>
              <h3>Photos Classiques</h3>
              <p>
                Vos photos du quotidien au format JPG, PNG, WEBP…
                Idéal pour les intérieurs, les pièces ou les espaces bien délimités.
              </p>
              <div class="feature-tag">JPG · PNG · WEBP</div>
              <div class="feature-arrow">${arrowRight}</div>
            </div>
            <div class="feature-card feature-card-panoramic" onclick="App.navigate('gallery')">
              <div class="feature-icon feature-icon-panoramic">${Icons.panoramic}</div>
              <h3>Photos Panoramiques</h3>
              <p>
                Images très larges (ratio 2:1 ou plus).
                Le visionneur permet de faire défiler en glissant.
              </p>
              <div class="feature-tag">Format large · Défilement fluide</div>
              <div class="feature-arrow">${arrowRight}</div>
            </div>
            <div class="feature-card feature-card-360" onclick="App.navigate('gallery')">
              <div class="feature-icon feature-icon-360">${Icons.sphere}</div>
              <h3>Photos 360°</h3>
              <p>
                Photos équirectangulaires (GoPro Max, Insta360…) rendues en sphère interactive.
              </p>
              <div class="feature-tag">Équirectangulaire · Rendu sphérique</div>
              <div class="feature-arrow">${arrowRight}</div>
            </div>
            <div class="feature-card feature-card-video" onclick="App.navigate('gallery')">
              <div class="feature-icon feature-icon-video">${Icons.video}</div>
              <h3>Vidéos</h3>
              <p>
                Courtes vidéos (max 15 s, max 720p) — MP4, WebM. Placez des pins pour naviguer vers d'autres scènes.
              </p>
              <div class="feature-tag">MP4 · WebM · max 15 s · 720p</div>
              <div class="feature-arrow">${arrowRight}</div>
            </div>
          </div>
        </div>

        <!-- ===== GRATUIT ===== -->
        <div class="free-banner">
          <div class="free-banner-inner">
            <div class="free-banner-left">
              <div class="free-banner-badge">Gratuit</div>
              <h2>100% gratuit, pour toujours</h2>
              <p>
                PhotoVista ne vous demande ni abonnement, ni inscription, ni carte bancaire.
                L'outil est open-source et fonctionne entièrement dans votre navigateur.
                Vos photos ne quittent jamais votre appareil.
              </p>
              <div class="free-checklist">
                <div class="free-check">
                  <div class="free-check-icon">${Icons.check}</div>
                  <span>Aucun compte à créer</span>
                </div>
                <div class="free-check">
                  <div class="free-check-icon">${Icons.check}</div>
                  <span>Aucune limite de photos ou de visites</span>
                </div>
                <div class="free-check">
                  <div class="free-check-icon">${Icons.check}</div>
                  <span>Vos données restent sur votre appareil</span>
                </div>
                <div class="free-check">
                  <div class="free-check-icon">${Icons.check}</div>
                  <span>Déployable gratuitement sur Netlify</span>
                </div>
              </div>
            </div>
            <div class="free-banner-right">
              <div class="free-illustration">
                <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="80" cy="80" r="70" stroke="currentColor" stroke-width="2" stroke-dasharray="8 5" opacity=".25"/>
                  <circle cx="80" cy="80" r="50" stroke="currentColor" stroke-width="1.5" opacity=".15"/>
                  <circle cx="80" cy="80" r="28" fill="currentColor" opacity=".08"/>
                  <path d="M60 80 L73 93 L100 66" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="80" cy="28" r="6" fill="currentColor" opacity=".4"/>
                  <circle cx="132" cy="80" r="6" fill="currentColor" opacity=".4"/>
                  <circle cx="80" cy="132" r="6" fill="currentColor" opacity=".4"/>
                  <circle cx="28" cy="80" r="6" fill="currentColor" opacity=".4"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== CONFIDENTIALITE ===== -->
        <div class="home-section" style="padding-bottom:0;">
          <div class="privacy-card">
            <div class="privacy-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:24px;height:24px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div class="privacy-text">
              <h4>Vos photos ne quittent jamais votre appareil</h4>
              <p>
                PhotoVista stocke toutes vos photos et visites en local dans votre navigateur (IndexedDB).
                Aucune donnée n'est envoyée vers un serveur. Si vous effacez le cache ou les données du site,
                vos photos seront supprimées — pensez à en faire des sauvegardes.
              </p>
            </div>
          </div>
        </div>

      </div>
    `;
  },

  render(main) {
    this.currentFilter = 'all';
    const photos = App.state.photos;
    main.innerHTML = `
      <div class="page-header">
        <div class="page-header-inner">
          <h1 class="page-title">Galerie <span id="gallery-count">${photos.length} média${photos.length !== 1 ? 's' : ''}</span></h1>
        </div>
      </div>
      <div class="filter-bar">
        <div class="filter-bar-inner">
          <button class="filter-btn active" onclick="Gallery.setFilter('all', this)">Tous</button>
          <button class="filter-btn" onclick="Gallery.setFilter('classic', this)">${Icons.image} Classiques</button>
          <button class="filter-btn" onclick="Gallery.setFilter('panoramic', this)">${Icons.panoramic} Panoramiques</button>
          <button class="filter-btn" onclick="Gallery.setFilter('360', this)">${Icons.sphere} 360°</button>
          <button class="filter-btn" onclick="Gallery.setFilter('video', this)">${Icons.video} Vidéos</button>
        </div>
      </div>
      <div class="gallery-page-content">

        <!-- Zone d'import -->
        <div id="upload-area-classic" class="upload-area" ondragover="Gallery.onDragOver(event,'classic')" ondragleave="Gallery.onDragLeave(event)" ondrop="Gallery.onDrop(event,'classic')" onclick="Gallery.triggerUpload('classic')">
          <div class="upload-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="16,16 12,12 8,16"/><line x1="12" y1="12" x2="12" y2="21"/>
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
            </svg>
          </div>
          <h3>Importer des médias</h3>
          <p>Glissez-déposez vos images ici, ou choisissez le type ci-dessous.</p>
          <div class="upload-type-row">
            <button class="upload-type-btn upload-type-btn-classic" onclick="event.stopPropagation(); Gallery.triggerUpload('classic')">Classiques</button>
            <button class="upload-type-btn upload-type-btn-panoramic" onclick="event.stopPropagation(); Gallery.triggerUpload('panoramic')">Panoramiques</button>
            <button class="upload-type-btn upload-type-btn-360" onclick="event.stopPropagation(); Gallery.triggerUpload('360')">360°</button>
            <button class="upload-type-btn upload-type-btn-video" onclick="event.stopPropagation(); Gallery.triggerVideoUpload()">Vidéos</button>
          </div>
        </div>
        <input type="file" id="file-input" accept="image/*" multiple style="display:none" onchange="Gallery.onFileSelect(event)">
        <input type="file" id="video-input" accept="video/*" multiple style="display:none" onchange="Gallery.onVideoSelect(event)">

        <!-- Explication du workflow -->
        <div class="workflow-hint">
          <div class="workflow-hint-icon">${Icons.info}</div>
          <div class="workflow-hint-body">
            <strong>Et ensuite ?</strong>
            Une fois vos photos importées ici, rendez-vous dans l'onglet
            <strong>Visites</strong> pour créer un parcours, y ajouter vos photos
            et placer des <strong>pins de navigation</strong> entre elles.
          </div>
          <button class="btn btn-primary btn-sm" onclick="App.navigate('tours')">
            Aller aux Visites
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><polyline points="9,18 15,12 9,6"/></svg>
          </button>
        </div>

        <div id="photo-grid" class="photo-grid">
          ${this._renderPhotos(photos)}
        </div>
      </div>
    `;
    this._uploadType = null;
  },

  _renderPhotos(photos) {
    const filtered = this.currentFilter === 'all' ? photos : photos.filter(p => p.type === this.currentFilter);
    if (filtered.length === 0) {
      return `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon">${Icons.image}</div>
          <h3>Aucun média</h3>
          <p>${this.currentFilter === 'all' ? 'Importez vos premiers médias ci-dessus.' : `Aucun média de type "${this.currentFilter}".`}</p>
        </div>
      `;
    }
    return filtered.map(p => this._photoCard(p)).join('');
  },

  _photoCard(photo) {
    const isVideo = photo.type === 'video';
    const thumbEl = isVideo
      ? `<img src="${escHtml(photo.thumbnail || photo.src)}" alt="${escHtml(photo.name)}" loading="lazy">
         <div class="video-duration-badge">${Icons.video} ${photo.duration ? photo.duration.toFixed(0) + 's' : ''}</div>`
      : `<img src="${escHtml(photo.src)}" alt="${escHtml(photo.name)}" loading="lazy">`;
    return `
      <div class="photo-card" id="photo-card-${photo.id}">
        <div class="photo-thumb" onclick="Gallery.viewPhoto('${photo.id}')">
          ${thumbEl}
          <div class="photo-thumb-overlay">
            <div class="thumb-play-btn">${isVideo ? Icons.video : Icons.eye}</div>
          </div>
        </div>
        <div class="photo-info">
          <div class="photo-name" title="${escHtml(photo.name)}">${escHtml(photo.name)}</div>
          <div class="photo-meta">
            ${typeBadge(photo.type)}
            <div class="photo-actions">
              <button class="photo-delete-btn btn-icon" title="Supprimer" onclick="Gallery.deletePhoto('${photo.id}')">
                ${Icons.trash}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  setFilter(filter, btn) {
    this.currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const grid = document.getElementById('photo-grid');
    if (!grid) return;

    // Remove existing empty state
    grid.querySelector('.empty-state')?.remove();

    let visible = 0;
    grid.querySelectorAll('.photo-card').forEach(card => {
      const id = card.id.replace('photo-card-', '');
      const photo = App.getPhoto(id);
      const show = !photo ? false : (filter === 'all' || photo.type === filter);
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    if (visible === 0) {
      const msg = filter === 'all'
        ? 'Importez vos premiers médias ci-dessus.'
        : `Aucun média de type "${filter}".`;
      grid.insertAdjacentHTML('afterbegin', `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon">${Icons.image}</div>
          <h3>Aucun média</h3>
          <p>${msg}</p>
        </div>`);
    }

    this._updateCount();
  },

  _updateCount() {
    const n = App.state.photos.length;
    const el = document.getElementById('gallery-count');
    if (el) el.textContent = `${n} média${n !== 1 ? 's' : ''}`;
  },

  _uploadType: null,

  triggerUpload(type) {
    this._uploadType = type;
    const input = document.getElementById('file-input');
    if (input) {
      input.value = '';
      input.click();
    }
  },

  triggerVideoUpload() {
    const input = document.getElementById('video-input');
    if (input) {
      input.value = '';
      input.click();
    }
  },

  onVideoSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    this._processVideos(files);
  },

  onDragOver(e, type) {
    e.preventDefault();
    this._uploadType = type;
    e.currentTarget.classList.add('drag-over');
  },

  onDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
  },

  onDrop(e, type) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    this._uploadType = type;
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) { App.toast('Aucune image valide.', 'error'); return; }
    this._processFiles(files, type);
  },

  onFileSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const type = this._uploadType || 'classic';
    this._processFiles(files, type);
  },

  async _processFiles(files, type) {
    let count = 0;
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const src = await this._readFile(file);
        const dims = await this._getImageDims(src);
        const photo = {
          id: genId(),
          name: file.name.replace(/\.[^/.]+$/, ''),
          type,
          src,
          width: dims.w,
          height: dims.h,
          createdAt: Date.now(),
        };
        await App.savePhoto(photo);
        count++;
        // Add card to grid if gallery is open
        const grid = document.getElementById('photo-grid');
        if (grid) {
          // Remove empty state if present
          grid.querySelector('.empty-state')?.remove();
          if (this.currentFilter === 'all' || this.currentFilter === type) {
            grid.insertAdjacentHTML('afterbegin', this._photoCard(photo));
          }
          this._updateCount();
        }
      } catch (err) {
        console.error('Error processing file', file.name, err);
        App.toast(`Erreur : ${file.name}`, 'error');
      }
    }
    if (count > 0) {
      const typeLabel = type === '360' ? '360°' : type === 'panoramic' ? 'panoramique' : 'classique';
      App.toast(`${count} photo${count > 1 ? 's' : ''} importée${count > 1 ? 's' : ''} (${typeLabel}) — ajoutez-les à une visite depuis l'onglet Visites.`);
    }
  },

  _readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  _getImageDims(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve({ w: 0, h: 0 });
      img.src = src;
    });
  },

  async _processVideos(files) {
    const MAX_DURATION = 15;
    const MAX_HEIGHT = 720;
    let count = 0;
    for (const file of files) {
      if (!file.type.startsWith('video/')) continue;
      try {
        const src = await this._readFile(file);
        const meta = await this._getVideoMeta(src);

        if (meta.duration > MAX_DURATION) {
          App.toast(`"${file.name}" dépasse ${MAX_DURATION}s (durée : ${meta.duration.toFixed(1)}s). Ignoré.`, 'error');
          continue;
        }
        if (meta.height > MAX_HEIGHT) {
          App.toast(`"${file.name}" dépasse ${MAX_HEIGHT}p (résolution : ${meta.height}p). Ignoré.`, 'error');
          continue;
        }

        const media = {
          id: genId(),
          name: file.name.replace(/\.[^/.]+$/, ''),
          type: 'video',
          src,
          thumbnail: meta.thumbnail,
          duration: meta.duration,
          width: meta.width,
          height: meta.height,
          createdAt: Date.now(),
        };
        await App.savePhoto(media);
        count++;
        const grid = document.getElementById('photo-grid');
        if (grid) {
          grid.querySelector('.empty-state')?.remove();
          if (this.currentFilter === 'all' || this.currentFilter === 'video') {
            grid.insertAdjacentHTML('afterbegin', this._photoCard(media));
          }
          this._updateCount();
        }
      } catch (err) {
        console.error('Error processing video', file.name, err);
        App.toast(`Erreur : ${file.name}`, 'error');
      }
    }
    if (count > 0) {
      App.toast(`${count} vidéo${count > 1 ? 's' : ''} importée${count > 1 ? 's' : ''} — ajoutez-les à une visite depuis l'onglet Visites.`);
    }
  },

  _getVideoMeta(src) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const cleanup = () => { video.src = ''; };

      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('Timeout : impossible de lire les métadonnées vidéo.'));
      }, 10000);

      video.preload = 'metadata';
      video.muted = true;
      video.src = src;

      video.onloadeddata = () => {
        video.currentTime = 0.1;
      };

      video.onseeked = () => {
        clearTimeout(timer);
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(video.videoWidth, 320);
        canvas.height = Math.round(canvas.width * video.videoHeight / video.videoWidth);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          thumbnail,
        });
        cleanup();
      };

      video.onerror = (e) => {
        clearTimeout(timer);
        cleanup();
        reject(e);
      };
    });
  },

  viewPhoto(id) {
    const photo = App.getPhoto(id);
    if (!photo) return;

    let viewerHtml;
    if (photo.type === '360') {
      viewerHtml = `<div id="photo-preview-360" style="width:100%;height:400px;border-radius:var(--r-md);overflow:hidden;"></div>`;
    } else if (photo.type === 'video') {
      viewerHtml = `
        <video controls style="width:100%;max-height:460px;border-radius:var(--r-md);background:#111;display:block;">
          <source src="${photo.src}">
        </video>`;
    } else {
      viewerHtml = `<img src="${photo.src}" alt="${escHtml(photo.name)}" style="width:100%;max-height:500px;object-fit:contain;border-radius:var(--r-md);background:#111;">`;
    }

    const meta = photo.type === 'video'
      ? `${photo.duration ? photo.duration.toFixed(1) + 's' : ''} — ${photo.width} × ${photo.height} px`
      : `${photo.width} × ${photo.height} px`;

    App.showModal(`
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        ${typeBadge(photo.type)}
        <span style="font-weight:700;font-size:1.05rem;">${escHtml(photo.name)}</span>
      </div>
      ${viewerHtml}
      <div style="margin-top:12px;font-size:.82rem;color:var(--text-muted);">
        ${meta}
      </div>
    `, { wide: true });

    if (photo.type === '360') {
      setTimeout(() => {
        try {
          pannellum.viewer('photo-preview-360', {
            type: 'equirectangular',
            panorama: photo.src,
            autoLoad: true,
            showControls: false,
            compass: false,
          });
        } catch(e) { console.warn('Pannellum preview error', e); }
      }, 50);
    }
  },

  async deletePhoto(id) {
    const photo = App.getPhoto(id);
    if (!photo) return;

    const usedIn = App.state.tours.filter(t => t.photoIds.includes(id));
    const msg = usedIn.length > 0
      ? `Cette photo est utilisée dans ${usedIn.length} visite(s). La supprimer la retirera automatiquement de ces visites.`
      : `Supprimer définitivement la photo "${photo.name}" ?`;

    const ok = await App.showConfirm(msg, {
      type: 'danger',
      title: 'Supprimer la photo ?',
      confirmText: 'Supprimer',
    });
    if (!ok) return;

    await App.deletePhoto(id);
    document.getElementById(`photo-card-${id}`)?.remove();
    App.toast('Photo supprimée.', 'info');
    this._updateCount();

    // Show empty state if no photos left
    const grid = document.getElementById('photo-grid');
    if (grid && grid.querySelectorAll('.photo-card').length === 0) {
      grid.innerHTML = this._renderPhotos(App.state.photos);
    }
  },
};
