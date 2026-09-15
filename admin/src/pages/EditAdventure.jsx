import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
    ArrowLeft,
    CalendarDays,
    Download,
} from 'lucide-react';
import { adventuresAPI, getImageUrl } from '../utils/api';
import BrochureFields from '../components/BrochureFields';
import TourPricingOptionsEditor from '../components/TourPricingOptionsEditor';
import DepartureCitiesField from '../components/DepartureCitiesField';
import { BrochurePdfImport, ConfirmationPdfField } from '../components/AdventurePdfFields';
import { asStringList } from '../utils/brochure';
import { mergeExtractedPdfData } from '../utils/pdfExtract';
import { downloadItineraryPdf, previewItineraryPdf } from '../utils/downloadItineraryPdf';
import { cloneDefaultTourPricingOptions } from '../utils/tourPricingDefaults';
import ItineraryEditor from '../components/ItineraryEditor';
import MealOptionsField from '../components/MealOptionsField';
import { normalizeDepartureCities, inferDepartureCities } from '../utils/departureCities';
import './AddAdventure.css'; // Reusing the same styles

const EditAdventure = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const imageInputRef = useRef(null);
    const galleryInputRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [brochureLoading, setBrochureLoading] = useState(false);
    const [pdfDownloading, setPdfDownloading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        duration: '',
        difficulty: 'Moderate',
        category: '',
        departure_cities: [],
        endurance_level: '',
        base_village: '',
        elevation: '',
        region: '',
        price_note: '',
        pricing_options: [],
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
        existingGalleryUrls: [],
        newGalleryFiles: [],
        galleryPreviews: [],
        included: [],
        excluded: [],
        itinerary: [],
        available_dates: [],
        event_day_offset: 1,
        meal_options: [],
        status: 'active',
        confirmation_pdf: null,
        confirmation_pdf_name: '',
        existing_confirmation_pdf_url: '',
        remove_confirmation_pdf: false,
    });

    const [includedInput, setIncludedInput] = useState('');
    const [excludedInput, setExcludedInput] = useState('');
    const [dateInput, setDateInput] = useState('');

    useEffect(() => {
        fetchAdventure();
    }, [id]);

    const fetchAdventure = async () => {
        try {
            const response = await adventuresAPI.getById(id);
            // Handle both { data: {...} } and flat object
            const adventure = response.data?.data || response.data;

            // Ensure JSON fields are parsed if they come as strings
            const included = typeof adventure.included === 'string' ? JSON.parse(adventure.included) : adventure.included;
            const excluded = typeof adventure.excluded === 'string' ? JSON.parse(adventure.excluded) : adventure.excluded;
            const itinerary = typeof adventure.itinerary === 'string' ? JSON.parse(adventure.itinerary) : adventure.itinerary;

            let imagePreview = getImageUrl(adventure.image_url);

            const images = typeof adventure.images === 'string' ? JSON.parse(adventure.images) : adventure.images || [];
            const existingGalleryUrls = images;
            const galleryPreviews = images.map((imgUrl) => getImageUrl(imgUrl)).filter(Boolean);

            const rawDates = typeof adventure.available_dates === 'string'
                ? JSON.parse(adventure.available_dates)
                : adventure.available_dates;
            const availableDates = Array.isArray(rawDates) ? [...rawDates].sort() : [];

            setFormData({
                title: adventure.title || '',
                description: adventure.description || '',
                location: adventure.location || '',
                duration: adventure.duration || '',
                difficulty: adventure.difficulty || 'Moderate',
                category: adventure.category || '',
                departure_cities: (() => {
                    const explicit = normalizeDepartureCities(adventure.departure_cities);
                    if (explicit.length > 0) return explicit;
                    return inferDepartureCities({
                        pickup_mumbai: asStringList(adventure.pickup_mumbai),
                        pickup_pune: asStringList(adventure.pickup_pune),
                    });
                })(),
                endurance_level: adventure.endurance_level || '',
                base_village: adventure.base_village || '',
                elevation: adventure.elevation || '',
                region: adventure.region || '',
                price_note: adventure.price_note || '',
                pricing_options: Array.isArray(adventure.pricing_options)
                    ? adventure.pricing_options
                    : (adventure.category === 'tour' ? cloneDefaultTourPricingOptions() : []),
                things_to_carry: asStringList(adventure.things_to_carry),
                pickup_mumbai: asStringList(adventure.pickup_mumbai),
                pickup_pune: asStringList(adventure.pickup_pune),
                dos: asStringList(adventure.dos),
                donts: asStringList(adventure.donts),
                trek_guidelines: asStringList(adventure.trek_guidelines),
                price: adventure.price || '',
                advance_per_person: adventure.advance_per_person ?? '',
                max_participants: adventure.max_participants || '',
                start_time: adventure.start_time || '08:00',
                image: null,
                imagePreview,
                existingGalleryUrls,
                newGalleryFiles: [],
                galleryPreviews,
                included: Array.isArray(included) ? included : [],
                excluded: Array.isArray(excluded) ? excluded : [],
                itinerary: Array.isArray(itinerary) ? itinerary : [],
                available_dates: availableDates,
                event_day_offset: adventure.event_day_offset ?? 1,
                meal_options: Array.isArray(adventure.meal_options) ? adventure.meal_options : [],
                status: adventure.status || 'active',
                confirmation_pdf: null,
                confirmation_pdf_name: adventure.confirmation_pdf_url ? 'Current confirmation PDF' : '',
                existing_confirmation_pdf_url: adventure.confirmation_pdf_url || '',
                remove_confirmation_pdf: false,
            });
        } catch (error) {
            console.error('Error fetching adventure:', error);
            toast.error('Failed to fetch adventure details.');
            navigate('/adventures');
        } finally {
            setFetching(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const next = { ...prev, [name]: value };
            if (name === 'category' && value === 'tour' && (!prev.pricing_options || prev.pricing_options.length === 0)) {
                next.pricing_options = cloneDefaultTourPricingOptions();
            }
            return next;
        });
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
                newGalleryFiles: [...prev.newGalleryFiles, ...files],
                galleryPreviews: [...prev.galleryPreviews, ...newPreviews]
            }));
        }
    };

    const removeGalleryImage = (index) => {
        setFormData(prev => {
            const isExisting = index < prev.existingGalleryUrls.length;
            let newExistingUrl = [...prev.existingGalleryUrls];
            let newGalleryFiles = [...prev.newGalleryFiles];
            let newPreviews = [...prev.galleryPreviews];

            if (isExisting) {
                newExistingUrl = newExistingUrl.filter((_, i) => i !== index);
            } else {
                const adjustedIndex = index - prev.existingGalleryUrls.length;
                newGalleryFiles = newGalleryFiles.filter((_, i) => i !== adjustedIndex);
            }

            newPreviews = newPreviews.filter((_, i) => i !== index);

            return {
                ...prev,
                existingGalleryUrls: newExistingUrl,
                newGalleryFiles: newGalleryFiles,
                galleryPreviews: newPreviews
            };
        });
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

    const isPastDate = (iso) => {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        return iso < today.toISOString().slice(0, 10);
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
            existing_confirmation_pdf_url: '',
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
            submitData.append('departure_cities', JSON.stringify(normalizeDepartureCities(formData.departure_cities)));
            submitData.append('endurance_level', formData.endurance_level || '');
            submitData.append('base_village', formData.base_village || '');
            submitData.append('elevation', formData.elevation || '');
            submitData.append('region', formData.region || '');
            submitData.append('price_note', formData.price_note || '');
            submitData.append('price', formData.price);
            if (formData.category === 'tour') {
                submitData.append(
                    'advance_per_person',
                    formData.advance_per_person === '' || formData.advance_per_person == null
                        ? ''
                        : formData.advance_per_person,
                );
            }
            submitData.append('max_participants', formData.max_participants);
            submitData.append('start_time', formData.start_time || '08:00');
            submitData.append('status', formData.status);

            // Handle gallery images: upload new ones, combine with existing ones
            let uploadedGalleryUrls = [];
            if (formData.newGalleryFiles.length > 0) {
                const galleryData = new FormData();
                formData.newGalleryFiles.forEach(file => {
                    galleryData.append('images', file);
                });
                const galleryResponse = await adventuresAPI.uploadImages(galleryData);
                uploadedGalleryUrls = galleryResponse.data.data;
            }

            const combinedGalleryUrls = [...formData.existingGalleryUrls, ...uploadedGalleryUrls];

            // Append image only if new one is selected
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
            submitData.append('images', JSON.stringify(combinedGalleryUrls));
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
            submitData.append('event_day_offset', String(formData.event_day_offset ?? 1));
            submitData.append('meal_options', JSON.stringify(formData.meal_options || []));
            if (formData.category === 'tour') {
                submitData.append('pricing_options', JSON.stringify(formData.pricing_options || []));
            }

            await adventuresAPI.update(id, submitData);
            toast.success('✅ Adventure updated successfully!');
            navigate('/adventures');
        } catch (error) {
            console.error('Error updating adventure:', error);
            toast.error(error.response?.data?.message || 'Failed to update adventure. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading adventure details...</p>
            </div>
        );
    }

    return (
        <div className="add-adventure-page">
            <div className="page-header">
                <div>
                    <p className="page-subtitle" style={{ marginTop: 0 }}>Update trek details, dates, and confirmation PDF</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        className="btn-secondary"
                        disabled={pdfDownloading}
                        onClick={async () => {
                            setPdfDownloading(true);
                            const tid = toast.loading('Opening itinerary preview…');
                            try {
                                await previewItineraryPdf(id);
                                toast.success('Preview opened in a new tab', { id: tid });
                            } catch (err) {
                                toast.error(err.message || 'Could not preview PDF', { id: tid });
                            } finally {
                                setPdfDownloading(false);
                            }
                        }}
                    >
                        Preview PDF
                    </button>
                    <button
                        type="button"
                        className="btn-secondary"
                        disabled={pdfDownloading}
                        onClick={async () => {
                            setPdfDownloading(true);
                            const tid = toast.loading('Preparing itinerary PDF…');
                            try {
                                await downloadItineraryPdf(id, formData.title);
                                toast.success('Itinerary PDF downloaded', { id: tid });
                            } catch (err) {
                                console.error(err);
                                toast.error(err.message || 'Could not download itinerary PDF', { id: tid });
                            } finally {
                                setPdfDownloading(false);
                            }
                        }}
                    >
                        {pdfDownloading ? <Loader className="spinning" size={18} /> : <Download size={18} />}
                        {pdfDownloading ? 'Preparing…' : 'Download itinerary PDF'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/adventures')}
                        className="btn-secondary"
                    >
                        <ArrowLeft size={18} />
                        Back
                    </button>
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

                        <DepartureCitiesField
                            value={formData.departure_cities}
                            onChange={(departure_cities, patch = {}) => setFormData((prev) => {
                                const next = { ...prev, departure_cities };
                                if (patch.ensurePickupMumbai && (!prev.pickup_mumbai || prev.pickup_mumbai.length === 0)) {
                                    next.pickup_mumbai = [patch.ensurePickupMumbai];
                                }
                                if (patch.ensurePickupPune && (!prev.pickup_pune || prev.pickup_pune.length === 0)) {
                                    next.pickup_pune = [patch.ensurePickupPune];
                                }
                                return next;
                            })}
                        />

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

                        {formData.category === 'tour' && (
                            <div className="form-group">
                                <label className="form-label">Advance per person (₹)</label>
                                <input
                                    type="number"
                                    name="advance_per_person"
                                    min="0"
                                    value={formData.advance_per_person}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Site default if empty"
                                />
                                <p style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Guests can pay this amount per seat now, or pay the full trip total.
                                </p>
                            </div>
                        )}

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
                            <label className="form-label">Start time (IST)</label>
                            <input
                                type="time"
                                name="start_time"
                                value={formData.start_time || '08:00'}
                                onChange={handleChange}
                                className="form-input"
                            />
                            <p style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Bookings auto-close 3 hours before this time.
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

                {formData.category === 'tour' && (
                    <TourPricingOptionsEditor
                        value={formData.pricing_options}
                        onChange={(pricing_options) => setFormData((prev) => ({ ...prev, pricing_options }))}
                    />
                )}

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

                <div className="form-section">
                    <h2 className="section-title">Booking options</h2>
                    <MealOptionsField
                        value={formData.meal_options}
                        onChange={(meal_options) => setFormData((prev) => ({ ...prev, meal_options }))}
                    />
                </div>

                {/* Available Dates */}
                <div className="form-section">
                    <h2 className="section-title">
                        <CalendarDays size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                        Available Dates
                    </h2>
                    <p className="form-help" style={{ marginTop: '-0.75rem', marginBottom: '1rem' }}>
                        Add departure dates (pickup / travel start). Past dates are kept for reference but won&apos;t be bookable.
                    </p>

                    <div className="form-group" style={{ maxWidth: 320, marginBottom: '1rem' }}>
                        <label className="form-label">Event day offset</label>
                        <input
                            type="number"
                            min="0"
                            className="form-input"
                            value={formData.event_day_offset ?? 1}
                            onChange={(e) => setFormData((prev) => ({
                                ...prev,
                                event_day_offset: Math.max(0, parseInt(e.target.value, 10) || 0),
                            }))}
                        />
                        <p className="form-help">
                            Days after departure when the main event happens. Use 1 when departure is the day before the event.
                        </p>
                    </div>

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
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                    No dates added yet
                                </span>
                            ) : (
                                formData.available_dates.map((date) => {
                                    const past = isPastDate(date);
                                    return (
                                        <span key={date} className="tag date-tag" style={past ? { opacity: 0.6 } : undefined}>
                                            <CalendarDays size={14} style={{ marginRight: '0.25rem' }} />
                                            {formatDateForDisplay(date)}
                                            {past && (
                                                <span style={{ marginLeft: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    (past)
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveDate(date)}
                                                className="tag-remove"
                                                aria-label={`Remove ${date}`}
                                            >
                                                <X size={14} />
                                            </button>
                                        </span>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Itinerary */}
                <div className="form-section">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                        <div>
                            <h2 className="section-title" style={{ marginBottom: '0.35rem' }}>Itinerary</h2>
                            <p className="form-help section-help" style={{ marginBottom: 0 }}>
                                Add or edit each day below (PDF import may only fill basics). Download a customer itinerary PDF anytime.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="btn-secondary"
                            disabled={pdfDownloading}
                            onClick={async () => {
                                setPdfDownloading(true);
                                const tid = toast.loading('Preparing itinerary PDF…');
                                try {
                                    await downloadItineraryPdf(id, formData.title);
                                    toast.success('Itinerary PDF downloaded', { id: tid });
                                } catch (err) {
                                    toast.error(err.response?.data?.message || 'Could not download itinerary PDF', { id: tid });
                                } finally {
                                    setPdfDownloading(false);
                                }
                            }}
                        >
                            {pdfDownloading ? <Loader className="spinning" size={16} /> : <Download size={16} />}
                            Download PDF
                        </button>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <ItineraryEditor
                            value={formData.itinerary}
                            onChange={(itinerary) => setFormData((prev) => ({ ...prev, itinerary }))}
                        />
                    </div>
                </div>

                <ConfirmationPdfField
                    confirmationFileName={formData.confirmation_pdf_name}
                    existingConfirmationUrl={
                        !formData.remove_confirmation_pdf ? formData.existing_confirmation_pdf_url : ''
                    }
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
                                Updating...
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                Update Adventure
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditAdventure;
