"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useCallback, useRef, useState } from "react";

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

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
    ],
    content: content ? JSON.parse(content) : "",
    onUpdate: ({ editor }) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        onUpdate(JSON.stringify(editor.getJSON()));
      }, 1500);
    },
  });

  useEffect(() => {
    if (editor && content) {
      const currentContent = JSON.stringify(editor.getJSON());
      if (currentContent !== content) {
        editor.commands.setContent(JSON.parse(content));
      }
    }
  }, [content, editor]);

  return (
    <div className="flex flex-col h-full">
      <EditorToolbar editor={editor} />
      <div className="flex-1 overflow-y-auto p-6">
        <EditorContent editor={editor} className="prose max-w-none" />
      </div>
    </div>
  );
}
