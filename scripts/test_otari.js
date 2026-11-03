const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
let apiKey = process.env.OTARI_API_KEY;

if (!apiKey && fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('OTARI_API_KEY=')) {
      apiKey = trimmed.slice('OTARI_API_KEY='.length).trim();
      if ((apiKey.startsWith('"') && apiKey.endsWith('"')) || (apiKey.startsWith("'") && apiKey.endsWith("'"))) {
        apiKey = apiKey.slice(1, -1);
      }
      break;
    }
  }
}

if (!apiKey) {
  console.error("OTARI_API_KEY not found in environment or .env.local");
  process.exit(1);
}

async function testCall() {
  try {
    const res = await fetch('https://otari.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Otari-Key': apiKey
      },
      body: JSON.stringify({
        model: 'alibaba/qwen-3.5-35b-a3b',
        messages: [{ role: 'user', content: 'Hello' }]
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`HTTP Error: ${res.status} ${res.statusText}`);
      console.error(errText.replace(new RegExp(apiKey, 'g'), '[REDACTED]'));
      process.exit(1);
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content;
    if (reply) {
      console.log(reply);
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Request error:", err.message);
  }
}

testCall();
