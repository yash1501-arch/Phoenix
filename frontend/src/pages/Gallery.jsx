import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import InstagramFeed from '../components/ui/InstagramFeed';
import PageHero from '../components/ui/PageHero';
import Seo from '../components/Seo';
import { Reveal } from '../components/ui/Motion';
import { publicSettingsAPI } from '../utils/api';

const Gallery = () => {
  const [igPosts, setIgPosts] = useState([]);
  const [igHandle, setIgHandle] = useState('@phoenixadventures');

  useEffect(() => {
    let alive = true;
    publicSettingsAPI.getAll().then((all) => {
      if (!alive) return;
      const posts =
        typeof all.instagram_posts === 'string'
          ? (() => {
              try {
                return JSON.parse(all.instagram_posts);
              } catch {
                return [];
              }
            })()
          : all.instagram_posts || [];
      setIgPosts(Array.isArray(posts) ? posts.filter(Boolean) : []);
      setIgHandle(all.instagram_handle || '@phoenix_adventures__');
    });
    return () => {
      alive = false;
    };
  }, []);

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
        <InstagramFeed posts={igPosts} handle={igHandle} />
      </Reveal>
      <Footer />
          </div>
  );
};

export default Gallery;
