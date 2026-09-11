import React from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';

const emptyDay = (dayNum) => ({
  day: dayNum,
  title: '',
  description: '',
  activities: [],
  meals: [],
  accommodation: '',
});

function parseCommaList(str) {
  return String(str || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Day-by-day itinerary editor for tour (and trek) packages.
 */
const ItineraryEditor = ({ value = [], onChange }) => {
  const days = Array.isArray(value) ? value : [];

  const setDays = (next) => onChange(next);

  const updateDay = (index, patch) => {
    setDays(days.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  };

  const addDay = () => {
    const nextNum = days.length ? Math.max(...days.map((d) => Number(d.day) || 0)) + 1 : 1;
    setDays([...days, emptyDay(nextNum)]);
  };

  const removeDay = (index) => {
    setDays(
      days
        .filter((_, i) => i !== index)
        .map((d, i) => ({ ...d, day: i + 1 })),
    );
  };

  return (
    <div className="itinerary-input-section">
      {days.length === 0 ? (
        <p className="empty-hint">
          Add each day of the tour — where you go, what guests do, meals, and overnight stay.
        </p>
      ) : (
        days.map((day, index) => (
          <div key={index} className="itinerary-day">
            <div className="day-header">
              <GripVertical size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span className="day-number">Day {day.day ?? index + 1}</span>
              <button
                type="button"
                className="pdf-remove-btn"
                onClick={() => removeDay(index)}
                aria-label={`Remove day ${index + 1}`}
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="form-grid" style={{ marginTop: '0.75rem' }}>
              <div className="form-group full-width">
                <label className="form-label">Day title</label>
                <input
                  className="form-input"
                  value={day.title || ''}
                  onChange={(e) => updateDay(index, { title: e.target.value })}
                  placeholder="e.g., Haridwar → Rishikesh"
                />
              </div>
              <div className="form-group full-width">
                <label className="form-label">Activities &amp; plan</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={day.description || ''}
                  onChange={(e) => updateDay(index, { description: e.target.value })}
                  placeholder="What happens this day — sightseeing, travel, free time…"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Activities (comma-separated)</label>
                <input
                  className="form-input"
                  value={(day.activities || []).join(', ')}
                  onChange={(e) => updateDay(index, { activities: parseCommaList(e.target.value) })}
                  placeholder="Temple visit, Ganga aarti"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Meals (comma-separated)</label>
                <input
                  className="form-input"
                  value={(day.meals || []).join(', ')}
                  onChange={(e) => updateDay(index, { meals: parseCommaList(e.target.value) })}
                  placeholder="Breakfast, Lunch, Dinner"
                />
              </div>
              <div className="form-group full-width">
                <label className="form-label">Stay / accommodation</label>
                <input
                  className="form-input"
                  value={day.accommodation || ''}
                  onChange={(e) => updateDay(index, { accommodation: e.target.value })}
                  placeholder="e.g., Hotel in Rishikesh (group stay, 3 per room)"
                />
              </div>
            </div>
          </div>
        ))
      )}

      <button type="button" className="btn-secondary" onClick={addDay} style={{ alignSelf: 'flex-start' }}>
        <Plus size={18} /> Add day
      </button>
    </div>
  );
};

export default ItineraryEditor;
