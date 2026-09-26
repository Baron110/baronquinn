const BASE_URL = "https://api.17track.net/track/v2.2";

function headers() {
  const key = process.env.TRACK17_API_KEY;
  if (!key) throw new Error("TRACK17_API_KEY is not set");
  return { "Content-Type": "application/json", "17token": key };
}

export async function register17Track(trackingNumber: string): Promise<void> {
  try {
    await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify([{ number: trackingNumber }])
    });
  } catch (err) {
    console.error("[17TRACK] register error:", err);
  }
}

// Returns the raw accepted item, or null if 17TRACK has nothing for this
// number (unregistered, invalid, or not yet picked up by a carrier).
export async function get17Track(trackingNumber: string): Promise<any | null> {
  const res = await fetch(`${BASE_URL}/gettrackinfo`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify([{ number: trackingNumber }]),
    cache: "no-store"
  });
  if (!res.ok) {
    console.error("[17TRACK] gettrackinfo failed:", res.status);
    return null;
  }
  const json = await res.json();
  return json?.data?.accepted?.[0] ?? null;
}
