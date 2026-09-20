import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import oneDark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import c from 'react-syntax-highlighter/dist/esm/languages/prism/c';
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp';
import csharp from 'react-syntax-highlighter/dist/esm/languages/prism/csharp';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go';
import rust from 'react-syntax-highlighter/dist/esm/languages/prism/rust';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import php from 'react-syntax-highlighter/dist/esm/languages/prism/php';
import { Copy, Check } from 'lucide-react';
import { copyText } from '../utils/clipboard';

// Kuch bundlers default export ko { default: fn } bana dete hain, isliye dono case handle
const unwrap = (m: any) => (m && m.default ? m.default : m);

const LANGS: Record<string, any> = {
  javascript, typescript, jsx, tsx, python, bash, json, css, markup, java, c, cpp, csharp, sql, go, rust, yaml, php,
};
Object.entries(LANGS).forEach(([name, def]) => SyntaxHighlighter.registerLanguage(name, unwrap(def)));
const codeTheme = unwrap(oneDark);

// Model kabhi "js", "py", "html" jaise short naam likhta hai
const ALIASES: Record<string, string> = {
  js: 'javascript', ts: 'typescript', py: 'python', python3: 'python', sh: 'bash', shell: 'bash', zsh: 'bash',
  html: 'markup', xml: 'markup', svg: 'markup', yml: 'yaml', 'c++': 'cpp', 'c#': 'csharp', cs: 'csharp',
  golang: 'go', rs: 'rust', jsonc: 'json',
};
const normalizeLang = (raw: string): string => ALIASES[raw.toLowerCase()] || raw.toLowerCase();

const LANG_BADGE: Record<string, string> = {
  javascript: '🟨', typescript: '🟦', jsx: '⚛️', tsx: '⚛️', python: '🐍', bash: '💻', json: '🧾', css: '🎨',
  markup: '🌐', java: '☕', c: '⚙️', cpp: '⚙️', csharp: '🔷', sql: '🗄️', go: '🐹', rust: '🦀', yaml: '📄', php: '🐘',
};

const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);
  const lang = normalizeLang(language);

  const handleCopy = async () => {
    if (await copyText(code)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="not-prose my-4 overflow-hidden rounded-xl border border-zinc-700/60 shadow-md">
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gradient-to-r from-fuchsia-600/25 via-indigo-600/25 to-cyan-600/25 border-b border-zinc-700/60">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex gap-1.5 shrink-0" aria-hidden="true">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </span>
          <span className="text-xs font-semibold tracking-wide text-cyan-200 truncate">
            {LANG_BADGE[lang] || '📝'} {language || 'code'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          title="Copy code"
          className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            copied ? 'text-emerald-300 bg-emerald-500/15' : 'text-zinc-200 hover:text-white bg-white/5 hover:bg-white/10'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" /> Copied ✓
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" /> Copy
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto bg-[#282c34]">
        <SyntaxHighlighter
          language={lang}
          style={codeTheme}
          PreTag="div"
          customStyle={{ margin: 0, padding: '1rem', background: 'transparent', fontSize: '0.85rem', lineHeight: '1.6', minWidth: '100%' }}
          codeTagProps={{ style: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' } }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export const MarkdownMessage: React.FC<{ content: string; isDark: boolean }> = ({ content, isDark }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      // <pre> ko khali rakho, warna CodeBlock ke upar dusra box ban jata hai
      pre: ({ children }) => <>{children}</>,
      code({ className, children, ...props }) {
        const text = String(children);
        const match = /language-([\w+#-]+)/.exec(className || '');
        // Fenced block (bina language wala multi-line bhi)
        if (match || text.includes('\n')) {
          return <CodeBlock code={text.replace(/\n$/, '')} language={match ? match[1] : ''} />;
        }
        // Inline code
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
      },
      a: ({ children, ...props }) => (
        <a {...props} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      ),
    }}
  >
    {content}
  </ReactMarkdown>
);