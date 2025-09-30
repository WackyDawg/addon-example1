// channels.js
import axios from "axios";
import fs from "fs/promises";

const API_URL =
  "https://848b3516657c-usatv.baby-beamup.club/catalog/tv/all.json?genre=Sports";

async function testStream(url) {
  try {
    // HEAD request (faster than GET, just checks availability)
    const response = await axios.head(url, { timeout: 8000 });
    return response.status === 200;
  } catch (err) {
    return false;
  }
}

async function fetchChannels() {
  try {
    const { data } = await axios.get(API_URL, { timeout: 15000 });

    if (!data.metas || !Array.isArray(data.metas)) {
      console.error("Invalid response: metas not found");
      return;
    }

    let results = [];

    for (const channel of data.metas) {
      if (!channel.streams) continue;

      console.log(`🔍 Checking streams for: ${channel.name}`);

      let workingStreams = [];

      for (const stream of channel.streams) {
        const isAlive = await testStream(stream.url);
        if (isAlive) {
          console.log(`✅ Working: ${stream.url}`);
          workingStreams.push(stream);
        } else {
          console.log(`❌ Dead: ${stream.url}`);
        }
      }

      if (workingStreams.length > 0) {
        results.push({
          id: channel.id,
          name: channel.name,
          logo: channel.logo,
          country: channel.country,
          genre: channel.genre,
          streams: workingStreams,
        });
      }
    }

    // Save results to file
    await fs.writeFile("channels.json", JSON.stringify(results, null, 2));
    console.log(`📁 Saved ${results.length} channels to channels.json`);
  } catch (err) {
    console.error("Error fetching channels:", err.message);
  }
}

fetchChannels();
