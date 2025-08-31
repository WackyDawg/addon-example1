import sizeOf from "image-size";
import mime from "mime-types";
import axios from "axios";

/**
 * Validates image dimensions from a URL and constructs metadata.
 * @param {string} imageUrl - Full image URL.
 * @param {string} Id - Channel ID.
 * @returns {Object|null} - Image metadata or null on failure.
 */
export const validateImageDimensions = async (imageUrl) => {
  try {
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data, "binary");

    const dimensions = sizeOf(buffer);
    const ratio = dimensions.width / dimensions.height;
    const mimeType = mime.lookup(imageUrl);
    const type = imageUrl.split("/").pop();

    return {
      type,
      style: dimensions.width > dimensions.height ? "wide" : "tall",
      ratio,
      defaultWidth: dimensions.width,
      defaultHeight: dimensions.height,
      url: imageUrl,
    };
  } catch (error) {
    console.error("Image dimension validation failed:", error.message);
    return null;
  }
};
