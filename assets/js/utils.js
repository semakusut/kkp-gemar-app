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
