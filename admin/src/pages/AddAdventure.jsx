import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    Save,
    Upload,
    Plus,
    X,
    MapPin,
    Clock,
    Users,
    DollarSign,
    Image as ImageIcon,
    Loader,
    CalendarDays
} from 'lucide-react';
import { adventuresAPI } from '../utils/api';
import BrochureFields from '../components/BrochureFields';
import { BrochurePdfImport, ConfirmationPdfField } from '../components/AdventurePdfFields';
import { mergeExtractedPdfData } from '../utils/pdfExtract';
import './AddAdventure.css';

const AddAdventure = () => {
    const navigate = useNavigate();
    const imageInputRef = useRef(null);
    const galleryInputRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [brochureLoading, setBrochureLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        duration: '',
        difficulty: 'Moderate',
        category: '',
        endurance_level: '',
        base_village: '',
        elevation: '',
        region: '',
        price_note: '',
        things_to_carry: [],
        pickup_mumbai: [],
        pickup_pune: [],
        dos: [],
        donts: [],
        trek_guidelines: [],
        price: '',
        max_participants: '',
        start_time: '08:00',
        image: null,
        imagePreview: null,
        galleryFiles: [],
        galleryPreviews: [],
        included: [],
        excluded: [],
        itinerary: [],
        available_dates: [],
        status: 'active',
        confirmation_pdf: null,
        confirmation_pdf_name: '',
        remove_confirmation_pdf: false,
    });

    const [includedInput, setIncludedInput] = useState('');
    const [excludedInput, setExcludedInput] = useState('');
    const [dateInput, setDateInput] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                image: file,
                imagePreview: URL.createObjectURL(file)
            }));
        }
    };

    const handleGalleryChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setFormData(prev => ({
                ...prev,
                galleryFiles: [...prev.galleryFiles, ...files],
                galleryPreviews: [...prev.galleryPreviews, ...newPreviews]
            }));
        }
    };

    const removeGalleryImage = (index) => {
        setFormData(prev => ({
            ...prev,
            galleryFiles: prev.galleryFiles.filter((_, i) => i !== index),
            galleryPreviews: prev.galleryPreviews.filter((_, i) => i !== index)
        }));
    };

    const handleAddItem = (type, value) => {
        if (!value.trim()) return;

        setFormData(prev => ({
            ...prev,
            [type]: [...prev[type], value.trim()]
        }));

        if (type === 'included') setIncludedInput('');
        if (type === 'excluded') setExcludedInput('');
    };

    const handleRemoveItem = (type, index) => {
        setFormData(prev => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index)
        }));
    };

    const handleAddDate = () => {
        if (!dateInput) return;
        setFormData(prev => {
            if (prev.available_dates.includes(dateInput)) return prev;
            const next = [...prev.available_dates, dateInput].sort();
            return { ...prev, available_dates: next };
        });
        setDateInput('');
    };

    const handleRemoveDate = (date) => {
        setFormData(prev => ({
            ...prev,
            available_dates: prev.available_dates.filter((d) => d !== date)
        }));
    };

    const formatDateForDisplay = (iso) => {
        if (!iso) return '';
        const [y, m, d] = iso.split('-').map(Number);
        if (!y || !m || !d) return iso;
        const dt = new Date(Date.UTC(y, m - 1, d));
        return dt.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            timeZone: 'UTC'
        });
    };

    const handleBrochurePdfUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setBrochureLoading(true);
            const formDataPDF = new FormData();
            formDataPDF.append('pdf', file);

            const response = await adventuresAPI.extractFromPDF(formDataPDF);
            const extractedData = response.data.data;
            const warning = response.data.meta?.warning;

            setFormData(prev => mergeExtractedPdfData(prev, extractedData));
            if (warning) {
                toast.success('Form updated (basic parsing). Review fields and fill any gaps.');
                toast(warning, { icon: '⚠️', duration: 6000 });
            } else {
                toast.success('Brochure PDF processed — form fields updated.');
            }
        } catch (error) {
            console.error('Error processing PDF:', error);
            const serverMsg = error.response?.data?.message;
            toast.error(serverMsg || 'Failed to read brochure PDF. Please try again.');
        } finally {
            setBrochureLoading(false);
            e.target.value = '';
        }
    };

    const handleConfirmationPdfChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setFormData(prev => ({
            ...prev,
            confirmation_pdf: file,
            confirmation_pdf_name: file.name,
            remove_confirmation_pdf: false,
        }));
        e.target.value = '';
    };

    const handleRemoveConfirmationPdf = () => {
        setFormData(prev => ({
            ...prev,
            confirmation_pdf: null,
            confirmation_pdf_name: '',
            remove_confirmation_pdf: true,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.location || !formData.price) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (formData.available_dates.length === 0) {
            toast.error('Please add at least one available date');
            return;
        }

        try {
            setLoading(true);
            const submitData = new FormData();

            // Append basic fields
            submitData.append('title', formData.title);
            submitData.append('description', formData.description);
            submitData.append('location', formData.location);
            submitData.append('duration', formData.duration);
            submitData.append('difficulty', formData.difficulty);
            submitData.append('category', formData.category);
            submitData.append('endurance_level', formData.endurance_level || '');
            submitData.append('base_village', formData.base_village || '');
            submitData.append('elevation', formData.elevation || '');
            submitData.append('region', formData.region || '');
            submitData.append('price_note', formData.price_note || '');
            submitData.append('price', formData.price);
            submitData.append('max_participants', formData.max_participants);
            submitData.append('start_time', formData.start_time || '08:00');
            submitData.append('status', formData.status);

            // If there are gallery images, we must upload them first to get their URLs
            let uploadedGalleryUrls = [];
            if (formData.galleryFiles.length > 0) {
                const galleryData = new FormData();
                formData.galleryFiles.forEach(file => {
                    galleryData.append('images', file);
                });
                const galleryResponse = await adventuresAPI.uploadImages(galleryData);
                uploadedGalleryUrls = galleryResponse.data.data;
            }

            // Append image
            if (formData.image) {
                submitData.append('image', formData.image);
            }
            if (formData.confirmation_pdf) {
                submitData.append('confirmation_pdf', formData.confirmation_pdf);
            }
            if (formData.remove_confirmation_pdf) {
                submitData.append('remove_confirmation_pdf', 'true');
            }

            // Append JSON fields
            if (uploadedGalleryUrls.length > 0) {
                submitData.append('images', JSON.stringify(uploadedGalleryUrls));
            }
            submitData.append('included', JSON.stringify(formData.included));
            submitData.append('excluded', JSON.stringify(formData.excluded));
            submitData.append('things_to_carry', JSON.stringify(formData.things_to_carry || []));
            submitData.append('pickup_mumbai', JSON.stringify(formData.pickup_mumbai || []));
            submitData.append('pickup_pune', JSON.stringify(formData.pickup_pune || []));
            submitData.append('dos', JSON.stringify(formData.dos || []));
            submitData.append('donts', JSON.stringify(formData.donts || []));
            submitData.append('trek_guidelines', JSON.stringify(formData.trek_guidelines || []));
            submitData.append('itinerary', JSON.stringify(formData.itinerary));
            submitData.append('available_dates', JSON.stringify(formData.available_dates));

            await adventuresAPI.create(submitData);
            toast.success('✅ Adventure created successfully!');
            navigate('/adventures');
        } catch (error) {
            console.error('Error creating adventure:', error);
            const serverMessage = error.response?.data?.message;
            const detail = serverMessage || error.message || 'Please try again.';
            toast.error(`Failed to create adventure. ${detail}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-adventure-page">
            <div className="page-header">
                <div>
                    <p className="page-subtitle" style={{ marginTop: 0 }}>Create a trek package — upload a brochure PDF to auto-fill fields</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="adventure-form">
                <BrochurePdfImport
                    loading={brochureLoading}
                    onUpload={handleBrochurePdfUpload}
                />

                {/* Basic Information */}
                <div className="form-section">
                    <h2 className="section-title">Basic Information</h2>

                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label className="form-label required">Adventure Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="e.g., Himalayan Trek Adventure"
                                required
                            />
                        </div>

                        <div className="form-group full-width">
                            <label className="form-label">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="form-textarea"
                                rows="4"
                                placeholder="Describe the adventure experience..."
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label required">
                                <MapPin size={16} />
                                Location
                            </label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="e.g., Manali, Himachal Pradesh"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                <Clock size={16} />
                                Duration
                            </label>
                            <input
                                type="text"
                                name="duration"
                                value={formData.duration}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="e.g., 5 Days, 4 Nights"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Difficulty Level</label>
                            <select
                                name="difficulty"
                                value={formData.difficulty}
                                onChange={handleChange}
                                className="form-select"
                            >
                                <option value="Easy">Easy</option>
                                <option value="Moderate">Moderate</option>
                                <option value="Challenging">Challenging</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="form-select"
                            >
                                <option value="">Select category...</option>
                                <option value="trek">Trek</option>
                                <option value="camping">Camping</option>
                                <option value="tour">Tour</option>
                                <option value="general">General</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label required">
                                <DollarSign size={16} />
                                Price (₹)
                            </label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="e.g., 8999"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                <Users size={16} />
                                Max Participants
                            </label>
                            <input
                                type="number"
                                name="max_participants"
                                value={formData.max_participants}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="e.g., 15"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                <CalendarDays size={16} />
                                Start time (IST)
                            </label>
                            <input
                                type="time"
                                name="start_time"
                                value={formData.start_time || '08:00'}
                                onChange={handleChange}
                                className="form-input"
                            />
                            <p className="form-hint" style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Bookings auto-close 3 hours before this time (e.g. 20:30 → closes at 17:30).
                            </p>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="form-select"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Image Upload */}
                <div className="form-section">
                    <h2 className="section-title">Main Adventure Image</h2>

                    <div className="image-upload-area">
                        {formData.imagePreview ? (
                            <div className="image-preview">
                                <img src={formData.imagePreview} alt="Preview" />
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, image: null, imagePreview: null }))}
                                    className="remove-image-btn"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        ) : (
                            <div
                                className="upload-placeholder"
                                onClick={() => imageInputRef.current?.click()}
                            >
                                <ImageIcon size={48} />
                                <p>Click to upload main image</p>
                                <span>All image formats supported up to 15MB</span>
                            </div>
                        )}
                        <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            style={{ display: 'none' }}
                        />
                    </div>
                </div>

                {/* Gallery Upload */}
                <div className="form-section">
                    <div className="form-section-header">
                        <h2 className="section-title">Gallery Images</h2>
                        <button 
                            type="button"
                            className="btn-secondary py-2"
                            onClick={() => galleryInputRef.current?.click()}
                        >
                            <Plus size={16} /> Add Multiple Files
                        </button>
                    </div>

                    {formData.galleryPreviews.length > 0 ? (
                        <div className="gallery-grid">
                            {formData.galleryPreviews.map((preview, index) => (
                                <div key={index} className="gallery-item">
                                    <img src={preview} alt={`Gallery ${index}`} />
                                    <button
                                        type="button"
                                        onClick={() => removeGalleryImage(index)}
                                        className="gallery-remove"
                                        aria-label="Remove image"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div 
                            className="upload-placeholder border-dashed border-2 py-8 mt-2 cursor-pointer"
                            onClick={() => galleryInputRef.current?.click()}
                        >
                            <ImageIcon size={32} className="text-gray-400 mb-2 mx-auto" />
                            <p className="text-gray-500 text-sm">Click to add supplementary gallery photos</p>
                        </div>
                    )}
                    
                    <input
                        ref={galleryInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleGalleryChange}
                        style={{ display: 'none' }}
                    />
                </div>

                {/* Included/Excluded */}
                <div className="form-section">
                    <h2 className="section-title">What's Included & Excluded</h2>

                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Included</label>
                            <div className="input-with-button">
                                <input
                                    type="text"
                                    value={includedInput}
                                    onChange={(e) => setIncludedInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem('included', includedInput))}
                                    className="form-input"
                                    placeholder="e.g., Meals, Accommodation"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleAddItem('included', includedInput)}
                                    className="add-btn"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                            <div className="tags-list">
                                {formData.included.map((item, index) => (
                                    <span key={index} className="tag">
                                        {item}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem('included', index)}
                                            className="tag-remove"
                                        >
                                            <X size={14} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Excluded</label>
                            <div className="input-with-button">
                                <input
                                    type="text"
                                    value={excludedInput}
                                    onChange={(e) => setExcludedInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem('excluded', excludedInput))}
                                    className="form-input"
                                    placeholder="e.g., Personal expenses"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleAddItem('excluded', excludedInput)}
                                    className="add-btn"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                            <div className="tags-list">
                                {formData.excluded.map((item, index) => (
                                    <span key={index} className="tag">
                                        {item}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem('excluded', index)}
                                            className="tag-remove"
                                        >
                                            <X size={14} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <BrochureFields formData={formData} setFormData={setFormData} />

                {/* Available Dates */}
                <div className="form-section">
                    <h2 className="section-title">
                        <CalendarDays size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                        Available Dates
                    </h2>
                    <p className="form-help" style={{ marginTop: '-0.75rem', marginBottom: '1rem' }}>
                        Add the departure dates for this adventure. Users will only be able to book one of these dates.
                    </p>

                    <div className="form-group full-width">
                        <div className="input-with-button">
                            <input
                                type="date"
                                value={dateInput}
                                min={new Date().toISOString().slice(0, 10)}
                                onChange={(e) => setDateInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddDate(); } }}
                                className="form-input"
                            />
                            <button
                                type="button"
                                onClick={handleAddDate}
                                className="add-btn"
                                disabled={!dateInput}
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        <div className="tags-list">
                            {formData.available_dates.length === 0 ? (
                                <span className="text-muted" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                    No dates added yet
                                </span>
                            ) : (
                                formData.available_dates.map((date) => (
                                    <span key={date} className="tag date-tag">
                                        <CalendarDays size={14} style={{ marginRight: '0.25rem' }} />
                                        {formatDateForDisplay(date)}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveDate(date)}
                                            className="tag-remove"
                                            aria-label={`Remove ${date}`}
                                        >
                                            <X size={14} />
                                        </button>
                                    </span>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Itinerary */}
                <div className="form-section">
                    <h2 className="section-title">Itinerary</h2>
                    <p className="form-help section-help">
                        Import a brochure PDF above to populate the day-by-day schedule, or leave empty if not needed.
                    </p>

                    {formData.itinerary.length > 0 ? (
                        <div className="itinerary-preview">
                            {formData.itinerary.map((day, index) => (
                                <div key={index} className="itinerary-day">
                                    <div className="day-header">
                                        <span className="day-number">Day {day.day}</span>
                                        <h4>{day.title}</h4>
                                    </div>
                                    <p className="day-description">{day.description}</p>
                                    {day.activities && day.activities.length > 0 && (
                                        <div className="day-activities">
                                            <strong>Activities:</strong>
                                            <ul>
                                                {day.activities.map((activity, i) => (
                                                    <li key={i}>{activity}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {day.meals && day.meals.length > 0 && (
                                        <div className="day-meals">
                                            <strong>Meals:</strong> {day.meals.join(', ')}
                                        </div>
                                    )}
                                    {day.accommodation && (
                                        <div className="day-accommodation">
                                            <strong>Accommodation:</strong> {day.accommodation}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted empty-hint">No itinerary yet — upload a brochure PDF to import one.</p>
                    )}
                </div>

                <ConfirmationPdfField
                    confirmationFileName={formData.confirmation_pdf_name}
                    existingConfirmationUrl={null}
                    removeConfirmation={formData.remove_confirmation_pdf}
                    onConfirmationChange={handleConfirmationPdfChange}
                    onRemoveConfirmation={handleRemoveConfirmationPdf}
                />

                {/* Submit Button */}
                <div className="form-actions">
                    <button
                        type="button"
                        onClick={() => navigate('/adventures')}
                        className="btn-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader className="spinning" size={20} />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                Create Adventure
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddAdventure;
