import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Save, Plus, X, MapPin, Clock, Users, DollarSign, Image as ImageIcon, Loader, CalendarDays, ArrowLeft } from 'lucide-react';
import { adventuresAPI } from '../utils/api';
import { BrochurePdfImport, ConfirmationPdfField } from '../components/AdventurePdfFields';
import { mergeExtractedPdfData } from '../utils/pdfExtract';
import { downloadItineraryPdf } from '../utils/downloadItineraryPdf';
import { normalizeDepartureCities } from '../utils/departureCities';
import DepartureCitiesField from '../components/DepartureCitiesField';
import TourPricingOptionsEditor from '../components/TourPricingOptionsEditor';
import ItineraryEditor from '../components/ItineraryEditor';
import TagListField from '../components/TagListField';
import { cloneDefaultTourPricingOptions } from '../utils/tourPricingDefaults';
import './AddAdventure.css';

const AddTourAdventure = () => {
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
        category: 'tour',
        price: '',
        advance_per_person: '',
        price_note: '',
        max_participants: '',
        start_time: '08:00',
        status: 'active',
        // Tour-specific
        pricing_options: cloneDefaultTourPricingOptions(),
        departure_cities: [],
        pickup_mumbai: [],
        pickup_pune: [],
        included: [],
        excluded: [],
        itinerary: [],
        available_dates: [],
        event_day_offset: 1,
        // Image & PDF
        image: null,
        imagePreview: null,
        confirmation_pdf: null,
        confirmation_pdf_name: '',
        remove_confirmation_pdf: false,
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

    const handleConfirmationPdfChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setForm(prev => ({
            ...prev,
            confirmation_pdf: file,
            confirmation_pdf_name: file.name,
            remove_confirmation_pdf: false,
        }));
        e.target.value = '';
    };

    const handleRemoveConfirmationPdf = () => {
        setForm(prev => ({
            ...prev,
            confirmation_pdf: null,
            confirmation_pdf_name: '',
            remove_confirmation_pdf: true,
        }));
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
            fd.append('category', 'tour');
            fd.append('price', form.price);
            if (form.advance_per_person !== '' && form.advance_per_person != null) {
                fd.append('advance_per_person', form.advance_per_person);
            }
            fd.append('price_note', form.price_note || '');
            fd.append('max_participants', form.max_participants);
            fd.append('start_time', form.start_time || '08:00');
            fd.append('status', form.status);
            fd.append('departure_cities', JSON.stringify(normalizeDepartureCities(form.departure_cities)));
            fd.append('pickup_mumbai', JSON.stringify(form.pickup_mumbai));
            fd.append('pickup_pune', JSON.stringify(form.pickup_pune));
            fd.append('included', JSON.stringify(form.included));
            fd.append('excluded', JSON.stringify(form.excluded));
            fd.append('itinerary', JSON.stringify(form.itinerary));
            fd.append('available_dates', JSON.stringify(form.available_dates));
            fd.append('event_day_offset', String(form.event_day_offset ?? 1));
            fd.append('pricing_options', JSON.stringify(form.pricing_options || []));
            // Tour forms don't use things_to_carry / dos / donts — send empty
            fd.append('things_to_carry', JSON.stringify([]));
            fd.append('pickup_mumbai', JSON.stringify(form.pickup_mumbai));
            fd.append('dos', JSON.stringify([]));
            fd.append('donts', JSON.stringify([]));
            fd.append('trek_guidelines', JSON.stringify([]));
            if (form.image) fd.append('image', form.image);
            if (form.confirmation_pdf) fd.append('confirmation_pdf', form.confirmation_pdf);
            if (form.remove_confirmation_pdf) fd.append('remove_confirmation_pdf', 'true');

            const res = await adventuresAPI.create(fd);
            const created = res.data?.data;
            const newId = typeof created === 'string' ? created : (created?._id || created?.id);
            toast.success('Tour created!');
            if (newId) {
                try {
                    await downloadItineraryPdf(newId, form.title);
                } catch (dlErr) {
                    toast(
                        dlErr.message
                            || 'Tour saved, but the itinerary PDF did not download. You can download it from the adventures list later.',
                        { duration: 7000 },
                    );
                }
                navigate(`/adventures/edit/${newId}`);
            } else {
                navigate('/adventures');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create tour');
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
                    <h1 className="page-title">New Tour Package</h1>
                    <p className="page-subtitle">Upload a brochure PDF to auto-fill the form</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="adventure-form">
                <BrochurePdfImport loading={brochureLoading} onUpload={handleBrochureUpload} />

                {/* ── Core info ── */}
                <div className="form-section">
                    <h2 className="section-title">Tour Information</h2>
                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label className="form-label required">Title</label>
                            <input name="title" value={form.title} onChange={handleChange}
                                className="form-input" placeholder="e.g., Goa Beach Tour" required />
                        </div>

                        <div className="form-group full-width">
                            <label className="form-label">Description</label>
                            <textarea name="description" value={form.description} onChange={handleChange}
                                className="form-textarea" rows="3" placeholder="Short tour description..." />
                        </div>

                        <div className="form-group">
                            <label className="form-label required"><MapPin size={14} /> Location / Destination</label>
                            <input name="location" value={form.location} onChange={handleChange}
                                className="form-input" placeholder="e.g., Goa" required />
                        </div>

                        <div className="form-group">
                            <label className="form-label"><Clock size={14} /> Duration</label>
                            <input name="duration" value={form.duration} onChange={handleChange}
                                className="form-input" placeholder="e.g., 4 Days, 3 Nights" />
                        </div>

                        <div className="form-group">
                            <label className="form-label required"><DollarSign size={14} /> Base Price (₹)</label>
                            <input name="price" type="number" value={form.price} onChange={handleChange}
                                className="form-input" placeholder="e.g., 8999" required />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Advance per person (₹)</label>
                            <input name="advance_per_person" type="number" min="0" value={form.advance_per_person}
                                onChange={handleChange} className="form-input" placeholder="e.g., 2000" />
                            <p className="form-help">UPI amount per seat for advance booking. Leave blank to use site default from Settings.</p>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Price Note</label>
                            <input name="price_note" value={form.price_note} onChange={handleChange}
                                className="form-input" placeholder="e.g., Mumbai to Mumbai" />
                        </div>

                        <div className="form-group">
                            <label className="form-label"><Users size={14} /> Max Participants</label>
                            <input name="max_participants" type="number" value={form.max_participants}
                                onChange={handleChange} className="form-input" placeholder="e.g., 40" />
                        </div>

                        <div className="form-group">
                            <label className="form-label"><CalendarDays size={14} /> Departure Time (IST)</label>
                            <input name="start_time" type="time" value={form.start_time}
                                onChange={handleChange} className="form-input" />
                            <p className="form-help">Bookings close 3 hrs before departure</p>
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

                {/* ── Train / Room pricing options ── */}
                <TourPricingOptionsEditor
                    value={form.pricing_options}
                    onChange={v => set('pricing_options', v)}
                />

                {/* ── Departure dates ── */}
                <div className="form-section">
                    <h2 className="section-title">Departure Dates *</h2>
                    <p className="form-help section-help">Pickup / travel start dates. Set event offset below if the main event is on a later day.</p>
                    <div className="form-group" style={{ maxWidth: 320, marginBottom: '1rem' }}>
                        <label className="form-label">Event day offset</label>
                        <input
                            type="number"
                            min="0"
                            className="form-input"
                            value={form.event_day_offset ?? 1}
                            onChange={(e) => set('event_day_offset', Math.max(0, parseInt(e.target.value, 10) || 0))}
                        />
                        <p className="form-help">Days after departure when the main event happens (1 = event is next day).</p>
                    </div>
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

                {/* ── Pickup points ── */}
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
                    <TagListField label="Mumbai pickup points" placeholder="e.g., Dadar 7:00 AM"
                        items={form.pickup_mumbai} onChange={v => set('pickup_mumbai', v)} />
                    <TagListField label="Pune pickup points" placeholder="e.g., Swargate 6:00 AM"
                        items={form.pickup_pune} onChange={v => set('pickup_pune', v)} />
                </div>

                {/* ── Cover image ── */}
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
                                    className="form-input" placeholder="e.g., Hotel stay, Breakfast" />
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
                                    className="form-input" placeholder="e.g., Airfare, Visa" />
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

                {/* ── Day-by-day plan ── */}
                <div className="form-section">
                    <h2 className="section-title">Day-by-day itinerary</h2>
                    <p className="form-help section-help">
                        PDF import often misses the full schedule — add each travel day here. This appears on the website and in the customer itinerary PDF.
                    </p>
                    <ItineraryEditor
                        value={form.itinerary}
                        onChange={(itinerary) => set('itinerary', itinerary)}
                    />
                </div>

                {/* ── Confirmation PDF ── */}
                <ConfirmationPdfField
                    confirmationFileName={form.confirmation_pdf_name}
                    existingConfirmationUrl={null}
                    removeConfirmation={form.remove_confirmation_pdf}
                    onConfirmationChange={handleConfirmationPdfChange}
                    onRemoveConfirmation={handleRemoveConfirmationPdf}
                />

                {/* ── Actions ── */}
                <div className="form-actions">
                    <button type="button" onClick={() => navigate('/adventures/add')} className="btn-secondary">
                        <ArrowLeft size={16} /> Back
                    </button>
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? <><Loader className="spinning" size={18} /> Creating...</> : <><Save size={18} /> Create Tour</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddTourAdventure;
