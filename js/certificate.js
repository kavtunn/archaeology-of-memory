function loadImage(src) {
  return new Promise(function (resolve, reject) {
    const img = new Image();
    img.onload = function () {
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = String(text || '').split(/\s+/);
  let line = '';
  let yy = y;
  for (let i = 0; i < words.length; i++) {
    if (!words[i]) continue;
    const test = line ? line + ' ' + words[i] : words[i];
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = words[i];
      yy += lineH;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, yy);
    yy += lineH;
  }
  return yy;
}

async function drawPhoto(ctx, x, y, w, h, meta) {
  ctx.strokeStyle = '#5a4632';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  if (!meta) {
    ctx.fillStyle = '#c8b89a';
    ctx.fillRect(x, y, w, h);
    return;
  }

  try {
    const img = await loadImage(meta.file);
    const ir = img.width / img.height;
    const box = w / h;
    let dw = w;
    let dh = h;
    let dx = x;
    let dy = y;

    if (ir > box) {
      dw = h * ir;
      dx = x - (dw - w) / 2;
    } else {
      dh = w / ir;
      dy = y - (dh - h) / 2;
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  } catch (e) {
    ctx.fillStyle = '#c8b89a';
    ctx.fillRect(x, y, w, h);
  }
}

function drawSeal(ctx, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = 'rgba(120,40,35,0.75)';
  ctx.fillStyle = 'rgba(140,50,40,0.12)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(120,40,35,0.8)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold ' + Math.floor(r * 0.28) + 'px Times New Roman, serif';
  const seal =
    (window.MemoryLab && window.MemoryLab.i18n && window.MemoryLab.i18n.t('sealMemory')) ||
    'ПАМЯТЬ';
  ctx.fillText(seal, 0, -4);
  ctx.font = Math.floor(r * 0.18) + 'px Courier New, monospace';
  ctx.fillText('АП · РБ', 0, 12);
  ctx.restore();
}

function fitText(text, maxLen) {
  const s = String(text || '');
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen - 1) + '…';
}

async function renderCertificate(canvas, soldierCase) {
  const getImageById = window.MemoryLab.getImageById;
  const i18n = window.MemoryLab.i18n;
  const t = function (key) {
    return i18n ? i18n.t(key) : key;
  };
  const localized = i18n ? i18n.localizeCase(soldierCase) : soldierCase;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const id = localized.identity;

  const paper = ctx.createLinearGradient(0, 0, w, h);
  paper.addColorStop(0, '#f3ead8');
  paper.addColorStop(1, '#e2d4b8');
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#6a5038';
  ctx.lineWidth = 4;
  ctx.strokeRect(18, 16, w - 36, h - 32);
  ctx.lineWidth = 1;
  ctx.strokeRect(28, 26, w - 56, h - 52);

  ctx.fillStyle = '#3a2a1c';
  ctx.font = 'bold 26px Times New Roman, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(t('certHeading'), w / 2, 54);
  ctx.font = '13px Courier New, monospace';
  ctx.fillStyle = '#5a4632';
  ctx.fillText(t('brandTitle') + ' · ' + t('brandSub'), w / 2, 76);
  ctx.fillText(t('certProtocol') + localized.protocolId, w / 2, 96);

  await drawPhoto(ctx, 48, 118, 112, 140, getImageById(localized.portraitId));

  const memorial = getImageById(localized.memorialImage);
  if (memorial) {
    try {
      const img = await loadImage(memorial.file);
      ctx.drawImage(img, w - 188, 118, 140, 84);
      ctx.strokeStyle = '#5a4632';
      ctx.strokeRect(w - 188, 118, 140, 84);
    } catch (e) {}
  }

  ctx.textAlign = 'left';
  ctx.fillStyle = '#2a2018';
  ctx.font = 'bold 17px Times New Roman, serif';
  const nameX = 180;
  let y = 140;
  y = wrapText(
    ctx,
    id.lastName + ' ' + id.firstName + ' ' + id.patronymic,
    nameX,
    y,
    w - nameX - 200,
    20
  );
  y += 6;

  ctx.font = '12px Courier New, monospace';
  ctx.fillStyle = '#3a3028';
  const meta = [
    t('certBirth') + id.birthYear,
    t('certBorn') + id.birthPlace,
    t('certRank') + id.rank,
    t('certRole') + id.role,
    t('certUnit') + id.unit,
    t('certPlace') + localized.place,
  ];
  for (let i = 0; i < meta.length; i++) {
    y = wrapText(ctx, meta[i], nameX, y, w - nameX - 200, 17);
  }

  const textLeft = 48;
  const textWidth = w - 220;
  y = Math.max(y + 16, 290);

  ctx.font = 'italic 12px Times New Roman, serif';
  ctx.fillStyle = '#4a3828';
  y = wrapText(ctx, localized.fateStatus, textLeft, y, w - 96, 16);
  y += 10;

  ctx.font = '12px Times New Roman, serif';
  ctx.fillStyle = '#3a2a1c';
  y = wrapText(ctx, fitText(localized.battlePath, 360), textLeft, y, textWidth, 15);
  y += 8;

  ctx.font = '11px Courier New, monospace';
  ctx.fillStyle = '#3a2a1c';
  const burialMaxY = h - 52;
  const burial = fitText(localized.burialStatus, 220);
  wrapText(ctx, burial, textLeft, Math.min(y, burialMaxY - 32), textWidth, 14);

  drawSeal(ctx, w - 100, h - 110, 42);

  ctx.font = '10px Courier New, monospace';
  ctx.fillStyle = '#6a5640';
  ctx.textAlign = 'center';
  ctx.fillText(t('brandTitle'), w / 2, h - 34);
}

function downloadCertificate(canvas, filename) {
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function generateCertificate(soldierCase) {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 500;
  await renderCertificate(canvas, soldierCase);
  const fio = soldierCase.identity.lastName + '_' + soldierCase.identity.firstName;
  downloadCertificate(canvas, 'Svidetelstvo_Pamyati_' + fio + '.png');
  return canvas;
}

window.MemoryLab = window.MemoryLab || {};
window.MemoryLab.renderCertificate = renderCertificate;
window.MemoryLab.generateCertificate = generateCertificate;
