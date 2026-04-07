/* ============================================================
   STITCHER.JS — Créateur de panorama 360° à partir de photos
   Projection équirectangulaire + fusion pondérée (feathering)
   ============================================================ */

const Stitcher = {
  photos: [],      // { id, name, src, imgW, imgH, yaw, pitch, hFov }
  _worker: null,
  _resultCanvas: null,

  render(main) {
    this.photos = [];
    this._resultCanvas = null;
    if (this._worker) { this._worker.terminate(); this._worker = null; }

    main.innerHTML = `
      <div class="page-header">
        <div class="page-header-inner">
          <h1 class="page-title">Créateur 360° <span>Assemblez vos photos en panorama sphérique</span></h1>
        </div>
      </div>

      <div class="stitcher-page">

        <!-- Zone d'import -->
        <div class="stitcher-drop-zone" id="stitcher-drop-zone"
          ondragover="Stitcher.onDragOver(event)"
          ondragleave="Stitcher.onDragLeave(event)"
          ondrop="Stitcher.onDrop(event)"
          onclick="Stitcher.triggerUpload()">
          <div class="stitcher-drop-icon">${Icons.sphere}</div>
          <h3>Importez vos photos de la pièce</h3>
          <p>Glissez-déposez 2 à 12 photos prises depuis le centre — ou cliquez pour choisir</p>
          <button class="btn btn-secondary" onclick="event.stopPropagation(); Stitcher.triggerUpload()">
            ${Icons.upload} Choisir des photos
          </button>
          <input type="file" id="stitcher-file-input" accept="image/*" multiple style="display:none"
            onchange="Stitcher.onFileSelect(event)">
        </div>

        <!-- Explication -->
        <div class="stitcher-hint">
          <div class="stitcher-hint-icon">${Icons.info}</div>
          <div class="stitcher-hint-text">
            <strong>Comment ça marche ?</strong>
            Prenez plusieurs photos depuis le <em>centre exact</em> de la pièce, en faisant pivoter sur place.
            Pour une pièce carrée : 4 photos à <strong>0°, 90°, 180° et 270°</strong> suffisent.
            Chaque photo est projetée <em>individuellement</em> sur la sphère — les zones sans photo restent noires, sans déformation.
            Ajustez le <em>cap</em> (direction horizontale) et le <em>champ de vision</em> de chaque photo, puis cliquez sur <strong>Générer</strong>.
          </div>
        </div>

        <!-- Liste des photos + contrôles -->
        <div id="stitcher-photos-section" class="hidden">
          <div class="stitcher-section-header">
            <div class="stitcher-section-left">
              <h2 id="stitcher-photos-title">0 photo</h2>
              <button class="btn btn-secondary btn-sm" onclick="Stitcher.triggerUpload()">
                ${Icons.plus} Ajouter
              </button>
            </div>
            <div class="stitcher-compass-wrap" id="stitcher-compass"></div>
          </div>
          <div class="stitcher-cards" id="stitcher-cards"></div>
        </div>

        <!-- Options de résolution + bouton générer -->
        <div id="stitcher-options" class="stitcher-options hidden">
          <div class="stitcher-options-inner">
            <div class="form-group">
              <label class="form-label">Résolution de sortie</label>
              <div class="stitcher-res-selector">
                <label class="stitcher-res-opt">
                  <input type="radio" name="stitch-res" value="2048" checked>
                  <span>
                    <strong>Rapide</strong>
                    <small>2048 × 1024 px</small>
                  </span>
                </label>
                <label class="stitcher-res-opt">
                  <input type="radio" name="stitch-res" value="4096">
                  <span>
                    <strong>Standard</strong>
                    <small>4096 × 2048 px</small>
                  </span>
                </label>
                <label class="stitcher-res-opt">
                  <input type="radio" name="stitch-res" value="6144">
                  <span>
                    <strong>Haute qualité</strong>
                    <small>6144 × 3072 px</small>
                  </span>
                </label>
              </div>
            </div>
            <button class="btn btn-primary" id="btn-generate" onclick="Stitcher.generate()">
              ${Icons.sphere} Générer le 360°
            </button>
          </div>
        </div>

        <!-- Barre de progression -->
        <div id="stitcher-progress" class="stitcher-progress hidden">
          <div class="stitcher-progress-header">
            <span class="stitcher-progress-label" id="stitcher-progress-label">Calcul en cours...</span>
            <span class="stitcher-progress-pct" id="stitcher-progress-pct">0 %</span>
          </div>
          <div class="stitcher-progress-track">
            <div class="stitcher-progress-fill" id="stitcher-progress-fill"></div>
          </div>
          <p class="stitcher-progress-hint">Le traitement se fait entièrement dans votre navigateur — cela peut prendre quelques secondes.</p>
        </div>

        <!-- Résultat -->
        <div id="stitcher-result" class="stitcher-result hidden">
          <div class="stitcher-result-header">
            <h2>${Icons.check} 360° généré !</h2>
            <div class="stitcher-result-actions">
              <button class="btn btn-secondary" id="btn-preview360" onclick="Stitcher.previewIn360()">
                ${Icons.eye} Voir en 360°
              </button>
              <button class="btn btn-secondary" onclick="Stitcher.importToGallery()">
                ${Icons.image} Importer dans la galerie
              </button>
              <button class="btn btn-primary" onclick="Stitcher.download()">
                ${Icons.upload} Télécharger
              </button>
            </div>
          </div>
          <!-- Canvas équirectangulaire — montre l'étirement caractéristique -->
          <div class="stitcher-result-preview">
            <canvas id="stitcher-result-canvas"></canvas>
          </div>
        </div>

        <!-- ===== TUTORIEL ===== -->
        <div class="stitch-tuto">
          <div class="stitch-tuto-header">
            <div class="section-tag">Guide</div>
            <h2 class="stitch-tuto-title">Comment créer un bon 360°</h2>
            <p class="stitch-tuto-subtitle">
              Suivez ces étapes pour obtenir un panorama sphérique sans coutures et sans zones noires.
            </p>
          </div>

          <!-- Étapes -->
          <div class="stitch-tuto-steps">
            <div class="stitch-tuto-step">
              <div class="stitch-tuto-num">1</div>
              <div class="stitch-tuto-step-icon" style="background:linear-gradient(135deg,#4f6ef7,#6366f1);">${Icons.pin}</div>
              <h3>Positionnez-vous au centre</h3>
              <p>
                Placez-vous <strong>exactement au centre</strong> de la pièce et ne bougez plus.
                L'assemblage ne fonctionne bien que si toutes les photos sont prises depuis le même point de vue.
                Idéalement, utilisez un trépied et pivotez autour de l'axe vertical.
              </p>
            </div>
            <div class="stitch-tuto-step">
              <div class="stitch-tuto-num">2</div>
              <div class="stitch-tuto-step-icon" style="background:linear-gradient(135deg,#8b5cf6,#a855f7);">${Icons.panoramic}</div>
              <h3>Couvrez tout l'horizon</h3>
              <p>
                Prenez suffisamment de photos pour couvrir les 360° horizontaux.
                Les photos doivent se <strong>chevaucher d'au moins 20–30 %</strong> pour une bonne fusion.
              </p>
              <div class="stitch-tuto-configs">
                <div class="stitch-config-item">
                  <div class="stitch-config-badge stitch-config-4">4 photos</div>
                  <span>Caps : <strong>0°, 90°, 180°, 270°</strong></span>
                  <small>Minimum recommandé — pièce carrée</small>
                </div>
                <div class="stitch-config-item">
                  <div class="stitch-config-badge stitch-config-6">6 photos</div>
                  <span>Caps : <strong>0°, 60°, 120°, 180°, 240°, 300°</strong></span>
                  <small>Meilleur résultat — moins de distorsion</small>
                </div>
                <div class="stitch-config-item">
                  <div class="stitch-config-badge stitch-config-8">8 photos</div>
                  <span>Caps : <strong>0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°</strong></span>
                  <small>Optimal — qualité maximale</small>
                </div>
              </div>
            </div>
            <div class="stitch-tuto-step">
              <div class="stitch-tuto-num">3</div>
              <div class="stitch-tuto-step-icon" style="background:linear-gradient(135deg,#10b981,#059669);">${Icons.image}</div>
              <h3>Réglez les 3 paramètres</h3>
              <p>Pour chaque photo, ajustez les trois curseurs :</p>
              <div class="stitch-param-list">
                <div class="stitch-param">
                  <div class="stitch-param-name">Cap (Yaw)</div>
                  <div class="stitch-param-desc">
                    Direction horizontale vers laquelle pointe l'appareil.
                    <em>0° = Nord, 90° = Est, 180° = Sud, 270° = Ouest.</em>
                    C'est le réglage le plus important — il doit correspondre à la direction réelle de la photo.
                  </div>
                </div>
                <div class="stitch-param">
                  <div class="stitch-param-name">Inclinaison (Pitch)</div>
                  <div class="stitch-param-desc">
                    Inclinaison verticale de l'appareil au moment de la prise.
                    <em>0° = horizontal, +15° = légèrement vers le haut, -15° = légèrement vers le bas.</em>
                    Laissez à 0° si vous avez tenu l'appareil bien droit.
                  </div>
                </div>
                <div class="stitch-param">
                  <div class="stitch-param-name">Champ de vision (hFoV)</div>
                  <div class="stitch-param-desc">
                    Angle de vue horizontal de votre appareil. Il dépend de la focale utilisée.
                    <em>Smartphone standard ≈ 65–75°, mode grand angle ≈ 90–120°,
                    caméra d'action (GoPro) ≈ 120–150°.</em>
                    Un hFoV incorrect crée des zones noires ou des déformations.
                  </div>
                </div>
              </div>
            </div>
            <div class="stitch-tuto-step">
              <div class="stitch-tuto-num">4</div>
              <div class="stitch-tuto-step-icon" style="background:linear-gradient(135deg,#f59e0b,#d97706);">${Icons.check}</div>
              <h3>Conseils pour la qualité</h3>
              <ul class="stitch-tips-list">
                <li>${Icons.check} <span><strong>Éclairage uniforme :</strong> évitez de mélanger des photos prises avec des lumières différentes (soleil d'un côté, néon de l'autre) — les coutures seront visibles.</span></li>
                <li>${Icons.check} <span><strong>Même exposition :</strong> forcez l'exposition manuelle sur votre appareil pour que toutes les photos aient la même luminosité.</span></li>
                <li>${Icons.check} <span><strong>Chevauchement suffisant :</strong> si deux photos se touchent "juste", la fusion sera dure et visible. Prévoyez au moins 20 % de recouvrement.</span></li>
                <li>${Icons.check} <span><strong>hFoV identique pour toutes les photos :</strong> si vous avez changé de zoom entre les prises, corrigez le hFoV photo par photo.</span></li>
                <li>${Icons.check} <span><strong>Photo plancher / plafond :</strong> pointez l'appareil directement vers le bas (pitch −90°) et vers le haut (pitch +90°) pour couvrir les pôles — sinon l'outil les "remplit" en étirant les bords.</span></li>
              </ul>
            </div>
          </div>

          <!-- Schéma de référence -->
          <div class="stitch-tuto-diagram">
            <div class="stitch-diagram-label">Exemple — 4 photos à 90° d'intervalle</div>
            <svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" class="stitch-diagram-svg">
              <!-- Globe/sphère -->
              <ellipse cx="160" cy="90" rx="70" ry="70" fill="none" stroke="#e2e8f0" stroke-width="1.5"/>
              <ellipse cx="160" cy="90" rx="70" ry="22" fill="none" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="5 3"/>
              <!-- Point central -->
              <circle cx="160" cy="90" r="5" fill="#4f6ef7"/>
              <text x="160" y="82" text-anchor="middle" font-size="8" fill="#64748b" font-family="Inter,sans-serif">vous</text>
              <!-- 4 flèches de direction -->
              <!-- N = haut -->
              <line x1="160" y1="90" x2="160" y2="26" stroke="#4f6ef7" stroke-width="2.5" stroke-linecap="round"/>
              <polygon points="160,18 155,28 165,28" fill="#4f6ef7"/>
              <text x="160" y="14" text-anchor="middle" font-size="9" fill="#4f6ef7" font-family="Inter,sans-serif" font-weight="700">0°</text>
              <!-- E = droite -->
              <line x1="160" y1="90" x2="224" y2="90" stroke="#8b5cf6" stroke-width="2.5" stroke-linecap="round"/>
              <polygon points="232,90 222,85 222,95" fill="#8b5cf6"/>
              <text x="240" y="93" text-anchor="start" font-size="9" fill="#8b5cf6" font-family="Inter,sans-serif" font-weight="700">90°</text>
              <!-- S = bas -->
              <line x1="160" y1="90" x2="160" y2="154" stroke="#10b981" stroke-width="2.5" stroke-linecap="round"/>
              <polygon points="160,162 155,152 165,152" fill="#10b981"/>
              <text x="160" y="173" text-anchor="middle" font-size="9" fill="#10b981" font-family="Inter,sans-serif" font-weight="700">180°</text>
              <!-- O = gauche -->
              <line x1="160" y1="90" x2="96" y2="90" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/>
              <polygon points="88,90 98,85 98,95" fill="#f59e0b"/>
              <text x="80" y="93" text-anchor="end" font-size="9" fill="#f59e0b" font-family="Inter,sans-serif" font-weight="700">270°</text>
              <!-- Légende -->
              <text x="160" y="178" text-anchor="middle" font-size="8" fill="#94a3b8" font-family="Inter,sans-serif">Chaque flèche = une photo — répartition équitable tous les 90°</text>
            </svg>
          </div>
        </div>

      </div>
    `;
  },

  destroy() {
    if (this._worker) { this._worker.terminate(); this._worker = null; }
  },

  /* ---- Upload ---- */
  triggerUpload() {
    const input = document.getElementById('stitcher-file-input');
    if (input) { input.value = ''; input.click(); }
  },

  onDragOver(e) {
    e.preventDefault();
    document.getElementById('stitcher-drop-zone')?.classList.add('drag-over');
  },

  onDragLeave(e) {
    document.getElementById('stitcher-drop-zone')?.classList.remove('drag-over');
  },

  onDrop(e) {
    e.preventDefault();
    document.getElementById('stitcher-drop-zone')?.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (!files.length) { App.toast('Aucune image valide.', 'error'); return; }
    this._processFiles(files);
  },

  onFileSelect(e) {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    this._processFiles(files);
  },

  async _processFiles(files) {
    const existingCount = this.photos.length;
    const newPhotos = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const src = await this._readFile(files[i]);
        const dims = await this._getImageDims(src);
        // Distribue les caps automatiquement pour ce batch
        const autoYaw = Math.round(i * 360 / files.length);
        newPhotos.push({
          id: genId(),
          name: files[i].name.replace(/\.[^/.]+$/, ''),
          src,
          imgW: dims.w,
          imgH: dims.h,
          yaw:   autoYaw,
          pitch: 0,
          hFov:  90,
        });
      } catch {
        App.toast(`Erreur : ${files[i].name}`, 'error');
      }
    }

    this.photos.push(...newPhotos);
    this._refreshUI();
  },

  _readFile(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = e => resolve(e.target.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  },

  _getImageDims(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve({ w: 0, h: 0 });
      img.src = src;
    });
  },

  /* ---- Mise à jour de l'interface ---- */
  _refreshUI() {
    const section = document.getElementById('stitcher-photos-section');
    const options = document.getElementById('stitcher-options');
    const title   = document.getElementById('stitcher-photos-title');
    const cards   = document.getElementById('stitcher-cards');

    if (!this.photos.length) {
      section?.classList.add('hidden');
      options?.classList.add('hidden');
      return;
    }

    section?.classList.remove('hidden');
    if (this.photos.length >= 2) options?.classList.remove('hidden');
    else options?.classList.add('hidden');

    if (title) title.textContent = `${this.photos.length} photo${this.photos.length > 1 ? 's' : ''}`;
    if (cards) cards.innerHTML = this.photos.map((p, i) => this._photoCard(p, i)).join('');
    this._refreshCompass();
  },

  _refreshCompass() {
    const wrap = document.getElementById('stitcher-compass');
    if (!wrap) return;
    wrap.innerHTML = this._compassSVG();
  },

  _compassSVG() {
    const S = 140, cx = 70, cy = 70, r = 50;
    const COLORS = ['#4f6ef7','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#84cc16'];
    const rays = this.photos.map((p, i) => {
      const rad = (p.yaw - 90) * Math.PI / 180;
      const x = cx + r * Math.cos(rad);
      const y = cy + r * Math.sin(rad);
      const c = COLORS[i % COLORS.length];
      const anchor = x > cx + 4 ? 'start' : x < cx - 4 ? 'end' : 'middle';
      const lx = cx + (r + 14) * Math.cos(rad);
      const ly = cy + (r + 14) * Math.sin(rad);
      return `
        <line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${c}" stroke-width="2" opacity=".75"/>
        <circle cx="${x}" cy="${y}" r="5" fill="${c}"/>
        <text x="${lx}" y="${ly + 4}" font-size="9" fill="${c}" text-anchor="${anchor}" font-family="Inter,sans-serif" font-weight="700">${p.yaw}°</text>
      `;
    }).join('');
    return `
      <svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" style="display:block;">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--border)" stroke-width="1.5" stroke-dasharray="5 4"/>
        <circle cx="${cx}" cy="${cy}" r="4" fill="var(--text-muted)"/>
        <text x="${cx}" y="12" text-anchor="middle" font-size="10" fill="var(--text-muted)" font-family="Inter,sans-serif" font-weight="600">N</text>
        <text x="${cx}" y="${S - 3}" text-anchor="middle" font-size="10" fill="var(--text-muted)" font-family="Inter,sans-serif" font-weight="600">S</text>
        <text x="8"       y="${cy + 4}" text-anchor="middle" font-size="10" fill="var(--text-muted)" font-family="Inter,sans-serif" font-weight="600">O</text>
        <text x="${S - 4}" y="${cy + 4}" text-anchor="middle" font-size="10" fill="var(--text-muted)" font-family="Inter,sans-serif" font-weight="600">E</text>
        ${rays}
      </svg>
    `;
  },

  _photoCard(photo, index) {
    const COLORS = ['#4f6ef7','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#84cc16'];
    const color = COLORS[index % COLORS.length];
    const pitchStr = photo.pitch >= 0 ? `+${photo.pitch}°` : `${photo.pitch}°`;
    return `
      <div class="stitcher-card" id="stitch-card-${photo.id}">
        <div class="stitcher-card-thumb" style="--card-color:${color}">
          <img src="${photo.src}" alt="${escHtml(photo.name)}">
          <div class="stitcher-card-index">${index + 1}</div>
          <button class="stitcher-card-remove" onclick="Stitcher.removePhoto('${photo.id}')" title="Retirer">
            ${Icons.x}
          </button>
        </div>
        <div class="stitcher-card-body">
          <div class="stitcher-card-name">${escHtml(photo.name)}</div>
          <div class="stitcher-card-dims">${photo.imgW} × ${photo.imgH} px</div>

          <div class="stitcher-ctrl">
            <div class="stitcher-ctrl-label">
              <span>Cap (direction horizontale)</span>
              <span class="stitcher-ctrl-val" id="val-yaw-${photo.id}">${photo.yaw}°</span>
            </div>
            <input class="stitcher-slider" type="range" min="0" max="359" step="1" value="${photo.yaw}"
              aria-label="Cap horizontal" aria-valuemin="0" aria-valuemax="359"
              oninput="Stitcher.updateParam('${photo.id}','yaw',+this.value)">
            <div class="stitcher-ctrl-hints">
              <span>0° (N)</span><span>90° (E)</span><span>180° (S)</span><span>270° (O)</span>
            </div>
          </div>

          <div class="stitcher-ctrl">
            <div class="stitcher-ctrl-label">
              <span>Inclinaison verticale (pitch)</span>
              <span class="stitcher-ctrl-val" id="val-pitch-${photo.id}">${pitchStr}</span>
            </div>
            <input class="stitcher-slider" type="range" min="-45" max="45" step="1" value="${photo.pitch}"
              aria-label="Inclinaison verticale" aria-valuemin="-45" aria-valuemax="45"
              oninput="Stitcher.updateParam('${photo.id}','pitch',+this.value)">
            <div class="stitcher-ctrl-hints">
              <span>-45°</span><span>0° (niveau)</span><span>+45°</span>
            </div>
          </div>

          <div class="stitcher-ctrl">
            <div class="stitcher-ctrl-label">
              <span>Champ de vision horizontal (hFoV)</span>
              <span class="stitcher-ctrl-val" id="val-hfov-${photo.id}">${photo.hFov}°</span>
            </div>
            <input class="stitcher-slider" type="range" min="30" max="150" step="1" value="${photo.hFov}"
              aria-label="Champ de vision horizontal" aria-valuemin="30" aria-valuemax="150"
              oninput="Stitcher.updateParam('${photo.id}','hFov',+this.value)">
            <div class="stitcher-ctrl-hints">
              <span>30° (tele)</span><span>90° (normal)</span><span>150° (grand angle)</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /* ---- Contrôles ---- */
  updateParam(id, param, value) {
    const photo = this.photos.find(p => p.id === id);
    if (!photo) return;
    photo[param] = value;

    // Mise à jour de la valeur affichée
    const el = document.getElementById(`val-${param}-${id}`);
    if (el) {
      if (param === 'pitch') el.textContent = value >= 0 ? `+${value}°` : `${value}°`;
      else el.textContent = `${value}°`;
    }
    if (param === 'yaw') this._refreshCompass();
  },

  removePhoto(id) {
    this.photos = this.photos.filter(p => p.id !== id);
    this._refreshUI();
    document.getElementById('stitcher-result')?.classList.add('hidden');
  },

  /* ---- Génération ---- */
  async generate() {
    if (this.photos.length < 2) { App.toast('Ajoutez au moins 2 photos.', 'error'); return; }

    const MAX_RES = 4096;
    const W = Math.min(parseInt(document.querySelector('input[name="stitch-res"]:checked')?.value || '2048'), MAX_RES);
    const H = W / 2;

    document.getElementById('stitcher-progress').classList.remove('hidden');
    document.getElementById('stitcher-result').classList.add('hidden');
    document.getElementById('btn-generate').disabled = true;
    this._setProgress(0, 'Chargement des images…');

    // Charger les ImageData de chaque photo
    let photoDataArr;
    try {
      photoDataArr = await Promise.all(this.photos.map(p => this._loadImageData(p)));
    } catch (e) {
      App.toast('Erreur lors du chargement des images.', 'error');
      this._resetProgress();
      return;
    }

    this._setProgress(5, 'Lancement du traitement…');
    this._runWorker(photoDataArr, W, H);
  },

  _loadImageData(photo) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width  = img.width;
        c.height = img.height;
        c.getContext('2d').drawImage(img, 0, 0);
        const id = c.getContext('2d').getImageData(0, 0, img.width, img.height);
        resolve({
          data: id.data.buffer.slice(0), // ArrayBuffer transférable
          w: img.width,
          h: img.height,
          yaw:   photo.yaw,
          pitch: photo.pitch,
          hFov:  photo.hFov,
        });
      };
      img.onerror = reject;
      img.src = photo.src;
    });
  },

  _runWorker(photos, W, H) {
    /* ---- Code du worker inline (blob URL) ----
       Projection perspective → équirectangulaire pure.
       Chaque photo est projetée correctement sur la sphère avec
       interpolation bilinéaire + feathering cosinus aux bords.
       Les zones non couvertes restent noires (alpha=0). ---- */
    const workerSrc = `
self.onmessage = function(e) {
  const { photos, W, H } = e.data;
  const PI = Math.PI;

  const pc = photos.map(p => {
    const yaw  = p.yaw   * PI / 180;
    const pit  = p.pitch * PI / 180;
    const hFov = p.hFov  * PI / 180;
    const hTH  = Math.tan(hFov / 2);
    const hTV  = hTH * p.h / p.w;
    return {
      data: new Uint8ClampedArray(p.data),
      w: p.w, h: p.h,
      cosY: Math.cos(-yaw), sinY: Math.sin(-yaw),
      cosP: Math.cos(-pit), sinP: Math.sin(-pit),
      hTH, hTV,
    };
  });

  const output = new Uint8ClampedArray(W * H * 4);

  for (let oy = 0; oy < H; oy++) {
    const phi    = PI * 0.5 - (oy / H) * PI;
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);

    for (let ox = 0; ox < W; ox++) {
      const theta = (ox / W) * 2 * PI - PI;
      const vx = cosPhi * Math.sin(theta);
      const vy = sinPhi;
      const vz = cosPhi * Math.cos(theta);

      // ── Passe 1 : projection normale (pixels couverts par une photo) ──
      let totalW = 0, totalR = 0, totalG = 0, totalB = 0;

      for (let pi2 = 0; pi2 < pc.length; pi2++) {
        const p = pc[pi2];
        const x1 =  vx * p.cosY + vz * p.sinY;
        const y1 =  vy;
        const z1 = -vx * p.sinY + vz * p.cosY;
        const y2 =  y1 * p.cosP - z1 * p.sinP;
        const z2 =  y1 * p.sinP + z1 * p.cosP;
        if (z2 < 1e-6) continue;

        const tx = x1 / z2;
        const ty = y2 / z2;
        const rawX = (tx / p.hTH + 1) * 0.5 * p.w;
        const rawY = (-ty / p.hTV + 1) * 0.5 * p.h;

        if (rawX < 0 || rawX >= p.w || rawY < 0 || rawY >= p.h) continue;

        // Feathering cosinus : fondu doux sur les 15% de chaque bord
        // → transitions nettes aux chevauchements sans bouillie
        const FEATHER = 0.15;
        const nx = Math.min(rawX / p.w, 1 - rawX / p.w) / FEATHER;
        const ny = Math.min(rawY / p.h, 1 - rawY / p.h) / FEATHER;
        const t  = Math.min(Math.min(nx, ny), 1);
        const fw = Math.max(0.001, 0.5 * (1 - Math.cos(PI * t)));

        const ix = rawX | 0, iy = rawY | 0;
        const fx = rawX - ix, fy = rawY - iy;
        const xb = ix + 1 < p.w ? ix + 1 : ix;
        const yb = iy + 1 < p.h ? iy + 1 : iy;
        const i00 = (iy * p.w + ix) * 4, i10 = (iy  * p.w + xb) * 4;
        const i01 = (yb * p.w + ix) * 4, i11 = (yb  * p.w + xb) * 4;
        const aa = (1-fx)*(1-fy), bb = fx*(1-fy), cc = (1-fx)*fy, dd = fx*fy;
        totalR += (p.data[i00]*aa + p.data[i10]*bb + p.data[i01]*cc + p.data[i11]*dd) * fw;
        totalG += (p.data[i00+1]*aa+p.data[i10+1]*bb+p.data[i01+1]*cc+p.data[i11+1]*dd)*fw;
        totalB += (p.data[i00+2]*aa+p.data[i10+2]*bb+p.data[i01+2]*cc+p.data[i11+2]*dd)*fw;
        totalW += fw;
      }

      const idx = (oy * W + ox) * 4;

      if (totalW > 0) {
        output[idx]   = totalR / totalW;
        output[idx+1] = totalG / totalW;
        output[idx+2] = totalB / totalW;
        output[idx+3] = 255;
      } else {
        // ── Passe 2 : pôle fill ──
        // Ce pixel n'est couvert par aucune photo.
        // On cherche la photo dont l'azimut est le plus proche de theta
        // et on prend son bord haut ou bas à la colonne correcte.
        // C'est l'effet naturel de convergence en équirectangulaire.
        let bestP = null, bestDist = Infinity;
        for (let pi2 = 0; pi2 < pc.length; pi2++) {
          const p = pc[pi2];
          const x1 =  vx * p.cosY + vz * p.sinY;
          const z1 = -vx * p.sinY + vz * p.cosY;
          const y1 =  vy;
          const z2 =  y1 * p.sinP + z1 * p.cosP;
          if (z2 < 1e-6) continue;
          const tx = x1 / z2;
          // On n'utilise que les photos qui couvrent cet azimut horizontalement
          const normTX = Math.abs(tx) / p.hTH;
          if (normTX >= 1) continue;
          if (normTX < bestDist) { bestDist = normTX; bestP = { p, tx }; }
        }
        if (bestP) {
          const { p, tx } = bestP;
          const rawX = (tx / p.hTH + 1) * 0.5 * p.w;
          const srcX = Math.max(0, Math.min(p.w - 1, rawX | 0));
          // Bord haut si phi > 0 (pôle nord), bord bas si phi < 0 (pôle sud)
          const srcY = phi >= 0 ? 0 : p.h - 1;
          const ig = (srcY * p.w + srcX) * 4;
          output[idx]   = p.data[ig];
          output[idx+1] = p.data[ig + 1];
          output[idx+2] = p.data[ig + 2];
          output[idx+3] = 255;
        }
        // Si aucune photo ne couvre cet azimut, on laisse noir
      }
    }

    if ((oy & 31) === 0) self.postMessage({ progress: oy / H });
  }

  self.postMessage({ done: true, buffer: output.buffer, W, H }, [output.buffer]);
};
    `;

    const blob      = new Blob([workerSrc], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker    = new Worker(workerUrl);
    this._worker    = worker;

    const transferables = photos.map(p => p.data);
    worker.postMessage({ photos, W, H }, transferables);

    worker.onmessage = (e) => {
      if (e.data.progress !== undefined) {
        const pct = Math.round(5 + e.data.progress * 93);
        this._setProgress(pct, `Calcul des pixels… ${pct} %`);
        return;
      }
      if (e.data.done) {
        URL.revokeObjectURL(workerUrl);
        this._worker = null;
        this._onDone(new Uint8ClampedArray(e.data.buffer), e.data.W, e.data.H);
      }
    };

    worker.onerror = (err) => {
      URL.revokeObjectURL(workerUrl);
      this._worker = null;
      console.error('Worker error', err);
      App.toast('Erreur lors du traitement.', 'error');
      this._resetProgress();
    };
  },

  /* ---- Après génération ---- */
  _onDone(data, W, H) {
    this._setProgress(100, 'Finalisation…');

    const canvas = document.getElementById('stitcher-result-canvas');
    if (!canvas) { this._resetProgress(); return; }

    canvas.width  = W;
    canvas.height = H;
    canvas.getContext('2d').putImageData(new ImageData(data, W, H), 0, 0);
    this._resultCanvas = canvas;

    setTimeout(() => {
      this._resetProgress();
      document.getElementById('stitcher-result').classList.remove('hidden');
      document.getElementById('stitcher-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
      App.toast('360° généré avec succès !');
    }, 300);
  },

  _setProgress(pct, label) {
    const fill  = document.getElementById('stitcher-progress-fill');
    const lbl   = document.getElementById('stitcher-progress-label');
    const pctEl = document.getElementById('stitcher-progress-pct');
    if (fill)  fill.style.width = pct + '%';
    if (lbl)   lbl.textContent  = label;
    if (pctEl) pctEl.textContent = pct + ' %';
  },

  _resetProgress() {
    document.getElementById('stitcher-progress')?.classList.add('hidden');
    const btn = document.getElementById('btn-generate');
    if (btn) btn.disabled = false;
  },

  /* ---- Actions sur le résultat ---- */
  download() {
    const canvas = this._resultCanvas || document.getElementById('stitcher-result-canvas');
    if (!canvas) return;
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `photovista-360-${Date.now()}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/jpeg', 0.93);
  },

  previewIn360() {
    const canvas = this._resultCanvas || document.getElementById('stitcher-result-canvas');
    if (!canvas) return;
    const src = canvas.toDataURL('image/jpeg', 0.9);

    // Créer un conteneur dans la modal avec un id unique
    const containerId = 'stitch-pano-' + Date.now();
    App.showModal(`
      <div class="modal-title">${Icons.sphere} Prévisualisation 360°</div>
      <div id="${containerId}" style="width:100%;height:420px;border-radius:var(--r-md);overflow:hidden;background:#111;"></div>
    `, { wide: true });

    // Attendre que la modal soit dans le DOM et visible
    const tryInit = (attempts) => {
      const el = document.getElementById(containerId);
      if (!el || el.offsetWidth === 0) {
        if (attempts > 0) setTimeout(() => tryInit(attempts - 1), 80);
        return;
      }
      try {
        pannellum.viewer(containerId, {
          type: 'equirectangular',
          panorama: src,
          autoLoad: true,
          showControls: true,
          compass: false,
          hfov: 90,
          minHfov: 30,
          maxHfov: 120,
        });
      } catch(e) { console.warn('Pannellum modal', e); }
    };
    setTimeout(() => tryInit(10), 80);
  },

  async importToGallery() {
    const canvas = this._resultCanvas || document.getElementById('stitcher-result-canvas');
    if (!canvas) return;
    const src = canvas.toDataURL('image/jpeg', 0.93);
    const photo = {
      id: genId(),
      name: `360° — ${new Date().toLocaleDateString('fr-FR')}`,
      type: '360',
      src,
      width:  canvas.width,
      height: canvas.height,
      createdAt: Date.now(),
    };
    await App.savePhoto(photo);
    App.toast('Photo 360° importée dans la galerie !');
    App.navigate('gallery');
  },
};
