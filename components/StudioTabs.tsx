import Link from "next/link";

const TABS = [
  { slug: "remove-bg", name: "Remove background" },
  { slug: "enhance", name: "Enhance" },
  { slug: "prompt-edit", name: "Prompt edit" },
  { slug: "face-swap", name: "Face swap" },
  { slug: "image-to-video", name: "Image to video" },
  { slug: "voice-clone", name: "Voice clone" },
  { slug: "docs", name: "Docs" }
];

export default function StudioTabs({ active }: { active: string }) {
  return (
    <div className="flex justify-center gap-6 my-7 border-b border-line overflow-x-auto">
      {TABS.map((tab) => (
        <Link
          key={tab.slug}
          href={`/studio/${tab.slug}`}
          className={`pb-2.5 text-sm whitespace-nowrap ${
            tab.slug === active ? "font-medium border-b-2 border-ink" : "text-ink/40 hover:text-ink"
          }`}
        >
          {tab.name}
        </Link>
      ))}
    </div>
  );
}
