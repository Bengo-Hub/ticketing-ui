/*
 * Codevertex Ticketing web widget loader. No dependencies.
 *
 *   <script src="https://ticketing.codevertexafrica.com/widget.js" data-tenant="your-slug" async></script>
 *
 * Optional attributes on the script tag:
 *   data-theme     "light" or "dark" (default: follows the visitor's device)
 *   data-position  "right" or "left" (default: right)
 *   data-label     text for the button's tooltip and screen readers (default: "Help")
 *   data-color     button colour as a CSS colour (default: #6366f1)
 *
 * It adds a floating help button. The first click loads /support/widget for the tenant in an
 * iframe inside a panel; later clicks only show and hide it. Escape and the close button hide it.
 */
(function () {
  "use strict";

  if (window.__cvTicketingWidget) return;

  var script = document.currentScript;
  if (!script) {
    var found = document.querySelectorAll("script[data-tenant][src*='widget.js']");
    script = found[found.length - 1];
  }
  if (!script) return;

  var tenant = (script.getAttribute("data-tenant") || "").trim().toLowerCase();
  if (!tenant) {
    if (window.console) console.warn("Codevertex Ticketing widget: data-tenant is missing on the script tag.");
    return;
  }
  window.__cvTicketingWidget = true;

  var origin;
  try {
    origin = new URL(script.src, window.location.href).origin;
  } catch (e) {
    origin = "https://ticketing.codevertexafrica.com";
  }
  var theme = script.getAttribute("data-theme");
  var side = script.getAttribute("data-position") === "left" ? "left" : "right";
  var label = script.getAttribute("data-label") || "Help";
  var color = script.getAttribute("data-color") || "#6366f1";

  var src = origin + "/support/widget?tenant=" + encodeURIComponent(tenant);
  if (theme === "light" || theme === "dark") src += "&theme=" + theme;

  var Z = 2147483000;
  var ICON_HELP =
    '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>';
  var ICON_CLOSE =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

  function css(el, styles) {
    for (var k in styles) if (Object.prototype.hasOwnProperty.call(styles, k)) el.style[k] = styles[k];
  }

  var button = document.createElement("button");
  button.type = "button";
  button.title = label;
  button.setAttribute("aria-label", label);
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", "cv-ticketing-panel");
  button.innerHTML = ICON_HELP;
  css(button, {
    position: "fixed",
    bottom: "20px",
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    border: "0",
    padding: "0",
    margin: "0",
    background: color,
    color: "#ffffff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 6px 20px rgba(15, 23, 42, 0.25)",
    zIndex: String(Z),
  });
  button.style[side] = "20px";

  var panel = document.createElement("div");
  panel.id = "cv-ticketing-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", label);
  css(panel, {
    position: "fixed",
    display: "none",
    overflow: "hidden",
    background: theme === "dark" ? "#0b1120" : "#ffffff",
    boxShadow: "0 12px 40px rgba(15, 23, 42, 0.3)",
    zIndex: String(Z + 1),
  });

  var close = document.createElement("button");
  close.type = "button";
  close.setAttribute("aria-label", "Close");
  close.title = "Close";
  close.innerHTML = ICON_CLOSE;
  css(close, {
    position: "absolute",
    top: "6px",
    right: "6px",
    width: "36px",
    height: "36px",
    border: "0",
    borderRadius: "8px",
    padding: "0",
    background: "transparent",
    color: theme === "dark" ? "#f8fafc" : "#0f172a",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: "1",
  });
  panel.appendChild(close);

  var frame = null;

  /** Full screen on phones, a floating panel above the button from 480px up. */
  function layout() {
    var narrow = window.innerWidth < 480;
    if (narrow) {
      css(panel, { top: "0", left: "0", right: "0", bottom: "0", width: "100%", height: "100%", borderRadius: "0" });
    } else {
      css(panel, {
        top: "auto",
        left: side === "left" ? "20px" : "auto",
        right: side === "right" ? "20px" : "auto",
        bottom: "88px",
        width: "380px",
        height: Math.min(640, window.innerHeight - 108) + "px",
        borderRadius: "16px",
      });
    }
    // On phones the panel covers the button, so the close button inside it is the way out.
    button.style.display = narrow && isOpen() ? "none" : "flex";
  }

  function isOpen() {
    return panel.style.display !== "none";
  }

  function open() {
    if (!frame) {
      frame = document.createElement("iframe");
      frame.src = src;
      frame.title = label;
      frame.setAttribute("allow", "clipboard-write");
      css(frame, { width: "100%", height: "100%", border: "0", display: "block" });
      panel.appendChild(frame);
    }
    panel.style.display = "block";
    button.setAttribute("aria-expanded", "true");
    button.innerHTML = ICON_CLOSE;
    layout();
    close.focus();
  }

  function hide() {
    panel.style.display = "none";
    button.setAttribute("aria-expanded", "false");
    button.innerHTML = ICON_HELP;
    layout();
    button.focus();
  }

  button.addEventListener("click", function () {
    if (isOpen()) hide();
    else open();
  });
  close.addEventListener("click", hide);
  document.addEventListener("keydown", function (e) {
    if ((e.key === "Escape" || e.key === "Esc") && isOpen()) hide();
  });
  window.addEventListener("resize", function () {
    if (isOpen()) layout();
  });

  function mount() {
    document.body.appendChild(panel);
    document.body.appendChild(button);
    layout();
  }

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
