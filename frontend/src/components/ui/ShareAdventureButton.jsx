import { useState, useRef, useEffect } from 'react';
import { Share2, MessageCircle, Link2, Check, Facebook, Instagram } from 'lucide-react';
import toast from 'react-hot-toast';

const buildShareMeta = (adventure) => {
    const advId = adventure?._id || adventure?.id;
    const title = adventure?.title || 'Adventure';
    const location = adventure?.location || '';
    const url = advId ? `/adventure/${advId}` : '/adventures';
    const fullUrl = typeof window !== 'undefined' ? new URL(url, window.location.origin).toString() : url;
    const text = `Check out ${title}${location ? ` — ${location}` : ''} with Phoenix Adventures`;
    return { advId, title, location, url, fullUrl, text };
};

const VARIANT_STYLES = {
    overlay:
        'w-10 h-10 bg-mist/95 backdrop-blur-sm rounded-md flex items-center justify-center text-stone hover:bg-ember hover:text-cream transition-colors shadow-smoke',
    inline:
        'w-9 h-9 rounded-full border border-stone/15 bg-mist flex items-center justify-center text-stone hover:border-ember hover:text-ember hover:bg-ember/5 transition-colors shrink-0',
};

export default function ShareAdventureButton({
    adventure,
    className = '',
    iconSize,
    variant = 'overlay',
    buttonClassName,
}) {
    const resolvedIconSize = iconSize ?? (variant === 'inline' ? 16 : 15);
    const resolvedButtonClass = buttonClassName || VARIANT_STYLES[variant] || VARIANT_STYLES.overlay;
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const ref = useRef(null);
    const { fullUrl, text, title } = buildShareMeta(adventure);

    useEffect(() => {
        if (!open) return undefined;
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    const stop = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const onCopy = async (e) => {
        stop(e);
        try {
            await navigator.clipboard.writeText(fullUrl);
            setCopied(true);
            toast.success('Link copied!');
            setTimeout(() => {
                setCopied(false);
                setOpen(false);
            }, 1500);
        } catch {
            toast.error('Could not copy link');
        }
    };

    const onNative = async (e) => {
        stop(e);
        if (navigator.share) {
            try {
                await navigator.share({ title, text, url: fullUrl });
                setOpen(false);
            } catch {
                /* user cancelled */
            }
        } else {
            onCopy(e);
        }
    };

    const menuItemClass = 'flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-stone hover:bg-mist-subtle transition-colors text-left';

    return (
        <div ref={ref} className={`relative ${className}`} onClick={stop}>
            <button
                type="button"
                onClick={(e) => {
                    stop(e);
                    setOpen((o) => !o);
                }}
                aria-label={`Share ${title}`}
                aria-expanded={open}
                className={resolvedButtonClass}
            >
                <Share2 size={resolvedIconSize} />
            </button>
            {open && (
                <div
                    role="menu"
                    className="absolute top-full right-0 mt-2 z-30 min-w-[11.5rem] rounded-lg border border-stone/15 bg-mist shadow-card py-1.5 overflow-hidden"
                >
                    <button
                        type="button"
                        role="menuitem"
                        className={menuItemClass}
                        onClick={(e) => {
                            stop(e);
                            window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${fullUrl}`)}`, '_blank', 'noopener,noreferrer');
                            setOpen(false);
                        }}
                    >
                        <MessageCircle size={15} className="text-emerald-600 shrink-0" />
                        WhatsApp
                    </button>
                    <a
                        role="menuitem"
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={menuItemClass}
                        onClick={(e) => {
                            stop(e);
                            setOpen(false);
                        }}
                    >
                        <Facebook size={15} className="text-sky-600 shrink-0" />
                        Facebook
                    </a>
                    <button
                        type="button"
                        role="menuitem"
                        className={menuItemClass}
                        onClick={async (e) => {
                            stop(e);
                            try {
                                await navigator.clipboard.writeText(fullUrl);
                                toast.success('Link copied — paste in your Instagram story or DM');
                            } catch {
                                toast.error('Could not copy link');
                            }
                            setOpen(false);
                        }}
                    >
                        <Instagram size={15} className="text-pink-600 shrink-0" />
                        Instagram
                    </button>
                    <button
                        type="button"
                        role="menuitem"
                        className={menuItemClass}
                        onClick={onNative}
                    >
                        <Share2 size={15} className="text-ember shrink-0" />
                        More apps
                    </button>
                    <button
                        type="button"
                        role="menuitem"
                        className={menuItemClass}
                        onClick={onCopy}
                    >
                        {copied ? <Check size={15} className="text-moss shrink-0" /> : <Link2 size={15} className="text-stone shrink-0" />}
                        {copied ? 'Copied!' : 'Copy link'}
                    </button>
                </div>
            )}
        </div>
    );
}
