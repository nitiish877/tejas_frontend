import React, { useRef, useState } from 'react';
import { ArrowUp, Square, Smile } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
  isDark: boolean;
  isCentered?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isStreaming,
  onStopStreaming,
  isDark,
  isCentered = false,
}) => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-focus has been completely removed as requested: "bottom me auto focus remove kar do"

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isStreaming) return;

    const message = text.trim();
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setShowEmojiPicker(false);
    onSendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setText((prev) => prev + emoji);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = text.substring(0, start) + emoji + text.substring(end);
    setText(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
    }, 10);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full transition-all duration-300 ${
        isCentered
          ? 'max-w-2xl mx-auto px-4 my-auto'
          : 'max-w-3xl mx-auto px-3 sm:px-6 pb-2 pt-1'
      }`}
    >
      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <EmojiPicker
          onSelectEmoji={handleEmojiSelect}
          onClose={() => setShowEmojiPicker(false)}
          isDark={isDark}
        />
      )}

      {/* ChatGPT-style clean Input Box */}
      <div
        className={`relative flex items-end gap-2 rounded-2xl border p-2 sm:p-2.5 transition-all shadow-sm ${
          isDark
            ? 'bg-[#2f2f2f] border-zinc-700/70 focus-within:border-zinc-500 text-zinc-100'
            : 'bg-white border-zinc-300 focus-within:border-zinc-500 text-zinc-900 shadow-sm'
        } ${isCentered ? 'shadow-md py-3 px-3.5 sm:px-4 rounded-3xl' : ''}`}
      >
        {/* Emoji Trigger Button */}
        <button
          id="toggle-emoji-btn"
          type="button"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          title="Add emoji"
          className={`p-2 rounded-xl shrink-0 transition-colors ${
            showEmojiPicker
              ? isDark
                ? 'bg-zinc-700 text-zinc-200'
                : 'bg-zinc-200 text-zinc-800'
              : isDark
              ? 'hover:bg-zinc-700/60 text-zinc-400 hover:text-zinc-200'
              : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Text Input Area with requested placeholder: "ask here..." */}
        <textarea
          id="chat-message-input"
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask here..."
          className={`flex-1 max-h-44 resize-none bg-transparent py-1.5 px-1 text-sm sm:text-base focus:outline-none leading-relaxed ${
            isDark
              ? 'text-zinc-100 placeholder-zinc-400'
              : 'text-zinc-900 placeholder-zinc-500'
          }`}
        />

        {/* Action Button: Send Arrow or Stop Generating (ChatGPT style) */}
        {isStreaming ? (
          <button
            id="stop-streaming-btn"
            type="button"
            onClick={onStopStreaming}
            title="Stop generating"
            className="p-2.5 rounded-full bg-zinc-200 text-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center shrink-0 transition-transform active:scale-95"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
        ) : (
          <button
            id="send-message-btn"
            type="button"
            onClick={() => handleSubmit()}
            disabled={!text.trim()}
            title="Send message"
            className={`p-2.5 rounded-full flex items-center justify-center shrink-0 transition-all ${
              text.trim()
                ? isDark
                  ? 'bg-white text-zinc-950 hover:bg-zinc-200 active:scale-95'
                  : 'bg-zinc-900 text-white hover:bg-zinc-800 active:scale-95'
                : isDark
                ? 'bg-zinc-700/50 text-zinc-500 cursor-not-allowed'
                : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
            }`}
          >
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* Disclaimer: "tejas is ai can make mistakes please double chek response" */}
      <div className="text-center mt-2 px-2">
        <p className={`text-[11px] select-none ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
          tejas is ai can make mistakes please double chek response
        </p>
      </div>
    </div>
  );
};
