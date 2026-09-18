import { Phone } from 'lucide-react';
import TagListField from './TagListField';

/**
 * Multiple admin / trip-leader contact numbers for this adventure.
 */
const ContactPhonesField = ({ items = [], onChange }) => (
    <div className="form-section">
        <h2 className="section-title">
            <Phone size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
            Contact numbers
        </h2>
        <p className="form-help section-help">
            Add one or more mobile numbers trekkers can call. If one line is busy, they can try the next number.
            These appear on the public trek page with the About section.
        </p>
        <TagListField
            label="Phone number"
            hint="Press Enter or + to add each number (e.g. 93725 06447 or +91 9372506447)"
            placeholder="e.g. 93725 06447"
            items={items}
            onChange={onChange}
        />
    </div>
);

export default ContactPhonesField;
