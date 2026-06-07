import { Context } from '@google/adk';

export class SummaryAgent {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  getPrompt(transcript: string, promptRequirements?: string): string {
    const hasReqs = !!(promptRequirements && promptRequirements.trim().length > 0);

    if (hasReqs) {
      return `你是一个视频内容总结与分析助手。请根据以下 YouTube 视频字幕内容，针对用户的特定要求或关注的主题（如：“${promptRequirements}”），生成一份结构化的 5W1H（Who, What, When, Where, Why, How）总结。

【视频字幕】：
${transcript}

【用户生成要求】：
${promptRequirements}

【生成与排版规范（必须严格遵守）】：
1. 语言限制：你必须且只能使用【简体中文】进行总结与输出。
2. 5W1H 排版要求：必须且仅输出 Who, What, When, Where, Why, How 6个维度的总结，采用以下无序列表和粗体标题的格式（不要使用 Markdown 表格，不要输出其他多余的前言、结语或对话）：

- **Who**：[写明涉及的主体人物]
- **What**：[写明发生的核心事件或理念]
- **When**：[写明发生的时间节点或时间框架]
- **Where**：[写明发生或适用的领域、场景]
- **Why**：[写明深层原因、逻辑或动机]
- **How**：[写明具体的方法、策略或手段]`;
    }

    let formattingInstructions = `1. 语言限制：无论原始视频字幕是什么语言（英文、日文、繁体中文等），你必须且只能使用【简体中文】整理生成最终的对话文章。
2. 完整还原细节：请务必翻译、整理并还原原始视频中的全部对话内容与论点细节。不要缩减为大纲或摘要，而是产出一篇排版优美、逻辑流畅、可读性极强的完整对话文章（还原真实交流逻辑）。
3. 清除杂音：原始字幕中可能包含大量语音识别错误、词语/句子重复或冗余口头禅，请在整理时彻底清理这些杂音，确保文笔通顺专业。
4. 结构化清晰排版：使用 Markdown 格式（如使用 ## 或 ### 标记章节标题）进行清晰的结构化排版，按照对话的主题演进拆分为不同的章节标签。
5. 人物角色：如果能从语境中识别说话人，请使用 'Jen: ...', 'Mark: ...' 等角色名前缀予以区分。`;

    return `你是一个视频整理助手。请根据以下 YouTube 视频字幕，翻译并整理为一篇排版清晰、结构分明的中文视频对话记录文章。

【视频字幕】：
${transcript}

【生成与排版规范（必须严格遵守）】：
${formattingInstructions}`;
  }

  // We expose the raw stream endpoint here to integrate easily with Hono SSE
  getStreamUrl(): string {
    return `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:streamGenerateContent?alt=sse&key=${this.apiKey}`;
  }
}
