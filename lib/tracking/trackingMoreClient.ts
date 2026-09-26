const BASE_URL = "https://api.trackingmore.com/v4";

function headers() {
  const key = process.env.TRACKINGMORE_API_KEY;
  if (!key) throw new Error("TRACKINGMORE_API_KEY is not set");
  return { "Content-Type": "application/json", "Tracking-Api-Key": key };
}

// Returns the raw item, or null if TrackingMore has nothing for this number.
// Known limitation (confirmed against a real shipment during TRACK-ONLINE's
// build): the free tier often returns only the single latest checkpoint,
// not full history — that's exactly why the resolver below runs this
// alongside 17TRACK and keeps whichever actually has more events.
export async function getTrackingMore(trackingNumber: string, carrierCode?: string): Promise<any | null> {
  try {
    const body: Record<string, string> = { tracking_number: trackingNumber };
    if (carrierCode) body.courier_code = carrierCode;

    await fetch(`${BASE_URL}/trackings/create`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
      cache: "no-store"
    });

    // Give TrackingMore a moment to fetch the carrier's data before we ask
    // for it back.
    await new Promise((r) => setTimeout(r, 1000));

    let getUrl = `${BASE_URL}/trackings/get?tracking_numbers=${encodeURIComponent(trackingNumber)}&lang=en`;
    if (carrierCode) getUrl += `&courier_code=${encodeURIComponent(carrierCode)}`;

    const res = await fetch(getUrl, { method: "GET", headers: headers(), cache: "no-store" });
    const json = await res.json();
    return json?.data?.items?.[0] ?? null;
  } catch (err) {
    console.error("[TrackingMore] error:", err);
    return null;
  }
}
