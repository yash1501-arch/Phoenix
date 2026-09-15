import React from 'react';

export const MEAL_OPTION_CHOICES = [
  { value: 'veg', label: 'Vegetarian only' },
  { value: 'non_veg', label: 'Non-vegetarian only' },
  { value: 'jain', label: 'Jain' },
];

/**
 * Select which meal preferences guests can choose when booking.
 * Leave all unchecked to allow every option (backward compatible).
 */
const MealOptionsField = ({ value = [], onChange }) => {
  const selected = Array.isArray(value) ? value : [];

  const toggle = (meal) => {
    const set = new Set(selected);
    if (set.has(meal)) set.delete(meal);
    else set.add(meal);
    onChange([...set]);
  };

  return (
    <div className="form-group full-width">
      <label className="form-label">Meal preferences</label>
      <p className="form-help" style={{ marginBottom: '0.75rem' }}>
        Choose which meal options appear on the booking form. Leave all unchecked to show every option.
      </p>
      <div className="form-grid" style={{ gap: '0.5rem' }}>
        {MEAL_OPTION_CHOICES.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <label
              key={opt.value}
              className="flex items-center gap-2 text-sm"
              style={{ cursor: 'pointer' }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(opt.value)}
              />
              {opt.label}
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default MealOptionsField;
