import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';


import {
    MapPin, Clock, Users, Star, Shield, CheckCircle, XCircle,
    ChevronDown, ChevronUp, ArrowLeft,
    Activity, Phone, MessageCircle, CalendarCheck, Mountain, Bus, Backpack, Heart
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { adventuresAPI, publicSettingsAPI, getImageUrl, waitlistAPI } from '../utils/api';
import WishlistButton from '../components/ui/WishlistButton';
import Lightbox from '../components/ui/Lightbox';
import WeatherWidget from '../components/ui/WeatherWidget';
import ShareButtons from '../components/ui/ShareButtons';
import Reviews from '../components/ui/Reviews';
import BookingModal from '../components/BookingModal';
import { Reveal, IconMotion, StaggerContainer } from '../components/ui/Motion';
import { IMG_FALLBACK } from '../data/indiaImages';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import toast from 'react-hot-toast';
import Seo from '../components/Seo';
import AdventureCard from '../components/ui/AdventureCard';
import { absoluteAssetUrl, adventureJsonLd, adventureMetaDescription } from '../utils/seo';
import {
    dayLabel,
    formatDateIN,
    formatDatePair,
    getEventDayOffset,
    mapItineraryWithDates,
    parseAvailableDates,
    buildBookingItineraryPackage,
    parseJsonList,
    parseItineraryList,
} from '../utils/adventureDates';

const asStringList = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        } catch {
            return [];
        }
    }
    return [];
};

const DEFAULT_PACKING = [
    'Trekking shoes (broken in, not brand-new)',
    '2–3 litres of water in reusable bottles',
    'Cap, sunglasses, SPF 50 sunscreen',
    'Light daypack (30L is plenty)',
    'Energy snacks — dry fruits, bars',
    'Rain shell (June–Sept mandatory)',
];

