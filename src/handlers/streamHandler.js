import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { validateImageDimensions } from "../utils/imageValidator.utils.js";

const __dirname = path.resolve();

export async function handleStream(type) {
  if (type === "tv") {
    const uniqueID = process.env.UNIQUE_ID;

    const jsonPath = path.join(__dirname, "public", "streams.json");
    const fileData = await fs.readFile(jsonPath, "utf-8");
    const rawChannels = JSON.parse(fileData);

    const streams = [];

    for (const channel of rawChannels) {
      streams.push({
        id: channel.id,
        categoryId: channel.categoryId,
        iptvOrgId: channel.iptvOrgId,
        name: channel.name,
        summary: `Watch ${channel.name}`,
        rating: "PG",
        stitched: {
          paths: channel.hls.map(hlsUrl => ({
            type: "hls",
            path: hlsUrl,
          })),
        },
        backdrop: channel.backdrop,
        images: channel.imageUrl,
        isAuth: channel.isAuth,
        headers: channel.headers,
        alt_names: channel.alt_names,
        network: channel.network,
        owners: channel.owners,
        country: channel.country,
        categories: channel.categories,
        is_nsfw: channel.is_nsfw,
        launched: channel.launched,
        closed: channel.closed,
        replaced_by: channel.replaced_by,
        website: channel.website,
      });
    }

    return { streams };
  }

  return { streams: [] };
}
