/**
 * loader.js — GEMAR-KKP Page Loading Overlay
 *
 * API:
 *   PageLoader.start(message)      — show overlay, start animated progress
 *   PageLoader.setMessage(msg)     — update status text mid-load
 *   PageLoader.finish()            — complete to 100% → fade out
 *   PageLoader.error(msg, retryFn) — freeze bar (red), show error panel
 */

const PageLoader = (() => {
  let overlay   = null;
  let barEl     = null;
  let msgEl     = null;
  let pctEl     = null;
  let errorEl   = null;
  let animId    = null;
  let progress  = 0;
  let _retryFn  = null;

  /* ── CSS injected once ──────────────────────────────────────── */
  function injectCSS() {
    if (document.getElementById('pl-style')) return;
    const s = document.createElement('style');
    s.id = 'pl-style';
    s.textContent = `
      #pl-overlay {
        position: fixed; inset: 0; z-index: 99999;
        background: #fff;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        font-family: 'Poppins', system-ui, sans-serif;
        transition: opacity 0.35s ease;
      }
      #pl-overlay.pl-hide {
        opacity: 0; pointer-events: none;
      }
      #pl-logo-row {
        display: flex; align-items: center; gap: 12px;
        margin-bottom: 32px;
      }
      #pl-logo {
        width: 42px; height: 42px;
        animation: pl-bob 2.8s ease-in-out infinite;
      }
      @keyframes pl-bob {
        0%,100% { transform: translateY(0); }
        50%      { transform: translateY(-7px); }
      }
      #pl-brand {
        font-size: 20px; font-weight: 800;
        color: #1B2068; letter-spacing: -0.4px; line-height:1;
      }
      #pl-brand small {
        display: block; font-size: 10px; font-weight: 400;
        letter-spacing: 2px; text-transform: uppercase;
        color: #8892B0; margin-top: 4px;
      }
      #pl-inner {
        width: 100%; max-width: 300px;
        text-align: center; padding: 0 24px;
      }
      #pl-msg {
        font-size: 14px; color: #5A6480;
        margin-bottom: 14px; min-height: 20px;
        transition: opacity 0.2s;
      }
      #pl-track {
        width: 100%; height: 5px;
        background: #F0F2FF; border-radius: 99px;
        overflow: hidden; margin-bottom: 8px;
        box-shadow: inset 0 1px 3px rgba(27,32,104,0.08);
      }
      #pl-bar {
        height: 100%; width: 0%;
        background: linear-gradient(90deg, #1B2068 0%, #3535EE 100%);
        border-radius: 99px;
        transition: width 0.35s cubic-bezier(0.4,0,0.2,1);
        box-shadow: 0 0 8px rgba(53,53,238,0.45);
        position: relative;
      }
      /* Shimmer on bar */
      #pl-bar::after {
        content: '';
        position: absolute; top: 0; left: -60%; width: 60%; height: 100%;
        background: linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent);
        animation: pl-shimmer 1.4s ease infinite;
      }
      @keyframes pl-shimmer {
        0%   { left: -60%; }
        100% { left: 110%; }
      }
      #pl-pct {
        font-size: 11px; color: #A0AABB;
        letter-spacing: 0.5px; font-weight: 500;
      }
      /* ── Error panel ─────────────────────────────── */
      #pl-error {
        display: none; margin-top: 20px;
        padding: 14px 16px;
        background: #FEF2F2;
        border: 1px solid #FECACA;
        border-left: 4px solid #DC2626;
        border-radius: 10px; text-align: left;
      }
      #pl-error-title {
        font-size: 13.5px; font-weight: 700;
        color: #991B1B; margin-bottom: 4px;
        display: flex; align-items: center; gap: 6px;
      }
      #pl-error-body {
        font-size: 13px; color: #B91C1C; line-height: 1.55;
      }
      #pl-retry {
        display: none; margin-top: 14px; width: 100%;
        padding: 10px 20px;
        background: linear-gradient(135deg, #1B2068, #3535EE);
        color: white; border: none; border-radius: 10px;
        font-size: 13.5px; font-weight: 600;
        cursor: pointer; font-family: inherit;
        box-shadow: 0 2px 10px rgba(53,53,238,0.30);
        transition: all 0.2s;
      }
      #pl-retry:hover {
        box-shadow: 0 4px 16px rgba(53,53,238,0.40);
        transform: translateY(-1px);
      }
      /* ── Ocean wave decoration ───────────────────── */
      #pl-wave {
        position: absolute; bottom: 0; left: 0; right: 0;
        height: 70px; pointer-events: none; overflow: hidden;
      }
      #pl-wave svg { width: 100%; height: 100%; display: block; }
      #pl-wave-path1 { animation: pl-wave 10s ease-in-out infinite; }
      #pl-wave-path2 { animation: pl-wave 14s ease-in-out infinite reverse; }
      @keyframes pl-wave {
        0%,100% { transform: translateX(0); }
        50%      { transform: translateX(-20px); }
      }
    `;
    document.head.appendChild(s);
  }

  /* ── Build DOM ──────────────────────────────────────────────── */
  function build() {
    if (overlay) return;
    injectCSS();

    overlay = document.createElement('div');
    overlay.id = 'pl-overlay';
    overlay.innerHTML = `
      <div id="pl-logo-row">
        <img id="pl-logo" src="../assets/img/logo.svg" alt=""
             onerror="this.style.display='none'">
        <div id="pl-brand">GEMAR-KKP<small>Sistem Pelaporan Energi</small></div>
      </div>
      <div id="pl-inner">
        <div id="pl-msg">Memuat halaman...</div>
        <div id="pl-track"><div id="pl-bar"></div></div>
        <div id="pl-pct">0%</div>
        <div id="pl-error">
          <div id="pl-error-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Gagal Memuat Data
          </div>
          <div id="pl-error-body"></div>
          <button id="pl-retry" onclick="PageLoader._retry()">
            ↺ &nbsp;Coba Lagi
          </button>
        </div>
      </div>
      <div id="pl-wave">
        <svg viewBox="0 0 1440 70" preserveAspectRatio="none"
             xmlns="http://www.w3.org/2000/svg">
          <path id="pl-wave-path1"
            d="M0,35 Q360,5 720,35 T1440,35 L1440,70 L0,70 Z"
            fill="#F0F2FF" opacity="0.9"/>
          <path id="pl-wave-path2"
            d="M0,50 Q360,25 720,50 T1440,50 L1440,70 L0,70 Z"
            fill="#E8ECFF" opacity="0.7"/>
        </svg>
      </div>
    `;

    barEl   = overlay.querySelector('#pl-bar');
    msgEl   = overlay.querySelector('#pl-msg');
    pctEl   = overlay.querySelector('#pl-pct');
    errorEl = overlay.querySelector('#pl-error');

    /* Append before body content loads if possible */
    if (document.body) {
      document.body.insertBefore(overlay, document.body.firstChild);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.insertBefore(overlay, document.body.firstChild);
      });
    }
  }

  /* ── Progress helpers ───────────────────────────────────────── */
  function setProgress(pct) {
    progress = Math.max(0, Math.min(100, pct));
    if (barEl)  barEl.style.width  = progress + '%';
    if (pctEl)  pctEl.textContent  = Math.round(progress) + '%';
  }

  /* Ease-out cubic tween from current progress → target */
  function tweenTo(target, durationMs, onDone) {
    if (animId) cancelAnimationFrame(animId);
    const from  = progress;
    const start = performance.now();

    function tick(now) {
      const t = Math.min((now - start) / durationMs, 1);
      const e = 1 - Math.pow(1 - t, 3);           // ease-out cubic
      setProgress(from + (target - from) * e);
      if (t < 1) {
        animId = requestAnimationFrame(tick);
      } else {
        animId = null;
        onDone && onDone();
      }
    }
    animId = requestAnimationFrame(tick);
  }

  /* Slow crawl: ~0.35% per second, stops at 93% */
  function crawl() {
    if (animId) cancelAnimationFrame(animId);
    let last = performance.now();
    function tick(now) {
      const dt = now - last;
      last = now;
      if (progress < 93) {
        setProgress(progress + (dt / 1000) * 0.35);
        animId = requestAnimationFrame(tick);
      } else {
        animId = null;
      }
    }
    animId = requestAnimationFrame(tick);
  }

  /* ── Public API ─────────────────────────────────────────────── */
  function start(msg) {
    build();
    progress = 0;
    setProgress(0);
    if (barEl)   barEl.style.background = 'linear-gradient(90deg,#1B2068,#3535EE)';
    if (msgEl)   msgEl.textContent      = msg || 'Memuat data...';
    if (errorEl) errorEl.style.display  = 'none';
    const retryBtn = overlay && overlay.querySelector('#pl-retry');
    if (retryBtn) retryBtn.style.display = 'none';
    overlay.classList.remove('pl-hide');
    overlay.style.opacity = '1';

    /* Staged fake-progress that feels real: */
    tweenTo(32, 280, () => {          /* fast burst   0→32% */
      tweenTo(68, 900, () => {        /* medium pace 32→68% */
        tweenTo(85, 1600, () => {     /* slow build  68→85% */
          crawl();                    /* crawl       85→93% */
        });
      });
    });
  }

  function setMessage(msg) {
    if (msgEl) msgEl.textContent = msg;
  }

  function finish() {
    if (!overlay) return;
    if (animId) cancelAnimationFrame(animId);
    tweenTo(100, 220, () => {
      setTimeout(() => {
        overlay.classList.add('pl-hide');
        setTimeout(() => { overlay.style.display = 'none'; }, 380);
      }, 180);
    });
  }

  function error(msg, retryCallback) {
    if (!overlay) return;
    if (animId) cancelAnimationFrame(animId);
    if (barEl) barEl.style.background = '#DC2626';
    if (barEl) barEl.style.boxShadow  = '0 0 8px rgba(220,38,38,0.4)';
    if (msgEl) msgEl.textContent      = 'Gagal memuat data';
    if (errorEl) {
      errorEl.style.display = 'block';
      const bodyEl = errorEl.querySelector('#pl-error-body');
      if (bodyEl) bodyEl.textContent = msg || 'Terjadi kesalahan. Periksa koneksi internet Anda.';
    }
    _retryFn = retryCallback || null;
    const retryBtn = overlay && overlay.querySelector('#pl-retry');
    if (retryBtn) retryBtn.style.display = _retryFn ? 'block' : 'none';
  }

  function _retry() {
    if (!_retryFn) return;
    /* Reset to pre-error state then re-run */
    if (barEl)   barEl.style.background = 'linear-gradient(90deg,#1B2068,#3535EE)';
    if (barEl)   barEl.style.boxShadow  = '0 0 8px rgba(53,53,238,0.45)';
    if (errorEl) errorEl.style.display  = 'none';
    const retryBtn = overlay && overlay.querySelector('#pl-retry');
    if (retryBtn) retryBtn.style.display = 'none';
    progress = 0; setProgress(0);
    tweenTo(32, 280, () => {
      tweenTo(68, 900, () => {
        tweenTo(85, 1600, () => { crawl(); });
      });
    });
    _retryFn();
  }

  return { start, setMessage, finish, error, _retry };
})();
