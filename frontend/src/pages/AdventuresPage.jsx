import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Star, MapPin, Clock } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHero from '../components/ui/PageHero';
import Seo from '../components/Seo';
import WishlistButton from '../components/ui/WishlistButton';
import ShareAdventureButton from '../components/ui/ShareAdventureButton';
import { Reveal, StaggerContainer, StaggerItem, IconMotion } from '../components/ui/Motion';
import { adventuresAPI, getImageUrl } from '../utils/api';
import { DEPARTURE_CITIES, filterByDepartureCity } from '../utils/adventureFields';

const FILTERS = [
  { id: 'all', label: 'All trips' },
  { id: 'easy', label: 'Easy' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'challenging', label: 'Challenging' },
];

const AdventuresPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [adventures, setAdventures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [city, setCity] = useState(searchParams.get('city') || 'all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let alive = true;
    const fetchAdventures = async () => {
      try {
        const response = await adventuresAPI.getAll({ status: 'active' });
        if (alive) setAdventures(response.data.data || []);
      } catch (error) {
        if (alive) console.error('Error fetching adventures:', error);
      } finally {
        if (alive) setLoading(false);
      }
    };
    fetchAdventures();
    return () => { alive = false; };
  }, []);

  const filteredAdventures = useMemo(() => {
    const byCity = filterByDepartureCity(adventures, city);
    return byCity.filter((adv) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q ||
        (adv.title || '').toLowerCase().includes(q) ||
        (adv.location || '').toLowerCase().includes(q);
      const matchesFilter = filter === 'all' || adv.difficulty?.toLowerCase() === filter.toLowerCase();
      return matchesSearch && matchesFilter;
    });
  }, [adventures, searchTerm, filter, city]);

  const onCityChange = (c) => {
    setCity(c);
    const next = new URLSearchParams(searchParams);
    if (c === 'all') next.delete('city');
    else next.set('city', c);
    setSearchParams(next, { replace: true });
  };

  // Group by category for an editorial index
  const grouped = useMemo(() => {
    const map = new Map();
    for (const adv of filteredAdventures) {
      const key = adv.category || 'general';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(adv);
    }
    return Array.from(map.entries());
  }, [filteredAdventures]);

  if (loading) {
    return (
      <div className="min-h-screen bg-mist">
        <Navbar />
        <div className="pt-40 pb-24 flex justify-center items-center">
          <div className="w-10 h-10 border-2 border-ember border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mist">
      <Seo
        title="All Adventures"
        description={`Browse ${adventures.length} curated treks, camping trips, and expeditions across the Sahyadris and Himalayas.`}
      />
      <Navbar />

      <PageHero
        eyebrow="All departures"
        title="Every trek, every camp, one team."
        subtitle={`${adventures.length} curated routes — personally scouted, honestly graded, and led by guides we know by name. Filter by difficulty or search by destination.`}
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'All Adventures' }]}
      />

      {/* Search + filter bar */}
      <div className="sticky top-16 md:top-20 z-30 bg-mist/95 backdrop-blur border-b border-stone/10">
        <div className="container py-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search treks or destinations…"
                aria-label="Search adventures"
                className="input !pl-10 !py-2.5 !text-sm !border-transparent focus:!border-stone focus:!bg-mist"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar" role="tablist" aria-label="Filter by difficulty">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  role="tab"
                  aria-selected={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition whitespace-nowrap ${
                    filter === f.id
                      ? 'bg-panel text-cream'
                      : 'text-stone hover:bg-mist-muted border border-stone/10'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar" role="tablist" aria-label="Filter by departure city">
              {DEPARTURE_CITIES.map((c) => (
                <button
                  key={c.id}
                  role="tab"
                  aria-selected={city === c.id}
                  onClick={() => onCityChange(c.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition whitespace-nowrap ${
                    city === c.id
                      ? 'bg-panel text-cream'
                      : 'text-stone hover:bg-mist-muted border border-stone/10'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <p className="text-xs text-muted md:ml-auto">
              {filteredAdventures.length} {filteredAdventures.length === 1 ? 'trip' : 'trips'}
              {filter !== 'all' && ` · ${FILTERS.find((f) => f.id === filter)?.label}`}
              {city !== 'all' && ` · ${DEPARTURE_CITIES.find((c) => c.id === city)?.label}`}
              {searchTerm && ` · matching "${searchTerm}"`}
            </p>
          </div>
        </div>
      </div>

      <main id="main-content" className="container section-tight">
        {filteredAdventures.length === 0 ? (
          <Reveal variant="scale" className="text-center py-24 max-w-md mx-auto">
            <p className="font-display text-2xl text-stone mb-3">Nothing matches those filters</p>
            <p className="text-muted text-sm mb-6">
              Try a different difficulty or clear the search to see everything we run.
            </p>
            <button
              onClick={() => { setFilter('all'); setCity('all'); setSearchTerm(''); }}
              className="btn btn-primary"
            >
              Clear filters
            </button>
          </Reveal>
        ) : (
          grouped.map(([category, items]) => (
            <section key={category} className="mb-16">
              {grouped.length > 1 && (
                <Reveal variant="slideLeft">
                  <header className="flex items-baseline justify-between border-b border-stone/15 pb-3 mb-8">
                    <h2 className="font-display text-2xl md:text-3xl text-stone capitalize font-semibold">
                      {category === 'general' ? 'Featured departures' : category}
                    </h2>
                    <span className="meta">{items.length} {items.length === 1 ? 'trip' : 'trips'}</span>
                  </header>
                </Reveal>
              )}

              <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12" as="ol">
                {items.map((adv) => {
                  const advId = adv._id || adv.id;
                  const dates = (() => {
                    const raw = typeof adv.available_dates === 'string'
                      ? JSON.parse(adv.available_dates || '[]')
                      : (adv.available_dates || []);
                    return Array.isArray(raw) ? raw : [];
                  })();
                  const nextDate = dates[0] ? (() => {
                    const [y, m, d] = dates[0].split('-').map(Number);
                    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
                  })() : null;

                  return (
                    <StaggerItem key={advId} as="li">
                      <Link to={`/adventure/${advId}`} className="group block">
                        <div className="relative mb-5 aspect-[4/3] overflow-hidden rounded-lg">
                          <img
                            src={getImageUrl(adv.image_url) || '/placeholder.jpg'}
                            alt={`${adv.title} — ${adv.location}`}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            onError={(e) => { e.currentTarget.src = '/placeholder.jpg'; }}
                          />
                          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-panel/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute top-3 left-3 bg-panel/90 text-cream text-[10px] font-bold px-2.5 py-1.5 uppercase tracking-wider rounded-md">
                            {adv.difficulty || 'Moderate'}
                          </div>
                          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                            <ShareAdventureButton adventure={adv} />
                            <WishlistButton
                              adventure={adv}
                              size="sm"
                              className="!bg-mist/95 !border-stone/15 !text-stone hover:!border-ember hover:!text-ember"
                            />
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          <h3 className="font-display text-xl md:text-2xl leading-snug text-stone group-hover:text-ember transition-colors font-semibold">
                            {adv.title}
                          </h3>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                            <span className="inline-flex items-center gap-1.5">
                              <IconMotion hoverRotate={-6}><MapPin size={13} className="text-ember" /></IconMotion> {adv.location}
                            </span>
                            <span aria-hidden="true" className="text-stone/30">·</span>
                            <span className="inline-flex items-center gap-1.5">
                              <Clock size={13} className="text-ember" /> {adv.duration}
                            </span>
                          </div>

                          {adv.rating > 0 && (
                            <p className="flex items-center gap-1.5 text-sm">
                              <Star size={13} className="text-ember fill-current" />
                              <span className="font-semibold text-stone">{adv.rating}</span>
                              {adv.reviews_count > 0 && (
                                <span className="text-muted">· {adv.reviews_count} review{adv.reviews_count !== 1 ? 's' : ''}</span>
                              )}
                            </p>
                          )}

                          {nextDate && (
                            <p className="text-xs font-medium text-moss">
                              Next departure: {nextDate}
                              {dates.length > 1 && <span className="text-muted"> (+{dates.length - 1} more)</span>}
                            </p>
                          )}

                          <div className="flex items-baseline justify-between pt-3 border-t border-stone/10">
                            <div>
                              <span className="meta block">From</span>
                              <span className="font-display text-2xl text-stone font-semibold">₹{(adv.price || 0).toLocaleString('en-IN')}</span>
                            </div>
                            <span className="text-sm font-semibold text-ember inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                              Details <span aria-hidden="true">→</span>
                            </span>
                          </div>
                        </div>
                      </Link>
                    </StaggerItem>
                  );
                })}
              </StaggerContainer>
            </section>
          ))
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AdventuresPage;