const BrochureList = ({ items, variant = 'default' }) => (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3 max-w-2xl">
        {items.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-stone border-b border-stone/5 pb-3">
                <span
                    className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${variant === 'dont' ? 'bg-red-400' : 'bg-ember'}`}
                    aria-hidden="true"
                />
                <span>{item}</span>
            </li>
        ))}
    </ul>
);

// ── WhatsApp Redirect ────────────────────────────────────────────────────────
const openWhatsApp = (adventure, phone) => {
    const message = [
        `Hi! I'm interested in *${adventure.title}*`,
        `Location: ${adventure.location || ''}`,
        `Duration: ${adventure.duration || ''}`,
        `Price: ₹${adventure.price?.toLocaleString() || ''}`,
        ``,
        `Please share more details about availability, dates, and group size.`,
        `Thank you!`,
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
};

// ── Itinerary Accordion ──────────────────────────────────────────────────────
const ItineraryItem = ({ day, defaultOpen = false, calendarLabel = null }) => {
    const [open, setOpen] = useState(defaultOpen);
    const schedule = Array.isArray(day.schedule)
        ? day.schedule.filter((row) => row?.time || row?.activity)
        : [];
    const activities = Array.isArray(day.activities) ? day.activities.filter(Boolean) : [];
    const meals = Array.isArray(day.meals) ? day.meals.filter(Boolean) : [];
    const stay = String(day.accommodation || '').trim();

    return (
        <div className="border border-stone/10 rounded-lg overflow-hidden bg-mist-subtle">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left hover:bg-mist transition-colors"
            >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <span className="min-w-10 h-10 px-2 rounded-md bg-panel text-ember font-bold text-xs sm:text-sm flex items-center justify-center shrink-0">
                        {Number(day.day) === 0 ? 'Day 0' : `Day ${day.day}`}
                    </span>
                    <div className="min-w-0">
                        <span className="font-semibold text-stone truncate block">{day.title || dayLabel(day)}</span>
                        {calendarLabel && (
                            <span className="text-xs text-muted block truncate">{calendarLabel}</span>
                        )}
                    </div>
                </div>
                {open ? <ChevronUp size={18} className="text-ember shrink-0" /> : <ChevronDown size={18} className="text-muted shrink-0" />}
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 sm:px-5 pb-5 border-t border-stone/10 pt-4 space-y-4">
                            {schedule.length > 0 ? (
                                <ol className="space-y-0">
                                    {schedule.map((row, i) => (
                                        <li key={i} className="flex gap-3 sm:gap-4">
                                            <div className="w-[4.25rem] sm:w-20 shrink-0 pt-0.5">
                                                <span className="text-ember font-semibold text-xs sm:text-sm tabular-nums">
                                                    {row.time || '—'}
                                                </span>
                                            </div>
                                            <div className="relative flex-1 min-w-0 pb-4 last:pb-0 border-l border-stone/15 pl-4">
                                                <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-ember" />
                                                <p className="text-stone text-sm leading-relaxed">{row.activity}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            ) : (
                                <>
                                    {day.description ? (
                                        <p className="text-muted text-sm leading-relaxed">{day.description}</p>
                                    ) : null}
                                    {activities.length > 0 ? (
                                        <ul className="list-disc pl-5 space-y-1 text-sm text-stone">
                                            {activities.map((item, i) => (
                                                <li key={i}>{item}</li>
                                            ))}
                                        </ul>
                                    ) : null}
                                </>
                            )}
                            {meals.length > 0 && (
                                <p className="text-sm text-muted">
                                    <span className="font-semibold text-moss">Meals:</span> {meals.join(' · ')}
                                </p>
                            )}
                            {stay && (
                                <p className="text-sm text-muted">
                                    <span className="font-semibold text-moss">Stay:</span> {stay}
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const WaitlistInline = ({ adventure }) => {
    const { user } = useAuth();
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState('');
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            await waitlistAPI.join({
                email,
                phone,
                adventure_id: adventure._id || adventure.id,
            });
            setDone(true);
            toast.success("You're on the waitlist");
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not join waitlist');
        } finally {
            setBusy(false);
        }
    };

    if (done) {
        return (
            <p className="text-xs text-center text-moss bg-moss/10 py-2.5 px-3 rounded border border-moss/20">
                We'll email/WhatsApp you when dates or seats open.
            </p>
        );
    }

    return (
        <form onSubmit={submit} className="space-y-2 rounded border border-stone/10 bg-mist-subtle p-3">
            <p className="text-xs text-center text-muted font-medium">No upcoming departures — join the waitlist</p>
            <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-md border border-stone/15 bg-mist-subtle px-3 py-2 text-sm"
            />
            <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="WhatsApp (optional)"
                className="w-full rounded-md border border-stone/15 bg-mist-subtle px-3 py-2 text-sm"
            />
            <button type="submit" disabled={busy} className="btn btn-outline w-full !py-2 text-xs">
                {busy ? 'Joining…' : 'Join waitlist'}
            </button>
        </form>
    );
};

// ── Booking card (mobile: under About; desktop: sticky sidebar) ─────────────
const BookingCard = ({ adventure, whatsappNumber, onBook, canBook = true, animated = false, onSave, isSaved = false }) => {
    const nextDeparture = (() => {
        try {
            const raw = typeof adventure.available_dates === 'string'
                ? JSON.parse(adventure.available_dates || '[]')
                : (adventure.available_dates || []);
            if (!Array.isArray(raw) || raw.length === 0) return null;
            const pair = formatDatePair(raw[0], adventure);
            return {
                departure: pair?.departureLabel,
                event: pair?.eventLabel,
                extra: raw.length > 1 ? raw.length - 1 : 0,
            };
        } catch {
            return null;
        }
    })();

    const isTour = String(adventure.category || '').toLowerCase() === 'tour';
    const payHint = isTour
        ? 'Tours: pay a UPI advance now (options extra). Remaining balance is due before departure.'
        : 'Treks: pay the full trip amount via UPI. Booking is confirmed after we verify your transfer.';

    const card = (
        <div className="card border-ink/10 overflow-hidden">
            <div className="bg-panel text-cream p-6 sm:p-8 border-b border-ember/30">
                <p className="meta !text-cream/50 mb-2">Price per person</p>
                <p className="font-display text-3xl sm:text-4xl text-cream font-semibold">₹{adventure.price?.toLocaleString()}</p>
                {adventure.price_note && (
                    <p className="text-cream/70 text-sm mt-2">{adventure.price_note}</p>
                )}
            </div>

            <div className="p-5 sm:p-6 space-y-4">
                <dl className="space-y-3.5">
                    <div className="flex items-baseline justify-between text-sm">
                        <dt className="text-muted inline-flex items-center gap-1.5"><Clock size={14} /> Duration</dt>
                        <dd className="font-semibold text-stone">{adventure.duration}</dd>
                    </div>
                    <div className="flex items-baseline justify-between text-sm">
                        <dt className="text-muted inline-flex items-center gap-1.5"><Users size={14} /> Group size</dt>
                        <dd className="font-semibold text-stone">Up to {adventure.max_participants || 'Flexible'}</dd>
                    </div>
                    <div className="flex items-baseline justify-between text-sm">
                        <dt className="text-muted inline-flex items-center gap-1.5"><Shield size={14} /> Difficulty</dt>
                        <dd className="badge">{adventure.difficulty || 'Moderate'}</dd>
                    </div>
                    <div className="flex items-baseline justify-between text-sm">
                        <dt className="text-muted inline-flex items-center gap-1.5"><Activity size={14} /> Endurance</dt>
                        <dd className="font-semibold text-stone">{adventure.endurance_level || 'Medium'}</dd>
                    </div>
                </dl>

                {nextDeparture ? (
                    <div className="text-xs text-center text-moss bg-moss/10 py-2.5 px-3 rounded border border-moss/20 font-medium space-y-1">
                        <p>Departure: <strong>{nextDeparture.departure}</strong>{nextDeparture.extra > 0 ? ` (+${nextDeparture.extra} more)` : ''}</p>
                        {nextDeparture.event && (
                            <p>Event: <strong>{nextDeparture.event}</strong></p>
                        )}
                    </div>
                ) : (
                    <WaitlistInline adventure={adventure} />
                )}

                <button type="button" onClick={onBook} className="btn btn-primary w-full">
                    <CalendarCheck size={18} />
                    {canBook ? (isTour ? 'Book Now — Pay advance via UPI' : 'Book Now — Pay full via UPI') : 'Log in to book'}
                </button>
                <button type="button" onClick={() => openWhatsApp(adventure, whatsappNumber)} className="btn btn-outline w-full">
                    <MessageCircle size={18} /> Ask on WhatsApp
                </button>
                <button
                    type="button"
                    onClick={onSave}
                    aria-label={isSaved ? 'Remove from saved adventures' : 'Save adventure'}
                    aria-pressed={isSaved}
                    className={`btn w-full !py-2.5 text-sm font-semibold border-2 transition-colors ${
                        isSaved
                            ? 'border-ember bg-ember/10 text-ember-deep hover:bg-ember/15'
                            : 'border-stone/20 bg-mist-subtle text-stone hover:border-ember hover:text-ember-deep'
                    }`}
                >
                    <Heart size={16} className={isSaved ? 'fill-current' : ''} />
                    {isSaved ? 'Saved to wishlist' : 'Save adventure'}
                </button>
                <p className="text-center text-xs text-muted">
                    {canBook ? payHint : 'Browse freely — sign in when you are ready to reserve seats.'}
                </p>

                <div className="pt-5 border-t border-stone/10 space-y-3">
                    <p className="meta !text-muted">Your trip leader</p>
                    <div className="flex items-center gap-3">
                        <img
                            src="/logo-mark.png?v=6"
                            alt=""
                            width={40}
                            height={40}
                            className="block w-10 h-10 shrink-0"
                        />
                        <div className="min-w-0">
                            <p className="font-semibold text-stone text-sm">Phoenix Adventures</p>
                            <p className="text-xs text-muted">Est. 22 March 2023 · Sahyadris</p>
                        </div>
                    </div>
                    <a
                        href="tel:+919372506447"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-stone hover:text-ember-deep transition"
                    >
                        <Phone size={14} /> +91 93725 06447
                    </a>
                </div>
            </div>
        </div>
    );

    if (!animated) return card;
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            {card}
        </motion.div>
    );
};

// ── Main Page ────────────────────────────────────────────────────────────────
const AdventureDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { toggle, has } = useWishlist();
    const [adventure, setAdventure] = useState(null);
    const [loading, setLoading] = useState(true);
    const [whatsappNumber, setWhatsappNumber] = useState('919372506447');
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const [showBooking, setShowBooking] = useState(false);
    const [related, setRelated] = useState([]);
    const [selectedItineraryDate, setSelectedItineraryDate] = useState(null);

    const handleBook = () => {
        if (!isAuthenticated) {
            toast.error('Please log in to book');
            navigate('/login', { state: { from: `/adventure/${id}` } });
            return;
        }
        setShowBooking(true);
    };

    const handleSave = () => {
        if (!adventure) return;
        toggle(adventure);
    };

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setRelated([]);
        setAdventure(null);
        adventuresAPI
            .getById(id)
            .then((res) => {
                if (!alive) return;
                setAdventure(res.data.data);
            })
            .catch(() => {
                if (alive) navigate('/adventures');
            })
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, [id, navigate]);

    useEffect(() => {
        if (!adventure) return undefined;
        let alive = true;
        const currentId = String(adventure._id || id);
        adventuresAPI
            .getAll({ status: 'active', limit: 24 })
            .then((res) => {
                if (!alive) return;
                const list = Array.isArray(res.data?.data) ? res.data.data : [];
                const others = list.filter((a) => String(a._id || a.id) !== currentId);
                const cat = (adventure.category || '').toLowerCase();
                const same = others.filter((a) => (a.category || '').toLowerCase() === cat);
                const rest = others.filter((a) => (a.category || '').toLowerCase() !== cat);
                setRelated([...same, ...rest].slice(0, 3));
            })
            .catch(() => {
                if (alive) setRelated([]);
            });
        return () => {
            alive = false;
        };
    }, [adventure, id]);

    useEffect(() => {
        publicSettingsAPI.getAll().then((all) => {
            if (all.whatsapp) setWhatsappNumber(String(all.whatsapp).replace(/\D/g, '') || '919372506447');
        }).catch(() => {});
    }, []);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-mist">
            <Seo title="Adventure" description="Sahyadri treks and outdoor adventures with Phoenix Adventures." />
            <div className="w-12 h-12 border-4 border-ember border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!adventure) return null;

    const thingsToCarry = asStringList(adventure.things_to_carry);
    const packingList = thingsToCarry.length > 0 ? thingsToCarry : DEFAULT_PACKING;
    const pickupMumbai = asStringList(adventure.pickup_mumbai);
    const pickupPune = asStringList(adventure.pickup_pune);
    const dos = asStringList(adventure.dos);
    const donts = asStringList(adventure.donts);
    const guidelines = asStringList(adventure.trek_guidelines);
    const hasTrekMeta = adventure.base_village || adventure.elevation || adventure.region;
    const hasPickup = pickupMumbai.length > 0 || pickupPune.length > 0;
    const availableDates = parseAvailableDates(adventure);
    const parsedItinerary = parseItineraryList(adventure);
    const galleryImages = parseJsonList(adventure.images);
    const previewDepartureDate = selectedItineraryDate || availableDates[0] || null;
    const itineraryPackage = previewDepartureDate
        ? buildBookingItineraryPackage(adventure, previewDepartureDate)
        : { itinerary: mapItineraryWithDates(parsedItinerary, null), upcomingDates: [] };
    const itineraryWithDates = itineraryPackage.itinerary.length
        ? itineraryPackage.itinerary
        : mapItineraryWithDates(parsedItinerary, previewDepartureDate);
    const showItineraryDates = Boolean(previewDepartureDate && getEventDayOffset(adventure) >= 0);
    const previewDatePair = previewDepartureDate ? formatDatePair(previewDepartureDate, adventure) : null;

    const difficultyColor = {
        Easy: 'bg-moss/15 text-moss',
        Moderate: 'bg-ember/15 text-ember-deep',
        Challenging: 'bg-red-100 text-red-700',
    }[adventure.difficulty] || 'bg-mist-muted text-stone';

    const ogImage = absoluteAssetUrl(getImageUrl(adventure.image_url));
    const trekId = adventure._id || id;
    const isSaved = has(trekId);
    const hasGallery = galleryImages.length > 0;

    return (
        <div id="main-content" className="min-h-screen bg-mist">
            <Seo
                title={adventure.title}
                titleSuffix={false}
                description={adventureMetaDescription(adventure)}
                image={ogImage}
                jsonLd={adventureJsonLd(adventure, { id: trekId, image: ogImage })}
            />
            <Navbar />

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >

            {/* Hero Image — top padding clears fixed solid navbar */}
            <div className="relative h-[55vh] md:h-[70vh] overflow-hidden">
                <img
                    src={getImageUrl(adventure.image_url) || IMG_FALLBACK}
                    alt={adventure.title}
                    className="w-full h-full object-cover cursor-zoom-in"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    onClick={() => setLightboxIndex(0)}
                    onError={e => { e.target.src = IMG_FALLBACK; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/45" />

                {/* Back Button — below fixed nav (~4.5rem) */}
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-[4.75rem] md:top-[5.25rem] left-6 z-10 flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md text-white rounded-xl font-semibold hover:bg-white/30 transition-all text-sm"
                >
                    <ArrowLeft size={16} /> Back
                </button>

                {/* Save + share on hero */}
                <div className="absolute top-[4.75rem] md:top-[5.25rem] right-6 z-20 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleSave}
                        aria-label={isSaved ? 'Remove from saved adventures' : 'Save adventure'}
                        aria-pressed={isSaved}
                        className={`hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm backdrop-blur-md transition-all shadow-lg ${
                            isSaved
                                ? 'bg-ember text-cream border-2 border-ember'
                                : 'bg-white/95 text-stone border-2 border-white hover:bg-white hover:text-ember-deep'
                        }`}
                    >
                        <Heart size={16} className={isSaved ? 'fill-current' : ''} />
                        {isSaved ? 'Saved' : 'Save adventure'}
                    </button>
                    <WishlistButton
                        adventure={adventure}
                        size="lg"
                        className="sm:hidden !bg-white/95 !border-white !text-stone shadow-lg"
                    />
                </div>

                {/* Hero Content — kept below nav so title never sits under the bar */}
                <div className="absolute inset-x-0 bottom-0 top-24 md:top-28 flex flex-col justify-end p-4 sm:p-6 md:p-10 pointer-events-none">
                    <div className="max-w-5xl mx-auto w-full pointer-events-auto">
                        <div className="flex flex-wrap gap-2 mb-3">
                            <span className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider ${difficultyColor}`}>
                                {adventure.difficulty}
                            </span>
                            <span className="px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-green-100 text-green-700">
                                {adventure.status}
                            </span>
                        </div>
                        <h1 className="font-display text-2xl sm:text-3xl md:text-5xl font-semibold text-cream mb-2 sm:mb-3 leading-tight tracking-tight">{adventure.title}</h1>
                        <div className="flex flex-wrap gap-3 sm:gap-4 text-cream/80 sm:text-cream/90 text-xs sm:text-sm">
                            <span className="flex items-center gap-1.5"><MapPin size={13} className="text-ember shrink-0" />{adventure.location}</span>
                            <span className="flex items-center gap-1.5"><Clock size={13} className="text-ember shrink-0" />{adventure.duration}</span>
                            {adventure.region && (
                                <span className="flex items-center gap-1.5"><Mountain size={13} className="text-ember shrink-0" />{adventure.region}</span>
                            )}
                            {adventure.elevation && (
                                <span className="flex items-center gap-1.5"><Mountain size={13} className="text-ember shrink-0" />{adventure.elevation}</span>
                            )}
                            {adventure.rating && <span className="flex items-center gap-1.5"><Star size={13} className="text-ember fill-current" />{adventure.rating}</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">

                {/* LEFT: Details */}
                <div className="lg:col-span-2 space-y-10">

                    <Reveal variant="rise" as="section">
                        <h2 className="font-display text-2xl font-semibold text-stone mb-4">About this adventure</h2>
                        <p className="text-muted leading-relaxed text-base">{adventure.description}</p>
                    </Reveal>

                    {hasTrekMeta && (
                        <Reveal variant="fade" as="section">
                            <h2 className="font-display text-2xl font-semibold text-stone mb-4">Trek details</h2>
                            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {adventure.base_village && (
                                    <div className="rounded-lg border border-stone/10 bg-mist-subtle p-4">
                                        <dt className="text-xs uppercase tracking-wide text-muted mb-1">Base village</dt>
                                        <dd className="font-semibold text-stone text-sm">{adventure.base_village}</dd>
                                    </div>
                                )}
                                {adventure.elevation && (
                                    <div className="rounded-lg border border-stone/10 bg-mist-subtle p-4">
                                        <dt className="text-xs uppercase tracking-wide text-muted mb-1">Elevation</dt>
                                        <dd className="font-semibold text-stone text-sm">{adventure.elevation}</dd>
                                    </div>
                                )}
                                {adventure.region && (
                                    <div className="rounded-lg border border-stone/10 bg-mist-subtle p-4">
                                        <dt className="text-xs uppercase tracking-wide text-muted mb-1">Region</dt>
                                        <dd className="font-semibold text-stone text-sm">{adventure.region}</dd>
                                    </div>
                                )}
                            </dl>
                        </Reveal>
                    )}

                    {/* Mobile: Book Now sits directly under About */}
                    <div className="lg:hidden">
                        <BookingCard
                            adventure={adventure}
                            whatsappNumber={whatsappNumber}
                            onBook={handleBook}
                            canBook={isAuthenticated}
                            onSave={handleSave}
                            isSaved={isSaved}
                        />
                    </div>

                    {parsedItinerary.length > 0 && (
                        <Reveal variant="slideLeft" as="section">
                            <h2 className="font-display text-2xl font-semibold text-stone mb-4">Day-by-day itinerary</h2>
                            {availableDates.length > 1 && (
                                <div className="mb-4">
                                    <label className="text-sm font-semibold text-stone block mb-2">Preview dates for departure</label>
                                    <select
                                        className="input w-full max-w-md"
                                        value={previewDepartureDate || ''}
                                        onChange={(e) => setSelectedItineraryDate(e.target.value)}
                                    >
                                        {availableDates.map((d) => {
                                            const pair = formatDatePair(d, adventure);
                                            const label = pair?.eventLabel
                                                ? `${formatDateIN(d, { weekday: true, year: true })} · Event ${pair.eventLabel}`
                                                : formatDateIN(d, { weekday: true, year: true });
                                            return <option key={d} value={d}>{label}</option>;
                                        })}
                                    </select>
                                </div>
                            )}
                            {showItineraryDates && previewDepartureDate && (
                                <div className="text-sm text-stone mb-4 bg-moss/10 border border-moss/20 rounded-lg px-4 py-3">
                                    <p className="font-semibold text-moss mb-2">Dates you are viewing</p>
                                    <p className="mb-1">
                                        <span className="text-muted text-xs uppercase tracking-wide block">Departure date</span>
                                        <strong>{previewDatePair?.departureLabel || formatDateIN(previewDepartureDate, { weekday: true, year: true })}</strong>
                                    </p>
                                    {previewDatePair?.eventLabel && (
                                        <p>
                                            <span className="text-muted text-xs uppercase tracking-wide block">Event date</span>
                                            <strong>{previewDatePair.eventLabel}</strong>
                                        </p>
                                    )}
                                    <p className="text-muted text-xs mt-2">When you book, your confirmation and itinerary will use only the date you select — not other departures.</p>
                                </div>
                            )}
                            <div className="space-y-3">
                                {itineraryWithDates.map((day, index) => (
                                    <ItineraryItem
                                        key={`${day.day}-${index}`}
                                        day={day}
                                        defaultOpen={index === 0}
                                        calendarLabel={showItineraryDates ? day.calendar_label : null}
                                    />
                                ))}
                            </div>
                            {itineraryPackage.upcomingDates?.length > 0 && (
                                <div className="mt-6 rounded-lg border border-stone/10 bg-mist-subtle p-4">
                                    <h3 className="font-display text-lg font-semibold text-stone mb-2">This trip runs again on</h3>
                                    <ul className="space-y-2 text-sm text-muted">
                                        {itineraryPackage.upcomingDates.map((row) => (
                                            <li key={row.date} className="flex items-start gap-2">
                                                <CalendarCheck size={14} className="text-ember mt-0.5 shrink-0" />
                                                <span>{row.summary || row.departureLabel}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </Reveal>
                    )}

                    {/* Weather widget — for outdoor adventures */}
                    <section className="flex items-center gap-2">
                        <WeatherWidget
                            preset={(adventure.title || '').toLowerCase().includes('hampta') ? 'hampta' : (adventure.title || '').toLowerCase().includes('rajmachi') ? 'rajmachi' : (adventure.title || '').toLowerCase().includes('sandhan') ? 'sandhanavalley' : 'kalsubai'}
                            locationName={adventure.location}
                        />
                    </section>

                    {hasPickup && (
                        <Reveal variant="slideLeft" as="section">
                            <h2 className="font-display text-2xl font-semibold text-stone mb-4 flex items-center gap-2">
                                <Bus size={22} className="text-ember" /> Pickup points
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {pickupMumbai.length > 0 && (
                                    <div>
                                        <h3 className="font-bold text-stone mb-3">Mumbai</h3>
                                        <ul className="space-y-2">
                                            {pickupMumbai.map((point, i) => (
                                                <li key={i} className="text-sm text-muted flex items-start gap-2">
                                                    <MapPin size={14} className="text-ember mt-0.5 shrink-0" />
                                                    {point}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {pickupPune.length > 0 && (
                                    <div>
                                        <h3 className="font-bold text-stone mb-3">Pune</h3>
                                        <ul className="space-y-2">
                                            {pickupPune.map((point, i) => (
                                                <li key={i} className="text-sm text-muted flex items-start gap-2">
                                                    <MapPin size={14} className="text-ember mt-0.5 shrink-0" />
                                                    {point}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </Reveal>
                    )}

                    {/* Included / Excluded */}
                    {(adventure.included?.length > 0 || adventure.excluded?.length > 0) && (
                        <Reveal variant="fade" as="section">
                            <h2 className="font-display text-2xl font-semibold text-stone mb-4">What's included</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {adventure.included?.length > 0 && (
                                    <div>
                                        <h3 className="font-bold text-moss mb-3 flex items-center gap-2">
                                            <CheckCircle size={16} /> Included
                                        </h3>
                                        <ul className="space-y-2">
                                            {adventure.included.map((item, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-muted">
                                                    <CheckCircle size={14} className="text-moss mt-0.5 shrink-0" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {adventure.excluded?.length > 0 && (
                                    <div>
                                        <h3 className="font-bold text-red-600 mb-3 flex items-center gap-2">
                                            <XCircle size={16} /> Not Included
                                        </h3>
                                        <ul className="space-y-2">
                                            {adventure.excluded.map((item, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-muted">
                                                    <XCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </Reveal>
                    )}

                    <Reveal variant="slideRight" as="section">
                        <h2 className="font-display text-2xl md:text-3xl text-stone font-semibold mb-5 flex items-center gap-2">
                            <Backpack size={22} className="text-ember" /> Things to carry
                        </h2>
                        <p className="text-muted text-sm mb-6 max-w-xl">
                            {thingsToCarry.length > 0
                                ? 'Bring everything on this list for a safe and comfortable trek.'
                                : 'Everything here fits in a 30L daypack. Rentals available on request — mention it when you book.'}
                        </p>
                        <BrochureList items={packingList} />
                    </Reveal>

                    {(dos.length > 0 || donts.length > 0) && (
                        <Reveal variant="fade" as="section">
                            <h2 className="font-display text-2xl font-semibold text-stone mb-4">Do&apos;s &amp; Don&apos;ts</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {dos.length > 0 && (
                                    <div>
                                        <h3 className="font-bold text-moss mb-3 flex items-center gap-2">
                                            <CheckCircle size={16} /> Do&apos;s
                                        </h3>
                                        <BrochureList items={dos} />
                                    </div>
                                )}
                                {donts.length > 0 && (
                                    <div>
                                        <h3 className="font-bold text-red-600 mb-3 flex items-center gap-2">
                                            <XCircle size={16} /> Don&apos;ts
                                        </h3>
                                        <BrochureList items={donts} variant="dont" />
                                    </div>
                                )}
                            </div>
                        </Reveal>
                    )}

                    {guidelines.length > 0 && (
                        <Reveal variant="rise" as="section">
                            <h2 className="font-display text-2xl font-semibold text-stone mb-4">Trek guidelines</h2>
                            <BrochureList items={guidelines} />
                        </Reveal>
                    )}

                    {(hasGallery || related.length > 0) && (
                        <Reveal variant="clip" as="section">
                            <h2 className="font-display text-2xl font-semibold text-stone mb-4">Experience gallery</h2>
                            {hasGallery ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-10">
                                    {galleryImages.map((imgUrl, idx) => (
                                        <div
                                            key={idx}
                                            className="relative aspect-square overflow-hidden rounded-lg group border border-stone/10 cursor-zoom-in"
                                            onClick={() => setLightboxIndex((adventure.image_url ? 1 : 0) + idx)}
                                        >
                                            <img
                                                src={getImageUrl(imgUrl)}
                                                alt={`${adventure.title} - Gallery ${idx + 1}`}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                onError={(e) => { e.currentTarget.style.opacity = '0.35'; }}
                                            />
                                            <div className="absolute inset-0 bg-panel/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted mb-8">
                                    Trail photos from past departures — ask us on WhatsApp for the full album from your trek.
                                </p>
                            )}

                            {related.length > 0 && (
                                <div className="pt-2 border-t border-stone/10">
                                    <h3 className="font-display text-xl font-semibold text-stone mb-4">Related treks</h3>
                                    <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                                        {related.map((a, i) => (
                                            <AdventureCard key={a._id || a.id || i} adventure={a} index={i} />
                                        ))}
                                    </StaggerContainer>
                                </div>
                            )}
                        </Reveal>
                    )}

                    <section id="reviews" className="scroll-mt-24">
                        <Reviews adventureId={adventure._id || id} />
                    </section>

                    <section className="rounded-lg border border-stone/10 bg-mist-subtle p-5">
                        <span className="text-sm font-semibold text-stone block mb-3">Share this adventure</span>
                        <ShareButtons
                            theme="light"
                            url={`/adventure/${adventure._id || id}`}
                            title={adventure.title}
                            description={`Join us on ${adventure.title} — ${adventure.location || ''}`}
                        />
                    </section>

                    <Reveal variant="scale" as="section">
                        <div className="border-l-2 border-ember bg-mist-subtle p-6 flex items-start gap-4">
                            <IconMotion className="text-ember mt-1 shrink-0">
                              <Shield size={22} />
                            </IconMotion>
                            <div>
                                <h3 className="font-display text-lg text-stone font-semibold mb-1.5">Safety note</h3>
                                <p className="text-muted text-sm leading-relaxed">
                                    Trekking and technical activities (like rappelling) involve sections that require teamwork and discipline. These are mandatory for your group's safety. Please follow the trek leader's instructions at all times — they're qualified, certified, and have run this exact route before.
                                </p>
                            </div>
                        </div>
                    </Reveal>

                </div>

                {/* RIGHT: Sticky Booking Card (desktop) */}
                <div className="hidden lg:block">
                    <div className="sticky top-24">
                        <BookingCard
                            adventure={adventure}
                            whatsappNumber={whatsappNumber}
                            onBook={handleBook}
                            canBook={isAuthenticated}
                            onSave={handleSave}
                            isSaved={isSaved}
                            animated
                        />
                    </div>
                </div>
            </div>
            </motion.div>
        <Footer />

            {/* Lightbox */}
            {lightboxIndex !== null && (() => {
                const all = [getImageUrl(adventure.image_url), ...galleryImages.map(getImageUrl)].filter(Boolean);
                return (
                    <Lightbox
                        images={all}
                        index={lightboxIndex}
                        onClose={() => setLightboxIndex(null)}
                        onPrev={() => setLightboxIndex((i) => (i - 1 + all.length) % all.length)}
                        onNext={() => setLightboxIndex((i) => (i + 1) % all.length)}
                    />
                );
            })()}

            {showBooking && (
                <BookingModal adventure={adventure} onClose={() => setShowBooking(false)} />
            )}
        </div>
    );
};

export default AdventureDetail;
