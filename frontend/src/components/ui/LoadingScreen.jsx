import { Loader2 } from 'lucide-react';

const LoadingScreen = ({ label = 'Loading…', fullScreen = false }) => {
    const wrapper = fullScreen
        ? 'fixed inset-0 z-[60] flex flex-col items-center justify-center bg-mist/90 backdrop-blur-sm'
        : 'flex flex-col items-center justify-center py-20';
    return (
        <div className={wrapper} role="status" aria-live="polite">
            <span className="relative inline-block w-[72px] h-[72px] mb-4">
                <img
                    src="/logo-mark.png?v=6"
                    alt=""
                    className="block w-full h-full select-none"
                />
            </span>
            <Loader2 className="h-6 w-6 animate-spin text-ember" />
            <p className="mt-3 text-sm font-semibold tracking-wide text-muted">{label}</p>
        </div>
    );
};

export default LoadingScreen;
