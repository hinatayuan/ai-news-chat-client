import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, AlertCircle, Sparkles, TrendingUp, Clock } from 'lucide-react';
import { mastraAgentClient, ChatMessage } from '../services/MastraAgentClient';
import NewsCard from './NewsCard';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';

interface NewsChatBoxProps {
  className?: string;
}

const NewsChatBox: React.FC<NewsChatBoxProps> = ({ className = '' }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: '你好！我是 AI 新闻助手，现在支持实时流式响应！我可以为你提供最新的新闻摘要和深度分析。你想了解哪方面的新闻呢？',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [suggestedQuestions, setSuggestedQuestions] = useState([
    '今天有什么重要新闻？',
    '科技领域最新动态',
    '给我分析一下商业新闻'
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 检查连接状态
  useEffect(() => {
    const checkConnection = async () => {
      try {
        await mastraAgentClient.checkHealth();
        setIsConnected(true);
      } catch (error) {
        setIsConnected(false);
      }
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 60000); // 每分钟检查一次
    return () => clearInterval(interval);
  }, []);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 处理流式发送消息
  const handleStreamingMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // 创建助手消息（流式更新）
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      // 使用流式响应
      const stream = mastraAgentClient.chatWithNewsStream(content);
      
      for await (const chunk of stream) {
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? {
                ...msg,
                content: chunk.content,
                newsData: chunk.newsData,
                isStreaming: !chunk.done
              }
            : msg
        ));

        if (chunk.done) {
          // 生成建议问题
          if (chunk.newsData && chunk.newsData.length > 0) {
            const categories = [...new Set(chunk.newsData.map(article => article.category))];
            setSuggestedQuestions([
              '还有其他相关新闻吗？',
              '详细分析一下这些新闻',
              `${categories[0] || '这个'}领域的趋势如何？`
            ]);
          } else {
            setSuggestedQuestions([
              '今天还有什么重要新闻？',
              '科技领域最新动态',
              '商业新闻摘要'
            ]);
          }
        }
      }
    } catch (error) {
      // 错误处理
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? {
              ...msg,
              content: '抱歉，处理请求时出现问题。请检查网络连接或稍后重试。',
              isStreaming: false
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  // 处理发送消息
  const handleSendMessage = async (content?: string) => {
    const messageContent = content || inputValue.trim();
    if (!messageContent || isLoading) return;

    // 使用流式响应
    await handleStreamingMessage(messageContent);
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 处理建议问题点击
  const handleSuggestedQuestionClick = (question: string) => {
    handleSendMessage(question);
  };

  // 渲染流式消息效果
  const renderMessage = (message: ChatMessage) => (
    <div key={message.id} className={`flex items-start gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
      {/* 头像 */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        message.type === 'user' 
          ? 'bg-blue-600 text-white' 
          : 'bg-gradient-to-br from-purple-500 to-blue-600 text-white'
      }`}>
        {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* 消息内容 */}
      <div className={`flex-1 max-w-[80%] ${message.type === 'user' ? 'flex flex-col items-end' : ''}`}>
        <div className={`rounded-2xl px-4 py-3 ${
          message.type === 'user'
            ? 'bg-blue-600 text-white ml-auto'
            : 'bg-gray-100 text-gray-900'
        }`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            rehypePlugins={[rehypeHighlight, rehypeRaw]}
            className={`prose prose-sm max-w-none ${
              message.type === 'user' ? 'prose-invert' : ''
            }`}
          >
            {message.content}
          </ReactMarkdown>
          
          {/* 流式输入动画 */}
          {message.isStreaming && (
            <div className="typing-indicator mt-2">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          )}
        </div>

        {/* 新闻数据展示 */}
        {message.newsData && message.newsData.length > 0 && (
          <div className="mt-3 space-y-3 w-full">
            {message.newsData.map((article, index) => (
              <NewsCard 
                key={index} 
                article={article} 
                compact={message.newsData!.length > 3}
              />
            ))}
          </div>
        )}

        {/* 时间戳 */}
        <div className={`text-xs text-gray-500 mt-1 flex items-center gap-1 ${
          message.type === 'user' ? 'justify-end' : 'justify-start'
        }`}>
          <Clock className="w-3 h-3" />
          {message.timestamp.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
          {message.isStreaming && (
            <span className="ml-1 text-blue-500">正在输入中...</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden ${className}`}>
      {/* 头部状态栏 */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-full">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">AI 新闻助手</h2>
            <p className="text-blue-100 text-sm">支持实时流式响应 • Mastra + DeepSeek</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${ 
            isConnected 
              ? 'bg-green-500/20 text-green-100' 
              : 'bg-red-500/20 text-red-100'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            {isConnected ? '已连接' : '连接断开'}
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[500px]">
        {messages.map(renderMessage)}

        {/* 加载状态 */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 text-white flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">连接到 Mastra Agent...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 建议问题 */}
      {suggestedQuestions.length > 0 && !isLoading && (
        <div className="px-4 py-2 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 font-medium">建议问题：</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedQuestionClick(question)}
                className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 输入框 */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        {!isConnected && (
          <div className="mb-3 flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>无法连接到 Mastra Workers 服务，请检查网络连接</span>
          </div>
        )}
        
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isConnected ? "输入你的问题，比如：今天有什么科技新闻？（支持实时流式响应）" : "等待连接..."}
              disabled={!isConnected || isLoading}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || !isConnected || isLoading}
            className="flex-shrink-0 w-11 h-11 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 text-center">
          按 Enter 发送消息，Shift + Enter 换行 • 🚀 现在支持实时流式响应！
        </div>
      </div>
    </div>
  );
};

export default NewsChatBox;
