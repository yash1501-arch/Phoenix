import { useLanguage } from '../../context/LanguageContext';

/** Compact EN / HI switch for Maharashtra audience. */
const LanguageToggle = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={`inline-flex items-center rounded-md border border-stone/15 p-0.5 text-[11px] font-bold tracking-wide ${className}`}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 rounded ${language === 'en' ? 'bg-ember text-cream' : 'text-stone/60 hover:text-stone'}`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('hi')}
        className={`px-2 py-1 rounded ${language === 'hi' ? 'bg-ember text-cream' : 'text-stone/60 hover:text-stone'}`}
      >
        HI
      </button>
    </div>
  );
};

export default LanguageToggle;
