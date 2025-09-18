import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFile = path.join(__dirname, "streams.json");
const outputFile = path.join(__dirname, "streams.updated.json");

const data = JSON.parse(fs.readFileSync(inputFile, "utf-8"));

const updated = data.map(stream => {
  const { id, categoryId, ...rest } = stream;

  return {
    id,
    categoryId,
    iptvOrgId: "",  
    ...rest
  };
});

fs.writeFileSync(outputFile, JSON.stringify(updated, null, 2));

console.log(`✅ Updated JSON saved to ${outputFile}`);
