"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StudioTabs from "@/components/StudioTabs";
import { formatNaira } from "@/lib/format";
import { DOC_TEMPLATES } from "@/lib/studio/docTemplates";

const COST = 5000;
const CATEGORIES = ["Business", "Legal", "Certificate", "Personal", "ID & Cards"] as const;

export default function DocsPage() {
  const [templateId, setTemplateId] = useState(DOC_TEMPLATES[0].id);
  const [details, setDetails] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const template = DOC_TEMPLATES.find((t) => t.id === templateId)!;

  async function handleRun() {
    if (!details.trim()) {
      setError("Add a few details first.");
      return;
    }
    setError(null);
    setRunning(true);
    setResult(null);

    try {
      const res = await fetch("/api/studio/docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, details })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setResult(data.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setRunning(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-5 py-10">
        <div className="text-center mb-2">
          <h1 className="text-2xl mb-1">Studio</h1>
          <p className="text-sm text-ink/50">Remove backgrounds, enhance photos, and more.</p>
        </div>

        <StudioTabs active="docs" />

        <div className="bg-paper border border-line rounded-xl p-6">
          <p className="text-sm text-ink/60 mb-5">Pick a template, add the details, and get a ready draft.</p>

          <div className="mb-5">
            <p className="text-xs font-medium mb-2">Template</p>
            <select
              value={templateId}
              onChange={(e) => {
                setTemplateId(e.target.value);
                setResult(null);
              }}
              className="w-full h-10 px-3 border border-line rounded text-sm focus:outline-none focus:border-ink"
            >
              {CATEGORIES.map((cat) => (
                <optgroup key={cat} label={cat}>
                  {DOC_TEMPLATES.filter((t) => t.category === cat).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="mb-5">
            <p className="text-xs font-medium mb-2">Details</p>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={5}
              placeholder={template.placeholder}
              className="w-full border border-line rounded p-3 text-sm focus:outline-none focus:border-ink resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-700 mb-3">{error}</p>}

          <div className="flex items-center justify-between border-t border-line pt-4">
            <span className="text-sm text-ink/60">Cost: {formatNaira(COST)}</span>
            <button
              onClick={handleRun}
              disabled={running || !details.trim()}
              className="h-10 px-5 bg-ink text-paper text-sm rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {running ? "Generating..." : "Generate document"}
            </button>
          </div>

          {result && (
            <div className="mt-5 pt-5 border-t border-line">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium">Result</p>
                <button onClick={handleCopy} className="text-xs underline underline-offset-4 text-ink/60 hover:text-ink">
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="whitespace-pre-wrap text-sm bg-bone border border-line rounded p-4 max-h-96 overflow-y-auto">
                {result}
              </pre>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
