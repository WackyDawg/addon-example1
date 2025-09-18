import fs from "fs/promises";
import path from "path";

const __dirname = path.resolve();

async function convertHls() {
  const jsonPath = path.join(__dirname, "public", "streams.json");

  try {
    const fileData = await fs.readFile(jsonPath, "utf-8");
    const channels = JSON.parse(fileData);

    const updatedChannels = channels.map(channel => {
      if (typeof channel.hls === "string") {
        channel.hls = [channel.hls];
      }
      return channel;
    });

    await fs.writeFile(jsonPath, JSON.stringify(updatedChannels, null, 2), "utf-8");
    console.log("✅ Conversion complete! streams.json updated.");
  } catch (err) {
    console.error("❌ Error converting streams:", err);
  }
}

convertHls();
