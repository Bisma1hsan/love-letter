/**
 * Digital Letter — script.js (Standalone Edition)
 */

'use strict';

/* ════════════════════════════════════════════════════════════
   CONSTANTS
   ════════════════════════════════════════════════════════════ */
const TW_CHAR_DELAY = 75;  // Kecepatan ketik per karakter (ms)
const TW_PARA_PAUSE = 800; // Jeda antar paragraf (ms)

/* ════════════════════════════════════════════════════════════
   STATE MACHINE & THEME
   ════════════════════════════════════════════════════════════ */
function showState(stateId) {
  ['loading', 'envelope', 'letter'].forEach(id => {
    const el = document.getElementById(`state-${id}`);
    if (el) el.classList.toggle('hidden', id !== stateId);
  });
}

const THEME_MAP = {
  'blush-cream': null,
  'cream': null,
  'sage': 'sage',
  'dusty-rose': 'dusty-rose',
  'midnight': 'midnight',
  'midnight-blue': 'midnight',
  'crimson': 'crimson',
  'obsidian': 'obsidian',
};

function applyTheme(theme) {
  const attr = Object.prototype.hasOwnProperty.call(THEME_MAP, theme) ? THEME_MAP[theme] : null;
  if (attr) {
    document.documentElement.setAttribute('data-theme', attr);
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

/* ════════════════════════════════════════════════════════════
   INIT — ENTRY POINT
   ════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', init);

async function init() {
  showState('loading');

  const params = new URLSearchParams(window.location.search);
  const rawConfig = (window.STANDALONE_CONFIG && Object.keys(window.STANDALONE_CONFIG).length > 0)
    ? window.STANDALONE_CONFIG
    : {};
  const config = _normalizeConfig(rawConfig);

  if (window.LetterI18n?.initGift) {
    window.LetterI18n.initGift(config);
  }

  // Prioritaskan query param ?theme= atau ?texture= jika ingin tes cepat lewat URL
  const activeTheme = params.get('theme') || config.theme || 'blush-cream';
  const showPremiumTexture = (config.paperTexture === 'handmade') || (params.get('texture') === 'handmade');
  applyTheme(activeTheme);
  config.theme = activeTheme;

  const paperEl = document.getElementById('letter-paper');
  const envWrapper = document.getElementById('envelope-wrapper');
  if (paperEl) paperEl.classList.toggle('is-premium-paper', showPremiumTexture);
  if (envWrapper) envWrapper.classList.toggle('is-premium-envelope', showPremiumTexture);

  _renderLetterSkeleton();

  // Siapkan pemutar musik
  if (config.playlist.length > 0) {
    const audio = _audioEl();
    audio.src = config.playlist[0].src || config.playlist[0].url || '';
    audio.load();
  }
  _initMusicPlayer(config);
  _initDownloadButton(config);

  // Set nama penerima di amplop
  const envName = document.getElementById('env-to-name');
  if (envName) {
    const cleanName = (config.recipientName || config.to || '')
      .replace(/^(Dearest|Dear|To)[:,\s]+/i, '')
      .replace(/[,;:.]\s*$/, '')
      .trim();
    envName.textContent = cleanName || 'kamu';
  }

  // Mode skip animasi (?skipTW=1) untuk pratinjau cepat saat mengedit teks
  if (params.get('skipTW') === '1') {
    config._forceSkipTW = true;
    showState('letter');
    if (window.Particles) window.Particles.init(activeTheme);
    if (paperEl) {
      requestAnimationFrame(() => requestAnimationFrame(() => paperEl.classList.add('is-revealing')));
    }
    await _delay(300);
    await _typewriteLetter(config);
    return;
  }

  // Alur normal: Amplop -> Kelopak Bunga -> Kertas Surat
  showState('envelope');
  await _waitForEnvelopeOpen(config, activeTheme);

  await new Promise(resolve => {
    window.addEventListener('flowers-gone', resolve, { once: true });
  });

  showState('letter');
  if (window.Particles) window.Particles.init(activeTheme);

  if (paperEl) {
    requestAnimationFrame(() => requestAnimationFrame(() => paperEl.classList.add('is-revealing')));
  }

  await _delay(1350);
  await _typewriteLetter(config);
}

/* ════════════════════════════════════════════════════════════
   CONFIG NORMALIZATION
   ════════════════════════════════════════════════════════════ */
function _normalizeConfig(raw) {
  return {
    locale: raw.locale === 'id' || raw.locale === 'en' ? raw.locale : 'id',
    recipientName: raw.recipientName || raw.to || '',
    to: raw.to || 'Dear,',
    title: raw.title || '',
    from: raw.from || '',
    letter_body: raw.letter_body || raw.message || '',
    date: raw.date || '',
    playlist: Array.isArray(raw.playlist) ? raw.playlist : [],
    theme: raw.theme || 'blush-cream',
    salutation: raw.letterTo || raw.salutation || raw.to || 'Dear,',
    fontFamily: raw.fontFamily || 'caveat',
    fontSize: raw.fontSize || 'size-medium',
    login_password: raw.login_password || '',
    login_hint: raw.login_hint || '',
    secretMediaList: _normalizeMediaList(raw),
    paperTexture: raw.paperTexture || '',
  };
}

function _normalizeMediaList(raw) {
  if (Array.isArray(raw.secretMediaList) && raw.secretMediaList.length) {
    return raw.secretMediaList.slice(0, 10).filter(m => m && m.url);
  }
  if (raw.secretMedia || raw.secret_media) {
    return [{ url: raw.secretMedia || raw.secret_media, caption: raw.secretCaption || raw.secret_caption || '' }];
  }
  return [];
}

/* ════════════════════════════════════════════════════════════
   ENVELOPE & FLOWER TRANSITION
   ════════════════════════════════════════════════════════════ */
function _waitForEnvelopeOpen(config, activeTheme) {
  return new Promise(resolve => {
    const scene = document.getElementById('envelope-scene');
    const wrapper = document.getElementById('envelope-wrapper');
    const hint = document.getElementById('envelope-hint');

    async function openEnvelope() {
      wrapper.removeEventListener('click', openEnvelope);
      wrapper.removeEventListener('keydown', onKeydown);

      if (config.login_password && config.login_password.trim() !== '') {
        await _handleAuthentication(config);
      }

      if (window.__playMusic) window.__playMusic();
      if (hint) hint.style.opacity = '0';

      wrapper.classList.add('is-opening');

      setTimeout(async () => {
        if (scene) scene.classList.add('is-exit');
        await _playFlowerTransition(activeTheme || config.theme);
        resolve();
      }, 1100);
    }

    function onKeydown(e) {
      if (e.key === 'Enter' || e.key === ' ') openEnvelope();
    }

    wrapper.addEventListener('click', openEnvelope);
    wrapper.addEventListener('keydown', onKeydown);
  });
}

async function _playFlowerTransition(theme) {
  const container = document.createElement('div');
  Object.assign(container.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '9999',
    pointerEvents: 'none',
    overflow: 'hidden'
  });
  document.body.appendChild(container);

  // Gunakan flower1.png & flower2.png sebagai fallback aman jika aset tema lain tidak tersedia
  const flowerAssets = ['./assets/flower1.png', './assets/flower2.png'];

  const slotSize = 100;
  const cols = Math.ceil(window.innerWidth / slotSize) + 2;
  const rows = Math.ceil(window.innerHeight / slotSize) + 2;
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);

  const flowers = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c - 0.5) * slotSize + (Math.random() - 0.5) * slotSize * 0.8;
      const y = (r - 0.5) * slotSize + (Math.random() - 0.5) * slotSize * 0.8;
      const dist = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
      const rippleDelay = (dist / maxDist) * 1200;
      flowers.push({ x, y, delay: rippleDelay + Math.random() * 200, rippleDelay });
    }
  }

  return new Promise(resolveTransition => {
    let bloomed = 0;
    flowers.forEach((f, i) => {
      const img = document.createElement('img');
      f.img = img;
      img.src = flowerAssets[i % flowerAssets.length];
      const rotation = Math.random() * 360;
      f.finalRotation = rotation + (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 180);
      f.finalScale = 1.0 + Math.random() * 1.8;

      Object.assign(img.style, {
        position: 'absolute',
        left: `${f.x}px`,
        top: `${f.y}px`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(0)`,
        opacity: '0',
        willChange: 'transform, opacity',
        transition: 'transform 1.2s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.8s ease-in-out',
        width: '150px',
        height: 'auto'
      });

      container.appendChild(img);

      setTimeout(() => {
        img.style.opacity = '1';
        img.style.transform = `translate(-50%, -50%) rotate(${f.finalRotation}deg) scale(${f.finalScale})`;
        bloomed++;

        if (bloomed === flowers.length) {
          resolveTransition();

          setTimeout(() => {
            let maxFallDelay = 0;
            flowers.forEach(flower => {
              const fallDelay = flower.rippleDelay + Math.random() * 100;
              if (fallDelay > maxFallDelay) maxFallDelay = fallDelay;

              setTimeout(() => {
                const fallDuration = 2.0 + Math.random();
                flower.img.style.transition = `transform ${fallDuration}s ease-in, opacity ${fallDuration - 0.5}s ease-in-out`;
                flower.img.style.opacity = '0';
                const fallY = 100 + Math.random() * 150;
                const extraRot = (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 30);
                flower.img.style.transform = `translate(-50%, calc(-50% + ${fallY}px)) rotate(${flower.finalRotation + extraRot}deg) scale(${flower.finalScale})`;
              }, fallDelay);
            });

            setTimeout(() => {
              container.remove();
              window.dispatchEvent(new CustomEvent('flowers-gone'));
            }, maxFallDelay + 1200);
          }, 600);
        }
      }, f.delay);
    });
  });
}

/* ════════════════════════════════════════════════════════════
   TYPEWRITER ENGINE
   ════════════════════════════════════════════════════════════ */
function _renderLetterSkeleton() {
  ['letter-date', 'letter-title', 'letter-to', 'letter-from'].forEach(id => _setText(id, ''));
  const bodyEl = document.getElementById('letter-body');
  if (bodyEl) bodyEl.innerHTML = '';
}

async function _typewriteLetter(config) {
  const params = new URLSearchParams(window.location.search);
  const skipTW = params.get('skipTW') === '1' || config._forceSkipTW === true;

  if (skipTW) {
    if (config.title) _setText('letter-title', config.title);
    if (config.date) _setText('letter-date', config.date);
    if (config.salutation) _setText('letter-to', config.salutation);

    const bodyEl = document.getElementById('letter-body');
    if (bodyEl) {
      if (config.fontFamily) bodyEl.classList.add(`font-${config.fontFamily}`);
      if (config.fontSize) bodyEl.classList.add(config.fontSize);
      const paragraphs = (config.letter_body || '').trim().split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
      bodyEl.innerHTML = paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
    }

    if (config.from) _setText('letter-from', config.from);
    _revealActionButtons(config);
    return;
  }

  if (config.title) {
    await _typewriteSimple('letter-title', config.title, 80);
    await _delay(600);
  }
  if (config.date) {
    await _typewriteSimple('letter-date', config.date, 60);
    await _delay(300);
  }
  if (config.salutation) {
    await _typewriteSimple('letter-to', config.salutation, 80);
    await _delay(800);
  }

  const bodyEl = document.getElementById('letter-body');
  if (bodyEl) {
    if (config.fontFamily) bodyEl.classList.add(`font-${config.fontFamily}`);
    if (config.fontSize) bodyEl.classList.add(config.fontSize);

    const paragraphs = (config.letter_body || '').trim().split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
    const cursor = document.createElement('span');
    cursor.className = 'typewriter-cursor';
    cursor.setAttribute('aria-hidden', 'true');

    for (const para of paragraphs) {
      const p = document.createElement('p');
      p.style.opacity = '0';
      bodyEl.appendChild(p);
      p.appendChild(cursor);

      await _delay(150);
      p.style.transition = 'opacity 0.4s';
      p.style.opacity = '1';

      for (const ch of para) {
        if (ch === '\n') {
          p.insertBefore(document.createElement('br'), cursor);
          await _delay(TW_CHAR_DELAY * 4);
        } else {
          p.insertBefore(document.createTextNode(ch), cursor);
          const isAtBottom = (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 120);
          if (isAtBottom) cursor.scrollIntoView({ block: 'nearest', behavior: 'auto' });

          const delay = ['.', ',', '!', '?'].includes(ch)
            ? TW_CHAR_DELAY * 4
            : TW_CHAR_DELAY + (Math.random() * 12 - 6);
          await _delay(delay);
        }
      }
      cursor.remove();
      await _delay(TW_PARA_PAUSE);
    }
  }

  if (config.from) {
    await _delay(800);
    await _typewriteSimple('letter-from', config.from, 110);
  }

  await _delay(1500);
  _revealActionButtons(config);
}

function _revealActionButtons(config) {
  const saveBtnContainer = document.getElementById('save-letter-container');
  const secretBtn = document.getElementById('btn-secret-memory');

  if (saveBtnContainer) {
    if (config.secretMediaList && config.secretMediaList.length && secretBtn) {
      secretBtn.style.display = 'inline-flex';
    }
    saveBtnContainer.style.display = 'block';
    setTimeout(() => { saveBtnContainer.style.opacity = '1'; }, 50);
  }

  _initSecretMemory(config);

  if (config.secretMediaList && config.secretMediaList.length && secretBtn && !config._forceSkipTW) {
    setTimeout(() => {
      document.getElementById('letter-end')?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      secretBtn.click();
    }, 150);
  }
}

async function _typewriteSimple(elId, text, speed) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.style.display = '';
  el.textContent = '';
  for (const ch of text) {
    el.textContent += ch;
    await _delay(speed);
  }
}

/* ════════════════════════════════════════════════════════════
   SECRET MEMORY MODAL
   ════════════════════════════════════════════════════════════ */
function _initSecretMemory(config) {
  const modal = document.getElementById('modal-secret-memory');
  const openBtn = document.getElementById('btn-secret-memory');
  const closeBtn = document.getElementById('btn-close-memory');
  const mediaWrap = document.getElementById('polaroid-media-wrap');
  const captionEl = document.getElementById('polaroid-caption');
  const polaroid = document.getElementById('polaroid-frame');
  const prevBtn = document.getElementById('btn-memory-prev');
  const nextBtn = document.getElementById('btn-memory-next');
  const counterEl = document.getElementById('polaroid-counter');

  const list = config.secretMediaList || [];
  if (!modal || !openBtn || list.length === 0) return;

  let currentIndex = 0;

  function _renderSlide(idx) {
    const item = list[idx];
    if (!item) return;

    const oldVid = mediaWrap.querySelector('video');
    if (oldVid) oldVid.pause();
    mediaWrap.innerHTML = '';

    const isVideo = /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(item.url);
    if (isVideo) {
      const vid = document.createElement('video');
      vid.src = item.url;
      vid.autoplay = true;
      vid.loop = true;
      vid.muted = true;
      vid.playsInline = true;
      vid.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;border-radius:1px;';
      mediaWrap.appendChild(vid);
      vid.play().catch(() => {});
    } else {
      const img = document.createElement('img');
      img.src = item.url;
      img.alt = item.caption || 'Memory';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;border-radius:1px;';
      mediaWrap.appendChild(img);
    }

    if (captionEl) captionEl.textContent = item.caption || '';

    if (list.length > 1 && counterEl) {
      counterEl.textContent = `${idx + 1} / ${list.length}`;
      counterEl.style.display = 'block';
    }

    const rot = idx % 2 === 0 ? '-2.5deg' : '2deg';
    if (polaroid) polaroid.style.transform = `rotate(${rot}) translateY(0) scale(1)`;
  }

  function _goTo(idx) {
    currentIndex = (idx + list.length) % list.length;
    _renderSlide(currentIndex);
  }

  function _openModal() {
    currentIndex = 0;
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');

    if (list.length > 1) {
      if (prevBtn) prevBtn.style.display = 'flex';
      if (nextBtn) nextBtn.style.display = 'flex';
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        modal.style.background = 'rgba(10, 8, 6, 0.92)';
        modal.style.backdropFilter = 'blur(12px)';
        modal.style.webkitBackdropFilter = 'blur(12px)';
      });
    });

    setTimeout(() => {
      if (polaroid) {
        polaroid.style.opacity = '1';
        polaroid.style.filter = 'blur(0px)';
      }
      _renderSlide(0);
    }, 120);
  }

  function _closeModal() {
    if (polaroid) {
      polaroid.style.transform = 'rotate(-2.5deg) translateY(40px) scale(0.88)';
      polaroid.style.opacity = '0';
      polaroid.style.filter = 'blur(8px)';
    }
    modal.style.background = 'rgba(10, 8, 6, 0)';
    modal.style.backdropFilter = 'blur(0px)';
    modal.style.webkitBackdropFilter = 'blur(0px)';
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
    if (counterEl) counterEl.style.display = 'none';

    setTimeout(() => {
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
      const vid = mediaWrap ? mediaWrap.querySelector('video') : null;
      if (vid) vid.pause();
      if (mediaWrap) mediaWrap.innerHTML = '';
    }, 750);
  }

  openBtn.addEventListener('click', _openModal);
  if (closeBtn) closeBtn.addEventListener('click', _closeModal);
  if (prevBtn) prevBtn.addEventListener('click', () => _goTo(currentIndex - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => _goTo(currentIndex + 1));
  modal.addEventListener('click', e => { if (e.target === modal) _closeModal(); });

  document.addEventListener('keydown', e => {
    if (modal.style.display === 'none') return;
    if (e.key === 'Escape') _closeModal();
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') _goTo(currentIndex + 1);
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') _goTo(currentIndex - 1);
  });
}

/* ════════════════════════════════════════════════════════════
   DOWNLOAD / SCREENSHOT (IG STORY PNG)
   ════════════════════════════════════════════════════════════ */
const _THEME_BG = {
  'sage': ['#dce8da', '#c8d8c6'],
  'dusty-rose': ['#f5dada', '#ead0d0'],
  'midnight': ['#1a1f2e', '#111624'],
  'blush-cream': ['#f5e8d8', '#ecdccb'],
  'crimson': ['#1a050a', '#120308'],
  'obsidian': ['#050a07', '#0a100c'],
  'default': ['#f5e8d8', '#ecdccb'],
};

function _initDownloadButton(config) {
  const btn = document.getElementById('btn-save-letter');
  if (!btn) return;

  const _doCapture = async () => {
    let resultBlob = null;
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Menyimpan... ⏳';
    btn.style.opacity = '0.7';
    btn.style.pointerEvents = 'none';

    const targetEl = document.getElementById('letter-paper');
    const btnContainer = document.getElementById('save-letter-container');
    const scrollWrapper = document.querySelector('.letter-scroll');

    try {
      if (scrollWrapper) scrollWrapper.style.overflow = 'hidden';
      if (btnContainer) btnContainer.style.display = 'none';

      await window.LetterDownloadFlow?.waitForAssets(targetEl);

      const themeKey = (config.theme || 'default').replace('midnight-blue', 'midnight');
      const [bgTop, bgBot] = _THEME_BG[themeKey] || _THEME_BG.default;
      const isDark = ['midnight', 'crimson', 'obsidian'].includes(themeKey);

      if (window.LetterDownloadFlow?.isMobileDevice()) {
        resultBlob = await window.LetterDownloadFlow.createMobilePng(targetEl, {
          backgroundTop: bgTop,
          backgroundBottom: bgBot,
          paperTop: isDark ? bgTop : '#fffaf2',
          paperBottom: isDark ? bgBot : '#f2e5d4',
          borderColor: isDark ? 'rgba(235,206,165,.36)' : 'rgba(122,88,55,.30)',
          lineColor: isDark ? 'rgba(255,255,255,.055)' : 'rgba(122,88,55,.065)',
          accentColor: isDark ? 'rgba(235,206,165,.42)' : 'rgba(122,88,55,.32)'
        });
        return resultBlob;
      }

      const letterCanvas = await html2canvas(targetEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        onclone: clonedDoc => {
          const currentTheme = document.documentElement.getAttribute('data-theme');
          if (currentTheme) {
            clonedDoc.documentElement.setAttribute('data-theme', currentTheme);
            clonedDoc.body.setAttribute('data-theme', currentTheme);
            const paper = clonedDoc.getElementById('letter-paper');
            if (paper) {
              paper.setAttribute('data-theme', currentTheme);
              paper.style.animation = 'none';
              paper.style.filter = 'none';
              paper.style.transform = 'none';
              paper.style.opacity = '1';
            }
          }
          clonedDoc.querySelectorAll('svg path').forEach(el => {
            el.style.animation = 'none';
            el.style.strokeDashoffset = '0';
            el.style.strokeDasharray = 'none';
            el.style.opacity = '1';
          });
          clonedDoc.querySelectorAll('svg circle, .ornament-top, .letter-title-underline').forEach(el => {
            el.style.animation = 'none';
            el.style.opacity = '1';
            el.style.transform = 'none';
          });
        }
      });

      const STORY_W = 1080;
      const STORY_H = 1920;
      const PADDING = 80;
      const story = document.createElement('canvas');
      story.width = STORY_W;
      story.height = STORY_H;
      const ctx = story.getContext('2d');

      const grad = ctx.createLinearGradient(0, 0, 0, STORY_H);
      grad.addColorStop(0, bgTop);
      grad.addColorStop(0.5, bgBot);
      grad.addColorStop(1, bgTop);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, STORY_W, STORY_H);

      const scale = Math.min((STORY_W - PADDING * 2) / letterCanvas.width, (STORY_H - PADDING * 2) / letterCanvas.height, 1);
      const drawW = Math.round(letterCanvas.width * scale);
      const drawH = Math.round(letterCanvas.height * scale);
      const drawX = Math.round((STORY_W - drawW) / 2);
      const drawY = Math.round((STORY_H - drawH) / 2);

      ctx.save();
      ctx.shadowColor = isDark ? 'rgba(0,0,0,0.8)' : 'rgba(60,30,20,0.18)';
      ctx.shadowBlur = 48;
      ctx.shadowOffsetY = 12;
      ctx.fillStyle = isDark ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.01)';
      ctx.fillRect(drawX, drawY, drawW, drawH);
      ctx.restore();

      ctx.drawImage(letterCanvas, drawX, drawY, drawW, drawH);

      resultBlob = await new Promise(resolve => {
        story.toBlob(blob => resolve(blob || null), 'image/png');
      });

      letterCanvas.width = 0; letterCanvas.height = 0;
      story.width = 0; story.height = 0;
    } finally {
      if (btnContainer) btnContainer.style.display = 'block';
      if (scrollWrapper) scrollWrapper.style.overflow = 'auto';
      btn.innerHTML = originalText;
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
    }
    return resultBlob;
  };

  btn.addEventListener('click', () => {
    if (typeof html2canvas === 'undefined' || !window.LetterDownloadFlow) {
      alert('Fitur simpan PNG belum siap. Muat ulang halaman lalu coba kembali.');
      return;
    }
    const safeName = (config.recipientName || config.to || 'Kamu').replace(/[^a-zA-Z0-9]/g, '_');
    window.LetterDownloadFlow.run({
      button: btn,
      filename: `Surat_Untuk_${safeName}.png`,
      createBlob: _doCapture
    });
  });
}

/* ════════════════════════════════════════════════════════════
   MUSIC PLAYER FAB
   ════════════════════════════════════════════════════════════ */
const _audioEl = () => document.getElementById('audio-player');

function _initMusicPlayer(config) {
  const audio = _audioEl();
  const playlist = config.playlist || [];
  if (!audio || playlist.length === 0) return;

  let trackIdx = 0;
  let playing = false;

  const fab = document.createElement('button');
  fab.id = 'music-player-fab';
  fab.setAttribute('aria-label', 'Toggle music');
  fab.innerHTML = `<span id="music-fab-icon">♪</span><div class="music-slash"></div>`;
  document.body.appendChild(fab);

  const setTrack = idx => {
    trackIdx = idx;
    const t = playlist[idx];
    audio.src = t.src || t.url || t;
    audio.volume = 0.25;
    audio.load();
  };

  setTrack(0);

  const tryPlay = async () => {
    try {
      await audio.play();
      playing = true;
      fab.classList.remove('muted');
    } catch (_) {
      playing = false;
      fab.classList.add('muted');
    }
  };

  window.__playMusic = tryPlay;

  fab.addEventListener('click', async () => {
    if (playing) {
      audio.pause();
      playing = false;
      fab.classList.add('muted');
    } else {
      await tryPlay();
    }
  });

  audio.addEventListener('ended', () => {
    if (trackIdx < playlist.length - 1) {
      setTrack(trackIdx + 1);
      tryPlay();
    } else {
      playing = false;
      fab.classList.add('muted');
    }
  });

  setTimeout(() => fab.classList.add('visible'), 2000);
}

/* ════════════════════════════════════════════════════════════
   HELPERS & PASSWORD GATE
   ════════════════════════════════════════════════════════════ */
function _setText(id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  if (text) {
    el.textContent = text;
    el.style.display = '';
  } else {
    el.textContent = '';
    el.style.display = 'none';
  }
}

function _delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function _handleAuthentication(config) {
  const gateEl = document.getElementById('password-gate');
  const passInput = document.getElementById('gate-password-input');
  const verifyBtn = document.getElementById('btn-gate-verify');
  const hintContainer = document.getElementById('gate-hint-container');
  const hintText = document.getElementById('gate-hint-text');
  const errorEl = document.getElementById('gate-error');

  if (!config.login_password || config.login_password.trim() === '') return;

  return new Promise(resolve => {
    gateEl.classList.remove('hidden');
    gateEl.style.opacity = '0';
    gateEl.style.display = 'flex';
    void gateEl.offsetWidth;
    gateEl.style.opacity = '1';

    if (config.login_hint) {
      hintText.textContent = config.login_hint;
      hintContainer.classList.remove('hidden');
    }

    const checkPassword = () => {
      const inputPass = passInput.value.trim().toLowerCase();
      const actualPass = config.login_password.trim().toLowerCase();
      const card = gateEl.querySelector('.gate-card');

      if (inputPass === actualPass) {
        gateEl.style.opacity = '0';
        setTimeout(() => {
          gateEl.classList.add('hidden');
          resolve();
        }, 700);
      } else {
        errorEl.classList.remove('hidden');
        passInput.value = '';
        passInput.focus();
        card.classList.remove('gate-shake');
        void card.offsetWidth;
        card.classList.add('gate-shake');
        if (window.navigator?.vibrate) window.navigator.vibrate(50);
      }
    };

    verifyBtn.addEventListener('click', checkPassword);
    passInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') checkPassword();
    });
  });
}