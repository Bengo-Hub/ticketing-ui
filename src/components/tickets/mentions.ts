import type { RichTextEditorProps } from "@bengo-hub/shared-ui-lib/rich-text-editor";
import type { Agent } from "@/types/agents";

/**
 * The one switch for @mentions in the reply composer.
 *
 * shared-ui-lib v0.1.147 adds `mentions?: { id, label, description? }[]` to RichTextEditor, which
 * writes the fleet mention node the API parses and RichTextView renders as a pill. This app is
 * still on v0.1.146, whose editor has no such prop. To turn mentions on: bump the package to
 * v0.1.147 or later, set MENTIONS_ENABLED to true, and drop the cast below. Nothing else changes.
 */
export const MENTIONS_ENABLED = false;

export interface MentionItem {
  id: string;
  label: string;
  description?: string;
}

/** Active agents as mention suggestions: the agent id is what the API notifies. */
export function mentionItems(agents: Agent[]): MentionItem[] {
  return agents
    .filter((a) => a.is_active)
    .map((a) => ({ id: a.id, label: a.display_name, description: a.email }));
}

/** Extra props for the composer's RichTextEditor: none until mentions are enabled. */
export function mentionEditorProps(agents: Agent[]): Partial<RichTextEditorProps> {
  if (!MENTIONS_ENABLED) return {};
  // v0.1.146 types do not know `mentions` yet; the cast goes with the package bump.
  return { mentions: mentionItems(agents) } as unknown as Partial<RichTextEditorProps>;
}
