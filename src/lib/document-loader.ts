import { createHash } from "node:crypto";

export type LoadedDocument = {
  documentId: string;
  title: string;
  pages: string[];
  sourceUrl?: string;
};

const jinaProxy = (url: string) => `https://r.jina.ai/http://${url.replace(/^https?:\/\//, "")}`;

const splitPages = (text: string, pageSize = 1800): string[] => {
  const normalized = text.replace(/\r/g, "").trim();
  const pages: string[] = [];
  for (let i = 0; i < normalized.length; i += pageSize) {
    pages.push(normalized.slice(i, i + pageSize));
  }
  return pages.filter((p) => p.trim().length > 0);
};

export const loadDocumentFromUrl = async (url: string): Promise<LoadedDocument> => {
  const response = await fetch(jinaProxy(url));
  if (!response.ok) {
    throw new Error(`Unable to load ${url}: HTTP ${response.status}`);
  }

  const text = await response.text();
  const id = createHash("sha1").update(url).digest("hex").slice(0, 12);

  return {
    documentId: `url-${id}`,
    title: url.split("/").pop() ?? `source-${id}`,
    sourceUrl: url,
    pages: splitPages(text),
  };
};
