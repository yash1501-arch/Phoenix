import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, Mountain } from 'lucide-react';
import toast from 'react-hot-toast';
import { adventuresAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import PageHero from '../components/ui/PageHero';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import AdventureCard from '../components/ui/AdventureCard';
import { Reveal, StaggerContainer, IconMotion } from '../components/ui/Motion';

const DIFFICULTIES = ['all', 'easy', 'moderate', 'challenging'];

const Treks = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = searchParams.get('difficulty') || 'all';
  const [difficulty, setDifficulty] = useState(initial);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    adventuresAPI
      .getAll({
        category: 'trek',
        difficulty: difficulty === 'all' ? undefined : difficulty,
        limit: 24,
      })
      .then((res) => {
        if (!alive) return;
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setItems(list.filter((a) => (a.category || '').toLowerCase() === 'trek'));
      })
      .catch(() => alive && toast.error('Could not load treks'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [difficulty]);

  const onChange = (d) => {
    setDifficulty(d);
    const next = new URLSearchParams(searchParams);
    if (d === 'all') next.delete('difficulty');
    else next.set('difficulty', d);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="min-h-screen bg-mist">
      <Seo
        title="Treks"
        description="Multi-day Himalayan expeditions and Sahyadri day treks handpicked by Phoenix Adventures."
      />
      <Navbar />
      <PageHero
        eyebrow="Multi-day treks"
        title="Treks that change you"
        subtitle="From Sahyadri monsoon classics to high-altitude Himalayan expeditions — find your next summit."
        breadcrumb={[
          { label: 'Home', to: '/' },
          { label: 'Adventures', to: '/adventures' },
          { label: 'Treks' },
        ]}
        showCta
        ctaLabel="View all adventures"
      />

      <section className="bg-mist py-14 md:py-20">
        <div className="container">
          <Reveal variant="fade" className="mb-10 flex flex-wrap items-center gap-3">
            <IconMotion className="text-ember">
              <Filter size={18} />
            </IconMotion>
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onChange(d)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-colors ${
                  difficulty === d
                    ? 'bg-stone text-mist'
                    : 'border border-stone/15 text-stone hover:border-ember hover:text-ember'
                }`}
              >
                {d}
              </button>
            ))}
          </Reveal>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={Mountain}
              title="No treks match this filter"
              description="Try changing the difficulty or browse all adventures."
              action={
                <Link to="/adventures" className="btn btn-primary">
                  All Adventures
                </Link>
              }
            />
          ) : (
            <StaggerContainer className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((a, i) => (
                <AdventureCard key={a.id || a._id || i} adventure={a} index={i} />
              ))}
            </StaggerContainer>
          )}
        </div>
      </section>

            <Footer />
    </div>
  );
};

export default Treks;
