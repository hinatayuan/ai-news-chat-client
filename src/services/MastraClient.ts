/**
 * MastraClient - 连接到 Mastra Workers 的客户端
 * 用于调用部署在 Cloudflare Workers 上的新闻摘要 AI Agent
 */

// Mastra Workers API 地址 - 支持环境变量配置
const MASTRA_API_BASE = import.meta.env.VITE_MASTRA_API_BASE || 'https://mastra-agent.liuweiyuan0713.workers.dev';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000');
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

export interface NewsResponse {
  success: boolean;
  data: {
    summaries: NewsArticle[];
    totalArticles: number;
    timestamp: string;
    sources: string[];
    insights?: {
      categoriesFound: string[];
      sentimentBreakdown: Record<string, number>;
      highImportanceNews: number;
      averageConfidence?: number;
    };
    aiInsights?: string;
  };
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  newsData?: NewsArticle[];
}

export class MastraClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = MASTRA_API_BASE, timeout: number = API_TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
    
    if (DEBUG_MODE) {
      console.log(`[MastraClient] Initialized with baseUrl: ${this.baseUrl}, timeout: ${this.timeout}ms`);
    }
  }

  /**
   * 创建带超时的 fetch 请求
   */
  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`请求超时（${this.timeout}ms），请检查网络连接`);
      }
      throw error;
    }
  }

  /**
   * 健康检查
   */
  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    try {
      if (DEBUG_MODE) {
        console.log(`[MastraClient] Health check: ${this.baseUrl}/health`);
      }
      
      const response = await this.fetchWithTimeout(`${this.baseUrl}/health`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      
      if (DEBUG_MODE) {
        console.log('[MastraClient] Health check result:', result);
      }
      
      return result;
    } catch (error) {
      console.error('Health check failed:', error);
      throw new Error('无法连接到 Mastra Workers 服务');
    }
  }

  /**
   * 获取快速新闻摘要
   */
  async getQuickNews(options: {
    category?: string;
    maxArticles?: number;
  } = {}): Promise<NewsResponse> {
    const { category = '', maxArticles = 5 } = options;
    
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      params.append('maxArticles', maxArticles.toString());

      const url = `${this.baseUrl}/api/news?${params}`;
      if (DEBUG_MODE) {
        console.log(`[MastraClient] Quick news request: ${url}`);
      }

      const response = await this.fetchWithTimeout(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (DEBUG_MODE) {
        console.log('[MastraClient] Quick news result:', result);
      }
      
      return result;
    } catch (error) {
      console.error('Failed to fetch quick news:', error);
      throw new Error('获取新闻失败，请检查网络连接');
    }
  }

  /**
   * 获取详细新闻分析
   */
  async getDetailedAnalysis(options: {
    category?: string;
    maxArticles?: number;
    summaryLength?: 'short' | 'medium' | 'long';
    focusAreas?: string[];
  } = {}): Promise<NewsResponse> {
    const {
      category = '',
      maxArticles = 10,
      summaryLength = 'medium',
      focusAreas = []
    } = options;

    try {
      const url = `${this.baseUrl}/api/summarize`;
      const body = {
        category,
        maxArticles,
        summaryLength,
        focusAreas
      };

      if (DEBUG_MODE) {
        console.log(`[MastraClient] Detailed analysis request: ${url}`, body);
      }

      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (DEBUG_MODE) {
        console.log('[MastraClient] Detailed analysis result:', result);
      }

      return result;
    } catch (error) {
      console.error('Failed to get detailed analysis:', error);
      throw new Error('获取详细分析失败，请稍后重试');
    }
  }

  /**
   * 获取 API 文档
   */
  async getApiDocs(): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/docs`;
      if (DEBUG_MODE) {
        console.log(`[MastraClient] API docs request: ${url}`);
      }

      const response = await this.fetchWithTimeout(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (DEBUG_MODE) {
        console.log('[MastraClient] API docs result:', result);
      }
      
      return result;
    } catch (error) {
      console.error('Failed to fetch API docs:', error);
      throw new Error('获取 API 文档失败');
    }
  }

  /**
   * 智能对话 - 根据用户输入返回相关新闻
   */
  async chatWithNews(userMessage: string): Promise<{
    response: string;
    newsData?: NewsArticle[];
    suggestedQuestions?: string[];
  }> {
    try {
      if (DEBUG_MODE) {
        console.log('[MastraClient] Chat request:', userMessage);
      }

      // 分析用户消息，提取关键词和意图
      const intent = this.analyzeUserIntent(userMessage);
      
      let newsData: NewsArticle[] = [];
      let response = '';

      switch (intent.type) {
        case 'news_request':
          const newsResponse = await this.getQuickNews({
            category: intent.category,
            maxArticles: intent.maxArticles || 5
          });
          
          newsData = newsResponse.data.summaries;
          response = this.generateNewsResponse(intent, newsResponse.data);
          break;

        case 'detailed_analysis':
          const analysisResponse = await this.getDetailedAnalysis({
            category: intent.category,
            maxArticles: intent.maxArticles || 8,
            summaryLength: intent.summaryLength || 'medium',
            focusAreas: intent.focusAreas
          });
          
          newsData = analysisResponse.data.summaries;
          response = this.generateAnalysisResponse(intent, analysisResponse.data);
          break;

        case 'greeting':
          response = '你好！我是 AI 新闻助手，可以为你提供最新的新闻摘要和分析。你想了解哪方面的新闻呢？';
          break;

        case 'help':
          response = `我可以帮你：
