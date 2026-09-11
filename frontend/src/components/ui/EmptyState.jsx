import { Inbox } from 'lucide-react';

const EmptyState = ({ icon, title = 'Nothing here yet', description = 'Check back soon or explore other adventures.', action }) => {
    const Icon = icon || Inbox;
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone/20 bg-mist-subtle/80 px-6 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-ember/15 text-ember">
                <Icon size={28} />
            </div>
            <h3 className="text-lg font-bold text-stone">{title}</h3>
            <p className="mt-1 max-w-md text-sm text-muted">{description}</p>
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
};

export default EmptyState;
