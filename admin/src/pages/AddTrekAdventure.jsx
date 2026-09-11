import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Save, Plus, X, MapPin, Clock, Users, DollarSign, Image as ImageIcon, Loader, CalendarDays, ArrowLeft } from 'lucide-react';
import { adventuresAPI } from '../utils/api';
import { BrochurePdfImport } from '../components/AdventurePdfFields';
import { mergeExtractedPdfData } from '../utils/pdfExtract';
import { downloadItineraryPdf } from '../utils/downloadItineraryPdf';
import { normalizeDepartureCities } from '../utils/departureCities';
import DepartureCitiesField from '../components/DepartureCitiesField';
import TagListField from '../components/TagListField';
import './AddAdventure.css';

const AddTrekAdventure = () => {
    const navigate = useNavigate();
    const imageInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [brochureLoading, setBrochureLoading] = useState(false);

    const [form, setForm] = useState({
        title: '',
        description: '',
        location: '',
        duration: '',
        difficulty: 'Moderate',
        category: 'trek',
        price: '',
        max_participants: '',
        start_time: '08:00',
        status: 'active',
        // Trek-specific
        base_village: '',
        elevation: '',
        region: '',
        endurance_level: '',
        departure_cities: [],
        pickup_mumbai: [],
        pickup_pune: [],
        things_to_carry: [],
        included: [],
        excluded: [],
        dos: [],
        donts: [],
        trek_guidelines: [],
        itinerary: [],
        available_dates: [],
        // Image
        image: null,
        imagePreview: null,
    });

    const [includedInput, setIncludedInput] = useState('');
    const [excludedInput, setExcludedInput] = useState('');
    const [dateInput, setDateInput] = useState('');

    const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const handleChange = (e) => set(e.target.name, e.target.value);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            set('image', file);
            set('imagePreview', URL.createObjectURL(file));
        }
    };

    const handleAddDate = () => {
        if (!dateInput) return;
        setForm(prev => {
            if (prev.available_dates.includes(dateInput)) return prev;
            return { ...prev, available_dates: [...prev.available_dates, dateInput].sort() };
        });
        setDateInput('');
    };

    const handleRemoveDate = (date) => {
        setForm(prev => ({ ...prev, available_dates: prev.available_dates.filter(d => d !== date) }));
    };

    const formatDate = (iso) => {
        const [y, m, d] = iso.split('-').map(Number);
        return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-IN', {
            weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
        });
    };

    const handleBrochureUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            setBrochureLoading(true);
            const fd = new FormData();
            fd.append('pdf', file);
            const res = await adventuresAPI.extractFromPDF(fd);
            setForm(prev => mergeExtractedPdfData(prev, res.data.data));
            toast.success('Brochure imported — review and fill any gaps.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to read PDF');
        } finally {
            setBrochureLoading(false);
            e.target.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.location || !form.price) {
            toast.error('Title, location and price are required');
            return;
        }
        if (form.available_dates.length === 0) {
            toast.error('Add at least one departure date');
            return;
        }
        if (form.pickup_mumbai.length === 0 && form.pickup_pune.length === 0) {
            toast.error('Add at least one pickup point (Mumbai or Pune)');
            return;
        }

        try {
            setLoading(true);
            const fd = new FormData();
            fd.append('title', form.title);
            fd.append('description', form.description);
            fd.append('location', form.location);
            fd.append('duration', form.duration);
            fd.append('difficulty', form.difficulty);
            fd.append('category', form.category);
            fd.append('price', form.price);
            fd.append('max_participants', form.max_participants);
            fd.append('start_time', form.start_time || '08:00');
            fd.append('status', form.status);
            fd.append('base_village', form.base_village || '');
            fd.append('elevation', form.elevation || '');
            fd.append('region', form.region || '');
            fd.append('endurance_level', form.endurance_level || '');
            fd.append('departure_cities', JSON.stringify(normalizeDepartureCities(form.departure_cities)));
            fd.append('pickup_mumbai', JSON.stringify(form.pickup_mumbai));
            fd.append('pickup_pune', JSON.stringify(form.pickup_pune));
            fd.append('things_to_carry', JSON.stringify(form.things_to_carry));
            fd.append('included', JSON.stringify(form.included));
            fd.append('excluded', JSON.stringify(form.excluded));
            fd.append('dos', JSON.stringify(form.dos));
            fd.append('donts', JSON.stringify(form.donts));
            fd.append('trek_guidelines', JSON.stringify(form.trek_guidelines));
            fd.append('itinerary', JSON.stringify(form.itinerary));
            fd.append('available_dates', JSON.stringify(form.available_dates));
            if (form.image) fd.append('image', form.image);

            const res = await adventuresAPI.create(fd);
            const created = res.data?.data;
            const newId = typeof created === 'string' ? created : (created?._id || created?.id);
            toast.success('Adventure created!');
            if (newId) {
                try {
                    await downloadItineraryPdf(newId, form.title);
                } catch (dlErr) {
                    toast(
                        dlErr.message
                            || 'Adventure saved, but the itinerary PDF did not download. You can download it from the adventures list later.',
                        { duration: 7000 },
                    );
                }
                navigate(`/adventures/edit/${newId}`);
            } else {
                navigate('/adventures');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create adventure');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-adventure-page">
            <div className="page-header">
                <div>
                    <button type="button" className="back-link" onClick={() => navigate('/adventures/add')}>
                        <ArrowLeft size={16} /> Back
                    </button>
                    <h1 className="page-title">New Trek / Camping</h1>
                    <p className="page-subtitle">Upload a brochure PDF to auto-fill the form</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="adventure-form">
                <BrochurePdfImport loading={brochureLoading} onUpload={handleBrochureUpload} />

                {/* ── Core info ── */}
                <div className="form-section">
                    <h2 className="section-title">Basic Information</h2>
                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label className="form-label required">Title</label>
                            <input name="title" value={form.title} onChange={handleChange}
                                className="form-input" placeholder="e.g., Rajmachi Fort Trek" required />
                        </div>

                        <div className="form-group full-width">
                            <label className="form-label">Description</label>
                            <textarea name="description" value={form.description} onChange={handleChange}
                                className="form-textarea" rows="3" placeholder="Short trip description..." />
                        </div>

                        <div className="form-group">
                            <label className="form-label required"><MapPin size={14} /> Location</label>
                            <input name="location" value={form.location} onChange={handleChange}
                                className="form-input" placeholder="e.g., Karjat, Maharashtra" required />
                        </div>

                        <div className="form-group">
                            <label className="form-label"><Clock size={14} /> Duration</label>
                            <input name="duration" value={form.duration} onChange={handleChange}
                                className="form-input" placeholder="e.g., 1 Day, 2D/1N" />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Difficulty</label>
                            <select name="difficulty" value={form.difficulty} onChange={handleChange} className="form-select">
                                <option value="Easy">Easy</option>
                                <option value="Moderate">Moderate</option>
                                <option value="Challenging">Challenging</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Category</label>
                            <select name="category" value={form.category} onChange={handleChange} className="form-select">
                                <option value="trek">Trek</option>
                                <option value="camping">Camping</option>
                                <option value="general">General</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label required"><DollarSign size={14} /> Price (₹)</label>
                            <input name="price" type="number" value={form.price} onChange={handleChange}
                                className="form-input" placeholder="e.g., 1499" required />
                        </div>

                        <div className="form-group">
                            <label className="form-label"><Users size={14} /> Max Participants</label>
                            <input name="max_participants" type="number" value={form.max_participants}
                                onChange={handleChange} className="form-input" placeholder="e.g., 30" />
                        </div>

                        <div className="form-group">
                            <label className="form-label"><CalendarDays size={14} /> Start Time (IST)</label>
                            <input name="start_time" type="time" value={form.start_time}
                                onChange={handleChange} className="form-input" />
                            <p className="form-help">Bookings close 3 hrs before start</p>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select name="status" value={form.status} onChange={handleChange} className="form-select">
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* ── Departure dates ── */}
                <div className="form-section">
                    <h2 className="section-title">Departure Dates *</h2>
                    <div className="input-with-button" style={{ maxWidth: 320 }}>
                        <input type="date" value={dateInput}
                            min={new Date().toISOString().slice(0, 10)}
                            onChange={e => setDateInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddDate(); } }}
                            className="form-input" />
                        <button type="button" onClick={handleAddDate} className="add-btn" disabled={!dateInput}>
                            <Plus size={20} />
                        </button>
                    </div>
                    <div className="tags-list" style={{ marginTop: '0.75rem' }}>
                        {form.available_dates.length === 0
                            ? <span className="empty-hint">No dates yet</span>
                            : form.available_dates.map(date => (
                                <span key={date} className="tag date-tag">
                                    <CalendarDays size={13} />
                                    {formatDate(date)}
                                    <button type="button" onClick={() => handleRemoveDate(date)} className="tag-remove">
                                        <X size={13} />
                                    </button>
                                </span>
                            ))
                        }
                    </div>
                </div>

                {/* ── Pickup & departure cities ── */}
                <div className="form-section">
                    <h2 className="section-title">Pickup Points *</h2>
                    <p className="form-help section-help">At least one pickup point is required for booking to work.</p>
                    <div className="form-grid">
                        <DepartureCitiesField
                            value={form.departure_cities}
                            onChange={(departure_cities, patch = {}) => setForm(prev => {
                                const next = { ...prev, departure_cities };
                                if (patch.ensurePickupMumbai && !prev.pickup_mumbai?.length) next.pickup_mumbai = [patch.ensurePickupMumbai];
                                if (patch.ensurePickupPune && !prev.pickup_pune?.length) next.pickup_pune = [patch.ensurePickupPune];
                                return next;
                            })}
                        />
                    </div>
                    <TagListField label="Mumbai pickup points" placeholder="e.g., Dadar 5:30 AM"
                        items={form.pickup_mumbai} onChange={v => set('pickup_mumbai', v)} />
                    <TagListField label="Pune pickup points" placeholder="e.g., Swargate 6:00 AM"
                        items={form.pickup_pune} onChange={v => set('pickup_pune', v)} />
                </div>

                {/* ── Main image ── */}
                <div className="form-section">
                    <h2 className="section-title">Cover Image</h2>
                    <div className="image-upload-area">
                        {form.imagePreview ? (
                            <div className="image-preview">
                                <img src={form.imagePreview} alt="Preview" />
                                <button type="button"
                                    onClick={() => setForm(p => ({ ...p, image: null, imagePreview: null }))}
                                    className="remove-image-btn"><X size={20} /></button>
                            </div>
                        ) : (
                            <div className="upload-placeholder" onClick={() => imageInputRef.current?.click()}>
                                <ImageIcon size={40} />
                                <p>Click to upload cover image</p>
                                <span>JPG, PNG up to 15MB</span>
                            </div>
                        )}
                        <input ref={imageInputRef} type="file" accept="image/*"
                            onChange={handleImageChange} style={{ display: 'none' }} />
                    </div>
                </div>

                {/* ── Included / Excluded ── */}
                <div className="form-section">
                    <h2 className="section-title">Included & Excluded</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Included</label>
                            <div className="input-with-button">
                                <input value={includedInput} onChange={e => setIncludedInput(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), includedInput.trim() && (setForm(p => ({ ...p, included: [...p.included, includedInput.trim()] })), setIncludedInput('')))}
                                    className="form-input" placeholder="e.g., Meals, Guide" />
                                <button type="button" className="add-btn"
                                    onClick={() => { if (includedInput.trim()) { setForm(p => ({ ...p, included: [...p.included, includedInput.trim()] })); setIncludedInput(''); } }}>
                                    <Plus size={20} />
                                </button>
                            </div>
                            <div className="tags-list">
                                {form.included.map((item, i) => (
                                    <span key={i} className="tag">{item}
                                        <button type="button" className="tag-remove"
                                            onClick={() => setForm(p => ({ ...p, included: p.included.filter((_, j) => j !== i) }))}>
                                            <X size={13} /></button>
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Excluded</label>
                            <div className="input-with-button">
                                <input value={excludedInput} onChange={e => setExcludedInput(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), excludedInput.trim() && (setForm(p => ({ ...p, excluded: [...p.excluded, excludedInput.trim()] })), setExcludedInput('')))}
                                    className="form-input" placeholder="e.g., Personal expenses" />
                                <button type="button" className="add-btn"
                                    onClick={() => { if (excludedInput.trim()) { setForm(p => ({ ...p, excluded: [...p.excluded, excludedInput.trim()] })); setExcludedInput(''); } }}>
                                    <Plus size={20} />
                                </button>
                            </div>
                            <div className="tags-list">
                                {form.excluded.map((item, i) => (
                                    <span key={i} className="tag">{item}
                                        <button type="button" className="tag-remove"
                                            onClick={() => setForm(p => ({ ...p, excluded: p.excluded.filter((_, j) => j !== i) }))}>
                                            <X size={13} /></button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Trek details (optional) ── */}
                <div className="form-section">
                    <h2 className="section-title">Trek Details <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.875rem' }}>(optional)</span></h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Base Village</label>
                            <input name="base_village" value={form.base_village} onChange={handleChange}
                                className="form-input" placeholder="e.g., Khandale Village" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Elevation</label>
                            <input name="elevation" value={form.elevation} onChange={handleChange}
                                className="form-input" placeholder="e.g., 3855 ft" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Region</label>
                            <input name="region" value={form.region} onChange={handleChange}
                                className="form-input" placeholder="e.g., Karjat" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Endurance Level</label>
                            <select name="endurance_level" value={form.endurance_level} onChange={handleChange} className="form-select">
                                <option value="">Not specified</option>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                    </div>
                    <TagListField label="Things to carry" placeholder="e.g., Trekking shoes, 2L water"
                        items={form.things_to_carry} onChange={v => set('things_to_carry', v)} />
                    <TagListField label="Do's" placeholder="e.g., Follow trek leader instructions"
                        items={form.dos} onChange={v => set('dos', v)} />
                    <TagListField label="Don'ts" placeholder="e.g., No alcohol during trek"
                        items={form.donts} onChange={v => set('donts', v)} />
                    <TagListField label="Trek guidelines" placeholder="e.g., Carry your own trash back"
                        items={form.trek_guidelines} onChange={v => set('trek_guidelines', v)} />
                </div>

                {/* ── Itinerary (read-only from PDF) ── */}
                {form.itinerary.length > 0 && (
                    <div className="form-section">
                        <h2 className="section-title">Itinerary</h2>
                        <div className="itinerary-preview">
                            {form.itinerary.map((day, i) => (
                                <div key={i} className="itinerary-day">
                                    <div className="day-header">
                                        <span className="day-number">Day {day.day}</span>
                                        <h4>{day.title}</h4>
                                    </div>
                                    <p className="day-description">{day.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Actions ── */}
                <div className="form-actions">
                    <button type="button" onClick={() => navigate('/adventures/add')} className="btn-secondary">
                        <ArrowLeft size={16} /> Back
                    </button>
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? <><Loader className="spinning" size={18} /> Creating...</> : <><Save size={18} /> Create Trek</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddTrekAdventure;
