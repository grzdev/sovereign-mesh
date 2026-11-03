import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const content = fs.readFileSync(envPath, 'utf8');
let key = '';
for (const line of content.split('\n')) {
  if (line.trim().startsWith('OTARI_API_KEY=')) {
    key = line.trim().slice('OTARI_API_KEY='.length).trim().replace(/^['"]|['"]$/g, '');
    break;
  }
}

async function run() {
  try {
    const res = await fetch('https://otari.ai/api/v1/models', {
      headers: { 'Otari-Key': key }
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Models:', data.data ? data.data.map(m => m.id) : data);
  } catch (e) {
    console.error('Error:', e.message);
  }
}
run();
