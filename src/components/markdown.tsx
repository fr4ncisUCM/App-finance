import { Fragment, type ReactNode } from "react";

// Renderizador mínimo para los textos de la IA: títulos «##», listas «-» y **negritas**.

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>,
  );
}

export function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) {
      blocks.push(
        <ul key={blocks.length} className="my-2 list-disc space-y-1.5 pl-5">
          {list.map((li, i) => (
            <li key={i}>{inline(li)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (/^[-*]\s+/.test(line)) {
      list.push(line.replace(/^[-*]\s+/, ""));
      continue;
    }
    flush();
    if (!line) continue;
    const heading = line.match(/^#{1,4}\s+(.*)$/);
    if (heading) blocks.push(<h3 key={blocks.length} className="mt-4 mb-1 font-semibold first:mt-0">{inline(heading[1])}</h3>);
    else blocks.push(<p key={blocks.length} className="my-2">{inline(line)}</p>);
  }
  flush();
  return <div className="text-[15px] leading-relaxed">{blocks}</div>;
}
