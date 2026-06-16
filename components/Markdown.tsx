// Render mínimo de Markdown (headings, bold, listas, citas). Sin dependencias.
import React from "react";

function inline(text: string, key: number): React.ReactNode {
  // **negrita**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <React.Fragment key={key}>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p
      )}
    </React.Fragment>
  );
}

export default function Markdown({ children }: { children: string }) {
  const lines = children.split("\n");
  const out: React.ReactNode[] = [];
  let list: string[] = [];

  const flushList = () => {
    if (list.length) {
      out.push(
        <ul key={`ul${out.length}`} className="my-2 ml-5 list-disc space-y-1 text-sm text-neutral-700">
          {list.map((li, i) => <li key={i}>{inline(li, i)}</li>)}
        </ul>
      );
      list = [];
    }
  };

  lines.forEach((raw) => {
    const line = raw.trimEnd();
    if (/^#{3}\s/.test(line)) { flushList(); out.push(<h3 key={out.length} className="font-semibold text-sm mt-4 mb-1">{inline(line.replace(/^#{3}\s/, ""), 0)}</h3>); }
    else if (/^#{2}\s/.test(line)) { flushList(); out.push(<h2 key={out.length} className="font-bold text-base mt-5 mb-1">{inline(line.replace(/^#{2}\s/, ""), 0)}</h2>); }
    else if (/^#{1}\s/.test(line)) { flushList(); out.push(<h2 key={out.length} className="font-bold text-lg mt-5 mb-1">{inline(line.replace(/^#{1}\s/, ""), 0)}</h2>); }
    else if (/^[-*]\s/.test(line)) { list.push(line.replace(/^[-*]\s/, "")); }
    else if (/^>\s?/.test(line)) { flushList(); out.push(<blockquote key={out.length} className="border-l-2 border-accent/40 pl-3 my-2 text-sm text-neutral-600 italic">{inline(line.replace(/^>\s?/, ""), 0)}</blockquote>); }
    else if (line.trim() === "") { flushList(); }
    else { flushList(); out.push(<p key={out.length} className="text-sm text-neutral-700 my-2 leading-relaxed">{inline(line, 0)}</p>); }
  });
  flushList();
  return <div>{out}</div>;
}
