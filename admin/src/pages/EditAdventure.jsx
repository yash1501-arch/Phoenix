import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    Save,
    Upload,
    FileText,
    Sparkles,
    Plus,
    X,
    MapPin,
    Clock,
    Users,
    DollarSign,
    Image as ImageIcon,
    Loader,
    ArrowLeft,
    CalendarDays
} from 'lucide-react';
import { adventuresAPI } from '../utils/api';
import './AddAdventure.css'; // Reusing the same styles

const EditAdventure = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const imageInputRef = useRef(null);
    const pdfInputRef = useRef(null);
    const galleryInputRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [aiLoading, setAiLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        duration: '',
        difficulty: 'Moderate',
        category: '',
        price: '',
        max_participants: '',
        image: null,
        imagePreview: null,
        existingGalleryUrls: [],
        newGalleryFiles: [],
        galleryPreviews: [],
        included: [],
        excluded: [],
        itinerary: [],
        available_dates: [],
        status: 'active'
    });

    const [includedInput, setIncludedInput] = useState('');
    const [excludedInput, setExcludedInput] = useState('');
    const [itineraryInput, setItineraryInput] = useState('');
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

            const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
            let imagePreview = null;
            if (adventure.image_url) {
                if (adventure.image_url.startsWith('http')) {
                    imagePreview = adventure.image_url;
                } else {
                    imagePreview = `${baseUrl}${adventure.image_url}`;
                }
            }

            const images = typeof adventure.images === 'string' ? JSON.parse(adventure.images) : adventure.images || [];
            const existingGalleryUrls = images;
            const galleryPreviews = images.map(imgUrl => imgUrl.startsWith('http') ? imgUrl : `${baseUrl}${imgUrl}`);

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
                price: adventure.price || '',
                max_participants: adventure.max_participants || '',
                image: null,
                imagePreview,
                existingGalleryUrls,
                newGalleryFiles: [],
                galleryPreviews,
                included: Array.isArray(included) ? included : [],
                excluded: Array.isArray(excluded) ? excluded : [],
                itinerary: Array.isArray(itinerary) ? itinerary : [],
                available_dates: availableDates,
                status: adventure.status || 'active'
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

    const handlePDFUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setPdfLoading(true);
            const formDataPDF = new FormData();
            formDataPDF.append('pdf', file);

            const response = await adventuresAPI.extractFromPDF(formDataPDF);
            const extractedData = response.data.data;

            setFormData(prev => ({
                ...prev,
                title: extractedData.title || prev.title,
                description: extractedData.description || prev.description,
                location: extractedData.location || prev.location,
                duration: extractedData.duration || prev.duration,
                difficulty: extractedData.difficulty || prev.difficulty,
                price: extractedData.price || prev.price,
                max_participants: extractedData.maxParticipants || prev.max_participants,
                included: extractedData.included || prev.included,
                excluded: extractedData.excluded || prev.excluded,
                itinerary: extractedData.itinerary || prev.itinerary
            }));

            toast.success('✨ PDF processed successfully! Form updated with extracted data.');
        } catch (error) {
            console.error('Error processing PDF:', error);
            toast.error('Failed to process PDF. Please try again.');
        } finally {
            setPdfLoading(false);
            if (pdfInputRef.current) pdfInputRef.current.value = '';
        }
    };

    const handleOptimizeItinerary = async () => {
        if (!itineraryInput.trim()) {
            toast.error('Please enter itinerary details to optimize');
            return;
        }

        try {
            setAiLoading(true);
            const response = await adventuresAPI.optimizeItinerary({
                rawItinerary: itineraryInput,
                adventureDetails: {
                    title: formData.title,
                    location: formData.location,
                    duration: formData.duration,
                    difficulty: formData.difficulty
                }
            });

            const optimizedItinerary = response.data.data;
            setFormData(prev => ({
                ...prev,
                itinerary: Array.isArray(optimizedItinerary) ? optimizedItinerary : []
            }));
            setItineraryInput('');
            toast.success('✨ Itinerary optimized successfully!');
        } catch (error) {
            console.error('Error optimizing itinerary:', error);
            toast.error('Failed to optimize itinerary. Please try again.');
        } finally {
            setAiLoading(false);
        }
    };

    const handleGenerateDescription = async () => {
        if (!formData.title || !formData.location) {
            toast.error('Please enter title and location first');
            return;
        }

        try {
            setAiLoading(true);
            const response = await adventuresAPI.generateDescription({
                title: formData.title,
                location: formData.location,
                duration: formData.duration,
                difficulty: formData.difficulty
            });

            setFormData(prev => ({
                ...prev,
                description: response.data.data.description
            }));
            toast.success('✨ Description generated successfully!');
        } catch (error) {
            console.error('Error generating description:', error);
            toast.error('Failed to generate description. Please try again.');
        } finally {
            setAiLoading(false);
        }
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
            submitData.append('price', formData.price);
            submitData.append('max_participants', formData.max_participants);
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

            // Append JSON fields
            submitData.append('images', JSON.stringify(combinedGalleryUrls));
            submitData.append('included', JSON.stringify(formData.included));
            submitData.append('excluded', JSON.stringify(formData.excluded));
            submitData.append('itinerary', JSON.stringify(formData.itinerary));
            submitData.append('available_dates', JSON.stringify(formData.available_dates));

            await adventuresAPI.update(id, submitData);
            toast.success('✅ Adventure updated successfully!');
            navigate('/adventures');
        } catch (error) {
            console.error('Error updating adventure:', error);
            toast.error('Failed to update adventure. Please try again.');
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
                    <h1 className="page-title">Edit Adventure</h1>
                    <p className="page-subtitle">Update adventure details</p>
                </div>
                <button
                    onClick={() => navigate('/adventures')}
                    className="btn-secondary"
                >
                    <ArrowLeft size={20} />
                    Back to Adventures
                </button>
            </div>

            {/* AI Quick Actions */}
            <div className="ai-actions-card">
                <div className="ai-header">
                    <Sparkles className="ai-icon" />
                    <h3>AI-Powered Tools</h3>
                </div>
                <div className="ai-actions">
                    <button
                        type="button"
                        onClick={() => pdfInputRef.current?.click()}
                        className="ai-button"
                        disabled={pdfLoading}
                    >
                        {pdfLoading ? (
                            <>
                                <Loader className="spinning" size={20} />
                                Processing PDF...
                            </>
                        ) : (
                            <>
                                <FileText size={20} />
                                Update from PDF
                            </>
                        )}
                    </button>
                    <input
                        ref={pdfInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handlePDFUpload}
                        style={{ display: 'none' }}
                    />

                    <button
                        type="button"
                        onClick={handleGenerateDescription}
                        className="ai-button"
                        disabled={aiLoading || !formData.title || !formData.location}
                    >
                        <Sparkles size={20} />
                        Regenerate Description
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="adventure-form">
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
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="section-title mb-0">Gallery Images</h2>
                        <button 
                            type="button"
                            className="btn-secondary py-2"
                            onClick={() => galleryInputRef.current?.click()}
                        >
                            <Plus size={16} /> Add Multiple Files
                        </button>
                    </div>

                    {formData.galleryPreviews.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                            {formData.galleryPreviews.map((preview, index) => (
                                <div key={index} className="relative rounded-xl overflow-hidden aspect-square border border-gray-100 group">
                                    <img src={preview} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeGalleryImage(index)}
                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg"
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

                {/* Available Dates */}
                <div className="form-section">
                    <h2 className="section-title">
                        <CalendarDays size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                        Available Dates
                    </h2>
                    <p className="form-help" style={{ marginTop: '-0.75rem', marginBottom: '1rem' }}>
                        Add or remove departure dates. Past dates are kept here for reference but won't be bookable by users.
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
                    <h2 className="section-title">Itinerary</h2>

                    <div className="itinerary-input-section">
                        <textarea
                            value={itineraryInput}
                            onChange={(e) => setItineraryInput(e.target.value)}
                            className="form-textarea"
                            rows="6"
                            placeholder="Enter raw itinerary details here... AI will structure it for you!"
                        />
                        <button
                            type="button"
                            onClick={handleOptimizeItinerary}
                            className="ai-optimize-btn"
                            disabled={aiLoading || !itineraryInput.trim()}
                        >
                            {aiLoading ? (
                                <>
                                    <Loader className="spinning" size={20} />
                                    Optimizing...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={20} />
                                    Optimize with AI
                                </>
                            )}
                        </button>
                    </div>

                    {formData.itinerary.length > 0 && (
                        <div className="itinerary-preview">
                            <h3>Optimized Itinerary</h3>
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
                    )}
                </div>

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
