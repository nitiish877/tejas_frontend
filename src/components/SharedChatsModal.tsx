import React, { useEffect, useState } from 'react';
import { X, Share2, Loader2, AlertCircle, ExternalLink, Link as LinkIcon } from 'lucide-react';
import { fetchMyShares, ShareRecord } from '../utils/api';

interface SharedChatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  getApiUrl: (path: string) => string;
  isDark: boolean;
  onOpenShare?: (shareId: string) => void;
}

export const SharedChatsModal: React.FC<SharedChatsModalProps> = ({
  isOpen,
  onClose,
  getApiUrl,
  isDark,
  onOpenShare,
}) => {
  const [shares, setShares] = useState<ShareRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    setLoading(true);
    setError(null);
    fetchMyShares(getApiUrl)
      .then((res) => {
        if (mounted) setShares(res.shares || []);
      })
      .catch((e) => {
        if (mounted) setError(e?.message || 'Shared chats load nahi ho payi.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [isOpen, getApiUrl]);

  if (!isOpen) return null;

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const openShare = (shareId: string) => {
    if (onOpenShare) return onOpenShare(shareId);
    window.open(`/share/${shareId}`, '_blank', 'noopener,noreferrer');
  };

  const copyLink = async (shareId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const url = `${window.location.origin}/share/${shareId}`;
      await navigator.clipboard.writeText(url);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto p-3 sm:p-4 bg-black/70 backdrop-blur-sm flex justify-center items-start sm:items-center min-h-screen animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-2xl my-auto max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
          isDark ? 'bg-[#18181b] border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-3.5 border-b shrink-0 ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/30 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold">Shared Chats</h2>
              <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Chats you have shared publicly
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {loading && (
            <div className="flex items-center justify-center gap-2 text-zinc-400 py-16">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading shared chats…</span>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <AlertCircle className="w-8 h-8 text-rose-400" />
              <p className="text-sm text-zinc-400">{error}</p>
            </div>
          )}

          {!loading && !error && shares.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Share2 className="w-8 h-8 text-zinc-500" />
              <p className="text-sm text-zinc-400">No shared chats yet.</p>
              <p className="text-xs text-zinc-500">When you share a chat, it will appear here.</p>
            </div>
          )}

          {!loading && !error && shares.length > 0 && (
            <div className="space-y-2">
              {shares.map((s) => (
                <div
                  key={s.shareId}
                  onClick={() => openShare(s.shareId)}
                  className={`group w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isDark
                      ? 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                      : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{s.title || 'Shared chat'}</p>
                      <p className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {formatDate(s.createdAt)}
                      </p>
                      <p className={`text-[10px] font-mono mt-1 truncate ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        /share/{s.shareId}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => copyLink(s.shareId, e)}
                        title="Copy link"
                        className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-200 text-zinc-500'}`}
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                      </button>
                      <ExternalLink className={`w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
