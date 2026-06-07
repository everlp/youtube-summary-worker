const fs = require('fs');
const devVars = fs.readFileSync('.dev.vars', 'utf8');
const match = devVars.match(/GEMINI_API_KEY=(.*)/);
const key = match ? match[1].replace(/"/g, '') : '';

async function test() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-robotics-er-1.6-preview:streamGenerateContent?alt=sse&key=${key}`;
  const prompt = `You are a helpful AI assistant. Summarize the following video transcript into an article.

Transcript:
(Mock transcript)
Jen: 目前AI公司的商业表现和收入增长情况如何？
Mark: 新一波AI公司的收入增长正处于史无前例的爆发期。这种增长是真实的客户需求转化为银行账户中的资金，其增长速度是前所未有的。

User Requirements (Natural Language Constraints):
智能经济：收入爆发与成本塌陷 帮我总结who what when where why how

Important formatting instructions:
1. Please write the response in Chinese.
2. Structure the article clearly using Markdown headings (e.g., ## or ### for chapters). Be sure to naturally generate structured chapters based on the topics discussed.
3. CRITICAL INSTRUCTION: If the User Requirements mention a specific chapter name (e.g., "智能经济：收入爆发与成本塌陷") or explicitly ask for a 5W1H summary, you MUST ONLY output the Who, What, When, Where, Why, and How (5W1H) summary for that specific chapter.
IMPORTANT FORMATTING FOR 5W1H: Do NOT use markdown tables. You MUST use the exact following format, with the English question word on its own line, followed by the answer on the next line:
Who
[Answer here]
What
[Answer here]
When
[Answer here]
Where
[Answer here]
Why
[Answer here]
How
[Answer here]

4. Otherwise, if no specific chapter is mentioned, generate the full structured article.`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
  });
  
  const text = await res.text();
  console.log(text);
}
test();
