import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight, Search } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHero from '../components/ui/PageHero';
import Seo from '../components/Seo';
import { blogAPI, getImageUrl } from '../utils/api';
import { Reveal, StaggerContainer, StaggerItem } from '../components/ui/Motion';

const CATEGORIES = [
  { key: 'all', label: 'All Stories' },
  { key: 'trail-notes', label: 'Trail Notes' },
  { key: 'guides', label: 'Guides' },
  { key: 'news', label: 'News' },
];

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    blogAPI.getAll()
      .then((res) => { if (alive) setPosts(res.data?.data || []); })
      .catch(() => { if (alive) setError('Could not load stories right now.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    let list = posts;
    if (selectedCategory !== 'all') list = list.filter((p) => p.category === selectedCategory);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [posts, selectedCategory, searchTerm]);

  return (
    <div className="min-h-screen bg-mist">
      <Seo
        title="Trail Journal — Phoenix Adventures"
        description="Field notes, route guides, and stories from the Sahyadris and Himalayas. Written by the guides who run the trips."
      />
      <Navbar />

      <PageHero
        eyebrow="The Trail Journal"
        title="Notes from the field"
        subtitle="Route breakdowns, gear reviews, and honest trip reports — written by the same guides who'll lead your expedition."
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Journal' }]}
      />

      <main id="main-content" className="container py-16 md:py-24">
        <Reveal variant="fade" className="flex flex-col md:flex-row gap-4 md:items-center justify-between mb-12 pb-8 border-b border-stone/10">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setSelectedCategory(c.key)}
                className={`px-4 py-2 text-sm font-semibold transition-colors border rounded-md ${
                  selectedCategory === c.key
                    ? 'bg-panel text-cream border-stone'
                    : 'bg-transparent text-stone border-stone/15 hover:border-ember hover:text-ember'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="relative md:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search stories…"
              aria-label="Search blog posts"
              className="input !pl-10"
            />
          </div>
        </Reveal>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-10 h-10 border-2 border-ember border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <Reveal variant="scale" className="text-center py-24">
            <p className="text-lg text-muted mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="btn btn-secondary">Try again</button>
          </Reveal>
        ) : filtered.length === 0 ? (
          <Reveal variant="rise" className="text-center py-24 max-w-md mx-auto">
            <h3 className="font-display text-2xl text-stone font-semibold mb-3">
              {posts.length === 0 ? 'The journal is fresh off the press' : 'No stories match your search'}
            </h3>
            <p className="text-muted">
              {posts.length === 0
                ? "We're preparing our first dispatches. In the meantime, follow us on Instagram for field updates, or browse upcoming departures."
                : 'Try a different keyword or category.'}
            </p>
            {posts.length === 0 && (
              <Link to="/adventures" className="btn btn-primary mt-6 inline-flex">
                Browse adventures <ArrowRight size={16} />
              </Link>
            )}
          </Reveal>
        ) : (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
            {filtered.map((post) => (
              <StaggerItem key={post._id} as="article" className="group">
                <Link to={`/blog/${post.slug}`} className="block">
                  {post.cover_image && (
                    <div className="img-editorial aspect-[16/10] mb-5 overflow-hidden rounded-lg">
                      <img
                        src={getImageUrl(post.cover_image)}
                        alt={post.title}
                        loading="lazy"
                        decoding="async"
                        className="transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 meta text-ember">
                      <span>{CATEGORIES.find((c) => c.key === post.category)?.label || post.category}</span>
                      <span aria-hidden="true" className="text-stone/30">·</span>
                      <span className="text-muted">{post.read_time || 5} min read</span>
                    </div>
                    <h2 className="font-display text-2xl leading-snug text-stone group-hover:text-ember transition-colors font-semibold">
                      {post.title}
                    </h2>
                    <p className="text-muted line-clamp-3">{post.excerpt}</p>
                    <div className="flex items-center gap-4 text-sm text-muted pt-1">
                      <span className="inline-flex items-center gap-1.5"><User size={13} /> {post.author}</span>
                      <span className="inline-flex items-center gap-1.5"><Calendar size={13} /> {formatDate(post.created_at)}</span>
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </main>

            <Footer />
    </div>
  );
};

export default Blog;
