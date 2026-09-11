import { DEPARTURE_CITY_OPTIONS } from '../utils/departureCities';

const DEFAULT_PICKUP = {
  mumbai: 'Mumbai meeting point (update details)',
  pune: 'Pune meeting point (update details)',
};

/**
 * Mumbai / Pune checkboxes — drives the user-site city filter.
 * onChange(cities, patch) — optional patch seeds pickup lists when a city is first selected.
 */
const DepartureCitiesField = ({ value = [], onChange }) => {
  const selected = Array.isArray(value) ? value : [];

  const toggle = (id) => {
    const turningOn = !selected.includes(id);
    const next = turningOn ? [...selected, id] : selected.filter((c) => c !== id);
    const patch = {};
    if (turningOn) {
      if (id === 'mumbai') patch.ensurePickupMumbai = DEFAULT_PICKUP.mumbai;
      if (id === 'pune') patch.ensurePickupPune = DEFAULT_PICKUP.pune;
    }
    onChange(next, patch);
  };

  return (
    <div className="form-group full-width">
      <label className="form-label">Departure cities</label>
      <p className="form-hint" style={{ marginBottom: '0.6rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        Shown on the website as Mumbai / Pune filters. Select every city this trip departs from.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        {DEPARTURE_CITY_OPTIONS.map((opt) => {
          const checked = selected.includes(opt.id);
          return (
            <label
              key={opt.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '0.55rem 0.9rem',
                borderRadius: 8,
                border: checked ? '1px solid var(--ember, #f0591e)' : '1px solid var(--border-color, #e5e7eb)',
                background: checked ? 'rgba(240, 89, 30, 0.06)' : 'transparent',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(opt.id)}
              />
              {opt.label}
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default DepartureCitiesField;
