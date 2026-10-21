function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function ForensicLab(canvas, soldierCase, options) {
  options = options || {};
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d', { willReadFrequently: true });
  this.case = soldierCase;
  this.onDeciphered = options.onDeciphered || function () {};
  this.onHintChange = options.onHintChange || function () {};
  this.w = canvas.width;
  this.h = canvas.height;
  this.source = null;
  this.contrast = 0;
  this.threshold = 255;
  this.filter = 'original';
  this.ok = false;
  this.raf = 0;
}

ForensicLab.prototype.init = function () {
  this.ok = false;
  this.drawForm();
  this.source = this.ctx.getImageData(0, 0, this.w, this.h);
  this.apply();
};

ForensicLab.prototype.setCase = function (soldierCase) {
  this.case = soldierCase;
  this.ok = false;
  this.contrast = 0;
  this.threshold = 255;
  this.filter = 'original';
  this.drawForm();
  this.source = this.ctx.getImageData(0, 0, this.w, this.h);
  this.apply();
};

ForensicLab.prototype.setContrast = function (v) {
  this.contrast = Number(v);
  this.schedule();
};

ForensicLab.prototype.setThreshold = function (v) {
  this.threshold = Number(v);
  this.schedule();
};

ForensicLab.prototype.setFilter = function (v) {
  this.filter = v;
  this.schedule();
};

ForensicLab.prototype.reset = function () {
  this.contrast = 0;
  this.threshold = 255;
  this.filter = 'original';
  this.ok = false;
  this.apply();
};

ForensicLab.prototype.getTarget = function () {
  return this.case.labHint || { contrast: 70, threshold: 130, filter: 'uv' };
};

ForensicLab.prototype.applyRecommended = function () {
  const h = this.getTarget();
  this.contrast = h.contrast;
  this.threshold = h.threshold;
  this.filter = h.filter;
  this.apply();
  return {
    contrast: this.contrast,
    threshold: this.threshold,
    filter: this.filter,
  };
};

ForensicLab.prototype.schedule = function () {
  const self = this;
  if (this.raf) cancelAnimationFrame(this.raf);
  this.raf = requestAnimationFrame(function () {
    self.raf = 0;
    self.apply();
  });
};

ForensicLab.prototype.drawForm = function () {
  const ctx = this.ctx;
  const w = this.w;
  const h = this.h;
  const id = this.case.identity;

  ctx.clearRect(0, 0, w, h);

  const paper = ctx.createLinearGradient(0, 0, w, h);
  paper.addColorStop(0, '#7a5c40');
  paper.addColorStop(1, '#5a402c');
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 28; i++) {
    ctx.fillStyle = 'rgba(40,25,10,' + (0.06 + Math.random() * 0.1) + ')';
    ctx.beginPath();
    ctx.arc(Math.random() * w, Math.random() * h, 6 + Math.random() * 22, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(40,28,18,0.45)';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 8, w - 20, h - 16);

  ctx.fillStyle = 'rgba(55,30,90,0.55)';
  ctx.font = 'bold 13px Courier New, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('НАРКОМАТ ОБОРОНЫ СССР', w / 2, 28);
  ctx.font = '11px Courier New, monospace';
  ctx.fillText('БЛАНК К МЕДАЛЬОНУ · ПРИКАЗ НКО № 138', w / 2, 46);
  ctx.textAlign = 'left';

  const lines = [
    'Фамилия: ' + id.lastName,
    'Имя: ' + id.firstName,
    'Отчество: ' + id.patronymic,
    'Год рожд.: ' + id.birthYear,
    'Уроженец: ' + id.birthPlace,
    'Звание / должность: ' + id.rank + ', ' + id.role,
    'Часть: ' + id.unit,
  ];

  ctx.font = '16px Segoe Script, Comic Sans MS, cursive';
  let y = 78;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillStyle = 'rgba(70,40,120,0.62)';
    ctx.fillText(lines[i], 35.2, y - 0.4);
    ctx.fillStyle = 'rgba(88,52,140,0.48)';
    ctx.fillText(lines[i], 36, y);
    y += 26;
  }

  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let p = 0; p < d.length; p += 4) {
    const n = (Math.random() - 0.5) * 5;
    d[p] = clamp(d[p] + n, 0, 255);
    d[p + 1] = clamp(d[p + 1] + n * 0.8, 0, 255);
    d[p + 2] = clamp(d[p + 2] + n * 0.6, 0, 255);
  }
  ctx.putImageData(img, 0, 0);
};

ForensicLab.prototype.apply = function () {
  if (!this.source) return;

  const src = this.source.data;
  const out = this.ctx.createImageData(this.w, this.h);
  const dst = out.data;
  const C = this.contrast;
  const F = (259 * (C + 255)) / (255 * (259 - C));
  const thr = this.threshold;
  const filter = this.filter;
  const useThr = thr < 250;

  for (let i = 0; i < src.length; i += 4) {
    let r = src[i];
    let g = src[i + 1];
    let b = src[i + 2];
    const a = src[i + 3];

    if (filter === 'negative') {
      r = 255 - r;
      g = 255 - g;
      b = 255 - b;
    }

    let Y;
    if (filter === 'uv') {
      const paper = 0.5 * r + 0.5 * g;
      const violet = Math.max(0, b - paper * 0.75);
      Y = clamp(paper * 1.25 - violet * 2.8 + 28, 0, 255);
    } else {
      Y = 0.1 * r + 0.2 * g + 0.7 * b;
    }

    const Yp = clamp(F * (Y - 128) + 128, 0, 255);

    if (useThr) {
      const v = Yp < thr ? 0 : 255;
      dst[i] = v;
      dst[i + 1] = v;
      dst[i + 2] = v;
    } else if (filter === 'uv') {
      dst[i] = clamp(Yp * 0.55 + 40, 0, 255);
      dst[i + 1] = clamp(Yp * 0.35 + 20, 0, 255);
      dst[i + 2] = clamp(Yp * 0.95, 0, 255);
    } else {
      dst[i] = Yp;
      dst[i + 1] = Yp;
      dst[i + 2] = Yp;
    }
    dst[i + 3] = a;
  }

  this.ctx.putImageData(out, 0, 0);
  this.checkOk();
  this.onHintChange(this.getHintText());
};

ForensicLab.prototype.checkOk = function () {
  if (this.ok) return;

  const hint = this.getTarget();
  const okC = this.contrast >= hint.contrast - 40;
  const okT =
    this.threshold >= hint.threshold - 55 && this.threshold <= hint.threshold + 60;
  const okF = this.filter === hint.filter;

  if (okC && okT && okF) {
    this.ok = true;
    this.onDeciphered();
  }
};

ForensicLab.prototype.getHintText = function () {
  const i18n = window.MemoryLab && window.MemoryLab.i18n;
  const t = function (key) {
    return i18n ? i18n.t(key) : key;
  };
  const h = this.getTarget();

  if (this.ok) return t('labHintDone');

  if (this.filter !== h.filter) {
    return t('labHintStep1');
  }
  if (this.contrast < h.contrast - 40) {
    return t('labHintStep2').replace('{c}', String(h.contrast));
  }
  if (this.threshold > h.threshold + 60 || this.threshold < h.threshold - 55) {
    return t('labHintStep3').replace('{t}', String(h.threshold));
  }
  return t('labHintAlmost');
};

window.MemoryLab = window.MemoryLab || {};
window.MemoryLab.ForensicLab = ForensicLab;
