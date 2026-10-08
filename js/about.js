(function () {
  const ML = window.MemoryLab;

  function renderCredits() {
    const images = ML.IMAGE_SOURCES;
    const texts = ML.TEXT_SOURCES;
    const i18n = ML.i18n;
    const root = document.getElementById('image-credits');
    let html = '';
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const caption = i18n.imageCaption(img);
      html +=
        '<div class="credit-item"><img src="' +
        img.file +
        '" alt="" loading="lazy" /><div><strong>' +
        caption +
        '</strong><br /><a href="' +
        img.url +
        '" target="_blank" rel="noopener">' +
        img.source +
        '</a><br />' +
        img.license +
        ' · ' +
        img.year +
        '</div></div>';
    }
    root.innerHTML = html;

    let list = '<ul class="source-list">';
    for (let t = 0; t < texts.length; t++) {
      list +=
        '<li><a href="' +
        texts[t].url +
        '" target="_blank" rel="noopener">' +
        texts[t].title +
        '</a> — ' +
        texts[t].publisher +
        ', ' +
        texts[t].year +
        '</li>';
    }
    list += '</ul>';
    document.getElementById('text-sources').innerHTML = list;
  }

  function start() {
    renderCredits();
    window.addEventListener('memory-lab:lang', renderCredits);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
