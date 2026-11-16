import type { MentionOption } from "@bengo-hub/shared-ui-lib/rich-text-editor";
import type { Agent } from "@/types/agents";

/**
 * @mention suggestions for the reply composer. The shared RichTextEditor (v0.1.147) writes the
 * fleet mention node, <span data-type="mention" data-id="<agent id>" data-label="Name">, which
 * ticketing-api reads to notify the agent and RichTextView renders as a pill. The editor turns
 * mentions on when the prop is present at first render, so the composer always passes the list,
 * even while the agents are still loading.
 */
export function mentionItems(agents: Agent[]): MentionOption[] {
  return agents
    .filter((a) => a.is_active)
    .map((a) => ({ id: a.id, label: a.display_name, description: a.email }));
}
