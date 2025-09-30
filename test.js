import fs from 'fs';
import axios from 'axios';
import xml2js from 'xml2js';

// Replace with your XML file path or URL
const XML_FILE = './epg.xml'; 
// OR for URL: const XML_FILE = 'https://example.com/epg.xml';

async function loadXml() {
  if (XML_FILE.startsWith('http')) {
    const { data } = await axios.get(XML_FILE);
    return data;
  } else {
    return fs.readFileSync(XML_FILE, 'utf-8');
  }
}

async function extractChannels() {
  const xmlData = await loadXml();
  const parser = new xml2js.Parser();
  const result = await parser.parseStringPromise(xmlData);

  const channelsArray = result.tv.channel || [];
  const channelsJson = channelsArray.map(ch => ({
    id: ch.$.id,
    name: ch['display-name']?.[0] || ''
  }));

  fs.writeFileSync('channels.json', JSON.stringify(channelsJson, null, 2));
  console.log(`Extracted ${channelsJson.length} channels to channels.json`);
}

extractChannels().catch(console.error);
