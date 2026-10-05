// The stock voices offered in Studio. To add, remove, or reorder one, edit
// this list only — the page dropdown and the server-side check both read
// from it. IDs must match xAI's built-in voice names; the notes come from
// their voice list.
export const STUDIO_VOICES = [
  { id: "ara", label: "Ara", note: "Warm and friendly" },
  { id: "iris", label: "Iris", note: "Friendly, upbeat, charming" },
  { id: "lumen", label: "Lumen", note: "Warm and articulate" },
  { id: "altair", label: "Altair", note: "Elegant and premium" },
  { id: "rex", label: "Rex", note: "Confident and clear" },
  { id: "sal", label: "Sal", note: "Smooth and balanced" },
  { id: "atlas", label: "Atlas", note: "Confident and commanding" },
  { id: "leo", label: "Leo", note: "Authoritative, British accent" }
] as const;

export const DEFAULT_VOICE = "ara";

export function isStudioVoice(id: unknown): id is string {
  return typeof id === "string" && STUDIO_VOICES.some((v) => v.id === id);
}
