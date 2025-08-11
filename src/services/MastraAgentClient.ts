/**
 * MastraAgentClient - 使用官方 @mastra/client-js 连接到 Mastra Agents
 * 支持流式响应和直接 Agent 调用
 */

import { MastraClient } from '@mastra/client-js';

// Mastra Workers API 地址 - 支持环境变量配置
const MASTRA_API_BASE = import.meta.env.VITE_MASTRA_API_BASE || 'https://mastra-agent.liuweiyuan0713.workers.dev';
const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';

export interface NewsArticle {
  title: string;
  summary: string;
  category: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  source: string;
  url: string;
  publishedAt: string;
  keywords: string[];
  importance: 'High' | 'Medium' | 'Low';
  aiSummary?: string;
  analysisConfidence?: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  newsData?: NewsArticle[];
  isStreaming?: boolean;
}

export interface StreamingResponse {
  content: string;
  done: boolean;
  newsData?: NewsArticle[];
}

export class MastraAgentClient {
  private client: MastraClient;
  private baseUrl: string;

  constructor(baseUrl: string = MASTRA_API_BASE) {
    this.baseUrl = baseUrl;
    this.client = new MastraClient({
      baseUrl: this.baseUrl,
    });
    
    if (DEBUG_MODE) {
      console.log(`[MastraAgentClient] Initialized with baseUrl: ${this.baseUrl}`);
    }
  }

