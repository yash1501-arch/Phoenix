import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, Clock, Filter, Frown } from 'lucide-react';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import PageHero from '../components/ui/PageHero';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import { getImageUrl } from '../utils/api';
import { DEPARTURE_CITIES, filterByDepartureCity } from '../utils/adventureFields';

const SearchResults = () => {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const difficulty = params.get('difficulty') || 'all';
  const category = params.get('category') || 'all';
  const city = params.get('city') || 'all';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const p = { status: 'active', limit: 50 };
    if (q) p.search = q;
    if (difficulty !== 'all') p.difficulty = difficulty;
    if (category !== 'all') p.category = category;
    api.get('/adventures', { params: p })
      .then((res) => {
        if (!alive) return;
        const list = Array.isArray(res.data?.data) ? res.data.data
          : Array.isArray(res.data) ? res.data : [];
        let filtered = q
          ? list.filter((a) => {
            const hay = `${a.title || ''} ${a.location || ''} ${a.description || ''}`.toLowerCase();
            return hay.includes(q.toLowerCase());
          })
          : list;
        if (category !== 'all') {
          filtered = filtered.filter((a) => String(a.category || '').toLowerCase() === category);
        }
        filtered = filterByDepartureCity(filtered, city);
        setItems(filtered);
      })
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [q, difficulty, category, city]);

  const setParam = (key, value, allToken = 'all') => {
    const next = new URLSearchParams(params);
    if (value === allToken) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const setDiff = (d) => setParam('difficulty', d);

  return (
    <div className="min-h-screen bg-mist">
      <Seo
        title={q ? `Search "${q}"` : 'Search'}
        description="Find your next Indian adventure."
      />
      <Navbar />
      <PageHero
        eyebrow="Discover"
        title={q ? `Results for "${q}"` : 'Search Adventures'}
        subtitle="Trekking, camping, expeditions — all across India."
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Search' }]}
      />
      <section className="bg-mist-subtle py-12 md:py-16">
        <div className="container">
          <Reveal variant="fade" className="mb-8 flex flex-wrap items-center gap-3">
            <Filter size={18} className="text-muted" />
            {['all', 'easy', 'moderate', 'challenging'].map((d) => (
              <button
                key={d}
                onClick={() => setDiff(d)}
                className={`rounded-md border px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
                  difficulty === d
                    ? 'border-stone bg-panel text-cream'
                    : 'border-stone/15 text-muted hover:border-ember hover:text-ember'
                }`}
              >
                {d}
              </button>
            ))}
            {['all', 'trek', 'tour', 'camping'].map((c) => (
              <button
                key={`cat-${c}`}
                onClick={() => setParam('category', c)}
                className={`rounded-md border px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
                  category === c
                    ? 'border-stone bg-panel text-cream'
                    : 'border-stone/15 text-muted hover:border-ember hover:text-ember'
                }`}
              >
                {c === 'all' ? 'all types' : c}
              </button>
            ))}
            {DEPARTURE_CITIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setParam('city', c.id)}
                className={`rounded-md border px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
                  city === c.id
                    ? 'border-stone bg-panel text-cream'
                    : 'border-stone/15 text-muted hover:border-ember hover:text-ember'
                }`}
              >
                {c.label}
              </button>
            ))}
          </Reveal>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <Reveal variant="scale">
              <EmptyState
                icon={Frown}
                title={q ? `No matches for "${q}"` : 'No adventures found'}
                description="Try a different keyword, difficulty, or browse all adventures."
                action={
                  <Link to="/adventures" className="btn btn-primary">
                    All Adventures
                  </Link>
                }
              />
            </Reveal>
          ) : (
            <StaggerContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((a, i) => {
                const id = a.id || a._id || i;
                return (
                  <StaggerItem key={id} as="article" className="group flex flex-col overflow-hidden rounded-lg border border-stone/8 bg-mist-subtle shadow-smoke transition-shadow hover:shadow-card h-full">
                    <Link to={`/adventure/${id}`} className="flex flex-col flex-1">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img
                          src={getImageUrl(a.image_url) || '/placeholder.jpg'}
                          alt={a.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          onError={(e) => (e.currentTarget.src = '/placeholder.jpg')}
                        />
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <div className="mb-2 flex items-center justify-between text-xs text-muted">
                          <span className="inline-flex items-center gap-1"><MapPin size={12} className="text-ember" /> {a.location || 'India'}</span>
                          <span className="inline-flex items-center gap-1"><Clock size={12} className="text-ember" /> {a.duration || '—'}</span>
                        </div>
                        <h3 className="font-display line-clamp-2 text-base font-semibold text-stone group-hover:text-ember transition-colors">{a.title}</h3>
                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-stone/8">
                          <span className="font-display text-lg font-semibold text-stone">₹{Number(a.price || 0).toLocaleString('en-IN')}</span>
                          <span className="text-xs font-bold text-ember">View</span>
                        </div>
                      </div>
                    </Link>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          )}
        </div>
      </section>
            <Footer />
    </div>
  );
};

export default SearchResults;
