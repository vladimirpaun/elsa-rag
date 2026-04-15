import { readFile } from "node:fs/promises";

const main = async () => {
  const source = process.argv[2];
  if (!source) {
    throw new Error("Usage: npm run ingest -- ./docs/sample-documents.json");
  }

  const content = await readFile(source, "utf8");
  const json = JSON.parse(content);

  const res = await fetch("http://localhost:3000/api/ingest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(json),
  });

  console.log(await res.json());
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
