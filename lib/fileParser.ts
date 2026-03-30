import { marked } from "marked";
import { generateJSON } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";

const extensions = [StarterKit, Underline];

export function parseTxtFile(content: string): object {
  const paragraphs = content.split(/\n\n+/).filter((p) => p.trim());
  if (paragraphs.length === 0) {
    return { type: "doc", content: [] };
  }

  return {
    type: "doc",
    content: paragraphs.map((text) => ({
      type: "paragraph",
      content: [{ type: "text", text: text.trim() }],
    })),
  };
}

export function parseMdFile(content: string): object {
  const html = marked.parse(content, { async: false }) as string;
  return generateJSON(html, extensions);
}

export function deriveTitle(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return filename.slice(0, 100) || "Imported Document";
  const title = filename.slice(0, lastDot);
  return title.slice(0, 100) || "Imported Document";
}
