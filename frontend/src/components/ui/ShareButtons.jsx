import { Share2, MessageCircle, Link2, Check } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ShareButtons({ url, title, description, theme = 'dark' }) {
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

    const isLight = theme === 'light';

    const btn = {
        wa: isLight
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25',
        fb: isLight
            ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
            : 'bg-sky-500/15 text-sky-300 border-sky-500/30 hover:bg-sky-500/25',
        x: isLight
            ? 'bg-stone/5 text-stone border-stone/15 hover:bg-stone/10'
            : 'bg-zinc-500/15 text-zinc-200 border-zinc-500/30 hover:bg-zinc-500/25',
        share: isLight
            ? 'bg-mist-subtle text-stone border-stone/15 hover:bg-stone/5'
            : 'bg-white/10 text-white border-white/20 hover:bg-white/20',
        copy: isLight
            ? 'bg-ember/10 text-ember-deep border-ember/25 hover:bg-ember/15'
            : 'bg-primary/15 text-primary border-primary/30 hover:bg-primary/25',
    };

    const base = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition';

    return (
        <div className="flex flex-wrap items-center gap-2">
            <button
                onClick={() => window.open(wa, '_blank', 'noopener,noreferrer')}
                className={`${base} ${btn.wa}`}
                aria-label="Share on WhatsApp"
            >
                <MessageCircle size={14} /> WhatsApp
            </button>
            <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${base} ${btn.fb}`}
                aria-label="Share on Facebook"
            >
                Facebook
            </a>
            <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(fullUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${base} ${btn.x}`}
                aria-label="Share on X"
            >
                X / Twitter
            </a>
            <button
                onClick={onNative}
                className={`${base} ${btn.share}`}
                aria-label="Share"
            >
                <Share2 size={14} /> Share
            </button>
            <button
                onClick={onCopy}
                className={`${base} ${btn.copy}`}
                aria-label="Copy link"
            >
                {copied ? <Check size={14} /> : <Link2 size={14} />} {copied ? 'Copied' : 'Copy'}
            </button>
        </div>
    );
}
