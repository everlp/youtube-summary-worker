const fs = require('fs');
const devVars = fs.readFileSync('.dev.vars', 'utf8');
const match = devVars.match(/GEMINI_API_KEY=(.*)/);
const key = match ? match[1].replace(/"/g, '') : '';

async function test() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:streamGenerateContent?alt=sse&key=${key}`;
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
IMPORTANT FORMATTING FOR 5W1H: Do NOT use markdown tables. You MUST output ALL 6 fields. Do NOT omit 'When', 'Where', or 'Why'.
You MUST use the exact following format exactly like this example:

Who
Mark
What
AI 行业的收入增长、商业模式、普及速度、定价方式和单位成本下降趋势。
When
当前 AI 商业化早期，以及未来十年。
Where
消费者 AI 市场、企业 AI 市场、云服务和数据中心基础设施领域。
Why
AI 可以依托已有互联网快速触达全球用户，并能为个人和企业直接创造效率提升、收入增长和成本优化等价值。
How
通过消费者订阅、企业按需 token 计费和基于业务价值的变现方式获得收入；同时随着 GPU 和数据中心供给改善，单位成本下降会进一步扩大需求。

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
