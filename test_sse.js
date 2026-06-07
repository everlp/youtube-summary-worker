const lines = [
  'data: {"candidates": [{"content": {"parts": [{"text": "这是一个非常长',
  'data: 的中文段落..."}]}}]}',
  '',
  'data: [DONE]',
  ''
];

let eventBuffer = "";
for (const line of lines) {
  if (line.startsWith('data: ')) {
    eventBuffer += line.slice(6) + "\n";
  } else if (line.trim() === '') {
    if (eventBuffer.trim() === '[DONE]') {
      console.log('DONE');
    } else if (eventBuffer) {
      try {
        console.log("PARSE:", JSON.parse(eventBuffer));
      } catch (e) {
        console.log("ERR:", e.message);
      }
    }
    eventBuffer = "";
  }
}
