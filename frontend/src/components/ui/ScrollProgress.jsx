import { useEffect, useState } from 'react';

const ScrollProgress = () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const onScroll = () => {
            const h = document.documentElement;
            const scrolled = h.scrollTop;
            const height = h.scrollHeight - h.clientHeight;
            setProgress(height > 0 ? (scrolled / height) * 100 : 0);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return <div className="scroll-progress" style={{ width: `${progress}%` }} aria-hidden="true" />;
};

export default ScrollProgress;
