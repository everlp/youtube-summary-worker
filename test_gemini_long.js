const fs = require('fs');
const devVars = fs.readFileSync('.dev.vars', 'utf8');
const match = devVars.match(/GEMINI_API_KEY=(.*)/);
const key = match ? match[1].replace(/"/g, '') : '';

async function test() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:streamGenerateContent?alt=sse&key=${key}`;
  const prompt = `You are a helpful AI assistant. Summarize the following video transcript into an article.

Transcript:
(Mock transcript)
Jen: 目前AI公司的商业表现和收入增长情况如何？
Mark: 新一波AI公司的收入增长正处于史无前例的爆发期。这种增长是真实的客户需求转化为银行账户中的资金，其增长速度是前所未有的。
Jen: 那么硬件格局呢？
Mark: GPU很重要，但专用芯片将很快过剩。中美在开源上也有博弈。

User Requirements (Natural Language Constraints):
No specific requirements provided.

Important formatting instructions:
1. Please write the response in Chinese.
2. Structure the article clearly using Markdown headings (e.g., ## or ### for chapters). Be sure to naturally generate structured chapters based on the topics discussed.
`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
  });
  
  let resultText = "";
  let buffer = "";
  for await (const chunk of res.body) {
    buffer += new TextDecoder().decode(chunk);
    let lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (txt) resultText += txt;
      }
    }
  }
  console.log(resultText);
}
test();
