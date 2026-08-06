import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, Phone, Trash2, CheckCheck, Archive } from 'lucide-react';
import { contactAdminAPI } from '../utils/api';
import './Messages.css';

const STATUS_META = {
  new: { label: 'New', className: 'status-badge pending' },
  read: { label: 'Read', className: 'status-badge active' },
  replied: { label: 'Replied', className: 'status-badge active' },
  archived: { label: 'Archived', className: 'status-badge cancelled' },
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
    <div className="messages-page">
      <div className="page-header">
        <p className="page-subtitle" style={{ marginTop: 0 }}>
          Contact form enquiries
          {newCount > 0 && <span className="badge badge-yellow" style={{ marginLeft: '0.5rem' }}>{newCount} new</span>}
        </p>
      </div>

      <div className="tab-bar message-filters" role="tablist">
        {['all', 'new', 'read', 'replied', 'archived'].map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`tab-btn ${filter === f ? 'is-active' : ''}`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Mail size={40} strokeWidth={1.5} />
          <h3>No messages</h3>
          <p>When someone submits the contact form, it shows up here.</p>
        </div>
      ) : (
        <div className="message-list">
          {filtered.map((msg) => {
            const meta = STATUS_META[msg.status] || STATUS_META.new;
            const isOpen = expanded === msg._id;
            return (
              <article key={msg._id} className={`message-card panel ${msg.status === 'new' ? 'is-new' : ''}`}>
                <button
                  type="button"
                  className="message-toggle"
                  onClick={() => {
                    setExpanded(isOpen ? null : msg._id);
                    if (msg.status === 'new' && !isOpen) setStatus(msg, 'read');
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <p className="message-name">{msg.name}</p>
                      <span className={meta.className}>{meta.label}</span>
                    </div>
                    <p className="message-subject">{msg.subject}</p>
                    <p className="message-time">
                      {new Date(msg.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </button>

                {isOpen && (
                  <div className="message-body">
                    <p className="message-text">{msg.message}</p>
                    <div className="message-contacts">
                      <a href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}>
                        <Mail size={14} /> {msg.email}
                      </a>
                      {msg.phone && (
                        <a href={`tel:${msg.phone}`}>
                          <Phone size={14} /> {msg.phone}
                        </a>
                      )}
                    </div>
                    <div className="message-actions">
                      {msg.status !== 'replied' && (
                        <button type="button" onClick={() => setStatus(msg, 'replied')} className="btn-secondary">
                          <CheckCheck size={14} /> Mark replied
                        </button>
                      )}
                      {msg.status !== 'archived' && (
                        <button type="button" onClick={() => setStatus(msg, 'archived')} className="btn-ghost">
                          <Archive size={14} /> Archive
                        </button>
                      )}
                      <button type="button" onClick={() => onDelete(msg)} className="btn-danger">
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
