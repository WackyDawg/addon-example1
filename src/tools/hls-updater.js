import fs from "fs/promises";
import axios from "axios";
import path from "path";

const __dirname = path.resolve();

const CHANNELS_FILE = path.join(__dirname, "public", "streams.json");
const STREAMS_URL = "https://iptv-org.github.io/api/streams.json";
const LOGOS_URL = "https://iptv-org.github.io/api/logos.json";
const CHANNELS_URL = "https://iptv-org.github.io/api/channels.json";
const MAX_CONCURRENT = 20;

const CATEGORY_MAPPING = [
  { jsonId: "auto", appId: "5" },
  { jsonId: "animation", appId: "6" },
  { jsonId: "business", appId: "7" },
  { jsonId: "classic", appId: "8" },
  { jsonId: "comedy", appId: "9" },
  { jsonId: "cooking", appId: "10" },
  { jsonId: "culture", appId: "11" },
  { jsonId: "documentary", appId: "12" },
  { jsonId: "education", appId: "13" },
  { jsonId: "entertainment", appId: "14" },
  { jsonId: "family", appId: "15" },
  { jsonId: "general", appId: "16" },
  { jsonId: "interactive", appId: null },
  { jsonId: "kids", appId: "17" },
  { jsonId: "legislative", appId: "18" },
  { jsonId: "lifestyle", appId: "19" },
  { jsonId: "movies", appId: "20" },
  { jsonId: "music", appId: "3" },
  { jsonId: "news", appId: "2" },
  { jsonId: "outdoor", appId: "21" },
  { jsonId: "public", appId: null },
  { jsonId: "relax", appId: "22" },
  { jsonId: "religious", appId: "23" },
  { jsonId: "series", appId: "24" },
  { jsonId: "science", appId: "25" },
  { jsonId: "shop", appId: "26" },
  { jsonId: "sports", appId: "4" },
  { jsonId: "travel", appId: "27" },
  { jsonId: "weather", appId: "28" },
  { jsonId: "xxx", appId: null },
];

async function isAlive(url) {
  try {
    const res = await axios.head(url, { timeout: 5000 });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function filterAlive(streamObjs) {
  const results = [];
  let active = 0;
  let i = 0;

  return new Promise((resolve) => {
    const next = () => {
      if (i >= streamObjs.length && active === 0) {
        resolve(results);
        return;
      }
      while (active < MAX_CONCURRENT && i < streamObjs.length) {
        const stream = streamObjs[i++];
        active++;
        isAlive(stream.url)
          .then((ok) => {
            if (ok) results.push(stream);
          })
          .finally(() => {
            active--;
            next();
          });
      }
    };
    next();
  });
}

async function updateChannels() {
  try {
    const channelsData = await fs.readFile(CHANNELS_FILE, "utf-8");
    const channels = JSON.parse(channelsData);

    const [{ data: streams }, { data: logos }, { data: meta }] =
      await Promise.all([
        axios.get(STREAMS_URL),
        axios.get(LOGOS_URL),
        axios.get(CHANNELS_URL),
      ]);

    const streamsMap = streams.reduce((acc, stream) => {
      if (!acc[stream.channel]) acc[stream.channel] = [];
      acc[stream.channel].push({
        url: stream.url,
        feed: stream.feed,
        quality: stream.quality,
      });
      return acc;
    }, {});

    const logosMap = logos.reduce((acc, logo) => {
      acc[logo.channel] = logo.url;
      return acc;
    }, {});

    const metaMap = meta.reduce((acc, ch) => {
      acc[ch.id] = ch;
      return acc;
    }, {});

    for (let i = 0; i < channels.length; i++) {
      const channel = channels[i];

      if (Object.keys(channel).length === 1 && channel.iptvOrgId) {
        const iptvOrgId = channel.iptvOrgId;
        const metaData = metaMap[iptvOrgId] || {};
        const logoUrl = logosMap[iptvOrgId] || null;
        const channelStreams = streamsMap[iptvOrgId] || [];

        let categoryId = null;
        if (metaData.categories && metaData.categories.length > 0) {
          const mapped = CATEGORY_MAPPING.find(
            (c) => c.jsonId === metaData.categories[0]
          );
          categoryId = mapped ? mapped.appId : null;
        }

        channels[i] = {
          id: iptvOrgId.toUpperCase(),
          categoryId,
          iptvOrgId,
          name: metaData.name || iptvOrgId,
          hls: channelStreams,
          backdrop: null,
          imageUrl: logoUrl,
          alt_names: metaData.alt_names || [],
          network: metaData.network || null,
          owners: metaData.owners || [],
          country: metaData.country || null,
          categories: metaData.categories || [],
          is_nsfw: metaData.is_nsfw || false,
          launched: metaData.launched || null,
          closed: metaData.closed || null,
          replaced_by: metaData.replaced_by || null,
          website: metaData.website || null,
        };

        console.log(`✨ Populated stub channel ${iptvOrgId}`);
      } else {
        if (streamsMap[channel.iptvOrgId]) {
          const existing = (channel.hls || []).map((h) =>
            typeof h === "string" ? { url: h, feed: null, quality: null } : h
          );

          const merged = [...existing, ...streamsMap[channel.iptvOrgId]];

          const unique = [];
          const seen = new Set();
          for (const s of merged) {
            if (!seen.has(s.url)) {
              seen.add(s.url);
              unique.push(s);
            }
          }

          console.log(`🔍 Checking ${unique.length} links for ${channel.name}...`);
          channel.hls = await filterAlive(unique);
        }

        if (logosMap[channel.iptvOrgId]) {
          channel.imageUrl = logosMap[channel.iptvOrgId];
        }

        if (metaMap[channel.iptvOrgId]) {
          const metaData = metaMap[channel.iptvOrgId];
          channel.name = metaData.name || channel.name;
          channel.alt_names = metaData.alt_names || [];
          channel.network = metaData.network || null;
          channel.owners = metaData.owners || [];
          channel.country = metaData.country || null;
          channel.categories = metaData.categories || [];
          channel.is_nsfw = metaData.is_nsfw || false;
          channel.launched = metaData.launched || null;
          channel.closed = metaData.closed || null;
          channel.replaced_by = metaData.replaced_by || null;
          channel.website = metaData.website || null;


          if (!channel.categoryId && metaData.categories?.length > 0) {
            const mapped = CATEGORY_MAPPING.find(
              (c) => c.jsonId === metaData.categories[0]
            );
            channel.categoryId = mapped ? mapped.appId : null;
          }
        }
      }
    }

    await fs.writeFile(CHANNELS_FILE, JSON.stringify(channels, null, 2));
    console.log("✅ Channels updated with feeds + alive streams + logos + metadata!");
  } catch (err) {
    console.error("❌ Error updating channels:", err.message);
  }
}

updateChannels();
