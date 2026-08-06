import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { blogAdminAPI } from '../utils/api';

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

const CATEGORIES = [
  { value: 'trail-notes', label: 'Trail Notes (trip reports, field stories)' },
  { value: 'guides', label: 'Guides (how-tos, gear, preparation)' },
  { value: 'news', label: 'News (announcements, new routes)' },
];

const BlogEditor = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'trail-notes',
    cover_image: '',
    tags: '',
    author: 'Phoenix Team',
    published: false,
  });

  useEffect(() => {
    if (!isEdit) return;
    blogAdminAPI.getById(id)
      .then((res) => {
        const p = res.data?.data;
        if (!p) return toast.error('Post not found');
        setForm({
          title: p.title || '',
          slug: p.slug || '',
          excerpt: p.excerpt || '',
          content: p.content || '',
          category: p.category || 'trail-notes',
          cover_image: p.cover_image || '',
          tags: (p.tags || []).join(', '),
          author: p.author || 'Phoenix Team',
          published: !!p.published,
        });
      })
      .catch(() => toast.error('Failed to load post'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (publishOverride) => {
    if (!form.title.trim() || !form.excerpt.trim() || !form.content.trim()) {
      toast.error('Title, excerpt and content are required');
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      content: form.content.trim(),
      category: form.category,
      cover_image: form.cover_image.trim() || undefined,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      author: form.author.trim() || 'Phoenix Team',
      published: publishOverride !== undefined ? publishOverride : form.published,
    };
    try {
      if (isEdit) {
        await blogAdminAPI.update(id, payload);
        toast.success('Post updated');
      } else {
        await blogAdminAPI.create({ ...payload, slug: form.slug.trim() || undefined });
        toast.success('Post created');
      }
      navigate('/blog');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-state" style={{ height: '60vh' }}><div className="spinner"></div></div>;
  }

  return (
    <div className="adventures-page" style={{ maxWidth: 900 }}>
      <div className="page-header">
        <div>
          <button onClick={() => navigate('/blog')} className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--primary)] mb-2 font-medium">
            <ArrowLeft size={14} /> Back to blog
          </button>
          <h1 className="page-title">{isEdit ? 'Edit post' : 'New post'}</h1>
          <p className="page-subtitle">
            Content supports simple formatting: blank line = new paragraph, `## Heading`, `- list item`, `**bold**`.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[var(--border-color)] p-6 md:p-8 space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-2">Title *</label>
          <input
            className="form-input w-full"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value, slug: isEdit ? f.slug : slugify(e.target.value) }))}
            placeholder="e.g. Sandhan Valley in the monsoon: a field report"
            maxLength={200}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold mb-2">URL slug</label>
            <input className="form-input w-full" value={form.slug} onChange={set('slug')} placeholder="auto-generated from title" disabled={isEdit} />
            {!isEdit && <p className="text-xs text-[var(--text-light)] mt-1">Auto-generated. Cannot be changed after publishing.</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Category *</label>
            <select className="form-input w-full" value={form.category} onChange={set('category')}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Excerpt *</label>
          <textarea className="form-input w-full" rows={2} maxLength={500} value={form.excerpt} onChange={set('excerpt')}
            placeholder="One or two sentences shown on the journal index and in search results." />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Cover image URL</label>
            <input className="form-input w-full" value={form.cover_image} onChange={set('cover_image')} placeholder="https://… (Cloudinary or Unsplash)" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Author</label>
            <input className="form-input w-full" value={form.author} onChange={set('author')} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Tags (comma separated)</label>
          <input className="form-input w-full" value={form.tags} onChange={set('tags')} placeholder="monsoon, sahyadri, beginner" />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Content *</label>
          <textarea className="form-input w-full font-mono text-sm" rows={16} value={form.content} onChange={set('content')}
            placeholder={'Write the story here.\n\nUse blank lines to separate paragraphs.\n\n## Section heading\n\n- List item one\n- List item two\n\nUse **bold** for emphasis.'} />
          <p className="text-xs text-[var(--text-light)] mt-1">{form.content.split(/\s+/).filter(Boolean).length} words · ~{Math.max(1, Math.round(form.content.split(/\s+/).filter(Boolean).length / 200))} min read</p>
        </div>

        <div className="flex flex-wrap gap-3 pt-4 border-t border-[var(--border-color)]">
          <button onClick={() => handleSubmit()} disabled={saving} className="btn btn-primary">
            <Save size={16} /> {saving ? 'Saving…' : (form.published ? 'Save changes' : 'Save draft')}
          </button>
          {!form.published && (
            <button onClick={() => handleSubmit(true)} disabled={saving} className="btn btn-secondary">
              <Eye size={16} /> Publish now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogEditor;
