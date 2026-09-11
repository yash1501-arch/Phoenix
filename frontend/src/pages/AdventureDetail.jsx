import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';


import {
    MapPin, Clock, Users, Star, Shield, CheckCircle, XCircle,
    ChevronDown, ChevronUp, ArrowLeft,
    Activity, Phone, MessageCircle, CalendarCheck, Mountain, Bus, Backpack
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
import { Reveal, IconMotion } from '../components/ui/Motion';
import { IMG_FALLBACK } from '../data/indiaImages';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';

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
const ItineraryItem = ({ day }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-stone/10 rounded-lg overflow-hidden bg-mist-subtle">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-mist transition-colors"
            >
                <div className="flex items-center gap-4">
                    <span className="w-10 h-10 rounded-md bg-panel text-ember font-bold text-sm flex items-center justify-center shrink-0">
                        D{day.day}
                    </span>
                    <span className="font-semibold text-stone">{day.title}</span>
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
                        <p className="px-5 pb-5 text-muted text-sm leading-relaxed border-t border-stone/10 pt-4">
                            {day.description}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const WaitlistInline = ({ adventure }) => {
    const { user } = useAuth();
    const { t } = useLanguage();
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
                {t.booking.waitlistDone}
            </p>
        );
    }

    return (
        <form onSubmit={submit} className="space-y-2 rounded border border-stone/10 bg-mist-subtle p-3">
            <p className="text-xs text-center text-muted font-medium">{t.booking.waitlistHint}</p>
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
                {busy ? t.booking.joining : t.booking.waitlist}
            </button>
        </form>
    );
};

// ── Booking card (mobile: under About; desktop: sticky sidebar) ─────────────
const BookingCard = ({ adventure, whatsappNumber, onBook, canBook = true, animated = false }) => {
    const { t } = useLanguage();
    const nextDeparture = (() => {
        try {
            const raw = typeof adventure.available_dates === 'string'
                ? JSON.parse(adventure.available_dates || '[]')
                : (adventure.available_dates || []);
            if (!Array.isArray(raw) || raw.length === 0) return null;
            const [y, m, d] = raw[0].split('-').map(Number);
            const dt = new Date(Date.UTC(y, m - 1, d));
            return {
                formatted: dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }),
                extra: raw.length > 1 ? raw.length - 1 : 0,
            };
        } catch {
            return null;
        }
    })();

    const isTour = String(adventure.category || '').toLowerCase() === 'tour';
    const payHint = isTour ? t.booking.payHintTour : t.booking.payHintTrek;

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
                    <p className="text-xs text-center text-moss bg-moss/10 py-2.5 px-3 rounded border border-moss/20 font-medium">
                        Next departure: <strong>{nextDeparture.formatted}</strong>
                        {nextDeparture.extra > 0 ? ` (+${nextDeparture.extra} more)` : ''}
                    </p>
                ) : (
                    <WaitlistInline adventure={adventure} />
                )}

                <button type="button" onClick={onBook} className="btn btn-primary w-full">
                    <CalendarCheck size={18} />
                    {canBook ? (isTour ? t.booking.bookTour : t.booking.bookTrek) : t.booking.loginToBook}
                </button>
                <button type="button" onClick={() => openWhatsApp(adventure, whatsappNumber)} className="btn btn-outline w-full">
                    <MessageCircle size={18} /> Ask on WhatsApp
                </button>
                <p className="text-center text-xs text-muted">
                    {canBook ? payHint : t.booking.browseHint}
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
    const [adventure, setAdventure] = useState(null);
    const [loading, setLoading] = useState(true);
    const [whatsappNumber, setWhatsappNumber] = useState('919372506447');
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const [showBooking, setShowBooking] = useState(false);

    const handleBook = () => {
        if (!isAuthenticated) {
            toast.error('Please log in to book');
            navigate('/login', { state: { from: `/adventure/${id}` } });
            return;
        }
        setShowBooking(true);
    };

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await adventuresAPI.getById(id);
                setAdventure(res.data.data);
            } catch {
                navigate('/adventures');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [id]);

    useEffect(() => {
        publicSettingsAPI.getAll().then((all) => {
            if (all.whatsapp) setWhatsappNumber(String(all.whatsapp).replace(/\D/g, '') || '919372506447');
        }).catch(() => {});
    }, []);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-mist">
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

    const difficultyColor = {
        Easy: 'bg-moss/15 text-moss',
        Moderate: 'bg-ember/15 text-ember-deep',
        Challenging: 'bg-red-100 text-red-700',
    }[adventure.difficulty] || 'bg-mist-muted text-stone';

    return (
        <div id="main-content" className="min-h-screen bg-mist">
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

                {/* Wishlist heart */}
                <div className="absolute top-[4.75rem] md:top-[5.25rem] right-6 z-10">
                    <WishlistButton adventure={adventure} size="lg" />
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
                        />
                    </div>

                    {adventure.itinerary && adventure.itinerary.length > 0 && (
                        <Reveal variant="slideLeft" as="section">
                            <h2 className="font-display text-2xl font-semibold text-stone mb-4">Day-by-day itinerary</h2>
                            <div className="space-y-3">
                                {adventure.itinerary.map(day => <ItineraryItem key={day.day} day={day} />)}
                            </div>
                        </Reveal>
                    )}

                    {/* Weather widget — for outdoor adventures */}
                    <section className="flex items-center gap-2">
                        <WeatherWidget
                            preset={(adventure.title || '').toLowerCase().includes('hampta') ? 'hampta' : (adventure.title || '').toLowerCase().includes('rajmachi') ? 'rajmachi' : (adventure.title || '').toLowerCase().includes('sandhan') ? 'sandhanavalley' : 'kalsubai'}
                            locationName={adventure.location}
                        />
                    </section>

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

                    <Reveal variant="slideRight" as="section">
                        <h2 className="font-display text-2xl md:text-3xl text-stone font-semibold mb-5 flex items-center gap-2">
                            <Backpack size={22} className="text-ember" /> What to pack
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

                    <section id="reviews" className="scroll-mt-24">
                        <Reviews adventureId={adventure._id || id} />
                    </section>

                    <section className="flex items-center gap-2">
                        <span className="text-sm text-muted">Share this adventure:</span>
                        <ShareButtons url={`/adventure/${adventure._id || id}`} title={adventure.title} description={`Join us on ${adventure.title} — ${adventure.location || ''}`} />
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

                    {adventure.images && (typeof adventure.images === 'string' ? JSON.parse(adventure.images) : adventure.images).length > 0 && (
                        <Reveal variant="clip" as="section">
                            <h2 className="font-display text-2xl font-semibold text-stone mb-4">Experience gallery</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                                {(typeof adventure.images === 'string' ? JSON.parse(adventure.images) : adventure.images).map((imgUrl, idx) => (
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
                        </Reveal>
                    )}
                </div>

                {/* RIGHT: Sticky Booking Card (desktop) */}
                <div className="hidden lg:block">
                    <div className="sticky top-24">
                        <BookingCard
                            adventure={adventure}
                            whatsappNumber={whatsappNumber}
                            onBook={handleBook}
                            canBook={isAuthenticated}
                            animated
                        />
                    </div>
                </div>
            </div>
            </motion.div>
        <Footer />

            {/* Lightbox */}
            {lightboxIndex !== null && (() => {
                const gallery = (typeof adventure.images === 'string' ? JSON.parse(adventure.images || '[]') : (adventure.images || []));
                const all = [getImageUrl(adventure.image_url), ...gallery.map(getImageUrl)].filter(Boolean);
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
