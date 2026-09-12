import React from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';

const emptyScheduleRow = () => ({ time: '', activity: '' });

const emptyDay = (dayNum) => ({
  day: dayNum,
  title: '',
  description: '',
  schedule: [emptyScheduleRow()],
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

function daySchedule(day) {
  const rows = Array.isArray(day?.schedule) ? day.schedule : [];
  return rows.length ? rows : [emptyScheduleRow()];
}

/**
 * Day-by-day itinerary editor for tour, trek, and camping packages.
 */
const ItineraryEditor = ({ value = [], onChange, variant }) => {
  const days = Array.isArray(value) ? value : [];
  const isTrek = variant === 'trek' || variant === 'camping';

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

  return (
    <div className="itinerary-input-section">
      {days.length === 0 ? (
        <p className="empty-hint">
          {isTrek
            ? 'Add each day and timed activities.'
            : 'Add each day of the tour — where you go, what guests do, meals, and overnight stay.'}
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
                  placeholder={isTrek ? 'e.g., Base village → summit' : 'e.g., Haridwar → Rishikesh'}
                />
              </div>
              <div className="form-group full-width">
                <label className="form-label">Description (optional)</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={day.description || ''}
                  onChange={(e) => updateDay(index, { description: e.target.value })}
                  placeholder={isTrek ? 'Overview of the day — optional if you add timed activities.' : 'What happens this day — sightseeing, travel, free time…'}
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
                        aria-label={`Day ${index + 1} time ${rowIndex + 1}`}
                      />
                      <input
                        type="text"
                        className="form-input schedule-activity"
                        value={row.activity || ''}
                        onChange={(e) => updateScheduleRow(index, rowIndex, { activity: e.target.value })}
                        placeholder="Assemble at Lonavala"
                        aria-label={`Day ${index + 1} activity ${rowIndex + 1}`}
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
                  placeholder={isTrek ? 'e.g., Tent at base camp' : 'e.g., Hotel in Rishikesh (group stay, 3 per room)'}
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
