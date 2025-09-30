import fs from "fs/promises";
import path from "path";

const __dirname = path.resolve();

// Input file (your JSON)
const INPUT_FILE = path.join(__dirname, "streams.json");
// Output file
const OUTPUT_FILE = path.join(__dirname, "iptvOrgIds.txt");

async function extractIptvOrgIds() {
  try {
    // Read JSON
    const data = JSON.parse(await fs.readFile(INPUT_FILE, "utf-8"));

    // Collect all iptvOrgId values (filtering out empty/null)
    const ids = data
      .map(ch => ch.iptvOrgId)
      .filter(Boolean);

    // Save to file (one per line)
    await fs.writeFile(OUTPUT_FILE, ids.join("\n"), "utf-8");

    console.log(`✅ Extracted ${ids.length} IPTV-org IDs → ${OUTPUT_FILE}`);
  } catch (err) {
    console.error("❌ Error extracting IPTV-org IDs:", err.message);
  }
}

extractIptvOrgIds();
