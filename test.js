
        let currentSessionId = null;
        let fetchedTranscript = "";

        function clearState() {
            document.getElementById('transcriptContainer').classList.add('hidden');
            document.getElementById('transcriptArea').value = '';
            document.getElementById('outputContainer').classList.add('hidden');
            document.getElementById('markdownOutput').innerHTML = '';
            fetchedTranscript = "";
            const btn = document.getElementById('fetchSubtitlesBtn');
            btn.innerText = "提取真实字幕";
            btn.disabled = false;
        }

        function clearUrl() {
            const urlInput = document.getElementById('url');
            urlInput.value = '';
            urlInput.readOnly = false;
            urlInput.classList.remove('bg-gray-100');
            clearState();
        }

        async function fetchSubtitles(isTest) {
            const urlInput = document.getElementById('url');
            if (isTest) {
                urlInput.value = 'https://www.youtube.com/watch?v=xRh2sVcNXQ8';
                urlInput.readOnly = true;
                urlInput.classList.add('bg-gray-100');
                clearState(); // reset any previous real fetch state
            }
            
            const url = urlInput.value;
            if (!url) return alert("请输入 YouTube 视频链接");
            const btn = isTest ? document.getElementById('testSubtitlesBtn') : document.getElementById('fetchSubtitlesBtn');
            const originalText = btn.innerText;
            btn.innerText = "提取中...";
            btn.disabled = true;

            const cookie = document.getElementById('youtubeCookie')?.value || '';

            try {
                const response = await fetch('/api/subtitles', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
                    body: JSON.stringify({ url, isTest, cookie })
                });
                
                const reader = response.body.getReader();
                const decoder = new TextDecoder("utf-8");
                let buffer = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || "";
                    
                    for (let line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                if (data.event === 'progress') {
                                    btn.innerText = data.message;
                                } else if (data.event === 'done') {
                                    fetchedTranscript = data.transcript;
                                    document.getElementById('transcriptContainer').classList.remove('hidden');
                                    document.getElementById('transcriptArea').value = fetchedTranscript;
                                    btn.innerText = "重新提取字幕";
                                } else if (data.event === 'error') {
                                    throw new Error(data.error);
                                }
                            } catch (e) {
                                console.error("Parse error", e);
                            }
                        }
                    }
                }
            } catch (err) {
                alert(err.message);
                btn.innerText = originalText;
            } finally {
                btn.disabled = false;
                if (!fetchedTranscript) {
                    btn.innerText = originalText;
                }
            }
        }

        document.getElementById('fetchSubtitlesBtn').addEventListener('click', () => fetchSubtitles(false));
        document.getElementById('testSubtitlesBtn').addEventListener('click', () => fetchSubtitles(true));

        document.getElementById('generateBtn').addEventListener('click', async () => {
            const url = document.getElementById('url').value;
            if (!url) return alert("请输入 YouTube 视频链接");

            const promptRequirements = document.getElementById('promptRequirements').value;

            document.getElementById('outputContainer').classList.remove('hidden');
            const markdownOutput = document.getElementById('markdownOutput');
            const statusIndicator = document.getElementById('statusIndicator');
            const generateBtn = document.getElementById('generateBtn');

            markdownOutput.innerHTML = '';
            statusIndicator.classList.remove('hidden');
            generateBtn.disabled = true;
            generateBtn.classList.add('opacity-70');

            try {
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url, transcript: fetchedTranscript, promptRequirements })
                });

                const reader = response.body.getReader();
                const decoder = new TextDecoder("utf-8");
                let markdownText = "";
                let buffer = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    const chunkStr = decoder.decode(value, { stream: true });
                    buffer += chunkStr;
                    
                    const lines = buffer.split('\\n');
                    buffer = lines.pop() || "";
                    
                    for (let line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                if (data.event === 'session') {
                                    currentSessionId = data.sessionId;
                                } else if (data.event === 'text') {
                                    markdownText += data.text;
                                    markdownOutput.innerHTML = marked.parse(markdownText);
                                } else if (data.event === 'end') {
                                    statusIndicator.classList.add('hidden');
                                    generateBtn.disabled = false;
                                    generateBtn.classList.remove('opacity-70');
                                } else if (data.event === 'error') {
                                    alert('生成摘要出错');
                                    statusIndicator.classList.add('hidden');
                                    generateBtn.disabled = false;
                                    generateBtn.classList.remove('opacity-70');
                                }
                            } catch (e) {}
                        }
                    }
                }
            } catch (err) {
                console.error(err);
                alert("生成过程中发生错误。");
                statusIndicator.classList.add('hidden');
                generateBtn.disabled = false;
                generateBtn.classList.remove('opacity-70');
            }
        });

        function inject5W1HButtons() {
            document.querySelectorAll('h2, h3').forEach(heading => {
                if (!heading.querySelector('.w5h1-btn')) {
                    // Extract text content carefully to avoid re-adding buttons
                    let text = Array.from(heading.childNodes).filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.nodeValue).join('').trim();
                    
                    const btn = document.createElement('button');
                    btn.className = 'w5h1-btn bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border border-indigo-300 text-xs px-3 py-1 rounded-full ml-4 font-bold shadow-sm transition-colors duration-200';
                    btn.innerText = '✨ 5W1H';
                    btn.onclick = () => fetch5W1H(text);
                    heading.appendChild(btn);
                }
            });
        }

        async function fetch5W1H(chapterTitle) {
            if (!currentSessionId) return alert("会话已过期或无效。");
            
            const modal = document.getElementById('modal');
            const modalContent = document.getElementById('modalContent');
            const modalTitle = document.getElementById('modalTitle');
            
            modal.classList.remove('hidden');
            modalTitle.innerText = chapterTitle + " - 5W1H 解析";
            modalContent.innerHTML = '<div class="text-center py-8"><div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div><p class="mt-2 text-gray-500">正在生成 5W1H 深度解析...</p></div>';

            try {
                const response = await fetch('/api/5w1h', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId: currentSessionId, chapterTitle })
                });
                
                if (!response.ok) throw new Error("Failed to fetch");
                
                const data = await response.json();
                
                modalContent.innerHTML = Object.entries(data).map(([key, val]) => \`
                    <div class="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <span class="font-bold text-indigo-700 block mb-1 uppercase tracking-wide text-xs">\${key}</span>
                        <span class="text-gray-800 text-sm">\${val}</span>
                    </div>
                \`).join('');
            } catch (err) {
                modalContent.innerHTML = '<p class="text-red-500">无法生成 5W1H 总结。</p>';
            }
        }

        document.getElementById('closeModal').addEventListener('click', () => {
            document.getElementById('modal').classList.add('hidden');
        });
    