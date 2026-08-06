import { Inbox } from 'lucide-react';

const EmptyState = ({ icon, title = 'Nothing here yet', description = 'Check back soon or explore other adventures.', action }) => {
    const Icon = icon || Inbox;
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white/60 px-6 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c9a961]/20 to-[#e2d4b2]/20 text-[#c9a961]">
                <Icon size={28} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="mt-1 max-w-md text-sm text-gray-500">{description}</p>
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
};

export default EmptyState;
