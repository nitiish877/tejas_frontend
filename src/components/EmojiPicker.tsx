import React, { useState } from 'react';
import { Smile, Sparkles, Hand, Laptop, Heart } from 'lucide-react';

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
  isDark: boolean;
}

export const EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    name: 'Smileys',
    icon: Smile,
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😋', '😛', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕']
  },
  {
    id: 'gestures',
    name: 'Hands',
    icon: Hand,
    emojis: ['👍', '👎', '👌', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '🫱', '🫲', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '👊', '✊', '🤛', '🤜']
  },
  {
    id: 'tech',
    name: 'Tech & AI',
    icon: Laptop,
    emojis: ['🤖', '🧠', '💻', '🖥️', '⌨️', '🖱️', '📱', '🔋', '⚡', '💡', '🔍', '⚙️', '🔧', '📡', '🛰️', '🚀', '🔮', '🛸', '🧬', '🔬', '🔭', '💾', '💿', '🕹️', '🛡️', '🔑', '🔐', '📊', '📈', '📉']
  },
  {
    id: 'symbols',
    name: 'Fun & Stars',
    icon: Sparkles,
    emojis: ['✨', '⭐', '🌟', '💫', '🔥', '💥', '🎉', '🎊', '🎯', '🏆', '🥇', '🎨', '🎬', '☕', '🍕', '🍔', '🚀', '🌈', '☀️', '🌙', '⭐', '⚡', '☘️', '🌺', '🍀']
  },
  {
    id: 'hearts',
    name: 'Hearts',
    icon: Heart,
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💖', '💗', '💓', '💞', '💕', '💌', '💯']
  }
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelectEmoji, onClose, isDark }) => {
  const [activeTab, setActiveTab] = useState('smileys');

  const currentCategory = EMOJI_CATEGORIES.find((c) => c.id === activeTab) || EMOJI_CATEGORIES[0];

  return (
    <div
      id="emoji-picker-container"
      className={`absolute bottom-full mb-3 right-0 sm:right-auto sm:left-0 z-50 w-72 sm:w-80 rounded-2xl border shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
        isDark
          ? 'bg-slate-900/95 border-slate-800 text-slate-100 shadow-cyan-950/40'
          : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/60'
      }`}
    >
      {/* Category Tabs */}
      <div className={`flex items-center justify-between border-b px-2 py-1.5 ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-slate-50'}`}>
        <div className="flex items-center gap-1">
          {EMOJI_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-400 font-medium'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                }`}
                title={cat.name}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onClose}
          className={`text-xs px-2 py-0.5 rounded font-mono ${
            isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          ESC
        </button>
      </div>

      {/* Emoji Grid */}
      <div className="p-2.5 max-h-56 overflow-y-auto grid grid-cols-8 gap-1">
        {currentCategory.emojis.map((emoji, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSelectEmoji(emoji)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:scale-125 transition-transform active:scale-95 ${
              isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
