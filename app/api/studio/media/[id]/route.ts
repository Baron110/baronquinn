import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Edit from "@/models/Edit";
import { applyWatermark } from "@/lib/studio/watermark";

const CONTENT_TYPES: Record<string, string> = {
  image: "image/png",
  "image-to-video": "video/mp4",
  "voice-clone": "audio/mpeg"
};

// Everything a customer sees for a Studio result points here, not at
// Cloudinary directly. This route is the only place that ever touches the
// real storage URL — it fetches the bytes server-side and hands them back
// under baronquinn.com, so no third-party domain ever reaches the browser.
//
// ?preview=1 returns a watermarked version, for the on-page result display
// before someone has actually saved it. No query param returns the clean
// version — that's what the Save button fetches once they decide to keep
// it. Both paths require the same ownership check either way; this flag
// only changes whether a watermark gets burned in, not who can reach it.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Log in to view this." }, { status: 401 });
  }

  await connectDB();
  const edit = await Edit.findById(params.id).lean();
  if (!edit || !(edit as any).resultUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = (edit as any).user?.toString() === session.user.id;
  const isAdmin = session.user.role === "admin";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const upstream = await fetch((edit as any).resultUrl);
  if (!upstream.ok) {
    return NextResponse.json({ error: "Could not load this result" }, { status: 502 });
  }

  const type = (edit as any).type as string;
  const contentType =
    type === "image-to-video" || type === "talking-video"
      ? CONTENT_TYPES["image-to-video"]
      : type === "voice-clone"
        ? CONTENT_TYPES["voice-clone"]
        : CONTENT_TYPES.image;
  const ext = contentType === "video/mp4" ? "mp4" : contentType === "audio/mpeg" ? "mp3" : "png";

  const isPreview = req.nextUrl.searchParams.get("preview") === "1";
  const isImage = contentType === "image/png";

  // Watermarking only applies to images right now — video and voice still
  // return the clean file either way. Burning a watermark into actual
  // video/audio needs real media-processing tooling, a bigger job than
  // this pass covers.
  if (isPreview && isImage) {
    const original = Buffer.from(await upstream.arrayBuffer());
    const watermarked = await applyWatermark(original);
    return new NextResponse(new Uint8Array(watermarked), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="baronquinn-preview-${params.id}.${ext}"`,
        "Cache-Control": "private, max-age=60"
      }
    });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="baronquinn-${params.id}.${ext}"`,
      "Cache-Control": "private, max-age=31536000, immutable"
    }
  });
}
