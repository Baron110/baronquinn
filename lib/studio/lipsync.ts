import { runReplicateOfficialModel } from "./replicate";

// One still photo + one audio clip in, a talking video out — the face is
// animated to speak the audio, with natural head and expression movement.
// Output length follows the audio length. Returns the provider's own URL;
// the caller re-hosts it so customers never see where it came from.
export async function generateTalkingVideo(imageUrl: string, audioUrl: string, timeoutMs: number): Promise<string> {
  return runReplicateOfficialModel(
    "veed/fabric-1.0",
    { image: imageUrl, audio: audioUrl, resolution: "720p" },
    timeoutMs
  );
}
