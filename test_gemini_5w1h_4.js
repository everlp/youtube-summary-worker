const fs = require('fs');
const devVars = fs.readFileSync('.dev.vars', 'utf8');
const match = devVars.match(/GEMINI_API_KEY=(.*)/);
const key = match ? match[1].replace(/"/g, '') : '';

async function test() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:streamGenerateContent?alt=sse&key=${key}`;
  const prompt = "hello";

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
  });
  
  const text = await res.text();
  console.log(text);
}
test();
