import React, { useState, useEffect } from 'react';
import NewsChatBox from './components/NewsChatBox';
import { mastraClient } from './services/MastraClient';
import { Activity, Globe, Zap, Github, ExternalLink } from 'lucide-react';

function App() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [apiDocs, setApiDocs] = useState<any>(null);

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const health = await mastraClient.checkHealth();
        setApiStatus('connected');
        
        // 获取 API 文档
        try {
          const docs = await mastraClient.getApiDocs();
          setApiDocs(docs);
        } catch (error) {
          console.log('Could not fetch API docs:', error);
        }
      } catch (error) {
        setApiStatus('disconnected');
      }
    };

    checkApiStatus();
    const interval = setInterval(checkApiStatus, 30000); // 每30秒检查一次
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* 头部 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    AI News Chat Client
                  </h1>
                  <p className="text-sm text-gray-600">基于 Mastra Workers 的智能新闻聊天客户端</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* API 状态指示器 */}
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                apiStatus === 'connected' 
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : apiStatus === 'disconnected'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  apiStatus === 'connected' ? 'bg-green-500' 
                  : apiStatus === 'disconnected' ? 'bg-red-500' 
                  : 'bg-yellow-500 animate-pulse'
                }`}></div>
                {apiStatus === 'connected' && 'Mastra API 已连接'}
                {apiStatus === 'disconnected' && 'API 连接失败'}
                {apiStatus === 'checking' && '检查连接中...'}
              </div>

              {/* GitHub 链接 */}
              <a
                href="https://github.com/hinatayuan/ai-news-chat-client"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Github className="w-4 h-4" />
                <span className="text-sm">GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 聊天区域 */}
          <div className="lg:col-span-2">
            <NewsChatBox className="h-[700px]" />
          </div>

          {/* 侧边栏信息 */}
          <div className="space-y-6">
            {/* 功能介绍 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                功能特性
              </h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>实时新闻摘要和智能分析</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>多领域新闻分类和情感分析</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span>基于 DeepSeek AI 的智能对话</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span>个性化新闻推荐和洞察</span>
                </li>
              </ul>
            </div>

            {/* API 信息 */}
            {apiDocs && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  Mastra API 信息
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">服务版本：</span>
                    <span className="text-gray-600">{apiDocs.version}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">AI 模型：</span>
                    <span className="text-gray-600">{apiDocs.powered_by?.ai_model}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">部署平台：</span>
                    <span className="text-gray-600">{apiDocs.powered_by?.platform}</span>
                  </div>
                  <div className="pt-2">
                    <a
                      href="https://mastra-agent.liuweiyuan0713.workers.dev/api/docs"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      查看 API 文档
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* 使用提示 */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-4">💡 使用提示</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• 尝试问："今天有什么科技新闻？"</li>
                <li>• 或者："分析一下AI领域的最新动态"</li>
                <li>• 支持多种新闻类别：科技、商业、健康等</li>
                <li>• 可以要求详细分析或简短摘要</li>
              </ul>
            </div>

            {/* 技术栈 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">🔧 技术栈</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>React 18</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>TypeScript</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                  <span>Tailwind CSS</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Mastra AI</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>DeepSeek API</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Cloudflare Workers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 底部 */}
      <footer className="mt-16 border-t border-gray-200 bg-white/50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">
              由 <span className="font-medium">Mastra AI Framework</span> 和 <span className="font-medium">DeepSeek API</span> 驱动
            </p>
            <p>
              部署在 <span className="font-medium">Cloudflare Workers</span> • 开源项目 • 
              <a 
                href="https://github.com/hinatayuan" 
                className="text-blue-600 hover:text-blue-700 font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                @hinatayuan
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
