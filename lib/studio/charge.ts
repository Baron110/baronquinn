import User from "@/models/User";
import Edit, { EditType } from "@/models/Edit";

export type ChargeKind = "wallet" | "free-edit" | "free-regen";

type BeginResult =
  | { ok: true; edit: any; chargeKind: ChargeKind }
  | { ok: false; error: string; status: number };

// Order of precedence: a valid free-regenerate on the same edit first, then
// a free-edit credit (from the deposit bonus), then the wallet. Every
// Studio route calls this the same way, so the rules can't drift between
// tools.
export async function beginGeneration(params: {
  userId: string;
  type: EditType;
  cost: number;
  prompt?: string;
  originalImage?: string;
  regenerateEditId?: string;
}): Promise<BeginResult> {
  const { userId, type, cost, prompt, originalImage, regenerateEditId } = params;

  if (regenerateEditId) {
    const existing = await Edit.findById(regenerateEditId);
    if (
      existing &&
      existing.user.toString() === userId &&
      existing.type === type &&
      !existing.freeRegenerateUsed
    ) {
      existing.status = "processing";
      await existing.save();
      return { ok: true, edit: existing, chargeKind: "free-regen" };
    }
    // Not found, not theirs, wrong tool, or already used once — fall
    // through to a normal fresh charge rather than failing outright.
  }

  const freeEditUser = await User.findOneAndUpdate(
    { _id: userId, freeEditsRemaining: { $gte: 1 } },
    { $inc: { freeEditsRemaining: -1 } }
  );
  if (freeEditUser) {
    const edit = await Edit.create({
      user: userId,
      type,
      prompt,
      originalImage,
      status: "processing",
      cost,
      usedFreeEdit: true
    });
    return { ok: true, edit, chargeKind: "free-edit" };
  }

  const debitedUser = await User.findOneAndUpdate(
    { _id: userId, walletBalance: { $gte: cost } },
    { $inc: { walletBalance: -cost } }
  );
  if (!debitedUser) {
    return { ok: false, error: "Not enough wallet balance for this.", status: 402 };
  }

  const edit = await Edit.create({ user: userId, type, prompt, originalImage, status: "processing", cost });
  return { ok: true, edit, chargeKind: "wallet" };
}

export async function completeGeneration(edit: any, chargeKind: ChargeKind, resultUrl: string) {
  edit.status = "completed";
  edit.resultUrl = resultUrl;
  if (chargeKind === "free-regen") edit.freeRegenerateUsed = true;
  await edit.save();
}

export async function refundGeneration(
  userId: string,
  chargeKind: ChargeKind,
  cost: number,
  edit: any,
  errorMessage: string
) {
  if (chargeKind === "wallet") {
    await User.findByIdAndUpdate(userId, { $inc: { walletBalance: cost } });
  } else if (chargeKind === "free-edit") {
    await User.findByIdAndUpdate(userId, { $inc: { freeEditsRemaining: 1 } });
  } else if (chargeKind === "free-regen") {
    // Nothing was ever charged for this attempt — don't burn their one
    // free shot on a failure that wasn't their fault.
    edit.freeRegenerateUsed = false;
  }
  edit.status = "failed";
  edit.error = errorMessage;
  await edit.save();
}
