import type { Pick } from "./types";

/**
 * Zero-backend board sharing for the beta: the capper's current board is
 * deflate-compressed into a URL fragment (#b=…), so a texted link carries
 * the real picks to any device. The fragment never hits a server.
 *
 * Honest limit: the data rides inside the link, so premium selections are
 * blurred for viewers but not cryptographically hidden — the production
 * backend replaces this with server-side entitlements.
 */
const MARK_DEFLATE = "1.";
const MARK_PLAIN = "0.";

function toB64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export async function encodeBoard(board: Pick[]): Promise<string> {
  const raw = new TextEncoder().encode(JSON.stringify(board));
  if (typeof CompressionStream !== "undefined") {
    const stream = new Blob([raw as BlobPart])
      .stream()
      .pipeThrough(new CompressionStream("deflate-raw"));
    const packed = new Uint8Array(await new Response(stream).arrayBuffer());
    return MARK_DEFLATE + toB64url(packed);
  }
  return MARK_PLAIN + toB64url(raw);
}

export async function decodeBoard(encoded: string): Promise<Pick[]> {
  const bytes = fromB64url(encoded.slice(2));
  let raw: Uint8Array;
  if (encoded.startsWith(MARK_DEFLATE)) {
    const stream = new Blob([bytes as BlobPart])
      .stream()
      .pipeThrough(new DecompressionStream("deflate-raw"));
    raw = new Uint8Array(await new Response(stream).arrayBuffer());
  } else {
    raw = bytes;
  }
  const parsed = JSON.parse(new TextDecoder().decode(raw));
  if (!Array.isArray(parsed)) throw new Error("bad board payload");
  return parsed as Pick[];
}

/** The encoded board from the current URL, if someone opened a shared link. */
export function sharedBoardHash(): string | null {
  const m = window.location.hash.match(/^#b=(.+)$/);
  return m ? m[1] : null;
}

export function shareUrl(encoded: string): string {
  const { origin, pathname, search } = window.location;
  return `${origin}${pathname}${search}#b=${encoded}`;
}
