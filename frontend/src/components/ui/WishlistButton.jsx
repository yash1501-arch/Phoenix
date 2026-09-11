import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWishlist } from '../../context/WishlistContext';

const WishlistButton = ({ adventure, size = 'md', className = '' }) => {
    const { has, toggle } = useWishlist();
    const advId = adventure?.id || adventure?._id;
    if (!advId) return null;
    const isSaved = has(advId);

    const sizeMap = {
        sm: { btn: 'h-9 w-9', icon: 16 },
        md: { btn: 'h-11 w-11', icon: 18 },
        lg: { btn: 'h-12 w-12', icon: 20 },
    };
    const s = sizeMap[size] || sizeMap.md;

    return (
        <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggle(adventure);
            }}
            aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={isSaved}
            className={`flex ${s.btn} items-center justify-center rounded-full border-2 transition-all backdrop-blur-sm ${
                isSaved
                    ? 'border-ember bg-ember text-cream'
                    : 'border-cream/70 bg-panel/50 text-cream hover:border-ember hover:text-ember'
            } ${className}`}
        >
            <Heart size={s.icon} className={isSaved ? 'fill-current' : ''} />
        </motion.button>
    );
};

export default WishlistButton;