  /**
   * 健康检查
   */
  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    try {
      if (DEBUG_MODE) {
        console.log(`[MastraAgentClient] Health check: ${this.baseUrl}/health`);
      }
      
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      
      if (DEBUG_MODE) {
        console.log('[MastraAgentClient] Health check result:', result);
      }
      
      return result;
    } catch (error) {
      console.error('Health check failed:', error);
      throw new Error('无法连接到 Mastra Workers 服务');
    }
  }

  /**
   * 使用流式响应进行智能对话
   */
  async *chatWithNewsStream(userMessage: string): AsyncGenerator<StreamingResponse, void, unknown> {
    try {
      if (DEBUG_MODE) {
        console.log('[MastraAgentClient] Stream chat request:', userMessage);
      }

      // 分析用户意图
      const intent = this.analyzeUserIntent(userMessage);
      
      // 使用 Mastra Client 调用 newsSummarizer Agent 的 stream 方法
      const stream = await this.client.agents.newsSummarizer.stream({
        messages: [
          {
            role: 'user',
            content: userMessage
          }
        ],
        context: {
          intent: intent.type,
          category: intent.category,
          maxArticles: intent.maxArticles || 5,
          focusAreas: intent.focusAreas || []
        }
      });

      let accumulatedContent = '';
      let newsData: NewsArticle[] = [];

      for await (const chunk of stream) {
        if (chunk.type === 'text') {
          accumulatedContent += chunk.content;
          yield {
            content: accumulatedContent,
            done: false
          };
        } else if (chunk.type === 'tool-call' && chunk.toolName === 'fetchNewsFromRss') {
          // 处理新闻数据
          if (chunk.result && chunk.result.articles) {
            newsData = chunk.result.articles;
          }
        }
      }

      // 流式响应结束
      yield {
        content: accumulatedContent,
        done: true,
        newsData: newsData.length > 0 ? newsData : undefined
      };

    } catch (error) {
      console.error('Stream chat failed:', error);
      yield {
        content: '抱歉，处理你的请求时遇到了问题。请稍后重试或尝试重新表达你的问题。',
        done: true
      };
    }
  }

  /**
   * 非流式智能对话（向后兼容）
   */
  async chatWithNews(userMessage: string): Promise<{
    response: string;
    newsData?: NewsArticle[];
    suggestedQuestions?: string[];
  }> {
    try {
      if (DEBUG_MODE) {
        console.log('[MastraAgentClient] Chat request:', userMessage);
      }

      // 分析用户意图
      const intent = this.analyzeUserIntent(userMessage);
      
      // 使用 Mastra Client 调用 newsSummarizer Agent
      const result = await this.client.agents.newsSummarizer.run({
        messages: [
          {
            role: 'user',
            content: userMessage
          }
        ],
        context: {
          intent: intent.type,
          category: intent.category,
          maxArticles: intent.maxArticles || 5,
          focusAreas: intent.focusAreas || []
        }
      });

      let newsData: NewsArticle[] = [];
      
      // 从工具调用结果中提取新闻数据
      if (result.toolCalls) {
        for (const toolCall of result.toolCalls) {
          if (toolCall.toolName === 'fetchNewsFromRss' && toolCall.result?.articles) {
            newsData = toolCall.result.articles;
            break;
          }
        }
      }

      const response = {
        response: result.content || '抱歉，没有获取到有效的回复。',
        newsData: newsData.length > 0 ? newsData : undefined,
        suggestedQuestions: this.generateSuggestedQuestions(intent, newsData)
      };

      if (DEBUG_MODE) {
        console.log('[MastraAgentClient] Chat response:', response);
      }

      return response;

    } catch (error) {
      console.error('Chat with news failed:', error);
      return {
        response: '抱歉，处理你的请求时遇到了问题。请稍后重试或尝试重新表达你的问题。',
        suggestedQuestions: [
          '今天有什么重要新闻？',
          '科技领域最新动态',
          '商业新闻摘要'
        ]
      };
    }
  }

  /**
   * 分析用户意图
   */
  private analyzeUserIntent(message: string): {
    type: 'news_request' | 'detailed_analysis' | 'greeting' | 'help' | 'general';
    category?: string;
    maxArticles?: number;
    summaryLength?: 'short' | 'medium' | 'long';
    focusAreas?: string[];
    keywords: string[];
  } {
    const lowerMessage = message.toLowerCase();
    
    // 问候语检测
    if (/^(你好|hi|hello|嗨|早上好|下午好|晚上好)/.test(lowerMessage)) {
      return { type: 'greeting', keywords: [] };
    }

    // 帮助请求检测
    if (/帮助|help|怎么用|如何使用|功能/.test(lowerMessage)) {
      return { type: 'help', keywords: [] };
    }

    // 详细分析请求检测
    if (/分析|深度|详细|趋势|洞察|报告/.test(lowerMessage)) {
      return {
        type: 'detailed_analysis',
        category: this.extractCategory(lowerMessage),
        focusAreas: this.extractKeywords(lowerMessage),
        keywords: this.extractKeywords(lowerMessage)
      };
    }

    // 新闻请求检测
    if (/新闻|消息|资讯|动态|最新|今天|昨天/.test(lowerMessage)) {
      return {
        type: 'news_request',
        category: this.extractCategory(lowerMessage),
        maxArticles: this.extractNumber(lowerMessage) || 5,
        keywords: this.extractKeywords(lowerMessage)
      };
    }

    // 通用查询
    return {
      type: 'general',
      keywords: this.extractKeywords(lowerMessage)
    };
  }

  /**
   * 提取类别
   */
  private extractCategory(message: string): string {
    const categories = {
      '科技|技术|AI|人工智能|互联网|软件|硬件|数码': 'technology',
      '商业|经济|金融|股票|投资|创业|公司': 'business',
      '政治|政府|选举|政策|国际|外交': 'politics',
      '体育|运动|足球|篮球|奥运': 'sports',
      '娱乐|电影|音乐|明星|游戏': 'entertainment',
      '科学|研究|发现|实验|学术': 'science',
      '健康|医疗|疫情|病毒|医学': 'health'
    };

    for (const [keywords, category] of Object.entries(categories)) {
      if (new RegExp(keywords).test(message)) {
        return category;
      }
    }

    return '';
  }

  /**
   * 提取关键词
   */
  private extractKeywords(message: string): string[] {
    const keywords = message
      .replace(/[？?！!。，,；;：:]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1)
      .filter(word => !/^(的|是|在|有|和|与|或|但|然而|因为|所以|这|那|什么|怎么|为什么|吗|呢|吧)$/.test(word));
    
    return keywords.slice(0, 5);
  }

  /**
   * 提取数字
   */
  private extractNumber(message: string): number | null {
    const match = message.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * 生成建议问题
   */
  private generateSuggestedQuestions(intent: any, newsData: NewsArticle[]): string[] {
    const questions = [
      '今天还有什么重要新闻？',
      '给我详细分析一下',
      '有什么科技新闻吗？'
    ];

    if (newsData.length > 0) {
      const categories = [...new Set(newsData.map(article => article.category))];
      categories.forEach(category => {
        questions.push(`${category}领域还有什么新闻？`);
      });
    }

    return questions.slice(0, 3);
  }

  /**
   * 获取当前配置信息
   */
  getConfig(): { baseUrl: string; debugMode: boolean } {
    return {
      baseUrl: this.baseUrl,
      debugMode: DEBUG_MODE
    };
  }
}

// 导出单例实例
export const mastraAgentClient = new MastraAgentClient();
