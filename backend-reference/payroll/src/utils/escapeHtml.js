// HTML escaping helpers for server-rendered templates (PDF/email).
// Any value that comes from data must go through escapeHtml before being
// interpolated into HTML, so it is rendered as text and never as markup.

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

// For URLs placed in src="...": only https:// and data:image/ URLs are allowed,
// anything else (file://, http://, javascript:, relative/local paths) becomes ''.
function safeImageSrc(url) {
  if (url === null || url === undefined) return '';
  const value = String(url).trim();
  if (!/^https:\/\//i.test(value) && !/^data:image\//i.test(value)) return '';
  return escapeHtml(value);
}

module.exports = { escapeHtml, safeImageSrc };
