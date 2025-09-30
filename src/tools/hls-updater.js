import fs from "fs/promises";
import axios from "axios";
import path from "path";

const __dirname = path.resolve();

const CHANNELS_FILE = path.join(__dirname, "public", "streams.json");
const STREAMS_URL = "https://iptv-org.github.io/api/streams.json";
const LOGOS_URL = "https://iptv-org.github.io/api/logos.json";
const CHANNELS_URL = "https://iptv-org.github.io/api/channels.json";
const BEAMUP_URL = "https://848b3516657c-usatv.baby-beamup.club/catalog/tv/all.json";

const MAX_CONCURRENT = 20;

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

    const [{ data: streams }, { data: logos }, { data: meta }, { data: beamup }] =
      await Promise.all([
        axios.get(STREAMS_URL),
        axios.get(LOGOS_URL),
        axios.get(CHANNELS_URL),
        axios.get(BEAMUP_URL),
      ]);

    // iptv-org maps
    const streamsMap = streams.reduce((acc, stream) => {
      if (!acc[stream.channel]) acc[stream.channel] = [];
      acc[stream.channel].push({
        url: stream.url,
        feed: stream.feed,
        quality: stream.quality,
        provider: "iptv-org",
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

    // beamup map
    const beamupMap = beamup.metas.reduce((acc, ch) => {
      acc[ch.id] = {
        id: ch.id,
        name: ch.name,
        logo: ch.logo,
        poster: ch.poster,
        streams: (ch.streams || []).map((s) => ({
          url: s.url,
          feed: s.description || null,
          quality: s.name || null,
          provider: "beamup",
        })),
        country: ch.country,
        genres: ch.genres || [],
      };
      return acc;
    }, {});

    for (let i = 0; i < channels.length; i++) {
      const channel = channels[i];

      const iptvStreams = streamsMap[channel.iptvOrgId] || [];
      const beamupStreams = channel.babyBeamupId
        ? (beamupMap[channel.babyBeamupId]?.streams || [])
        : [];

      const merged = [
        ...(channel.hls || []).map((h) =>
          typeof h === "string" ? { url: h } : h
        ),
        ...iptvStreams,
        ...beamupStreams,
      ];

      // dedupe
      const unique = [];
      const seen = new Set();
      for (const s of merged) {
        if (!seen.has(s.url)) {
          seen.add(s.url);
          unique.push(s);
        }
      }

      if (unique.length > 0) {
        console.log(`🔍 Checking ${unique.length} streams for ${channel.name}...`);
        channel.hls = await filterAlive(unique);
      }

      // logos
      if (logosMap[channel.iptvOrgId]) {
        channel.imageUrl = logosMap[channel.iptvOrgId];
      } else if (channel.babyBeamupId && beamupMap[channel.babyBeamupId]?.logo) {
        channel.imageUrl = beamupMap[channel.babyBeamupId].logo;
      }

      // metadata
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
      } else if (channel.babyBeamupId && beamupMap[channel.babyBeamupId]) {
        const bMeta = beamupMap[channel.babyBeamupId];
        channel.name = channel.name || bMeta.name;
        channel.country = channel.country || bMeta.country;
        channel.categories = channel.categories?.length ? channel.categories : bMeta.genres;
      }
    }

    await fs.writeFile(CHANNELS_FILE, JSON.stringify(channels, null, 2));
    console.log("✅ Channels updated with IPTV-org + Beamup feeds!");
  } catch (err) {
    console.error("❌ Error updating channels:", err.message);
  }
}

updateChannels();
