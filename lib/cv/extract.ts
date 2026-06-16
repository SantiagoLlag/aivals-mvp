// Extracción de texto del CV (PDF) en el servidor, con unpdf (apto para serverless).
import { extractText, getDocumentProxy } from "unpdf";

export async function extractCvText(bytes: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  const out = Array.isArray(text) ? text.join("\n") : (text ?? "");
  return out
    .replace(/ /g, " ") // nbsp -> espacio normal
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
