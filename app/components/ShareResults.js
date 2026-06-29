"use client";

import { useState } from "react";
import { Share2, Copy, Check, MessageCircle, Link2 } from "lucide-react";

/**
 * Share results via WhatsApp, Twitter, or copy link
 */
export default function ShareResults({ analysisId, improvementPotential }) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/upload`;
  const shareText = `I just used GlowUp AI and found out I can improve my appearance by +${improvementPotential || 25}%! Get your free analysis:`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = `${shareText} ${shareUrl}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(url, "_blank");
  };

  const handleTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "GlowUp AI - My Results",
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      setShowMenu(!showMenu);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleNativeShare}
        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-surface border border-border hover:border-accent/30 text-sm font-medium transition-all"
      >
        <Share2 className="w-4 h-4 text-accent" />
        Share Results
      </button>

      {showMenu && (
        <div className="absolute bottom-full mb-2 left-0 glass rounded-xl p-3 min-w-[200px] z-50 shadow-xl">
          <button
            onClick={handleWhatsApp}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-surface-light transition-colors text-sm"
          >
            <MessageCircle className="w-4 h-4 text-green-400" />
            WhatsApp
          </button>
          <button
            onClick={handleTwitter}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-surface-light transition-colors text-sm"
          >
            <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            Twitter / X
          </button>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-surface-light transition-colors text-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-success" />
                <span className="text-success">Copied!</span>
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4 text-muted" />
                Copy Link
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
