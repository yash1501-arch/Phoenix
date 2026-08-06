import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, User, ArrowLeft, Clock } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import { blogAPI, getImageUrl } from '../utils/api';
import { Reveal } from '../components/ui/Motion';

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

const renderContent = (content) => {
  if (!content) return null;
  return content.split(/\n\n+/).map((block, i) => {
    const text = block.trim();
    if (!text) return null;
    if (text.startsWith('## ')) {
      return <h2 key={i} className="font-display text-3xl text-stone font-semibold mt-12 mb-4">{text.slice(3)}</h2>;
    }
    if (text.startsWith('- ')) {
      const items = text.split('\n').filter((l) => l.trim().startsWith('- '));
      return (
        <ul key={i} className="list-disc pl-5 space-y-2 my-6 text-muted">
          {items.map((l, j) => <li key={j}>{renderInline(l.replace(/^\s*-\s*/, ''))}</li>)}
        </ul>
      );
    }
    return <p key={i} className="text-lg leading-relaxed text-muted my-6">{renderInline(text)}</p>;
  });
};

const renderInline = (text) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i} className="text-stone font-semibold">{p.slice(2, -2)}</strong>
      : p
  );
};

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    blogAPI.getBySlug(slug)
      .then((res) => {
        if (!alive) return;
        const data = res.data?.data;
        if (data) setPost(data);
        else setNotFound(true);
      })
      .catch(() => { if (alive) setNotFound(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-mist flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-ember border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-mist">
        <Navbar />
        <main id="main-content" className="container py-32 text-center">
          <Reveal variant="scale">
            <h1 className="font-display text-display-xl text-stone font-semibold mb-4">Story not found</h1>
            <p className="text-muted mb-8">This post may have been unpublished, or the link is incorrect.</p>
            <Link to="/blog" className="btn btn-primary">Back to the journal</Link>
          </Reveal>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mist">
      <Seo title={post.title} description={post.excerpt} image={post.cover_image} type="article" />
      <Navbar />

      <article className="pt-28 md:pt-36 pb-20">
        <header className="container-narrow">
          <Reveal variant="fade">
            <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ember transition-colors mb-10">
              <ArrowLeft size={15} /> All stories
            </Link>
          </Reveal>
          <Reveal variant="rise">
            <div className="meta flex items-center gap-3 mb-5">
              <span className="text-ember">{post.category}</span>
              <span aria-hidden="true" className="text-stone/30">·</span>
              <span className="inline-flex items-center gap-1.5 text-muted"><Clock size={12} /> {post.read_time || 5} min read</span>
            </div>
            <h1 className="font-display text-display-2xl text-stone font-semibold">{post.title}</h1>
            <div className="flex items-center gap-5 mt-8 pb-10 border-b border-stone/10 text-sm text-muted">
              <span className="inline-flex items-center gap-2"><User size={14} /> {post.author}</span>
              <span className="inline-flex items-center gap-2"><Calendar size={14} /> {formatDate(post.created_at)}</span>
            </div>
          </Reveal>
        </header>

        {post.cover_image && (
          <Reveal variant="clip" className="container my-12">
            <figure>
              <div className="img-editorial aspect-[21/9] rounded-lg overflow-hidden">
                <img src={getImageUrl(post.cover_image)} alt={post.title} loading="eager" decoding="async" />
              </div>
            </figure>
          </Reveal>
        )}

        <div className="container-narrow">
          <Reveal variant="rise" delay={0.1}>
            {renderContent(post.content)}
          </Reveal>

          <Reveal variant="scale" className="mt-16 pt-10 border-t border-stone/10">
            <footer>
              <div className="bg-stone text-mist rounded-lg p-8 md:p-10 text-center">
                <h2 className="font-display text-2xl md:text-3xl !text-mist font-semibold mb-3">Ready to walk it yourself?</h2>
                <p className="text-mist/70 mb-6 max-w-xl mx-auto">
                  Reading about a trail is the easy part. Join one of our small-group departures and see it first-hand.
                </p>
                <Link to="/adventures" className="btn btn-primary inline-flex">
                  Browse upcoming departures
                </Link>
              </div>
            </footer>
          </Reveal>
        </div>
      </article>

            <Footer />
    </div>
  );
};

export default BlogPost;
