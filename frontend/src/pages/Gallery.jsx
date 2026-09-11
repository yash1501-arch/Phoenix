import React, { useEffect, useState } from 'react';
import { Instagram } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import InstagramFeed, { parseInstagramPosts } from '../components/ui/InstagramFeed';
import PageHero from '../components/ui/PageHero';
import Seo from '../components/Seo';
import { Reveal } from '../components/ui/Motion';
import { publicSettingsAPI } from '../utils/api';
import { businessInstagram } from '../data/founders';

const Gallery = () => {
  const [igPosts, setIgPosts] = useState([]);
  const [igHandle, setIgHandle] = useState(businessInstagram.handle || 'phoenix_adventures__');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const all = await Promise.race([
          publicSettingsAPI.getAll(),
          new Promise((_, reject) => {
            window.setTimeout(() => reject(new Error('timeout')), 6000);
          }),
        ]);
        if (!alive) return;
        setIgPosts(parseInstagramPosts(all?.instagram_posts));
        const handle =
          all?.instagram_handle ||
          all?.instagram_url ||
          businessInstagram.handle ||
          '@phoenix_adventures__';
        setIgHandle(String(handle).replace(/^@/, ''));
      } catch {
        if (!alive) return;
        setLoadError(true);
        setIgPosts([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, []);

  const handleDisplay = igHandle.startsWith('@') ? igHandle : `@${igHandle}`;

  return (
    <div className="min-h-screen bg-mist">
      <Seo
        title="Gallery"
        description="Photos from Phoenix Adventures treks, camps, and expeditions across India."
      />
      <Navbar />
      <PageHero
        eyebrow="On the trail"
        title="Photo gallery"
        subtitle="Moments from Sahyadri ridges and Himalayan passes — courage, weather, and the views that keep people coming back."
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Gallery' }]}
      />

      <Reveal variant="clip" className="bg-mist">
        {loading ? (
          <section className="py-12 md:py-16 bg-mist" aria-busy="true" aria-label="Loading gallery">
            <div className="container">
              <div className="max-w-5xl mx-auto mb-8 text-center space-y-3">
                <div className="mx-auto h-3 w-28 rounded bg-panel/10 animate-pulse" />
                <div className="mx-auto h-8 w-64 max-w-full rounded bg-panel/10 animate-pulse" />
              </div>
              <div className="mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-1.5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-panel/10 animate-pulse"
                    aria-hidden
                  />
                ))}
              </div>
            </div>
          </section>
        ) : igPosts.length > 0 ? (
          <InstagramFeed posts={igPosts} handle={handleDisplay} compact />
        ) : (
          <section className="py-14 md:py-20 bg-mist">
            <div className="container max-w-xl mx-auto text-center">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-panel text-ember mb-5">
                <Instagram size={26} />
              </span>
              <p className="kicker !text-ember mb-3">From the trail</p>
              <h2 className="font-display text-display-lg text-stone font-semibold mb-3">
                {loadError ? 'Gallery temporarily unavailable' : 'Photos coming soon'}
              </h2>
              <p className="text-muted mb-8 leading-relaxed">
                {loadError
                  ? 'We could not load the feed right now. Follow us on Instagram for the latest from the trail.'
                  : 'Add Instagram post or reel URLs in Admin → Settings → Instagram posts to feature them here — or follow the live trail on Instagram.'}
              </p>
              <a
                href={businessInstagram.url || `https://www.instagram.com/${igHandle.replace('@', '')}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary inline-flex"
              >
                <Instagram size={16} /> Follow {handleDisplay}
              </a>
            </div>
          </section>
        )}
      </Reveal>
      <Footer />
    </div>
  );
};

export default Gallery;
