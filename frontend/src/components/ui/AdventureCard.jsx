import { Link } from 'react-router-dom';
import { MapPin, Clock, Star, ArrowRight } from 'lucide-react';
import { getImageUrl } from '../../utils/api';
import { StaggerItem } from './Motion';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80';

/**
 * Image-forward trip tile — shared by Treks / Camping / Tours / listings.
 */
const AdventureCard = ({ adventure, index = 0 }) => {
  const id = adventure._id || adventure.id;
  const img =
    getImageUrl(adventure.image_url || adventure.image) || PLACEHOLDER;

  return (
    <StaggerItem>
      <article className="group flex flex-col overflow-hidden rounded-lg border border-stone/8 bg-white shadow-smoke hover:shadow-card transition-shadow h-full">
        <Link to={`/adventure/${id}`} className="flex flex-col flex-1">
          <div className="relative aspect-[4/5] overflow-hidden">
            <img
              src={img}
              alt={`${adventure.title || 'Adventure'} — ${adventure.location || 'India'}`}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.src = PLACEHOLDER;
              }}
            />
            <span className="absolute top-3 left-3 bg-stone/90 text-mist text-[10px] font-bold px-2.5 py-1.5 uppercase tracking-wider rounded-md">
              {adventure.difficulty || 'Moderate'}
            </span>
          </div>

          <div className="flex flex-1 flex-col p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-lg leading-snug text-stone group-hover:text-ember transition-colors font-semibold line-clamp-2">
                {adventure.title || 'Adventure'}
              </h3>
              {adventure.rating > 0 && (
                <div className="flex items-center gap-1 shrink-0 pt-0.5">
                  <Star size={12} className="text-ember fill-current" />
                  <span className="text-sm font-bold text-stone">{adventure.rating}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-muted">
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} className="text-ember" />
                {adventure.location || 'India'}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock size={12} className="text-ember" />
                {adventure.duration || '—'}
              </span>
            </div>

            <div className="mt-auto flex items-baseline justify-between pt-3 border-t border-stone/8">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                  From
                </span>
                <span className="font-display text-xl text-stone font-semibold">
                  ₹{Number(adventure.price || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <span className="text-sm font-bold text-ember inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                Book <ArrowRight size={14} />
              </span>
            </div>
          </div>
        </Link>
      </article>
    </StaggerItem>
  );
};

export default AdventureCard;
