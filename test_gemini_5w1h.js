const fs = require('fs');
const devVars = fs.readFileSync('.dev.vars', 'utf8');
const match = devVars.match(/GEMINI_API_KEY=(.*)/);
const key = match ? match[1].replace(/"/g, '') : '';

async function test() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-robotics-er-1.6-preview:streamGenerateContent?alt=sse&key=${key}`;
  const prompt = "请帮我总结一段话的 5W1H。段落内容：智能经济收入爆发。请使用 markdown 格式输出。";
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
  });
  
  const text = await res.text();
  console.log(text);
}
test();
