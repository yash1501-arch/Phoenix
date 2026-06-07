import { useState } from 'react';
import { Instagram, Facebook, ArrowUpRight } from 'lucide-react';
import { businessInstagram } from '../../data/founders';

const fallbackImage = '/placeholder.jpg';

export default function FounderCard({ founder }) {
  const [imgSrc, setImgSrc] = useState(founder.image);

  return (
    <div className="group bg-white rounded-2xl p-6 shadow-professional border border-[#D4AF37]/20 text-center h-full transition-all hover:-translate-y-1 hover:shadow-professional-lg">
      <div className="relative w-28 h-28 mx-auto mb-4">
        <img
          src={imgSrc}
          alt={founder.name}
          onError={() => setImgSrc(fallbackImage)}
          className="w-28 h-28 rounded-full object-cover border-4 border-[#D4AF37] mx-auto"
        />
      </div>
      <h3 className="text-xl font-bold text-black mb-1">{founder.name}</h3>
      <p className="text-[#D4AF37] font-semibold mb-3">{founder.role}</p>
      <p className="text-gray-600 text-sm leading-relaxed mb-5">{founder.bio}</p>

      <div className="flex items-center justify-center gap-3">
        <a
          href={founder.social.instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${founder.name} on Instagram`}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 via-fuchsia-500 to-amber-500 text-white shadow-md hover:scale-110 transition-transform"
        >
          <Instagram size={18} />
        </a>
        <a
          href={founder.social.facebook}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${founder.name} on Facebook`}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#1877F2] text-white shadow-md hover:scale-110 transition-transform"
        >
          <Facebook size={18} />
        </a>
      </div>
    </div>
  );
}

export function BusinessInstagramCTA() {
  return (
    <section className="container my-12 md:my-16">
      <a
        href={businessInstagram.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-amber-500 p-8 sm:p-10 shadow-professional-lg hover:shadow-2xl transition-shadow"
      >
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Instagram size={28} className="sm:size-8" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest opacity-90">Follow us</p>
              <h3 className="text-2xl sm:text-3xl font-black">@{businessInstagram.handle}</h3>
              <p className="text-sm sm:text-base opacity-90">Real-time dispatches from the field.</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-pink-600 font-bold text-sm shadow-lg group-hover:scale-105 transition-transform">
            Open Instagram <ArrowUpRight size={18} />
          </span>
        </div>
      </a>
    </section>
  );
}

export function BusinessSocialButtons({ className = '' }) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <a
        href={businessInstagram.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Phoenix Adventures on Instagram"
        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 via-fuchsia-500 to-amber-500 text-white shadow-md hover:scale-110 transition-transform"
      >
        <Instagram size={18} />
      </a>
      <a
        href={businessInstagram.facebook}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Phoenix Adventures on Facebook"
        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#1877F2] text-white shadow-md hover:scale-110 transition-transform"
      >
        <Facebook size={18} />
      </a>
    </div>
  );
}
