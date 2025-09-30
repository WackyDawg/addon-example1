// addProviders.js
import fs from "fs";

// Read and parse the JSON file
const channels = JSON.parse(fs.readFileSync("./streams.json", "utf-8"));

// Add providers if not already present
const updatedChannels = channels.map(channel => {
  if (!channel.providers) {
    channel.providers = {
      "epgshare01": { id: "" },
      "iptv-epg.org": { id: "" }
    };
  }
  return channel;
});

// Write back to streams.json (overwrite)
fs.writeFileSync(
  "./streams.json",
  JSON.stringify(updatedChannels, null, 2),
  "utf-8"
);

console.log("✅ Added providers to all channels!");
