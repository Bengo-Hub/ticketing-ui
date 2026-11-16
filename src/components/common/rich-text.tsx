"use client";

import { useMemo, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

/*
 * Long text is written with the shared RichTextEditor, which stores HTML. The shared package
 * exports `RichText` only as an alias of that editor and has no read-only renderer, so
 * RichTextView below renders stored HTML through an allow-list (the same approach as maskani-ui and
 * projects-ui). Older plain-text values show as paragraphs.
 */

const noopSubscribe = () => () => {};

const ALLOWED = new Set(["P", "BR", "H2", "H3", "STRONG", "B", "EM", "I", "S", "UL", "OL", "LI", "BLOCKQUOTE", "CODE", "PRE", "A"]);

/** Keeps only the editor's own tags and safe links. */
function clean(html: string): string {
  if (typeof window === "undefined" || !/<[a-z/][^>]*>/i.test(html)) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  const walk = (el: Element) => {
    for (const child of Array.from(el.children)) {
      if (!ALLOWED.has(child.tagName)) {
        // Script, style and frame bodies are dropped whole; any other unknown tag keeps its text.
        if (child.tagName === "SCRIPT" || child.tagName === "STYLE" || child.tagName === "IFRAME") child.remove();
        else child.replaceWith(...Array.from(child.childNodes));
        continue;
      }
      for (const attr of Array.from(child.attributes)) {
        const keep = child.tagName === "A" && attr.name === "href" && /^(https?:|mailto:|tel:)/i.test(attr.value);
        if (!keep) child.removeAttribute(attr.name);
      }
      if (child.tagName === "A") {
        child.setAttribute("target", "_blank");
        child.setAttribute("rel", "noopener noreferrer nofollow");
      }
      walk(child);
    }
  };
  // Unwrapping can expose nested disallowed tags, so the walk repeats until the tree is stable.
  let before = "";
  while (before !== doc.body.innerHTML) {
    before = doc.body.innerHTML;
    walk(doc.body);
  }
  return doc.body.innerHTML;
}

/** One-line preview of stored long text for lists and table cells: tags dropped, entities decoded. */
export function toPlainText(value?: string | null): string {
  if (!value) return "";
  const spaced = value.replace(/<\/(p|h2|h3|li|blockquote|pre)>|<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "");
  const decoded = spaced
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
  return decoded.replace(/\s+/g, " ").trim();
}

/** Shows stored long text: formatted when it came from the editor, as plain paragraphs otherwise. */
export function RichTextView({ value, className }: { value?: string | null; className?: string }) {
  const isHtml = !!value && /<[a-z/][^>]*>/i.test(value);
  // DOMParser exists only in the browser, so the server and the first client render show plain
  // text and the formatted version takes over after mount.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const html = useMemo(() => (mounted && value && isHtml ? clean(value) : ""), [mounted, value, isHtml]);
  if (!value) return null;
  if (!html) {
    return (
      <p className={cn("whitespace-pre-line break-words text-sm leading-relaxed", className)}>
        {isHtml ? toPlainText(value) : value}
      </p>
    );
  }
  return (
    <div
      className={cn(
        "break-words text-sm leading-relaxed [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
        "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3",
        "[&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mt-2 [&_h3]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_p]:my-1.5 [&_ul]:list-disc",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
