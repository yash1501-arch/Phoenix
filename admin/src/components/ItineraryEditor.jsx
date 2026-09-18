import React from 'react';
import { Plus, Trash2, GripVertical, Bus } from 'lucide-react';

const emptyScheduleRow = () => ({ time: '', activity: '' });

const emptyDay = (dayNum) => ({
  day: dayNum,
  title: '',
  description: '',
  schedule: [emptyScheduleRow()],
  accommodation: '',
});

function daySchedule(day) {
  const rows = Array.isArray(day?.schedule) ? day.schedule : [];
  return rows.length ? rows : [emptyScheduleRow()];
}

function dayHeading(day, index) {
  const n = Number(day.day);
  if (n === 0) return 'Day 0 · Pickup';
  return `Day ${day.day ?? index + 1}`;
}

/**
 * Day-by-day itinerary editor for tour, trek, and camping packages.
 */
const ItineraryEditor = ({ value = [], onChange, variant }) => {
  const days = Array.isArray(value) ? value : [];
  const isTrek = variant === 'trek' || variant === 'camping';
  const hasPickupDay = days.some((d) => Number(d.day) === 0);

  const setDays = (next) => onChange(next);

  const updateDay = (index, patch) => {
    setDays(days.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  };

  const addDay = () => {
    const regularDays = days.filter((d) => Number(d.day) !== 0);
    const nextNum = regularDays.length
      ? Math.max(...regularDays.map((d) => Number(d.day) || 0)) + 1
      : 1;
    setDays([...days, emptyDay(nextNum)]);
  };

  const addPickupDay = () => {
    if (hasPickupDay) return;
    const pickupDay = {
      ...emptyDay(0),
      title: 'Pickup & departure',
      description: 'Pickup from Mumbai / Pune and travel to the destination.',
    };
    setDays([pickupDay, ...days]);
  };

  const removeDay = (index) => {
    const filtered = days.filter((_, i) => i !== index);
    let nextRegular = 1;
    setDays(
      filtered.map((d) => {
        if (Number(d.day) === 0) return { ...d, day: 0 };
        const updated = { ...d, day: nextRegular };
        nextRegular += 1;
        return updated;
      }),
    );
  };

  const updateScheduleRow = (dayIndex, rowIndex, patch) => {
    const schedule = daySchedule(days[dayIndex]).map((row, i) =>
      i === rowIndex ? { ...row, ...patch } : row,
    );
    updateDay(dayIndex, { schedule });
  };

  const addScheduleRow = (dayIndex) => {
    updateDay(dayIndex, { schedule: [...daySchedule(days[dayIndex]), emptyScheduleRow()] });
  };

  const removeScheduleRow = (dayIndex, rowIndex) => {
    const schedule = daySchedule(days[dayIndex]).filter((_, i) => i !== rowIndex);
    updateDay(dayIndex, { schedule: schedule.length ? schedule : [emptyScheduleRow()] });
  };

  const sortedDays = days
    .map((day, index) => ({ day, index }))
    .sort((a, b) => Number(a.day.day) - Number(b.day.day));

  return (
    <div className="itinerary-input-section">
      {days.length === 0 ? (
        <p className="empty-hint">
          {isTrek
            ? 'Add Day 0 for pickup, then each trek day with a timed schedule.'
            : 'Add Day 0 for pickup/departure, then each day of the tour with timed schedule and stay.'}
        </p>
      ) : (
        sortedDays.map(({ day, index }) => {
          const isPickup = Number(day.day) === 0;
          return (
          <div key={`${day.day}-${index}`} className="itinerary-day">
            <div className="day-header">
              <GripVertical size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span className="day-number">{dayHeading(day, index)}</span>
              {isPickup && (
                <span className="text-xs" style={{ color: 'var(--accent)', marginLeft: '0.25rem' }}>
                  <Bus size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Pickup day
                </span>
              )}
              <button
                type="button"
                className="pdf-remove-btn"
                onClick={() => removeDay(index)}
                aria-label={`Remove ${dayHeading(day, index)}`}
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
                  placeholder={isPickup ? 'e.g., Mumbai pickup → base village' : isTrek ? 'e.g., Base village → summit' : 'e.g., Haridwar → Rishikesh'}
                />
              </div>
              <div className="form-group full-width">
                <label className="form-label">Description (optional)</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={day.description || ''}
                  onChange={(e) => updateDay(index, { description: e.target.value })}
                  placeholder={isPickup ? 'Pickup points, assembly times, and travel to the destination.' : isTrek ? 'Overview of the day — optional if you add timed activities.' : 'What happens this day — sightseeing, travel, free time…'}
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Timed schedule</label>
                <div className="schedule-table">
                  {daySchedule(day).map((row, rowIndex) => (
                    <div key={rowIndex} className="schedule-row">
                      <input
                        type="text"
                        className="form-input schedule-time"
                        value={row.time || ''}
                        onChange={(e) => updateScheduleRow(index, rowIndex, { time: e.target.value })}
                        placeholder="05:30"
                        aria-label={`${dayHeading(day, index)} time ${rowIndex + 1}`}
                      />
                      <input
                        type="text"
                        className="form-input schedule-activity"
                        value={row.activity || ''}
                        onChange={(e) => updateScheduleRow(index, rowIndex, { activity: e.target.value })}
                        placeholder={isPickup ? 'Pickup from Dadar' : 'Assemble at Lonavala'}
                        aria-label={`${dayHeading(day, index)} activity ${rowIndex + 1}`}
                      />
                      <button
                        type="button"
                        className="pdf-remove-btn"
                        onClick={() => removeScheduleRow(index, rowIndex)}
                        aria-label={`Remove schedule row ${rowIndex + 1}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button type="button" className="btn-secondary schedule-add-row" onClick={() => addScheduleRow(index)}>
                    <Plus size={16} /> Add time
                  </button>
                </div>
              </div>

              <div className="form-group full-width">
                <label className="form-label">Stay / accommodation</label>
                <input
                  className="form-input"
                  value={day.accommodation || ''}
                  onChange={(e) => updateDay(index, { accommodation: e.target.value })}
                  placeholder={isTrek ? 'e.g., Tent at base camp' : 'e.g., Hotel in Rishikesh (group stay, 3 per room)'}
                />
              </div>
            </div>
          </div>
          );
        })
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        {!hasPickupDay && (
          <button type="button" className="btn-secondary" onClick={addPickupDay} style={{ alignSelf: 'flex-start' }}>
            <Bus size={18} /> Add pickup day (Day 0)
          </button>
        )}
        <button type="button" className="btn-secondary" onClick={addDay} style={{ alignSelf: 'flex-start' }}>
          <Plus size={18} /> Add day
        </button>
      </div>
    </div>
  );
};

export default ItineraryEditor;
