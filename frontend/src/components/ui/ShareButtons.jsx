import { Share2, MessageCircle, Link2, Check } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ShareButtons({ url, title, description }) {
    const [copied, setCopied] = useState(false);
    const fullUrl = typeof window !== 'undefined' ? new URL(url, window.location.origin).toString() : url;
    const text = `${title} — ${description || ''}`.trim();

    const wa = `https://wa.me/?text=${encodeURIComponent(`${text}\n${fullUrl}`)}`;

    const onCopy = async () => {
        try {
            await navigator.clipboard.writeText(fullUrl);
            setCopied(true);
            toast.success('Link copied');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Copy failed');
        }
    };

    const onNative = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title, text, url: fullUrl });
            } catch {
                /* user cancelled */
            }
        } else {
            onCopy();
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            <button
                onClick={() => window.open(wa, '_blank', 'noopener,noreferrer')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/25 transition"
                aria-label="Share on WhatsApp"
            >
                <MessageCircle size={14} /> WhatsApp
            </button>
            <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 text-xs font-semibold hover:bg-sky-500/25 transition"
                aria-label="Share on Facebook"
            >
                Facebook
            </a>
            <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(fullUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-500/15 text-zinc-200 border border-zinc-500/30 text-xs font-semibold hover:bg-zinc-500/25 transition"
                aria-label="Share on X"
            >
                X / Twitter
            </a>
            <button
                onClick={onNative}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white border border-white/20 text-xs font-semibold hover:bg-white/20 transition"
                aria-label="Share"
            >
                <Share2 size={14} /> Share
            </button>
            <button
                onClick={onCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 text-primary border border-primary/30 text-xs font-semibold hover:bg-primary/25 transition"
                aria-label="Copy link"
            >
                {copied ? <Check size={14} /> : <Link2 size={14} />} {copied ? 'Copied' : 'Copy'}
            </button>
        </div>
    );
}
