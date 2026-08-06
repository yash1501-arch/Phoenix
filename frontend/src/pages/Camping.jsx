import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tent } from 'lucide-react';
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

const Camping = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    adventuresAPI
      .getAll({ category: 'camping', limit: 24 })
      .then((res) => {
        if (!alive) return;
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setItems(list.filter((a) => (a.category || '').toLowerCase() === 'camping'));
      })
      .catch(() => alive && toast.error('Could not load camping trips'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-mist">
      <Seo
        title="Camping"
        description="Lakeside, riverside, and forest camping experiences across India — curated by Phoenix Adventures."
      />
      <Navbar />
      <PageHero
        eyebrow="Sleep under the stars"
        title="Camping weekends"
        subtitle="Bonfire nights, lakeside tents, and forest cabins across Maharashtra, Karnataka, and the Northeast."
        breadcrumb={[
          { label: 'Home', to: '/' },
          { label: 'Adventures', to: '/adventures' },
          { label: 'Camping' },
        ]}
        showCta
        ctaLabel="View all adventures"
      />

      <section className="bg-mist py-14 md:py-20">
        <div className="container">
          <Reveal variant="slideLeft" className="mb-10 flex items-center gap-3">
            <IconMotion className="text-ember">
              <Tent size={20} />
            </IconMotion>
            <p className="text-sm text-muted">
              {loading ? 'Loading camps…' : `${items.length} open camping trip${items.length === 1 ? '' : 's'}`}
            </p>
          </Reveal>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={Tent}
              title="No camping trips available right now"
              description="We're adding new campsites every week. Check back soon!"
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

export default Camping;