📰 获取最新新闻摘要
🔍 深度分析特定领域新闻  
📊 提供新闻趋势洞察
💡 回答新闻相关问题

试试问我："今天有什么科技新闻？" 或 "分析一下AI领域的最新动态"`;
          break;

        default:
          // 尝试作为新闻查询处理
          const defaultResponse = await this.getQuickNews({
            category: intent.keywords.join(' '),
            maxArticles: 3
          });
          
          newsData = defaultResponse.data.summaries;
          response = `根据你的问题，我找到了以下相关新闻：`;
          break;
      }

      const result = {
        response,
        newsData,
        suggestedQuestions: this.generateSuggestedQuestions(intent, newsData)
      };

      if (DEBUG_MODE) {
        console.log('[MastraClient] Chat response:', result);
      }

      return result;

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
    // 简单的关键词提取，可以后续优化
    const keywords = message
      .replace(/[？?！!。，,；;：:]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1)
      .filter(word => !/^(的|是|在|有|和|与|或|但|然而|因为|所以|这|那|什么|怎么|为什么|吗|呢|吧)$/.test(word));
    
    return keywords.slice(0, 5); // 限制关键词数量
  }

  /**
   * 提取数字
   */
  private extractNumber(message: string): number | null {
    const match = message.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * 生成新闻响应
   */
  private generateNewsResponse(intent: any, data: any): string {
    const categoryText = intent.category ? `${intent.category}领域的` : '';
    const count = data.summaries.length;
    
    return `为你找到了 ${count} 条${categoryText}最新新闻：`;
  }

  /**
   * 生成分析响应
   */
  private generateAnalysisResponse(intent: any, data: any): string {
    const categoryText = intent.category ? `${intent.category}领域` : '全领域';
    const insights = data.insights;
    
    let response = `${categoryText}新闻分析报告：\n\n`;
    
    if (insights) {
      response += `📊 统计概览：\n`;
      response += `• 共分析 ${data.totalArticles} 篇文章\n`;
      response += `• 涉及类别：${insights.categoriesFound.join('、')}\n`;
      
      if (insights.sentimentBreakdown) {
        const sentiment = Object.entries(insights.sentimentBreakdown)
          .map(([key, value]) => `${key}: ${value}篇`)
          .join('，');
        response += `• 情感分布：${sentiment}\n`;
      }
      
      if (insights.highImportanceNews > 0) {
        response += `• 高重要度新闻：${insights.highImportanceNews} 篇\n`;
      }
    }

    if (data.aiInsights) {
      response += `\n🤖 AI 洞察：\n${data.aiInsights}`;
    }

    return response;
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
  getConfig(): { baseUrl: string; timeout: number; debugMode: boolean } {
    return {
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      debugMode: DEBUG_MODE
    };
  }
}

// 导出单例实例
export const mastraClient = new MastraClient();
