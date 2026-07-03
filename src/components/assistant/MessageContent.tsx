import { Fragment, type ReactNode } from "react";
import { parseAssistantMessage } from "@/lib/assistantDirectives";
import { ObjectCard } from "./ObjectCard";
import { RouteProposal } from "./RouteProposal";
import { QuickReplies } from "./QuickReplies";

/**
 * Рендер відповіді асистента: спершу вирізаємо директиви ([[obj]]/[[route]]/[[chips]])
 * і рендеримо їх реальними компонентами, а текстові фрагменти — безпечною
 * підмножиною markdown (жирне, курсив, посилання, списки, абзаци). Без
 * dangerouslySetInnerHTML.
 */

// ── Inline: **жирне**, *курсив*, [текст](url) ────────────────────────────
const INLINE_RE = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)|(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))/g;

function renderInline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  INLINE_RE.lastIndex = 0;
  while ((m = INLINE_RE.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const key = `${keyBase}-i${i++}`;
    if (m[2] !== undefined) {
      nodes.push(<strong key={key} className="font-odesa-bold">{m[2]}</strong>);
    } else if (m[4] !== undefined || m[6] !== undefined) {
      nodes.push(<em key={key}>{m[4] ?? m[6]}</em>);
    } else if (m[8] !== undefined && m[9] !== undefined) {
      nodes.push(
        <a
          key={key}
          href={m[9]}
          target="_blank"
          rel="noreferrer"
          className="text-[#9f1f47] underline underline-offset-2"
        >
          {m[8]}
        </a>,
      );
    }
    last = INLINE_RE.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

// ── Блоки: абзаци + марковані/нумеровані списки ───────────────────────────
function renderMarkdown(text: string, keyBase: string): ReactNode {
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let para: string[] = [];
  let b = 0;

  const flushPara = () => {
    if (!para.length) return;
    const joined = para.join("\n").trim();
    if (joined) {
      const k = `${keyBase}-p${b++}`;
      blocks.push(
        <p key={k} className="whitespace-pre-wrap leading-[1.5]">
          {renderInline(joined, k)}
        </p>,
      );
    }
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    const k = `${keyBase}-l${b++}`;
    const items = list.items.map((it, idx) => (
      <li key={`${k}-${idx}`} className="leading-[1.45]">
        {renderInline(it, `${k}-${idx}`)}
      </li>
    ));
    blocks.push(
      list.ordered ? (
        <ol key={k} className="ml-5 list-decimal space-y-1 marker:text-[#df9b3b] marker:font-odesa-bold">
          {items}
        </ol>
      ) : (
        <ul key={k} className="ml-5 list-disc space-y-1 marker:text-[#df9b3b]">
          {items}
        </ul>
      ),
    );
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    const ul = line.match(/^\s*[-*•]\s+(.*)$/);
    if (ol) {
      flushPara();
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(ol[1]);
    } else if (ul) {
      flushPara();
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(ul[1]);
    } else if (!line.trim()) {
      flushList();
      flushPara();
    } else {
      flushList();
      para.push(line);
    }
  }
  flushList();
  flushPara();

  return <div className="flex flex-col gap-2">{blocks}</div>;
}

export function MessageContent({
  content,
  onQuickReply,
  interactive = true,
}: {
  content: string;
  onQuickReply: (text: string) => void;
  interactive?: boolean;
}) {
  const segments = parseAssistantMessage(content);
  return (
    <div className="text-[15px] text-[#002f5e] font-odesa-regular">
      {segments.map((seg, i) => {
        switch (seg.kind) {
          case "text":
            return seg.text.trim() ? (
              <Fragment key={i}>{renderMarkdown(seg.text, `s${i}`)}</Fragment>
            ) : null;
          case "obj":
            return <ObjectCard key={i} slug={seg.slug} />;
          case "route":
            return <RouteProposal key={i} slugs={seg.slugs} title={seg.title} />;
          case "chips":
            return (
              <QuickReplies key={i} options={seg.options} onPick={onQuickReply} disabled={!interactive} />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
