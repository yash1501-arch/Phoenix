import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, Phone, Trash2, Circle, CircleDot, CheckCheck, Archive } from 'lucide-react';
import { contactAdminAPI } from '../utils/api';

const STATUS_META = {
  new: { label: 'New', className: 'status-badge pending', icon: CircleDot },
  read: { label: 'Read', className: 'status-badge confirmed', icon: Circle },
  replied: { label: 'Replied', className: 'status-badge confirmed', icon: CheckCheck },
  archived: { label: 'Archived', className: 'status-badge cancelled', icon: Archive },
};

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    try {
      const res = await contactAdminAPI.getAll();
      setMessages(res.data?.data || []);
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (msg, status) => {
    try {
      await contactAdminAPI.setStatus(msg._id, status);
      setMessages((prev) => prev.map((m) => (m._id === msg._id ? { ...m, status } : m)));
      toast.success(`Marked as ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const onDelete = async (msg) => {
    if (!window.confirm('Delete this message permanently?')) return;
    try {
      await contactAdminAPI.delete(msg._id);
      setMessages((prev) => prev.filter((m) => m._id !== msg._id));
      toast.success('Message deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filtered = messages.filter((m) => filter === 'all' || m.status === filter);
  const newCount = messages.filter((m) => m.status === 'new').length;

  return (
    <div className="adventures-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Messages</h1>
          <p className="page-subtitle">
            Contact form enquiries {newCount > 0 && <span className="status-badge pending" style={{ marginLeft: 8 }}>{newCount} new</span>}
          </p>
        </div>
      </div>

      <div className="filters-section" style={{ marginBottom: 20 }}>
        {['all', 'new', 'read', 'replied', 'archived'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-semibold rounded capitalize transition-colors ${
              filter === f
                ? 'bg-[var(--secondary)] text-white'
                : 'bg-white text-[var(--text-muted)] border border-[var(--border-color)] hover:border-[var(--primary)]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state" style={{ height: '40vh' }}><div className="spinner"></div></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Mail size={48} />
          <h3>No messages</h3>
          <p>When someone submits the contact form, it shows up here.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((msg) => {
            const meta = STATUS_META[msg.status] || STATUS_META.new;
            const isOpen = expanded === msg._id;
            return (
              <article key={msg._id} className={`bg-white rounded-xl border p-5 transition-colors ${msg.status === 'new' ? 'border-[var(--primary)]' : 'border-[var(--border-color)]'}`}>
                <button
                  className="w-full text-left flex items-start justify-between gap-4"
                  onClick={() => {
                    setExpanded(isOpen ? null : msg._id);
                    if (msg.status === 'new' && !isOpen) setStatus(msg, 'read');
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-bold text-[var(--text-main)]">{msg.name}</p>
                      <span className={meta.className}>{meta.label}</span>
                    </div>
                    <p className="text-sm font-medium text-[var(--text-main)]">{msg.subject}</p>
                    <p className="text-xs text-[var(--text-light)] mt-1">
                      {new Date(msg.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-[var(--border-color)] space-y-4">
                    <p className="text-sm text-[var(--text-main)] whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <a href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`} className="inline-flex items-center gap-1.5 text-[var(--primary-dark)] font-semibold hover:underline">
                        <Mail size={14} /> {msg.email}
                      </a>
                      {msg.phone && (
                        <a href={`tel:${msg.phone}`} className="inline-flex items-center gap-1.5 text-[var(--primary-dark)] font-semibold hover:underline">
                          <Phone size={14} /> {msg.phone}
                        </a>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {msg.status !== 'replied' && (
                        <button onClick={() => setStatus(msg, 'replied')} className="action-btn confirm !w-auto !px-3 !h-9 text-xs font-semibold">
                          <CheckCheck size={14} /> Mark replied
                        </button>
                      )}
                      {msg.status !== 'archived' && (
                        <button onClick={() => setStatus(msg, 'archived')} className="action-btn edit !w-auto !px-3 !h-9 text-xs font-semibold">
                          <Archive size={14} /> Archive
                        </button>
                      )}
                      <button onClick={() => onDelete(msg)} className="action-btn cancel !w-auto !px-3 !h-9 text-xs font-semibold">
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Messages;
