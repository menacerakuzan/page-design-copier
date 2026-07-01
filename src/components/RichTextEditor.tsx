import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";
import {
  Bold, Italic, UnderlineIcon, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Link as LinkIcon, Image as ImageIcon, Heading2, Heading3, Quote, Minus,
} from "lucide-react";

const ToolbarBtn = ({ onClick, active = false, title, children }: {
  onClick: () => void; active?: boolean; title: string; children: React.ReactNode;
}) => (
  <button type="button" onClick={onClick} title={title}
    className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
      active ? "bg-[#002f5e] text-[#fff2e8]" : "text-[#002f5e]/60 hover:bg-[#002f5e]/8 hover:text-[#002f5e]"
    }`}>
    {children}
  </button>
);

const Divider = () => <div className="h-5 w-px bg-[#002f5e]/15" />;

type Props = { value: string; onChange: (html: string) => void };

export default function RichTextEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      // StarterKit v3 bundles Link + Underline; disable them here so our own
      // configured copies below don't register duplicate extension names —
      // duplicates leave editor.schema null and crash getHTML().
      StarterKit.configure({ link: false, underline: false }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ inline: false }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Почніть писати статтю…" }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    // Guard isDestroyed: after a hot-reload / remount the previous editor is
    // destroyed (its schema is nulled), and calling getHTML() on it throws
    // "schema is null". Re-run when the editor instance itself changes so the
    // live editor gets synced.
    if (!editor || editor.isDestroyed) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  if (!editor) return null;

  const setLink = () => {
    const url = window.prompt("URL посилання:", editor.getAttributes("link").href ?? "https://");
    if (url === null) return;
    if (url === "") { editor.chain().focus().extendMarkRange("link").unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt("URL зображення:", "https://");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[#002f5e]/15 bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-[#002f5e]/10 bg-[#002f5e]/3 px-3 py-2">
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Жирний">
          <Bold className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Курсив">
          <Italic className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Підкреслення">
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Заголовок H2">
          <Heading2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Заголовок H3">
          <Heading3 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Цитата">
          <Quote className="h-4 w-4" />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="По лівому краю">
          <AlignLeft className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="По центру">
          <AlignCenter className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="По правому краю">
          <AlignRight className="h-4 w-4" />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Маркований список">
          <List className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Нумерований список">
          <ListOrdered className="h-4 w-4" />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={setLink} active={editor.isActive("link")} title="Посилання">
          <LinkIcon className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={addImage} active={false} title="Зображення за URL">
          <ImageIcon className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} title="Роздільник">
          <Minus className="h-4 w-4" />
        </ToolbarBtn>
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="article-content min-h-[280px] px-5 py-4 text-[15px] focus-within:outline-none"
      />
    </div>
  );
}
