// Thin wrapper around Replicate's REST API — avoids adding their SDK as a
// dependency for what's a handful of calls.
const BASE_URL = "https://api.replicate.com/v1";

function headers() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN is not set");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

// Replicate predictions run async — poll until it's done. If we run out of
// time first, cancel the job on the way out so it stops accruing cost for a
// result nobody is going to receive.
async function waitForPrediction(created: any, timeoutMs: number): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  let prediction = created;

  while (prediction.status !== "succeeded" && prediction.status !== "failed" && prediction.status !== "canceled") {
    if (Date.now() > deadline) {
      await fetch(`${BASE_URL}/predictions/${created.id}/cancel`, { method: "POST", headers: headers() }).catch(
        () => {}
      );
      throw new Error("Timed out waiting for Replicate");
    }
    await new Promise((r) => setTimeout(r, 1500));
    const pollRes = await fetch(`${BASE_URL}/predictions/${created.id}`, { headers: headers() });
    prediction = await pollRes.json();
  }

  if (prediction.status !== "succeeded") {
    throw new Error(prediction.error ?? "Replicate processing failed");
  }

  const output = prediction.output;
  return Array.isArray(output) ? output[0] : output;
}

// `version` is the model's version hash from Replicate's model page, e.g.
// "lucataco/remove-bg:<hash>" — run() splits that apart itself.
export async function runReplicateModel(modelVersion: string, input: Record<string, unknown>): Promise<string> {
  const [, version] = modelVersion.includes(":") ? modelVersion.split(":") : [null, modelVersion];

  const createRes = await fetch(`${BASE_URL}/predictions`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ version, input })
  });
  const created = await createRes.json();
  if (!createRes.ok) {
    throw new Error(created?.detail ?? "Replicate rejected the request");
  }

  // Most of these models finish in a few seconds; 90s covers a slow cold
  // start too.
  return waitForPrediction(created, 90_000);
}

// Official models (like "veed/fabric-1.0") are addressed by name rather than
// a version hash — Replicate always runs their current version. Takes an
// explicit timeout because some of these (video) run far longer than the
// image models above.
export async function runReplicateOfficialModel(
  model: string,
  input: Record<string, unknown>,
  timeoutMs: number
): Promise<string> {
  const createRes = await fetch(`${BASE_URL}/models/${model}/predictions`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ input })
  });
  const created = await createRes.json();
  if (!createRes.ok) {
    throw new Error(created?.detail ?? "Replicate rejected the request");
  }

  return waitForPrediction(created, timeoutMs);
}
