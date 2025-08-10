import React from 'react';
import { NewsArticle } from '../services/MastraClient';
import { ExternalLink, Clock, Tag, TrendingUp, Heart, Frown, Minus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface NewsCardProps {
  article: NewsArticle;
  compact?: boolean;
}

const NewsCard: React.FC<NewsCardProps> = ({ article, compact = false }) => {
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive':
        return <Heart className="w-4 h-4 text-green-500" />;
      case 'Negative':
        return <Frown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Negative':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'High':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Technology': 'text-blue-600 bg-blue-50 border-blue-200',
      'Business': 'text-green-600 bg-green-50 border-green-200',
      'Politics': 'text-purple-600 bg-purple-50 border-purple-200',
      'Sports': 'text-orange-600 bg-orange-50 border-orange-200',
      'Entertainment': 'text-pink-600 bg-pink-50 border-pink-200',
      'Science': 'text-indigo-600 bg-indigo-50 border-indigo-200',
      'Health': 'text-emerald-600 bg-emerald-50 border-emerald-200',
      'World': 'text-gray-600 bg-gray-50 border-gray-200',
    };
    return colors[category] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), {
    addSuffix: true,
    locale: zhCN
  });

  if (compact) {
    return (
      <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
            {article.title}
          </h4>
          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
            {article.aiSummary || article.summary}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="font-medium">{article.source}</span>
            <span>•</span>
            <span>{timeAgo}</span>
          </div>
        </div>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 p-1 text-gray-400 hover:text-blue-600 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 overflow-hidden">
      <div className="p-6">
        {/* 头部信息 */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(article.category)}`}>
                <Tag className="w-3 h-3" />
                {article.category}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getImportanceColor(article.importance)}`}>
                <TrendingUp className="w-3 h-3" />
                {article.importance}
              </span>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
              {article.title}
            </h3>
          </div>
          
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>

        {/* 摘要内容 */}
        <div className="space-y-3 mb-4">
          <p className="text-gray-700 leading-relaxed">
            {article.aiSummary || article.summary}
          </p>
          
          {article.aiSummary && article.summary !== article.aiSummary && (
            <details className="text-sm">
              <summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
                查看原始摘要
              </summary>
              <p className="mt-2 text-gray-600 pl-4 border-l-2 border-gray-200">
                {article.summary}
              </p>
            </details>
          )}
        </div>

        {/* 关键词 */}
        {article.keywords && article.keywords.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {article.keywords.slice(0, 5).map((keyword, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md border border-blue-200"
                >
                  {keyword}
                </span>
              ))}
              {article.keywords.length > 5 && (
                <span className="inline-block px-2 py-1 text-xs bg-gray-50 text-gray-500 rounded-md border border-gray-200">
                  +{article.keywords.length - 5}
                </span>
              )}
            </div>
          </div>
        )}

        {/* 底部信息 */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{timeAgo}</span>
            </div>
            <div className="font-medium">
              {article.source}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getSentimentColor(article.sentiment)}`}>
              {getSentimentIcon(article.sentiment)}
              {article.sentiment}
            </span>
            
            {article.analysisConfidence && (
              <span className="text-xs text-gray-500">
                置信度: {article.analysisConfidence}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
