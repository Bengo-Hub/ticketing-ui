/**
 * Fills `{name}` placeholders in a message. An unknown placeholder is left as written so it is easy
 * to spot. The same helper as hadia-ui's, kept apart from i18n.ts so it carries no catalogue.
 */
export type MessageVars = Record<string, string | number>;

export function format(template: string, vars?: MessageVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => (name in vars ? String(vars[name]) : whole));
}
