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
        <Link to="/blog/new" className="btn btn-primary">
          <Plus size={16} /> New post
        </Link>
      </div>

      <div className="filters-section" style={{ marginBottom: 20 }}>
        {['all', 'published', 'draft'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-semibold rounded transition-colors ${
              filter === f
                ? 'bg-[var(--secondary)] text-white'
                : 'bg-white text-[var(--text-muted)] border border-[var(--border-color)] hover:border-[var(--primary)]'
            }`}
          >
            {f === 'all' ? `All (${posts.length})` : f === 'published' ? `Published (${posts.filter(p => p.published).length})` : `Drafts (${posts.filter(p => !p.published).length})`}
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
          <Link to="/blog/new" className="btn btn-primary" style={{ marginTop: 12 }}>
            <Plus size={16} /> Create post
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((post) => (
            <article key={post._id} className="bg-white rounded-xl border border-[var(--border-color)] p-5 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`status-badge ${post.published ? 'confirmed' : 'pending'}`}>
                    {post.published ? 'Published' : 'Draft'}
                  </span>
                  <span className="badge badge-blue">{CATEGORY_LABELS[post.category] || post.category}</span>
                  <span className="text-xs text-[var(--text-light)]">{post.read_time || 5} min read</span>
                </div>
                <h3 className="font-bold text-lg text-[var(--text-main)] leading-snug">{post.title}</h3>
                <p className="text-sm text-[var(--text-muted)] line-clamp-2 mt-1">{post.excerpt}</p>
                <p className="text-xs text-[var(--text-light)] mt-2">
                  By {post.author} · {new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => togglePublish(post)}
                  className="action-btn edit"
                  title={post.published ? 'Unpublish' : 'Publish'}
                >
                  {post.published ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <Link to={`/blog/edit/${post._id}`} className="action-btn edit" title="Edit">
                  <Edit2 size={16} />
                </Link>
                <button onClick={() => onDelete(post)} className="action-btn cancel" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogList;
