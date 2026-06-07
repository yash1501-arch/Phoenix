import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function Lightbox({ images, index, onClose, onPrev, onNext }) {
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') onPrev();
            if (e.key === 'ArrowRight') onNext();
        };
        window.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [onClose, onPrev, onNext]);

    if (index == null || !images[index]) return null;
    const src = images[index];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                role="dialog"
                aria-modal="true"
                aria-label="Image viewer"
                className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4"
            >
                <button
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    aria-label="Close"
                    className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10"
                >
                    <X size={22} />
                </button>
                {images.length > 1 && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); onPrev(); }}
                            aria-label="Previous image"
                            className="absolute left-4 text-white/80 hover:text-white p-3 rounded-full bg-white/10"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onNext(); }}
                            aria-label="Next image"
                            className="absolute right-4 text-white/80 hover:text-white p-3 rounded-full bg-white/10"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </>
                )}
                <motion.img
                    key={src}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    src={src}
                    alt=""
                    onClick={(e) => e.stopPropagation()}
                    className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
                    {index + 1} / {images.length}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
