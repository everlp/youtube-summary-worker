export const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI YouTube 摘要生成器</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <style>
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f8fafc; }
        .glass-panel { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(16px); border: 1px solid rgba(241, 245, 249, 0.8); }
        .markdown-body h2 { font-size: 1.5rem; font-weight: 700; margin-top: 2rem; margin-bottom: 0.75rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; display: flex; align-items: center; justify-content: space-between; }
        .markdown-body h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: space-between; }
        .markdown-body p { margin-bottom: 1rem; line-height: 1.75; color: #334155; }
        .markdown-body ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 1rem; color: #475569; }
        .markdown-body ol { list-style-type: decimal; margin-left: 1.5rem; margin-bottom: 1rem; color: #475569; }
        .loading-dots:after {
            content: '.';
            animation: dots 1.5s steps(5, end) infinite;
        }
        @keyframes dots { 0%, 20% { content: '.'; } 40% { content: '..'; } 60% { content: '...'; } 80%, 100% { content: ''; } }
    </style>
</head>
<body class="min-h-screen p-4 md:p-8 text-slate-800">
    <div class="max-w-4xl mx-auto space-y-6">
        <header class="text-center mb-10">
            <h1 class="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mb-2">AI YouTube 摘要生成器</h1>
            <p class="text-slate-500">使用 Gemini AI 直接从 YouTube 视频生成结构化的章节摘要。</p>
        </header>

        <!-- STEP 1: Subtitle Extraction & Base Summary -->
        <div class="glass-panel rounded-2xl p-6 shadow-xl space-y-6">
            <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">1</span>
                <h2 class="text-lg font-bold text-slate-800">第一步：提取视频字幕</h2>
            </div>
            
            <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1.5">YouTube 视频链接</label>
                <div class="relative">
                    <input type="text" id="url" class="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm bg-white/70" placeholder="https://www.youtube.com/watch?v=..." oninput="clearState()">
                    <button onclick="clearUrl()" class="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 font-bold" title="清除链接并重置">✕</button>
                </div>
            </div>

            <div class="flex space-x-4">
                <button id="quickGenerateBtn" class="w-1/2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform transition hover:scale-[1.01] flex justify-center items-center gap-2">
                    🔄 提取弹幕
                </button>
                <button id="testSubtitlesBtn" class="w-1/2 bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform transition hover:scale-[1.01] flex justify-center items-center gap-2">
                    📝 测试兜底文章
                </button>
            </div>

            <!-- Subtitle Display Area -->
            <div id="subtitlesSection" class="hidden border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-2">
                <div class="flex justify-between items-center mb-1">
                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider">视频字幕内容</label>
                        <p class="text-[10px] text-slate-400">可自动提取，也可直接手动粘贴/修改</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <span id="subtitleCharCount" class="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full"></span>
                        <button id="generateFromCurrentBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition shadow-sm">
                            ⚡️ 基于当前字幕生成标准文档
                        </button>
                    </div>
                </div>
                <textarea id="transcriptArea" class="w-full h-64 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white/80 shadow-inner resize-y placeholder-slate-400 font-mono" placeholder="自动提取成功后，这里将显示原文字幕内容..."></textarea>
            </div>

            <!-- Collapsible Advanced Options -->
            <details class="group border-t border-slate-100 pt-4">
                <summary class="flex justify-between items-center font-bold text-slate-600 hover:text-slate-800 text-sm cursor-pointer select-none py-2">
                    <span class="flex items-center gap-1.5">⚙️ 调试选项与手动 Cookie 设置</span>
                    <span class="transition group-open:rotate-180">
                        <svg fill="none" height="18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="18" class="h-4 w-4 text-slate-500"><path d="M6 9l6 6 6-6"></path></svg>
                    </span>
                </summary>
                <div class="pt-4 space-y-4">
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">YouTube 账号 Cookie (防验证码限制)</label>
                        <input type="text" id="youtubeCookie" class="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-1 focus:ring-blue-500 bg-white" placeholder="粘贴您的 YouTube Cookie 字符串 (可选)">
                        <p class="mt-1 text-[10px] text-red-500">⚠️ 强烈建议使用测试小号 Cookie，避免主号受限。</p>
                    </div>
                </div>
            </details>
        </div>

        <!-- Output Section (Step 1 Result) -->
        <div id="outputContainer" class="hidden glass-panel rounded-2xl p-6 shadow-xl min-h-[200px] space-y-4">
            <div id="statusIndicator" class="text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span id="statusText">正在初始化...</span>
                </div>
            </div>
            <div class="border-b border-slate-100 pb-2">
                <h3 class="text-md font-bold text-slate-800">📄 整理后的标准版视频对话文章</h3>
            </div>
            <div id="markdownOutput" class="markdown-body text-slate-800"></div>
        </div>

        <!-- STEP 2: Custom Summary Section -->
        <div id="step2Container" class="hidden glass-panel rounded-2xl p-6 shadow-xl space-y-6">
            <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span class="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold">2</span>
                <h2 class="text-lg font-bold text-slate-800">第二步：根据自定义要求精炼总结 (可选)</h2>
            </div>
            
            <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1.5">自然语言生成要求</label>
                <textarea id="promptRequirements" rows="3" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition shadow-sm bg-white/70" placeholder="例如：请用小红书风格总结，重点突出 AI 行业的商业模式与成本变化，并加入符合段落意境的表情符号..."></textarea>
                <p class="mt-1.5 text-xs text-slate-400">可以通过自然语言设定任务类型、输出风格、目标受众、约束条件等。</p>
            </div>

            <div class="flex space-x-4">
                <button id="refinedGenerateBtn" class="w-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-700 hover:via-fuchsia-700 hover:to-pink-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transform transition hover:scale-[1.01] flex justify-center items-center gap-2">
                    ✨ 根据要求生成自定义总结
                </button>
            </div>

            <!-- Refined Output Section -->
            <div id="refinedOutputContainer" class="hidden border-t border-slate-100 pt-6 space-y-4">
                <div id="refinedStatusIndicator" class="text-sm font-semibold text-purple-600 bg-purple-50 border border-purple-100 rounded-lg p-3 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                        <span id="refinedStatusText">正在准备生成...</span>
                    </div>
                </div>
                <div class="border-b border-slate-100 pb-2">
                    <h3 class="text-md font-bold text-purple-800">✨ 自定义精炼总结文章</h3>
                </div>
                <div id="refinedMarkdownOutput" class="markdown-body text-slate-800"></div>
            </div>
        </div>
    </div>

    <!-- 5W1H Modal -->
    <div id="modal" class="fixed inset-0 bg-black/60 hidden flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl transform transition-all border border-slate-100">
            <h3 class="text-xl font-bold mb-4 border-b pb-2 text-slate-800" id="modalTitle">5W1H 深度解析</h3>
            <div id="modalContent" class="space-y-3 max-h-[70vh] overflow-y-auto pr-1"></div>
            <div class="mt-6 text-right">
                <button id="closeModal" class="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 px-5 rounded-xl transition">关闭</button>
            </div>
        </div>
    </div>

    <script>
        let currentSessionId = null;
        let refinedSessionId = null;
        let fetchedTranscript = "";

        // Real-time character count badge update
        function updateCharCount() {
            const transcriptArea = document.getElementById('transcriptArea');
            const charCount = document.getElementById('subtitleCharCount');
            if (transcriptArea && charCount) {
                const len = transcriptArea.value.length;
                charCount.innerText = len > 0 ? "共 " + len + " 字符" : "";
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            const transcriptArea = document.getElementById('transcriptArea');
            if (transcriptArea) {
                transcriptArea.addEventListener('input', updateCharCount);
            }
        });

        function clearState() {
            document.getElementById('transcriptArea').value = '';
            document.getElementById('subtitleCharCount').innerText = '';
            document.getElementById('outputContainer').classList.add('hidden');
            document.getElementById('markdownOutput').innerHTML = '';
            document.getElementById('step2Container').classList.add('hidden');
            document.getElementById('refinedOutputContainer').classList.add('hidden');
            document.getElementById('refinedMarkdownOutput').innerHTML = '';
            fetchedTranscript = "";
            document.getElementById('quickGenerateBtn').disabled = false;
        }

        function clearUrl() {
            const urlInput = document.getElementById('url');
            urlInput.value = '';
            urlInput.readOnly = false;
            urlInput.classList.remove('bg-slate-100');
            clearState();
        }

        // Promisified subtitle fetcher for workflow control
        function fetchSubtitlesWorkflow(isTest) {
            return new Promise(async (resolve, reject) => {
                const url = document.getElementById('url').value;
                const cookie = document.getElementById('youtubeCookie')?.value || '';
                const statusText = document.getElementById('statusText');

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
                        const lines = buffer.split(/\\r?\\n/);
                        buffer = lines.pop() || "";
                        
                        for (let line of lines) {
                            if (line.startsWith('data: ')) {
                                try {
                                    const data = JSON.parse(line.slice(6));
                                    if (data.event === 'progress') {
                                        statusText.innerText = data.message;
                                    } else if (data.event === 'done') {
                                        fetchedTranscript = data.transcript;
                                        
                                        // Update subtitle area
                                        const transcriptArea = document.getElementById('transcriptArea');
                                        transcriptArea.value = fetchedTranscript;
                                        transcriptArea.readOnly = false;
                                        updateCharCount();
                                        
                                        document.getElementById('subtitlesSection').classList.remove('hidden');
                                    } else if (data.event === 'error') {
                                        reject(new Error(data.error));
                                        return;
                                    }
                                } catch (e) {
                                    console.error("Parse error", e);
                                }
                            }
                        }
                    }
                    if (fetchedTranscript) {
                        resolve(fetchedTranscript);
                    } else {
                        reject(new Error("未提取到任何字幕数据。"));
                    }
                } catch (err) {
                    reject(err);
                }
            });
        }

        // SSE baseline article generator flow
        async function triggerGenerationWorkflow(transcript) {
            const url = document.getElementById('url').value;
            const markdownOutput = document.getElementById('markdownOutput');
            const statusIndicator = document.getElementById('statusIndicator');
            const statusText = document.getElementById('statusText');
            const quickGenerateBtn = document.getElementById('quickGenerateBtn');

            markdownOutput.innerHTML = '';
            statusIndicator.classList.remove('hidden');
            statusText.innerText = "正在调用 Gemini 大模型翻译并整理标准对话文章...";

            try {
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url, transcript, promptRequirements: "" }) // Baseline
                });

                if (!response.ok) {
                    throw new Error("HTTP 错误: " + response.status);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder("utf-8");
                let markdownText = "";
                let buffer = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split(/\\r?\\n/);
                    buffer = lines.pop() || "";

                    for (let line of lines) {
                        line = line.trim();
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                if (data.event === 'session') {
                                    currentSessionId = data.sessionId;
                                } else if (data.event === 'text') {
                                    markdownText += data.text;
                                    markdownOutput.innerHTML = marked.parse(markdownText);
                                    inject5W1HButtons('markdownOutput', currentSessionId);
                                } else if (data.event === 'error') {
                                    throw new Error(data.message);
                                }
                            } catch (e) {
                                if (e.message.startsWith("Gemini")) throw e;
                                console.error("解析 SSE 失败", e, line);
                            }
                        }
                    }
                }
                statusIndicator.classList.add('hidden');
                
                // Show Step 2 custom summary section
                document.getElementById('step2Container').classList.remove('hidden');
                document.getElementById('step2Container').scrollIntoView({ behavior: 'smooth' });
            } catch (err) {
                alert("整理文章失败: " + err.message);
                statusText.innerText = "❌ 整理失败: " + err.message;
            } finally {
                quickGenerateBtn.disabled = false;
                quickGenerateBtn.classList.remove('opacity-75');
            }
        }

        // SSE custom summary generation flow
        async function triggerRefinedGenerationWorkflow() {
            const url = document.getElementById('url').value;
            const transcript = document.getElementById('transcriptArea').value.trim();
            const promptRequirements = document.getElementById('promptRequirements').value;
            const refinedGenerateBtn = document.getElementById('refinedGenerateBtn');
            const refinedOutputContainer = document.getElementById('refinedOutputContainer');
            const refinedMarkdownOutput = document.getElementById('refinedMarkdownOutput');
            const refinedStatusIndicator = document.getElementById('refinedStatusIndicator');
            const refinedStatusText = document.getElementById('refinedStatusText');

            if (!transcript) return alert("无可用的字幕内容，请先执行第一步。");

            refinedMarkdownOutput.innerHTML = '';
            refinedOutputContainer.classList.remove('hidden');
            refinedStatusIndicator.classList.remove('hidden');
            refinedGenerateBtn.disabled = true;
            refinedGenerateBtn.classList.add('opacity-75');
            refinedStatusText.innerText = "正在根据您的特定要求生成自定义总结...";

            try {
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url, transcript, promptRequirements })
                });

                if (!response.ok) {
                    throw new Error("HTTP 错误: " + response.status);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder("utf-8");
                let markdownText = "";
                let buffer = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split(/\\r?\\n/);
                    buffer = lines.pop() || "";

                    for (let line of lines) {
                        line = line.trim();
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                if (data.event === 'session') {
                                    refinedSessionId = data.sessionId;
                                } else if (data.event === 'text') {
                                    markdownText += data.text;
                                    refinedMarkdownOutput.innerHTML = marked.parse(markdownText);
                                } else if (data.event === 'error') {
                                    throw new Error(data.message);
                                }
                            } catch (e) {
                                if (e.message?.startsWith("Gemini")) throw e;
                                console.error("解析 SSE 失败", e, line);
                            }
                        }
                    }
                }
                refinedStatusIndicator.classList.add('hidden');
                refinedMarkdownOutput.scrollIntoView({ behavior: 'smooth' });
            } catch (err) {
                alert("生成精炼总结失败: " + err.message);
                refinedStatusText.innerText = "❌ 生成失败: " + err.message;
            } finally {
                refinedGenerateBtn.disabled = false;
                refinedGenerateBtn.classList.remove('opacity-75');
            }
        }

        // Step 1: Subtitle Extraction + Generation trigger
        document.getElementById('quickGenerateBtn').addEventListener('click', async () => {
            const url = document.getElementById('url').value;
            if (!url) return alert("请输入 YouTube 视频链接");

            const outputContainer = document.getElementById('outputContainer');
            const markdownOutput = document.getElementById('markdownOutput');
            const statusIndicator = document.getElementById('statusIndicator');
            const statusText = document.getElementById('statusText');
            const quickGenerateBtn = document.getElementById('quickGenerateBtn');

            // Reset UI
            markdownOutput.innerHTML = '';
            outputContainer.classList.remove('hidden');
            statusIndicator.classList.remove('hidden');
            quickGenerateBtn.disabled = true;
            quickGenerateBtn.classList.add('opacity-75');

            statusText.innerText = "正在智能提取视频字幕...";
            try {
                const transcript = await fetchSubtitlesWorkflow(false);
                await triggerGenerationWorkflow(transcript);
            } catch (err) {
                alert("获取字幕失败，您可以尝试手动在下方粘贴字幕内容后重新生成。\\n错误原因: " + err.message);
                statusIndicator.classList.add('hidden');
                quickGenerateBtn.disabled = false;
                quickGenerateBtn.classList.remove('opacity-75');
            }
        });

        // Step 1: Mock/Test data load + Generation trigger
        document.getElementById('testSubtitlesBtn').addEventListener('click', async () => {
            const outputContainer = document.getElementById('outputContainer');
            const markdownOutput = document.getElementById('markdownOutput');
            const statusIndicator = document.getElementById('statusIndicator');
            const statusText = document.getElementById('statusText');
            const testSubtitlesBtn = document.getElementById('testSubtitlesBtn');

            // Set link
            document.getElementById('url').value = 'https://www.youtube.com/watch?v=4j1omjaRu0A';

            markdownOutput.innerHTML = '';
            outputContainer.classList.remove('hidden');
            statusIndicator.classList.remove('hidden');
            testSubtitlesBtn.disabled = true;
            testSubtitlesBtn.classList.add('opacity-75');

            statusText.innerText = "正在载入测试兜底数据...";
            try {
                // Fetch using isTest = true
                const transcript = await fetchSubtitlesWorkflow(true);
                await triggerGenerationWorkflow(transcript);
            } catch (err) {
                alert("载入兜底数据失败: " + err.message);
                statusIndicator.classList.add('hidden');
            } finally {
                testSubtitlesBtn.disabled = false;
                testSubtitlesBtn.classList.remove('opacity-75');
            }
        });

        // Step 1: Direct summary generation from current textarea content
        document.getElementById('generateFromCurrentBtn').addEventListener('click', async () => {
            const transcript = document.getElementById('transcriptArea').value.trim();
            if (!transcript) return alert("无可用的字幕内容，请先提取或手动粘贴。");
            
            const outputContainer = document.getElementById('outputContainer');
            const markdownOutput = document.getElementById('markdownOutput');
            const statusIndicator = document.getElementById('statusIndicator');
            const statusText = document.getElementById('statusText');
            
            markdownOutput.innerHTML = '';
            outputContainer.classList.remove('hidden');
            statusIndicator.classList.remove('hidden');
            statusText.innerText = "正在根据当前编辑的字幕生成整理文章...";
            
            await triggerGenerationWorkflow(transcript);
        });

        // Step 2 Trigger
        document.getElementById('refinedGenerateBtn').addEventListener('click', triggerRefinedGenerationWorkflow);

        function inject5W1HButtons(containerId, sessionId) {
            const container = document.getElementById(containerId);
            if (!container) return;
            container.querySelectorAll('h2, h3').forEach(heading => {
                if (!heading.querySelector('.w5h1-btn')) {
                    let text = Array.from(heading.childNodes).filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.nodeValue).join('').trim();
                    
                    const btn = document.createElement('button');
                    btn.className = 'w5h1-btn bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs px-3 py-1 rounded-full ml-4 font-bold shadow-sm transition-all duration-200 hover:scale-105';
                    btn.innerText = '✨ 5W1H';
                    btn.onclick = () => fetch5W1H(text, sessionId);
                    heading.appendChild(btn);
                }
            });
        }

        async function fetch5W1H(chapterTitle, sessionId) {
            if (!sessionId) return alert("会话已过期或无效。");
            
            const modal = document.getElementById('modal');
            const modalContent = document.getElementById('modalContent');
            const modalTitle = document.getElementById('modalTitle');
            
            modal.classList.remove('hidden');
            modalTitle.innerText = chapterTitle + " - 5W1H 解析";
            modalContent.innerHTML = '<div class="text-center py-8"><div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div><p class="mt-2 text-slate-500">正在生成 5W1H 深度解析...</p></div>';

            try {
                const response = await fetch('/api/5w1h', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId, chapterTitle })
                });
                
                if (!response.ok) throw new Error("Failed to fetch");
                
                const data = await response.json();
                
                modalContent.innerHTML = Object.entries(data).map(([key, val]) => \`
                    <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                        <span class="font-bold text-indigo-700 block uppercase tracking-wider text-xs">\${key}</span>
                        <span class="text-slate-700 text-sm leading-relaxed">\${val}</span>
                    </div>
                \`).join('');
            } catch (err) {
                modalContent.innerHTML = '<p class="text-red-500">无法生成 5W1H 总结。</p>';
            }
        }

        document.getElementById('closeModal').addEventListener('click', () => {
            document.getElementById('modal').classList.add('hidden');
        });
    </script>
</body>
</html>`;
