import confetti from 'canvas-confetti';

const gold = ['#D4AF37', '#F0E68C', '#B8860B', '#FFD700'];

export const fireConfetti = () => {
    if (typeof window === 'undefined') return;
    const duration = 2200;
    const end = Date.now() + duration;

    (function frame() {
        confetti({
            particleCount: 4,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.7 },
            colors: gold,
            zIndex: 9999,
        });
        confetti({
            particleCount: 4,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.7 },
            colors: gold,
            zIndex: 9999,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
    })();
};
