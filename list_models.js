const fs = require('fs');
const devVars = fs.readFileSync('.dev.vars', 'utf8');
const match = devVars.match(/GEMINI_API_KEY=(.*)/);
const key = match ? match[1].replace(/"/g, '') : '';

async function test() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  const res = await fetch(url);
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
}
test();
