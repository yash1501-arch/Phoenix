import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { blogAdminAPI } from '../utils/api';

const CATEGORY_LABELS = {
  'trail-notes': 'Trail Notes',
  'guides': 'Guides',
  'news': 'News',
};

const BlogList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    try {
      const res = await blogAdminAPI.getAll();
      setPosts(res.data?.data || []);
    } catch {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const togglePublish = async (post) => {
    try {
      await blogAdminAPI.update(post._id, { published: !post.published });
      setPosts((prev) => prev.map((p) => (p._id === post._id ? { ...p, published: !p.published } : p)));
      toast.success(post.published ? 'Unpublished' : 'Published');
    } catch {
      toast.error('Failed to update post');
    }
  };

  const onDelete = async (post) => {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    try {
      await blogAdminAPI.delete(post._id);
      setPosts((prev) => prev.filter((p) => p._id !== post._id));
      toast.success('Post deleted');
    } catch {
      toast.error('Failed to delete post');
    }
  };

  const filtered = posts.filter((p) => {
    if (filter === 'published') return p.published;
    if (filter === 'draft') return !p.published;
    return true;
  });

  return (
    <div className="adventures-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Blog</h1>
          <p className="page-subtitle">Write and publish stories for the Trail Journal</p>
        </div>
        <div className="page-actions">
          <Link to="/blog/new" className="btn-primary">
            <Plus size={16} /> New post
          </Link>
        </div>
      </div>

      <div className="tab-bar" role="tablist" aria-label="Filter posts">
        {['all', 'published', 'draft'].map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`tab-btn ${filter === f ? 'is-active' : ''}`}
          >
            {f === 'all'
              ? `All (${posts.length})`
              : f === 'published'
                ? `Published (${posts.filter((p) => p.published).length})`
                : `Drafts (${posts.filter((p) => !p.published).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state" style={{ height: '40vh' }}><div className="spinner"></div></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Plus size={48} />
          <h3>No posts yet</h3>
          <p>Write your first story to fill the Trail Journal.</p>
          <Link to="/blog/new" className="btn-primary">
            <Plus size={16} /> Create post
          </Link>
        </div>
      ) : (
        <div className="list-stack">
          {filtered.map((post) => (
            <article key={post._id} className="list-card">
              <div className="list-card-layout">
                <div className="list-card-main">
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span className={`status-badge ${post.published ? 'confirmed' : 'pending'}`}>
                      {post.published ? 'Published' : 'Draft'}
                    </span>
                    <span className="badge badge-blue">{CATEGORY_LABELS[post.category] || post.category}</span>
                    <span className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>{post.read_time || 5} min read</span>
                  </div>
                  <h3 style={{ margin: '0 0 0.35rem', fontSize: 'var(--text-lg)', fontWeight: 700, lineHeight: 1.3 }}>{post.title}</h3>
                  <p style={{ margin: '0 0 0.5rem', fontSize: 'var(--text-sm)', color: 'var(--ink-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.excerpt}</p>
                  <p className="text-muted" style={{ margin: 0, fontSize: 'var(--text-xs)' }}>
                    By {post.author} · {new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="list-card-actions">
                  <button
                    type="button"
                    onClick={() => togglePublish(post)}
                    className="action-btn"
                    title={post.published ? 'Unpublish' : 'Publish'}
                  >
                    {post.published ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <Link to={`/blog/edit/${post._id}`} className="action-btn" title="Edit">
                    <Edit2 size={16} />
                  </Link>
                  <button type="button" onClick={() => onDelete(post)} className="action-btn danger" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogList;
