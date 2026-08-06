import { useState } from 'react';
import { motion } from 'framer-motion';
import { Instagram, Facebook, Youtube } from 'lucide-react';
import { businessInstagram } from '../../data/founders';
import { IconMotion, EASE } from './Motion';

const fallbackImage = '/placeholder.jpg';

const socialBtn =
  'w-10 h-10 flex items-center justify-center border border-stone/15 text-stone/55 hover:text-ember hover:border-ember rounded-md transition-colors';

const FounderCard = ({ founder }) => {
  const [imgSrc, setImgSrc] = useState(founder.image);
  const [imgLoaded, setImgLoaded] = useState(false);

  const socials = [
    { href: founder.social?.instagram, icon: Instagram, label: 'Instagram' },
    { href: founder.social?.facebook, icon: Facebook, label: 'Facebook' },
  ].filter((s) => s.href);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: EASE }}
      className="group relative"
    >
      <div className="relative rounded-md border border-stone/10 bg-white p-6 sm:p-8 text-center h-full transition-shadow duration-300 group-hover:shadow-lift">
        <div className="relative w-28 h-28 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full ring-2 ring-ember/20 ring-offset-2 ring-offset-white" />
          {!imgLoaded && (
            <div className="absolute inset-0 rounded-full bg-mist animate-pulse" />
          )}
          <img
            src={imgSrc}
            alt={founder.name}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgSrc(fallbackImage)}
            className={`absolute inset-0 w-full h-full rounded-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        </div>

        <h3 className="font-display text-xl font-semibold text-stone mb-0.5">
          {founder.name}
        </h3>

        <span className="inline-block text-[10px] font-bold text-ember uppercase tracking-[0.18em] mb-3">
          {founder.role}
        </span>

        <p className="text-sm text-muted leading-relaxed mb-6 line-clamp-3">
          {founder.bio}
        </p>

        {socials.length > 0 && (
          <div className="flex items-center justify-center gap-2.5">
            {socials.map((s) => (
              <IconMotion key={s.label} hoverScale={1.1} hoverRotate={0}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${founder.name} on ${s.label}`}
                  className={socialBtn}
                >
                  <s.icon size={17} strokeWidth={2} />
                </a>
              </IconMotion>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FounderCard;

export function BusinessInstagramCTA() {
  return (
    <section className="container my-12 md:my-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, ease: EASE }}
        className="relative overflow-hidden bg-stone rounded-md p-8 sm:p-12"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-lg">
            <p className="meta !text-ember mb-3">Follow the journey</p>
            <h3 className="font-display text-3xl sm:text-4xl text-mist leading-tight">Live dispatches from the trail</h3>
            <p className="text-mist/60 mt-3 text-sm md:text-base">
              Real photos and reels from ongoing trips — posted by the guides leading them.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full lg:w-auto">
            <a
              href={businessInstagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary justify-center"
            >
              <IconMotion hoverScale={1.08} hoverRotate={-6}>
                <Instagram size={16} />
              </IconMotion>
              @{businessInstagram.handle}
            </a>
            <div className="grid grid-cols-2 gap-3">
              <a
                href={businessInstagram.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline text-xs justify-center !text-mist !border-mist/25 hover:!border-ember hover:!text-ember"
              >
                <IconMotion hoverScale={1.08} hoverRotate={0}>
                  <Facebook size={14} />
                </IconMotion>
                Facebook
              </a>
              <a
                href={businessInstagram.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline text-xs justify-center !text-mist !border-mist/25 hover:!border-ember hover:!text-ember"
              >
                <IconMotion hoverScale={1.08} hoverRotate={0}>
                  <Youtube size={14} />
                </IconMotion>
                YouTube
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
