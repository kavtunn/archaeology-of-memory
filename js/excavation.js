function seedRandom(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return function () {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 4294967296;
  };
}

function ExcavationManager(artifactCanvas, soilCanvas, options) {
  options = options || {};
  this.artifactCanvas = artifactCanvas;
  this.soilCanvas = soilCanvas;
  this.aCtx = artifactCanvas.getContext('2d');
  this.sCtx = soilCanvas.getContext('2d');
  this.onProgress = options.onProgress || function () {};
  this.onComplete = options.onComplete || function () {};
  this.seed = options.seed || 'default';
  this.w = artifactCanvas.width;
  this.h = artifactCanvas.height;
  this.brush = 22;
  this.digging = false;
  this.done = false;
  this.ticks = 0;

  const self = this;
  this._down = function (e) {
    self.down(e);
  };
  this._move = function (e) {
    self.move(e);
  };
  this._up = function () {
    self.up();
  };
}

ExcavationManager.prototype.init = function () {
  this.done = false;
  this.ticks = 0;
  this.drawFind();
  this.drawSoil();
  this.bind();
  this.onProgress(0);
};

ExcavationManager.prototype.destroy = function () {
  this.unbind();
};

ExcavationManager.prototype.drawFind = function () {
  const ctx = this.aCtx;
  const w = this.w;
  const h = this.h;
  const rnd = seedRandom(this.seed + '-a');

  ctx.fillStyle = '#2a241c';
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 120; i++) {
    ctx.fillStyle = 'rgba(50,40,30,' + (0.1 + rnd() * 0.3) + ')';
    ctx.beginPath();
    ctx.arc(rnd() * w, rnd() * h, 1 + rnd() * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  const cx = w / 2;
  const cy = h / 2 + 10;

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx + 8, cy + 20, 55, 28, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.18);

  const g = ctx.createLinearGradient(-20, 0, 20, 0);
  g.addColorStop(0, '#1a1210');
  g.addColorStop(0.5, '#5a4032');
  g.addColorStop(1, '#120e0c');
  ctx.fillStyle = g;
  ctx.fillRect(-19, -55, 38, 110);
  ctx.strokeStyle = '#100c08';
  ctx.strokeRect(-19, -55, 38, 110);

  ctx.fillStyle = '#6a4e3a';
  ctx.beginPath();
  ctx.moveTo(-17, -55);
  ctx.lineTo(-14, -70);
  ctx.lineTo(14, -70);
  ctx.lineTo(17, -55);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  for (let c = 0; c < 20; c++) {
    ctx.strokeStyle = 'rgba(10,8,6,' + (0.2 + rnd() * 0.3) + ')';
    ctx.beginPath();
    ctx.moveTo((rnd() - 0.5) * 28, (rnd() - 0.5) * 90);
    ctx.lineTo((rnd() - 0.5) * 28, (rnd() - 0.5) * 90);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(90,70,50,0.4)';
  ctx.font = '9px Courier New, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('НКО', 0, -6);
  ctx.fillText('1941', 0, 8);
  ctx.restore();
};

ExcavationManager.prototype.drawSoil = function () {
  const ctx = this.sCtx;
  const w = this.w;
  const h = this.h;
  const rnd = seedRandom(this.seed + '-s');

  ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, w, h);

  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#5a4632');
  g.addColorStop(1, '#2e2418');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  for (let y = 0; y < h; y += 3) {
    for (let x = 0; x < w; x += 3) {
      if (rnd() > 0.55) continue;
      const n = rnd();
      ctx.fillStyle =
        'rgba(' +
        Math.floor(55 + n * 50) +
        ',' +
        Math.floor(40 + n * 35) +
        ',' +
        Math.floor(22 + n * 20) +
        ',' +
        (0.35 + rnd() * 0.45) +
        ')';
      ctx.fillRect(x, y, 3, 3);
    }
  }

  for (let i = 0; i < 50; i++) {
    ctx.fillStyle = 'rgba(140,120,90,' + (0.4 + rnd() * 0.4) + ')';
    ctx.beginPath();
    ctx.ellipse(rnd() * w, rnd() * h, 2 + rnd() * 6, 1 + rnd() * 4, rnd(), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(30,22,14,0.35)';
  ctx.font = 'bold 13px Courier New, monospace';
  const soilCue =
    (window.MemoryLab && window.MemoryLab.i18n && window.MemoryLab.i18n.t('soilCue')) ||
    'СЛОЙ ГРУНТА · РАСЧИСТИТЕ КИСТЬЮ';
  ctx.fillText(soilCue, 18, h - 18);
};

ExcavationManager.prototype.bind = function () {
  const el = this.soilCanvas;
  el.style.touchAction = 'none';
  el.addEventListener('pointerdown', this._down);
  el.addEventListener('pointermove', this._move);
  el.addEventListener('pointerup', this._up);
  el.addEventListener('pointercancel', this._up);
  window.addEventListener('pointerup', this._up);
  el.addEventListener('mousedown', this._down);
  window.addEventListener('mousemove', this._move);
  window.addEventListener('mouseup', this._up);
  el.addEventListener('contextmenu', function (e) {
    e.preventDefault();
  });
};

ExcavationManager.prototype.unbind = function () {
  const el = this.soilCanvas;
  el.removeEventListener('pointerdown', this._down);
  el.removeEventListener('pointermove', this._move);
  el.removeEventListener('pointerup', this._up);
  el.removeEventListener('pointercancel', this._up);
  window.removeEventListener('pointerup', this._up);
  el.removeEventListener('mousedown', this._down);
  window.removeEventListener('mousemove', this._move);
  window.removeEventListener('mouseup', this._up);
};

ExcavationManager.prototype.pos = function (e) {
  const r = this.soilCanvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (this.w / Math.max(r.width, 1)),
    y: (e.clientY - r.top) * (this.h / Math.max(r.height, 1)),
  };
};

ExcavationManager.prototype.down = function (e) {
  if (this.done) return;
  if (e.button !== undefined && e.button !== 0) return;
  e.preventDefault();
  this.digging = true;
  if (e.pointerId != null && this.soilCanvas.setPointerCapture) {
    try {
      this.soilCanvas.setPointerCapture(e.pointerId);
    } catch (err) {}
  }
  this.erase(e);
};

ExcavationManager.prototype.move = function (e) {
  if (!this.digging || this.done) return;
  this.erase(e);
};

ExcavationManager.prototype.up = function () {
  this.digging = false;
};

ExcavationManager.prototype.erase = function (e) {
  const p = this.pos(e);
  const ctx = this.sCtx;
  const r = this.brush;

  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  const grad = ctx.createRadialGradient(p.x, p.y, r * 0.1, p.x, p.y, r);
  grad.addColorStop(0, 'rgba(0,0,0,1)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.75)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(p.x, p.y, r * 0.45, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,1)';
  ctx.fill();
  ctx.restore();

  this.ticks += 1;
  if (this.ticks % 8 === 0) this.checkProgress();
};

ExcavationManager.prototype.checkProgress = function () {
  if (this.done) return;

  const data = this.sCtx.getImageData(0, 0, this.w, this.h).data;
  let clear = 0;
  let total = 0;
  for (let i = 0; i < data.length; i += 128) {
    total += 1;
    if (data[i + 3] === 0) clear += 1;
  }

  const pct = total ? (clear / total) * 100 : 0;
  this.onProgress(pct);

  if (pct >= 85) {
    this.done = true;
    this.digging = false;
    this.onComplete();
  }
};

window.MemoryLab = window.MemoryLab || {};
window.MemoryLab.ExcavationManager = ExcavationManager;
