/**
 * utils.js — GEMAR-KKP Shared Utilities
 * Loaded before auth.js in all dashboard pages.
 */

const NAMA_BULAN = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtNum(val) {
  return (parseFloat(val) || 0).toLocaleString('id-ID');
}

function fmtRp(val) {
  return 'Rp ' + (parseFloat(val) || 0).toLocaleString('id-ID');
}

function showToast(msg, type, duration) {
  var t = document.createElement('div');
  t.className = 'toast toast--' + type;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function () { t.remove(); }, duration || 4000);
}

/**
 * Bottom navigation bar untuk mobile PWA.
 * Panggil sekali setelah requireAuth(), pass nama halaman aktif.
 * activePage: 'dashboard' | 'buat' | 'list' | 'approval' | 'final' | 'admin' | 'profile'
 */
function initBottomNav(activePage) {
  var user = (typeof getUser === 'function') ? getUser() : null;
  var role = user ? user.role : null;

  var SVG = {
    dashboard: '<path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H15v-6h-6v6H4a1 1 0 01-1-1z"/>',
    buat:      '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    list:      '<rect x="5" y="3" width="14" height="18" rx="2"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>',
    approval:  '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 12l2 2 4-4"/>',
    final:     '<path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 3 14 8 20 8"/><path d="M9 13l2 2 4-4"/>',
    admin:     '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
    profile:   '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"/>',
    logout:    '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>'
  };

  var items = [];
  items.push({ id: 'dashboard', href: 'dashboard.html', label: 'Dashboard', icon: SVG.dashboard });

  if (role === 'upt_admin') {
    items.push({ id: 'buat',  href: 'laporan-bulanan.html', label: 'Buat Laporan', icon: SVG.buat });
    items.push({ id: 'list',  href: 'list-laporan.html',    label: 'Laporan',      icon: SVG.list });
  } else if (role === 'eselon1' || role === 'eselon2') {
    items.push({ id: 'approval', href: 'approval.html',      label: 'Approval', icon: SVG.approval });
    items.push({ id: 'list',     href: 'list-laporan.html',  label: 'Laporan',  icon: SVG.list });
  } else if (role === 'superadmin' || role === 'asisten_superadmin') {
    items.push({ id: 'approval', href: 'approval.html',      label: 'Approval', icon: SVG.approval });
    items.push({ id: 'final',    href: 'final-report.html',  label: 'Final',    icon: SVG.final });
    items.push({ id: 'list',     href: 'list-laporan.html',  label: 'Laporan',  icon: SVG.list });
    if (role === 'superadmin') {
      items.push({ id: 'admin', href: 'admin.html', label: 'Admin', icon: SVG.admin });
    }
  }

  items.push({ id: 'logout', href: '#', label: 'Keluar', icon: SVG.logout, isLogout: true });

  var nav = document.createElement('nav');
  nav.className = 'bottom-nav';
  nav.setAttribute('aria-label', 'Navigasi Utama');

  var wrap = document.createElement('div');
  wrap.className = 'bottom-nav__items';

  items.forEach(function(item) {
    var el = document.createElement('a');
    el.href = item.isLogout ? '#' : item.href;
    var cls = 'bottom-nav__item';
    if (item.id === activePage) cls += ' bottom-nav__item--active';
    if (item.isLogout) cls += ' bottom-nav__item--logout';
    el.className = cls;
    el.setAttribute('aria-label', item.label);
    if (item.isLogout) {
      el.addEventListener('click', function(e) { e.preventDefault(); handleLogout(); });
    }
    el.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      item.icon + '</svg><span>' + item.label + '</span>';
    wrap.appendChild(el);
  });

  nav.appendChild(wrap);
  // Append langsung ke body — di luar semua wrapper agar position:fixed bekerja
  document.body.appendChild(nav);
}
