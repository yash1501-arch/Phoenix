import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bus } from 'lucide-react';
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

const Tours = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    adventuresAPI
      .getAll({ category: 'tour', limit: 24 })
      .then((res) => {
        if (!alive) return;
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setItems(list.filter((a) => (a.category || '').toLowerCase() === 'tour'));
      })
      .catch(() => alive && toast.error('Could not load tours'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-mist">
      <Seo
        title="Tours"
        description="Curated group tours, family getaways, and business retreats across India — by Phoenix Adventures."
      />
      <Navbar />
      <PageHero
        eyebrow="Explore with ease"
        title="Tours & Getaways"
        subtitle="Family holidays, corporate retreats, and group tours — thoughtfully planned, expertly guided."
        breadcrumb={[
          { label: 'Home', to: '/' },
          { label: 'Adventures', to: '/adventures' },
          { label: 'Tours' },
        ]}
        showCta
        ctaLabel="View all adventures"
      />

      <section className="bg-mist py-12 md:py-16">
        <div className="container">
          <Reveal
            variant="slideRight"
            className={`mb-8 flex items-center gap-3 ${loading ? 'justify-center' : ''}`}
          >
            <IconMotion className="text-ember">
              <Bus size={20} />
            </IconMotion>
            <p className="text-sm font-medium text-muted">
              {loading
                ? 'Loading tours…'
                : `${items.length} open tour${items.length === 1 ? '' : 's'}`}
            </p>
          </Reveal>

          {loading ? (
            <div
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              aria-busy="true"
              aria-label="Loading tours"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={Bus}
              title="No tours available right now"
              description="We're curating new tour packages. Check back soon!"
              action={
                <Link to="/adventures" className="btn btn-primary">
                  Browse All Adventures
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

export default Tours;
