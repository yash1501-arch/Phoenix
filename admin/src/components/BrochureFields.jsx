import TagListField from './TagListField';

const BrochureFields = ({ formData, setFormData }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const setList = (key, items) => {
        setFormData((prev) => ({ ...prev, [key]: items }));
    };

    return (
        <div className="form-section">
            <h2 className="section-title">Trek Brochure Details</h2>
            <p className="form-help" style={{ marginTop: '-0.75rem', marginBottom: '1rem' }}>
                Optional fields from your trek PDF — pickup points, packing list, do&apos;s &amp; don&apos;ts, and guidelines.
            </p>

            <div className="form-grid">
                <div className="form-group">
                    <label className="form-label">Base village</label>
                    <input
                        type="text"
                        name="base_village"
                        value={formData.base_village || ''}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="e.g. Khandale Village"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Elevation</label>
                    <input
                        type="text"
                        name="elevation"
                        value={formData.elevation || ''}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="e.g. 3855 ft"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Region</label>
                    <input
                        type="text"
                        name="region"
                        value={formData.region || ''}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="e.g. Karjat, Alibaug"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Endurance level</label>
                    <select
                        name="endurance_level"
                        value={formData.endurance_level || ''}
                        onChange={handleChange}
                        className="form-input"
                    >
                        <option value="">Not specified</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </select>
                </div>
                <div className="form-group full-width">
                    <label className="form-label">Price note</label>
                    <input
                        type="text"
                        name="price_note"
                        value={formData.price_note || ''}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="e.g. Mumbai to Mumbai (informational only)"
                    />
                </div>
            </div>

            <TagListField
                label="Things to carry"
                hint="Shown on the adventure page as the packing list."
                placeholder="e.g. Trekking shoes, 2L water"
                items={formData.things_to_carry || []}
                onChange={(items) => setList('things_to_carry', items)}
            />
            <TagListField
                label="Mumbai pickup points"
                placeholder="e.g. Dadar 5:30 AM"
                items={formData.pickup_mumbai || []}
                onChange={(items) => setList('pickup_mumbai', items)}
            />
            <TagListField
                label="Pune pickup points"
                placeholder="e.g. Swargate 6:00 AM"
                items={formData.pickup_pune || []}
                onChange={(items) => setList('pickup_pune', items)}
            />
            <TagListField
                label="Do's"
                placeholder="e.g. Follow trek leader instructions"
                items={formData.dos || []}
                onChange={(items) => setList('dos', items)}
            />
            <TagListField
                label="Don'ts"
                placeholder="e.g. No alcohol during trek"
                items={formData.donts || []}
                onChange={(items) => setList('donts', items)}
            />
            <TagListField
                label="Trek guidelines"
                placeholder="e.g. Carry your own trash back"
                items={formData.trek_guidelines || []}
                onChange={(items) => setList('trek_guidelines', items)}
            />
        </div>
    );
};

export default BrochureFields;
