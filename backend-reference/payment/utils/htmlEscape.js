"use strict";

// F-PAY-19: HTML-escape user fields before interpolating into server-rendered templates.
const escapeHtml = (value) => {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

module.exports = { escapeHtml };
