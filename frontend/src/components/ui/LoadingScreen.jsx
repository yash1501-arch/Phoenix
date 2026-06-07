import { Loader2 } from 'lucide-react';

const LoadingScreen = ({ label = 'Loading…', fullScreen = false }) => {
    const wrapper = fullScreen
        ? 'fixed inset-0 z-[60] flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm'
        : 'flex flex-col items-center justify-center py-20';
    return (
        <div className={wrapper} role="status" aria-live="polite">
            <Loader2 className="h-10 w-10 animate-spin text-[#D4AF37]" />
            <p className="mt-4 text-sm font-semibold tracking-wide text-gray-600">{label}</p>
        </div>
    );
};

export default LoadingScreen;
