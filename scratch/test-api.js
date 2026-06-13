const fs = require('fs');
const path = require('path');

const envPath = "c:/Users/NJIKANG HARRY/Desktop/HARRY FINAL YEAR PRoject/Tradam/tradam/.env.local";
let grokKey = '';

try {
  const content = fs.readFileSync(envPath, 'utf8');
  const grokMatch = content.match(/^\s*GROK_API_KEY\s*=\s*(.+)$/m);
  if (grokMatch) grokKey = grokMatch[1].trim().replace(/['"]/g, '');
} catch (e) {
  console.error("Error reading .env.local:", e.message);
}

async function listGrokModels() {
  if (!grokKey) return console.log("Grok key missing.");
  try {
    console.log("Listing available Grok models from xAI...");
    const res = await fetch('https://api.x.ai/v1/models', {
      headers: {
        'Authorization': `Bearer ${grokKey}`
      }
    });
    if (!res.ok) {
      console.error("Grok ListModels failed:", await res.text());
      return;
    }
    const data = await res.json();
    console.log("Available Grok Models:", (data.models || data.data || []).map(m => m.id || m.name));
  } catch (e) {
    console.error("Grok Error listing models:", e.message);
  }
}

listGrokModels();
