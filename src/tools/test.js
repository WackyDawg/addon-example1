import fs from "fs";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFile = path.join(__dirname, "channels.m3u");
const workingM3u = path.join(__dirname, "working.m3u");
const outputJson = path.join(__dirname, "working.json");

async function checkStream(url, headers = {}) {
  try {
    const res = await axios.get(url, { timeout: 8000, headers });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function processM3u() {
  const content = fs.readFileSync(inputFile, "utf8");
  const lines = content.split("\n");

  let workingEntries = [];
  let jsonEntries = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("#EXTINF")) {
      const infoLine = line;
      let referrer = "";
      let isAuth = false;

      const refMatch = infoLine.match(/http-referrer="([^"]*)"/);
      if (refMatch) {
        referrer = refMatch[1];
        isAuth = true;
      }

      if (lines[i + 1]?.startsWith("#EXTVLCOPT:http-referrer=")) {
        referrer = lines[i + 1].split("=")[1].trim();
        isAuth = true;
        i++;
      }

      const streamUrl = lines[i + 1]?.trim();

      if (streamUrl && streamUrl.startsWith("http")) {
        process.stdout.write(`🔍 Checking: ${streamUrl} ... `);

        const alive = await checkStream(streamUrl, referrer ? { Referer: referrer } : {});

        if (alive) {
          console.log("WORKING");

          workingEntries.push(infoLine);
          if (isAuth) {
            workingEntries.push(`#EXTVLCOPT:http-referrer=${referrer}`);
          }
          workingEntries.push(streamUrl);

          const nameMatch = infoLine.split(",").pop().trim();
          const tvgIdMatch = infoLine.match(/tvg-id="([^"]*)"/);
          const logoMatch = infoLine.match(/tvg-logo="([^"]*)"/);
          const groupMatch = infoLine.match(/group-title="([^"]*)"/);

          jsonEntries.push({
            id: "",
            categoryId: "20",
            iptvOrgId: tvgIdMatch ? tvgIdMatch[1] : "",
            name: nameMatch,
            hls: streamUrl,
            backdrop: "",
            imageUrl: logoMatch ? logoMatch[1] : "",
            isAuth,
            headers: {
              Referer: referrer || "",
              Authorization: ""
            }
          });
        } else {
          console.log("❌ FAILED");
        }
      }
    }
  }

  fs.writeFileSync(workingM3u, ["#EXTM3U", ...workingEntries].join("\n"), "utf8");

  fs.writeFileSync(outputJson, JSON.stringify(jsonEntries, null, 2), "utf8");

  console.log(`\n✅ Done. Working streams saved to ${workingM3u} and ${outputJson}`);
}

processM3u();
