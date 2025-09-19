import express from "express";
import bodyParser from "body-parser";
import path from "path";
import fs from "fs/promises";
import { handleStream } from "./handlers/streamHandler.js";
import "dotenv/config";
import cors from "cors";
import { exec } from "child_process";
import cron from "node-cron";


const app = express();
const port = 7860;
const __dirname = path.resolve();

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

let preloadedStreams = [];

async function init() {
  const { streams } = await handleStream("tv");
  if (streams.length > 0) {
    preloadedStreams = streams;
  }
}

const updaterPath = path.join(__dirname, "src/tools", "hls-updater.js");


function updateStreams() {
  exec(`node "${updaterPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
}

cron.schedule("0 * * * *", updateStreams);


app.get("/manifest.json", (req, res) => {
  res.sendFile(path.join(__dirname, "manifest.json"));
});

app.get("/stream/:type", (req, res) => {
  const { type } = req.params;
  if (type === "tv") {
    return res.json(preloadedStreams);
  }
  return res.json([]);
});

app.get("/", (req, res) => {
  res.send({
    status: "OK",
    message: "Hello World",
  });
});

app.post("/update-streams", async (req, res) => {
  const newStreams = req.body;

  if (!Array.isArray(newStreams)) {
    return res
      .status(400)
      .json({ error: "Invalid data format. Expected an array of streams." });
  }

  const filePath = path.join(__dirname, "public", "channels.json");

  try {
    await fs.writeFile(filePath, JSON.stringify(newStreams, null, 2), "utf-8");
    res.json({ success: true, message: "Streams updated successfully." });
  } catch (error) {
    console.error("Failed to write streams.json:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  await init();
});
