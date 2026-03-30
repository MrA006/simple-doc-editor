"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef } from "react";

interface EditorToolbarProps {
  editor: ReturnType<typeof useEditor>;
}

function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-1 border-b border-gray-200 p-2 bg-gray-50">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2 py-1 rounded text-sm font-medium ${
          editor.isActive("bold")
            ? "bg-blue-100 text-blue-700"
            : "hover:bg-gray-100 text-gray-700"
        }`}
      >
        Bold
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2 py-1 rounded text-sm font-medium ${
          editor.isActive("italic")
            ? "bg-blue-100 text-blue-700"
            : "hover:bg-gray-100 text-gray-700"
        }`}
      >
        Italic
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`px-2 py-1 rounded text-sm font-medium ${
          editor.isActive("underline")
            ? "bg-blue-100 text-blue-700"
            : "hover:bg-gray-100 text-gray-700"
        }`}
      >
        Underline
      </button>
      <div className="w-px h-5 bg-gray-300 mx-1" />
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`px-2 py-1 rounded text-sm font-medium ${
          editor.isActive("heading", { level: 1 })
            ? "bg-blue-100 text-blue-700"
            : "hover:bg-gray-100 text-gray-700"
        }`}
      >
        H1
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-2 py-1 rounded text-sm font-medium ${
          editor.isActive("heading", { level: 2 })
            ? "bg-blue-100 text-blue-700"
            : "hover:bg-gray-100 text-gray-700"
        }`}
      >
        H2
      </button>
      <div className="w-px h-5 bg-gray-300 mx-1" />
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2 py-1 rounded text-sm font-medium ${
          editor.isActive("bulletList")
            ? "bg-blue-100 text-blue-700"
            : "hover:bg-gray-100 text-gray-700"
        }`}
      >
        Bullet List
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-2 py-1 rounded text-sm font-medium ${
          editor.isActive("orderedList")
            ? "bg-blue-100 text-blue-700"
            : "hover:bg-gray-100 text-gray-700"
        }`}
      >
        Numbered List
      </button>
    </div>
  );
}

interface TiptapEditorProps {
  content: string;
  onUpdate: (content: string) => void;
}

export default function TiptapEditor({ content, onUpdate }: TiptapEditorProps) {
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  // Track whether the latest content string was produced by the editor itself.
  // If so, skip the setContent call in the effect — no need to round-trip and
  // risk clobbering the selection / node types.
  const editorOriginatedRef = useRef(false);

  const initialContent = (() => {
    if (!content) return "";
    try {
      return typeof content === "string" ? JSON.parse(content) : content;
    } catch {
      return "";
    }
  })();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Underline,
      Placeholder.configure({ placeholder: "Start writing..." }),
    ],
    content: initialContent,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        // Mark that this content update came from the editor so the effect
        // below knows it doesn't need to call setContent.
        editorOriginatedRef.current = true;
        onUpdate(JSON.stringify(editor.getJSON()));
      }, 1500);
    },
  });

  useEffect(() => {
    if (!editor || !content) return;

    // Content was just produced by this editor — no need to set it back in.
    if (editorOriginatedRef.current) {
      editorOriginatedRef.current = false;
      return;
    }

    try {
      const parsed = typeof content === "string" ? JSON.parse(content) : content;
      editor.commands.setContent(parsed, /* emitUpdate */ false);
    } catch {
      // ignore parse errors
    }
  }, [content, editor]);

  return (
    <div className="flex flex-col h-full">
      <EditorToolbar editor={editor} />
      {/*
        Bug 2 fix: if @tailwindcss/typography is NOT in your project, the
        `prose` class does nothing and Tailwind's preflight strips list bullets
        and heading sizes. Either:
          a) Install @tailwindcss/typography and add `typography` to your
             tailwind.config plugins array, OR
          b) Replace `prose max-w-none` with explicit styles (see below).

        Option (b) — safe fallback styles for the editor content:
      */}
      <div className="flex-1 overflow-y-auto p-6">
        <style>{`
          .tiptap-editor h1 { font-size: 2em; font-weight: bold; margin: 0.67em 0; }
          .tiptap-editor h2 { font-size: 1.5em; font-weight: bold; margin: 0.83em 0; }
          .tiptap-editor ul { list-style-type: disc; padding-left: 1.5em; margin: 0.5em 0; }
          .tiptap-editor ol { list-style-type: decimal; padding-left: 1.5em; margin: 0.5em 0; }
          .tiptap-editor li { margin: 0.25em 0; }
          .tiptap-editor p.is-editor-empty:first-child::before {
            color: #9ca3af;
            content: attr(data-placeholder);
            float: left;
            height: 0;
            pointer-events: none;
          }
        `}</style>
        <EditorContent editor={editor} className="tiptap-editor" />
      </div>
    </div>
  );
}