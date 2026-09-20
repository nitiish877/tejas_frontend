import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Loader2, AlertTriangle } from 'lucide-react';
import { Logo } from './Logo';
import { fetchSharedChat, SharedChatData } from '../utils/api';

interface SharedChatViewProps {
  shareId: string;
  getApiUrl: (path: string) => string;
  isDark: boolean;
}

// Public, read-only view of a shared chat. Login zaroori nahi — guest ya
// logged-in, koi bhi is link ko khol ke padh sakta hai.
export const SharedChatView: React.FC<SharedChatViewProps> = ({ shareId, getApiUrl, isDark }) => {
  const [data, setData] = useState<SharedChatData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchSharedChat(getApiUrl, shareId)
      .then((res) => {
        if (mounted) setData(res);
      })
      .catch((e) => {
        if (mounted) setError(e?.message || 'Ye shared chat load nahi ho payi.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [shareId, getApiUrl]);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
  };

  return (
    <div className={`min-h-[100dvh] w-full flex flex-col ${isDark ? 'bg-[#212121] text-zinc-100' : 'bg-white text-zinc-900'}`}>
      {/* Header */}
      <header
        className={`h-14 px-4 flex items-center justify-between border-b shrink-0 ${
          isDark ? 'bg-[#212121] border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Logo size="sm" glowing={false} />
          <span className="font-bold text-lg tracking-tight">Tejas</span>
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
              isDark ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30' : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}
          >
            🔗 Shared
          </span>
        </div>
        <a
          href="/"
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all"
        >
          Tejas AI try karo →
        </a>
      </header>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {loading && (
            <div className="flex items-center justify-center gap-2 text-zinc-400 py-20">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading shared chat...</span>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <AlertTriangle className="w-8 h-8 text-amber-400" />
              <p className="text-sm text-zinc-400">{error}</p>
            </div>
          )}

          {!loading && data && (
            <>
              <div className="pb-2">
                <h1 className="text-xl font-semibold">{data.title}</h1>
                <p className={`text-xs mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {data.ownerName} ne share ki • {new Date(data.createdAt).toLocaleDateString()}
                </p>
              </div>

              {data.messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={msg.id || idx} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} items-start`}>
                    {!isUser && (
                      <div className="shrink-0 pt-0.5">
                        <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                          <Logo size="xs" glowing={false} />
                        </div>
                      </div>
                    )}
                    <div
                      className={`relative max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-2.5 text-sm sm:text-base leading-relaxed ${
                        isUser
                          ? isDark
                            ? 'bg-[#2f2f2f] text-zinc-100'
                            : 'bg-[#f4f4f4] text-zinc-900'
                          : 'text-inherit px-0 sm:px-1'
                      }`}
                    >
                      {isUser ? (
                        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                      ) : (
                        <div className="prose prose-zinc dark:prose-invert max-w-none break-words leading-relaxed text-sm sm:text-base">
                          <ReactMarkdown
                            components={{
                              code({ className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '');
                                const code = String(children).replace(/\n$/, '');
                                if (!match) {
                                  return (
                                    <code
                                      className={`px-1.5 py-0.5 rounded-md text-[0.9em] font-mono ${
                                        isDark ? 'bg-zinc-800 text-pink-300' : 'bg-zinc-100 text-pink-600'
                                      }`}
                                      {...props}
                                    >
                                      {children}
                                    </code>
                                  );
                                }
                                const language = match[1];
                                const codeId = `${idx}-code-${language}`;
                                return (
                                  <div className="not-prose my-4 overflow-hidden rounded-xl border shadow-sm border-zinc-700/60">
                                    <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-indigo-600/20 via-blue-600/15 to-purple-600/20 border-b border-zinc-700/60">
                                      <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">
                                        {language}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyCode(code, codeId)}
                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                          copiedId === codeId
                                            ? 'text-emerald-400 bg-emerald-500/10'
                                            : 'text-zinc-300 hover:text-white hover:bg-zinc-700/60'
                                        }`}
                                      >
                                        {copiedId === codeId ? (
                                          <>
                                            <Check className="w-3.5 h-3.5" /> Copied
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-3.5 h-3.5" /> Copy
                                          </>
                                        )}
                                      </button>
                                    </div>
                                    <div className="overflow-x-auto bg-[#0d1117]">
                                      <SyntaxHighlighter
                                        language={language}
                                        style={oneDark}
                                        customStyle={{ margin: 0, padding: '1rem', background: 'transparent', fontSize: '0.85rem', lineHeight: '1.6', minWidth: '100%' }}
                                        PreTag="div"
                                      >
                                        {code}
                                      </SyntaxHighlighter>
                                    </div>
                                  </div>
                                );
                              },
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="pt-6 text-center">
                <a
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all"
                >
                  ✨ Apni khud ki chat shuru karo — Tejas AI
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
