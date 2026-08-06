import { useState } from 'react';
import { Plus, X } from 'lucide-react';

/**
 * Reusable tag-list input for trek brochure fields (pickup points, packing list, etc.)
 */
const TagListField = ({ label, hint, placeholder, items = [], onChange }) => {
    const [draft, setDraft] = useState('');

    const add = () => {
        const value = draft.trim();
        if (!value) return;
        onChange([...items, value]);
        setDraft('');
    };

    const remove = (index) => {
        onChange(items.filter((_, i) => i !== index));
    };

    return (
        <div className="form-group">
            <label className="form-label">{label}</label>
            {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}
            <div className="input-with-button">
                <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
                    className="form-input"
                    placeholder={placeholder}
                />
                <button type="button" onClick={add} className="add-btn" aria-label={`Add ${label}`}>
                    <Plus size={20} />
                </button>
            </div>
            <div className="tags-list">
                {items.map((item, index) => (
                    <span key={`${item}-${index}`} className="tag">
                        {item}
                        <button type="button" onClick={() => remove(index)} className="tag-remove" aria-label="Remove">
                            <X size={14} />
                        </button>
                    </span>
                ))}
            </div>
        </div>
    );
};

export default TagListField;
