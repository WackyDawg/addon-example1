import axios from "axios";

/**
 * Updates multiple categories by adding provided channel IDs and slugs.
 * @param {string[]} categoryIds - List of category IDs to update
 * @param {string[]} channelIds - List of channel IDs to add
 * @param {string[]} channelSlugs - List of channel slugs to add
 */
export async function updateCategoryWithChannels(categoryIds, channelIds, channelSlugs) {
  for (const categoryId of categoryIds) {
    try {
      await axios.post("http://localhost:7000/api/categories/add-channels", {
        categoryId,
        channelIds,
        channelSlugs,
      });
      console.log(`Category ${categoryId} updated successfully.`);
    } catch (err) {
      console.error(`Failed to update category ${categoryId}:`, err.message);
    }
  }
}
