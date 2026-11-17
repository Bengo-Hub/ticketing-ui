import { toPlainText } from "@/components/common/rich-text";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** AI text is plain text: blank lines become paragraphs and single line breaks stay as breaks. */
export function plainToHtml(text: string): string {
  return text
    .trim()
    .split(/\n\s*\n/)
    .map((para) => `<p>${escapeHtml(para.trim()).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/** A paragraph holding one link, for the reply editor. */
export function linkHtml(href: string, label: string): string {
  return `<p><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></p>`;
}

/** Adds HTML after what the editor already holds, or replaces an empty editor. */
export function appendHtml(current: string, html: string): string {
  return toPlainText(current) === "" ? html : `${current}${html}`;
}
