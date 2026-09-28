const BASE_URL = "https://api.trackingmore.com/v4";

function headers() {
  const key = process.env.TRACKINGMORE_API_KEY;
  if (!key) throw new Error("TRACKINGMORE_API_KEY is not set");
  return { "Content-Type": "application/json", "Tracking-Api-Key": key };
}

// Returns both the create and get responses so a failure (bad key, unknown
// carrier, etc.) is visible instead of collapsing into "nothing found".
// Known limitation from TRACK-ONLINE's build: the free tier often returns
// only the latest checkpoint — the resolver runs this alongside 17TRACK and
// keeps whichever has more events.
export async function getTrackingMore(
  trackingNumber: string,
  carrierCode?: string
): Promise<{ create: any; get: any } | null> {
  try {
    const body: Record<string, string> = { tracking_number: trackingNumber };
    if (carrierCode) body.courier_code = carrierCode;

    const createRes = await fetch(`${BASE_URL}/trackings/create`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
      cache: "no-store"
    });
    const create = await createRes.json().catch(() => null);

    await new Promise((r) => setTimeout(r, 1000));

    let getUrl = `${BASE_URL}/trackings/get?tracking_numbers=${encodeURIComponent(trackingNumber)}&lang=en`;
    if (carrierCode) getUrl += `&courier_code=${encodeURIComponent(carrierCode)}`;

    const res = await fetch(getUrl, { method: "GET", headers: headers(), cache: "no-store" });
    const get = await res.json().catch(() => null);
    return { create, get };
  } catch (err) {
    console.error("[TrackingMore] error:", err);
    return null;
  }
}
