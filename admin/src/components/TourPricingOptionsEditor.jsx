import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { cloneDefaultTourPricingOptions } from '../utils/tourPricingDefaults';

/**
 * Edit train / room (etc.) per-person extras for tour adventures.
 * value: pricing_options array
 */
const TourPricingOptionsEditor = ({ value = [], onChange }) => {
  const groups = Array.isArray(value) ? value : [];

  const updateGroups = (next) => onChange(next);

  const updateGroup = (gi, patch) => {
    updateGroups(groups.map((g, i) => (i === gi ? { ...g, ...patch } : g)));
  };

  const updateChoice = (gi, ci, patch) => {
    updateGroups(
      groups.map((g, i) => {
        if (i !== gi) return g;
        const choices = (g.choices || []).map((c, j) => (j === ci ? { ...c, ...patch } : c));
        return { ...g, choices };
      }),
    );
  };

  const addChoice = (gi) => {
    updateGroups(
      groups.map((g, i) => {
        if (i !== gi) return g;
        return {
          ...g,
          choices: [
            ...(g.choices || []),
            { id: `option_${(g.choices || []).length + 1}`, label: 'New option', extra_per_person: 0 },
          ],
        };
      }),
    );
  };

  const removeChoice = (gi, ci) => {
    updateGroups(
      groups.map((g, i) => {
        if (i !== gi) return g;
        return { ...g, choices: (g.choices || []).filter((_, j) => j !== ci) };
      }),
    );
  };

  const addGroup = () => {
    updateGroups([
      ...groups,
      {
        group: `option_${groups.length + 1}`,
        label: 'New option group',
        required: true,
        choices: [{ id: 'standard', label: 'Standard', extra_per_person: 0 }],
      },
    ]);
  };

  const removeGroup = (gi) => {
    updateGroups(groups.filter((_, i) => i !== gi));
  };

  const resetDefaults = () => {
    updateGroups(cloneDefaultTourPricingOptions());
  };

  return (
    <div className="form-section">
      <div className="form-section-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <h2 className="section-title">Tour pricing options</h2>
          <p className="form-hint" style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Guests choose Sleeper coach or 3AC per person at booking. Stay is group sharing (3 per room).
            Extras add to the base price. Guests pay advance now; balance is due before departure.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn-secondary py-2" onClick={resetDefaults}>
            Load defaults
          </button>
          <button type="button" className="btn-secondary py-2" onClick={addGroup}>
            <Plus size={16} /> Add group
          </button>
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="form-hint" style={{ color: 'var(--text-muted)' }}>
          No options yet. Click &quot;Load defaults&quot; for Sleeper/3AC + room sharing, or add a group.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {groups.map((g, gi) => (
            <div
              key={gi}
              style={{
                border: '1px solid var(--border-color, #e5e7eb)',
                borderRadius: 8,
                padding: '1rem',
                background: 'var(--bg-subtle, #fafafa)',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr auto auto',
                  gap: '0.75rem',
                  alignItems: 'end',
                  marginBottom: '0.75rem',
                }}
              >
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Group key</label>
                  <input
                    className="form-input"
                    value={g.group || ''}
                    onChange={(e) => updateGroup(gi, { group: e.target.value })}
                    placeholder="train"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Label</label>
                  <input
                    className="form-input"
                    value={g.label || ''}
                    onChange={(e) => updateGroup(gi, { label: e.target.value })}
                    placeholder="Train coach"
                  />
                </div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0, paddingBottom: 8 }}>
                  <input
                    type="checkbox"
                    checked={g.required !== false}
                    onChange={(e) => updateGroup(gi, { required: e.target.checked })}
                  />
                  Required
                </label>
                <button
                  type="button"
                  className="btn-secondary py-2"
                  onClick={() => removeGroup(gi)}
                  aria-label="Remove group"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(g.choices || []).map((c, ci) => (
                  <div
                    key={ci}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1.4fr 120px auto',
                      gap: '0.5rem',
                      alignItems: 'center',
                    }}
                  >
                    <input
                      className="form-input"
                      value={c.id || ''}
                      onChange={(e) => updateChoice(gi, ci, { id: e.target.value })}
                      placeholder="id"
                    />
                    <input
                      className="form-input"
                      value={c.label || ''}
                      onChange={(e) => updateChoice(gi, ci, { label: e.target.value })}
                      placeholder="Label"
                    />
                    <input
                      className="form-input"
                      type="number"
                      min={0}
                      step={100}
                      value={c.extra_per_person ?? 0}
                      onChange={(e) =>
                        updateChoice(gi, ci, { extra_per_person: Number(e.target.value) || 0 })
                      }
                      placeholder="Extra ₹"
                      title="Extra per person (₹)"
                    />
                    <button
                      type="button"
                      className="btn-secondary py-2"
                      onClick={() => removeChoice(gi, ci)}
                      aria-label="Remove choice"
                      disabled={(g.choices || []).length <= 1}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="btn-secondary py-2" style={{ marginTop: '0.75rem' }} onClick={() => addChoice(gi)}>
                <Plus size={14} /> Add choice
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TourPricingOptionsEditor;
