import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { formatNaira } from "@/lib/format";

const TOOLS = [
  { slug: "remove-bg", name: "Remove background", blurb: "Cut the background out of a photo instantly.", live: true },
  { slug: "enhance", name: "Enhance", blurb: "Sharpen and upscale a photo.", live: true },
  { slug: "prompt-edit", name: "Prompt edit", blurb: "Edit any photo just by describing the change.", live: true },
  { slug: "face-swap", name: "Face swap", blurb: "Swap a face into any photo.", live: true },
  { slug: "image-to-video", name: "Image to video", blurb: "Turn a still photo into a short video.", live: true },
  { slug: "voice-clone", name: "Voice clone", blurb: "Clone a voice from a short sample.", live: true },
  { slug: "docs", name: "Docs", blurb: "Generate a document from a template.", live: true }
];

const COST = 5000;

export default function StudioPage() {
  return (
    <>
      <Header />
      <main className="max-w-content mx-auto px-5 py-10">
        <h1 className="text-2xl mb-2">Studio</h1>
        <p className="text-sm text-ink/50 mb-10">
          AI-powered editing tools, paid from your wallet — {formatNaira(COST)} per result.
        </p>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {TOOLS.map((tool) =>
            tool.live ? (
              <Link
                key={tool.slug}
                href={`/studio/${tool.slug}`}
                className="border border-line p-5 hover:border-ink transition-colors"
              >
                <p className="text-sm">{tool.name}</p>
                <p className="text-xs text-ink/50 mt-1.5">{tool.blurb}</p>
              </Link>
            ) : (
              <div key={tool.slug} className="border border-line p-5 opacity-40 cursor-not-allowed">
                <p className="text-sm">{tool.name}</p>
                <p className="text-xs text-ink/50 mt-1.5">{tool.blurb}</p>
                <p className="text-xs text-ink/40 mt-3">Coming soon</p>
              </div>
            )
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
