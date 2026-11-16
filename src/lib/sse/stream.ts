import { authHeaders } from "@/lib/api-client";

export interface StreamMessage {
  event: string;
  data: string;
}

export interface StreamOptions {
  /** Called for every event. `connected` is sent once by ticketing-api when the stream opens. */
  onMessage: (msg: StreamMessage) => void;
  /** Called after a reconnect, since events sent while disconnected are not replayed. */
  onReconnect?: () => void;
}

const MIN_RETRY_MS = 2_000;
const MAX_RETRY_MS = 30_000;

/**
 * Opens a Server-Sent Events stream with fetch, so the bearer token and tenant headers travel in
 * headers (EventSource cannot set headers, and tokens never belong in a URL). Reconnects with
 * backoff from 2 s up to 30 s and reads fresh headers on every attempt, so a refreshed token is
 * picked up. Returns a function that closes the stream.
 */
export function openStream(url: string, opts: StreamOptions): () => void {
  let closed = false;
  let retry = MIN_RETRY_MS;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let controller: AbortController | null = null;
  let connectedOnce = false;

  const schedule = () => {
    if (closed) return;
    timer = setTimeout(connect, retry);
    retry = Math.min(retry * 2, MAX_RETRY_MS);
  };

  const connect = async () => {
    if (closed) return;
    controller = new AbortController();
    try {
      const res = await fetch(url, {
        headers: { ...authHeaders(), Accept: "text/event-stream" },
        signal: controller.signal,
        cache: "no-store",
      });
      if (!res.ok || !res.body) {
        schedule();
        return;
      }
      retry = MIN_RETRY_MS;
      if (connectedOnce) opts.onReconnect?.();
      connectedOnce = true;
      await readEvents(res.body, opts.onMessage);
    } catch {
      // Aborted on close, or the network dropped; the schedule below decides.
    }
    schedule();
  };

  void connect();
  return () => {
    closed = true;
    if (timer) clearTimeout(timer);
    controller?.abort();
  };
}

/** Parses the text/event-stream format: blocks separated by a blank line, `event:` and `data:` fields. */
async function readEvents(body: ReadableStream<Uint8Array>, onMessage: (msg: StreamMessage) => void) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return;
    buffer += decoder.decode(value, { stream: true });
    let sep: number;
    while ((sep = buffer.search(/\r?\n\r?\n/)) !== -1) {
      const block = buffer.slice(0, sep);
      buffer = buffer.slice(sep).replace(/^\r?\n\r?\n/, "");
      let event = "message";
      const data: string[] = [];
      for (const line of block.split(/\r?\n/)) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
      }
      onMessage({ event, data: data.join("\n") });
    }
  }
}
