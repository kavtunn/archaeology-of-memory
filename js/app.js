(function () {
  const ML = window.MemoryLab;
  const CASES = ML.SOLDIERS_DATABASE;
  const getImageById = ML.getImageById;
  const getSourcesByIds = ML.getSourcesByIds;
  const t = function (key) {
    return ML.i18n ? ML.i18n.t(key) : key;
  };
  const loc = function (c) {
    return ML.i18n ? ML.i18n.localizeCase(c) : c;
  };
  const imgCap = function (img) {
    return ML.i18n ? ML.i18n.imageCaption(img) : img.caption;
  };

  let caseIndex = 0;
  let excavation = null;
  let lab = null;
  let current = CASES[0];
  let screenName = 'excavation';

  const els = {};

  function $(id) {
    return document.getElementById(id);
  }

  function cacheDom() {
    els.sectorTitle = $('sector-title');
    els.sectorIntro = $('sector-intro');
    els.sectorPlace = $('sector-place');
    els.sectorProtocol = $('sector-protocol');
    els.sectorPicker = $('sector-picker');
    els.progressBar = $('progress-bar');
    els.progressLabel = $('progress-label');
    els.findMessage = $('find-message');
    els.btnToLab = $('btn-to-lab');
    els.artifactCanvas = $('artifact-canvas');
    els.soilCanvas = $('soil-canvas');
    els.labCanvas = $('lab-canvas');
    els.contrast = $('slider-contrast');
    els.threshold = $('slider-threshold');
    els.filter = $('select-filter');
    els.contrastVal = $('val-contrast');
    els.thresholdVal = $('val-threshold');
    els.btnResetLab = $('btn-reset-lab');
    els.btnAssistLab = $('btn-assist-lab');
    els.btnToArchive = $('btn-to-archive');
    els.labHint = $('lab-hint');
    els.dossier = $('dossier');
    els.gallery = $('case-gallery');
    els.certPreview = $('cert-preview');
    els.btnExport = $('btn-export');
    els.btnNewSearch = $('btn-new-search');
  }

  function showScreen(name) {
    const map = {
      excavation: 'screen-excavation',
      lab: 'screen-lab',
      archive: 'screen-archive',
    };

    const names = Object.keys(map);
    for (let i = 0; i < names.length; i++) {
      const el = $(map[names[i]]);
      if (!el) continue;
      const on = names[i] === name;
      el.hidden = !on;
      if (on) el.classList.add('is-active');
      else el.classList.remove('is-active');
    }

    const steps = document.querySelectorAll('.nav-step');
    for (let j = 0; j < steps.length; j++) {
      if (steps[j].dataset.screen === name) steps[j].classList.add('is-active');
      else steps[j].classList.remove('is-active');
    }

    const digOnly = document.querySelectorAll(
      '.dig-cue, .hero-dock, .sector-panel, .howto-strip, .context-strip'
    );
    for (let k = 0; k < digOnly.length; k++) {
      digOnly[k].hidden = name !== 'excavation';
    }

    document.body.classList.toggle('mode-lab', name === 'lab');
    document.body.classList.toggle('mode-archive', name === 'archive');
    screenName = name;

    window.scrollTo(0, 0);
  }

  function resetLabControls() {
    els.contrast.value = '0';
    els.threshold.value = '255';
    els.filter.value = 'original';
    els.contrastVal.textContent = '0';
    els.thresholdVal.textContent = '255';
  }

  function renderSectorPicker() {
    if (!els.sectorPicker) return;
    let html = '';
    for (let i = 0; i < CASES.length; i++) {
      const c = loc(CASES[i]);
      const active = i === caseIndex ? ' is-active' : '';
      const pressed = i === caseIndex ? 'true' : 'false';
      html +=
        '<button type="button" class="sector-picker__btn' +
        active +
        '" data-case-index="' +
        i +
        '" role="tab" aria-selected="' +
        pressed +
        '">' +
        (c.sectorShort || c.identity.lastName) +
        '</button>';
    }
    els.sectorPicker.innerHTML = html;
  }

  function loadCase(index) {
    caseIndex = index;
    current = loc(CASES[index]);
    renderSectorPicker();

    els.sectorTitle.textContent = current.sectorTitle;
    els.sectorIntro.textContent = current.sectorIntro;
    if (els.sectorPlace) {
      els.sectorPlace.textContent = t('placeLabel') + ' · ' + current.place;
    }
    if (els.sectorProtocol) {
      els.sectorProtocol.textContent = t('protocolLabel') + ' · ' + current.protocolId;
    }
    els.findMessage.hidden = true;
    els.btnToLab.disabled = true;
    els.btnToLab.classList.remove('is-ready');
    els.btnToLab.textContent = t('toLab');
    els.btnToArchive.disabled = true;
    els.btnToArchive.classList.remove('is-ready');
    if (!document.body.classList.contains('hero-capture')) {
      els.progressBar.style.width = '0%';
      els.progressBar.style.transform = 'none';
      els.progressLabel.textContent = '0%';
    }
    if (excavation) excavation.destroy();

    excavation = new ML.ExcavationManager(els.artifactCanvas, els.soilCanvas, {
      seed: current.id,
      onProgress: function (pct) {
        const shown = Math.min(100, Math.round(pct));
        if (document.body.classList.contains('hero-capture')) return;
        els.progressBar.style.width = shown + '%';
        els.progressBar.style.transform = 'none';
        els.progressLabel.textContent = shown + '%';
      },
      onComplete: function () {
        if (document.body.classList.contains('hero-capture')) return;
        els.findMessage.hidden = false;
        els.findMessage.textContent = t('findBanner');
        els.btnToLab.disabled = false;
        els.btnToLab.classList.add('is-ready');
        els.btnToLab.textContent = t('toLab');
        els.progressBar.style.width = '100%';
        els.progressBar.style.transform = 'none';
        els.progressLabel.textContent = '100%';
      },
    });
    excavation.init();
    resetLabControls();
  }

  function syncLabControls() {
    if (!lab) return;
    els.contrast.value = String(lab.contrast);
    els.threshold.value = String(lab.threshold);
    els.filter.value = lab.filter;
    els.contrastVal.textContent = String(lab.contrast);
    els.thresholdVal.textContent = String(lab.threshold);
    els.labHint.textContent = lab.getHintText();
  }

  function initLab() {
    function onOk() {
      els.btnToArchive.disabled = false;
      els.btnToArchive.classList.add('is-ready');
      els.btnToArchive.textContent = t('toFateDone');
      if (els.labHint) els.labHint.textContent = t('labHintDone');
    }

    function onHint(text) {
      if (els.labHint) els.labHint.textContent = text;
    }

    if (!lab) {
      lab = new ML.ForensicLab(els.labCanvas, current, {
        onDeciphered: onOk,
        onHintChange: onHint,
      });
    } else {
      lab.setCase(current);
      lab.onDeciphered = onOk;
      lab.onHintChange = onHint;
    }

    lab.init();
    syncLabControls();
    els.btnToArchive.textContent = t('toFateReady');
    els.btnToArchive.disabled = true;
    els.btnToArchive.classList.remove('is-ready');
  }

  async function renderArchive() {
    const c = current;
    const id = c.identity;
    const mem = getImageById(c.memorialImage);
    const portrait = getImageById(c.portraitId);

    let photoHtml = '';
    if (portrait) {
      const pCap = imgCap(portrait);
      photoHtml =
        '<img src="' +
        portrait.file +
        '" alt="' +
        id.lastName +
        '" width="160" />' +
        '<p class="source-line">' +
        pCap +
        '. ' +
        portrait.source +
        ' (' +
        portrait.license +
        ', ' +
        portrait.year +
        ').</p>';
    }

    let memHtml = '';
    if (mem) {
      const mCap = imgCap(mem);
      memHtml =
        '<figure class="dossier-figure"><img src="' +
        mem.file +
        '" alt="' +
        mCap +
        '" loading="lazy" />' +
        '<figcaption>' +
        mCap +
        '</figcaption></figure>';
    }

    els.dossier.innerHTML =
      '<div class="dossier__photo">' +
      photoHtml +
      '</div><div class="dossier__body">' +
      '<p class="stamp">' +
      c.fateStatus +
      '</p>' +
      '<h2>' +
      id.lastName +
      ' ' +
      id.firstName +
      ' ' +
      id.patronymic +
      '</h2>' +
      '<table class="dossier-table">' +
      '<tr><th>' +
      t('dossierRank') +
      '</th><td>' +
      id.rank +
      '</td></tr>' +
      '<tr><th>' +
      t('dossierRole') +
      '</th><td>' +
      id.role +
      '</td></tr>' +
      '<tr><th>' +
      t('dossierUnit') +
      '</th><td>' +
      id.unit +
      '</td></tr>' +
      '<tr><th>' +
      t('dossierBirth') +
      '</th><td>' +
      id.birthYear +
      '</td></tr>' +
      '<tr><th>' +
      t('dossierBorn') +
      '</th><td>' +
      id.birthPlace +
      '</td></tr>' +
      '<tr><th>' +
      t('dossierPlace') +
      '</th><td>' +
      c.place +
      '</td></tr>' +
      '<tr><th>' +
      t('dossierProtocol') +
      '</th><td>' +
      c.protocolId +
      '</td></tr>' +
      '</table>' +
      '<h3>' +
      t('dossierPath') +
      '</h3><p>' +
      c.battlePath +
      '</p>' +
      '<h3>' +
      t('dossierMemory') +
      '</h3><p>' +
      c.burialStatus +
      '</p>' +
      memHtml +
      '</div>';

    let galleryHtml = '';
    for (let i = 0; i < c.gallery.length; i++) {
      const img = getImageById(c.gallery[i]);
      if (!img) continue;
      const cap = imgCap(img);
      galleryHtml +=
        '<figure class="gallery-card"><img src="' +
        img.file +
        '" alt="' +
        cap +
        '" loading="lazy" />' +
        '<figcaption>' +
        cap +
        '</figcaption></figure>';
    }
    els.gallery.innerHTML = galleryHtml;

    await ML.renderCertificate(els.certPreview, c);
  }

  function onLangChange() {
    current = loc(CASES[caseIndex]);
    if (ML.i18n) ML.i18n.apply();
    renderSectorPicker();
    els.sectorTitle.textContent = current.sectorTitle;
    els.sectorIntro.textContent = current.sectorIntro;
    if (els.sectorPlace) {
      els.sectorPlace.textContent = t('placeLabel') + ' · ' + current.place;
    }
    if (els.sectorProtocol) {
      els.sectorProtocol.textContent = t('protocolLabel') + ' · ' + current.protocolId;
    }
    if (excavation && excavation.drawSoil) {
      excavation.drawSoil();
    }
    if (!els.findMessage.hidden) {
      els.findMessage.textContent = t('findBanner');
    }
    if (els.btnToLab && !els.btnToLab.classList.contains('is-ready')) {
      els.btnToLab.textContent = t('toLab');
    } else if (els.btnToLab) {
      els.btnToLab.textContent = t('toLab');
    }
    if (lab) {
      lab.setCase(current);
      syncLabControls();
      if (els.btnToArchive.classList.contains('is-ready')) {
        els.btnToArchive.textContent = t('toFateDone');
      } else if (screenName === 'lab') {
        els.btnToArchive.textContent = t('toFateReady');
      } else {
        els.btnToArchive.textContent = t('toFate');
      }
    }
    if (screenName === 'archive') {
      renderArchive();
    }
  }

  function bindUi() {
    if (els.sectorPicker) {
      els.sectorPicker.addEventListener('click', function (e) {
        const btn = e.target.closest('.sector-picker__btn');
        if (!btn) return;
        const next = Number(btn.getAttribute('data-case-index'));
        if (Number.isNaN(next) || next === caseIndex) return;
        loadCase(next);
        showScreen('excavation');
      });
    }

    els.btnToLab.addEventListener('click', function () {
      showScreen('lab');
      initLab();
    });

    els.contrast.addEventListener('input', function () {
      els.contrastVal.textContent = els.contrast.value;
      if (lab) lab.setContrast(els.contrast.value);
    });

    els.threshold.addEventListener('input', function () {
      els.thresholdVal.textContent = els.threshold.value;
      if (lab) lab.setThreshold(els.threshold.value);
    });

    els.filter.addEventListener('change', function () {
      if (lab) lab.setFilter(els.filter.value);
    });

    els.btnResetLab.addEventListener('click', function () {
      resetLabControls();
      els.btnToArchive.disabled = true;
      els.btnToArchive.classList.remove('is-ready');
      if (lab) lab.reset();
      syncLabControls();
    });

    if (els.btnAssistLab) {
      els.btnAssistLab.addEventListener('click', function () {
        if (!lab) return;
        lab.applyRecommended();
        syncLabControls();
      });
    }

    els.btnToArchive.addEventListener('click', function () {
      showScreen('archive');
      renderArchive();
    });

    els.btnExport.addEventListener('click', function () {
      ML.generateCertificate(current);
    });

    els.btnNewSearch.addEventListener('click', function () {
      const next = (caseIndex + 1) % CASES.length;
      loadCase(next);
      showScreen('excavation');
    });
  }

  function start() {
    cacheDom();
    bindUi();
    window.addEventListener('memory-lab:lang', onLangChange);
    const params = new URLSearchParams(window.location.search);
    let targetCaseIndex = 0;
    const sectorParam = params.get('sector') || params.get('case');
    if (sectorParam) {
      const idx = CASES.findIndex(function (c, i) {
        return (
          c.id === sectorParam ||
          c.sectorShort.toLowerCase() === sectorParam.toLowerCase() ||
          c.id.indexOf(sectorParam) !== -1 ||
          String(i) === sectorParam
        );
      });
      if (idx !== -1) {
        targetCaseIndex = idx;
      }
    }
    loadCase(targetCaseIndex);
    showScreen('excavation');
    const yearEl = $('project-year');
    if (yearEl) yearEl.textContent = String(ML.PROJECT.year);

    if (params.get('hero') === '1') {
      document.body.classList.add('hero-capture');
      if (params.get('plates') === '1') {
        document.body.classList.add('hero-plates-only');
      }
      const lockHeroProgress = function () {
        if (els.progressBar) {
          els.progressBar.style.transform = 'none';
          els.progressBar.style.width = '42%';
        }
        if (els.progressLabel) els.progressLabel.textContent = '42%';
        if (els.btnToLab) els.btnToLab.disabled = true;
      };
      lockHeroProgress();
      window.setTimeout(lockHeroProgress, 0);
      window.setTimeout(lockHeroProgress, 50);
      window.setTimeout(lockHeroProgress, 200);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
