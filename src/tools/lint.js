import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const m3uFile = path.join(__dirname, 'channels.m3u');
const outputJsonFile = path.join(__dirname, 'channels.json');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function parseM3U(content) {
  const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
  const output = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#EXTINF')) {
      const infoLine = lines[i];
      const urlLine = lines[i + 1];

      const tvgIdMatch = infoLine.match(/tvg-id="([^"]+)"/);
      const logoMatch = infoLine.match(/tvg-logo="([^"]+)"/);
      const referrerMatch = infoLine.match(/http-referrer="([^"]+)"/) || infoLine.match(/http-referer="([^"]+)"/i);

      const tvgId = tvgIdMatch ? tvgIdMatch[1] : 'Unknown';
      const logo = logoMatch ? logoMatch[1] : '';
      const hasReferrer = !!referrerMatch;
      const refererHeader = hasReferrer ? referrerMatch[1] : '';
      const categoryId = "20"

      output.push({
        id: "",
        categoryId: categoryId,               
        iptvOrgId: tvgId,
        name: tvgId,
        hls: urlLine,
        backdrop: "",
        imageUrl: logo,
        isAuth: hasReferrer,
        headers: {
          Referer: refererHeader,
          Authorization: ""
        }
      });
    }
  }

  return output;
}

async function main() {
  try {
    const data = await fs.promises.readFile(m3uFile, 'utf-8');
    const channels = parseM3U(data);
    await fs.promises.writeFile(outputJsonFile, JSON.stringify(channels, null, 2));
    console.log(`✅ Successfully converted and saved to ${outputJsonFile}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
