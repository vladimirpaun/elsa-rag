import "@/styles/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ELSA RAG Simulator",
  description: "GraphRAG + Gemini assistant for technical manuals",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
