import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Save, Trash2, Eye, EyeOff, Pencil, X } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  author: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

const AdminBlog = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<BlogPost> | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    // Admin can see all posts (published + unpublished) via admin RLS policy
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast({ title: 'Lỗi tải bài viết', variant: 'destructive' });
    setPosts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleSave = async () => {
    if (!editing?.title || !editing?.content) {
      toast({ title: 'Vui lòng nhập tiêu đề và nội dung', variant: 'destructive' });
      return;
    }
    setSaving(true);

    const slug = editing.slug || generateSlug(editing.title);
    const payload = {
      title: editing.title,
      slug,
      excerpt: editing.excerpt || null,
      content: editing.content,
      image_url: editing.image_url || null,
      meta_title: editing.meta_title || editing.title,
      meta_description: editing.meta_description || editing.excerpt || '',
      author: editing.author || 'Tuấn Đạt Luxury',
      is_published: editing.is_published ?? false,
      published_at: editing.is_published ? (editing.published_at || new Date().toISOString()) : null,
    };

    let error;
    if (editing.id) {
      ({ error } = await supabase.from('blog_posts').update(payload).eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('blog_posts').insert(payload));
    }

    setSaving(false);
    if (error) {
      toast({ title: 'Lỗi lưu bài viết', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: editing.id ? 'Đã cập nhật bài viết ✓' : 'Đã tạo bài viết ✓' });
    setEditing(null);
    fetchPosts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa bài viết này?')) return;
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) { toast({ title: 'Lỗi xóa', variant: 'destructive' }); return; }
    toast({ title: 'Đã xóa bài viết ✓' });
    fetchPosts();
  };

  const togglePublish = async (post: BlogPost) => {
    const newStatus = !post.is_published;
    const { error } = await supabase.from('blog_posts').update({
      is_published: newStatus,
      published_at: newStatus ? new Date().toISOString() : null,
    }).eq('id', post.id);
    if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); return; }
    toast({ title: newStatus ? 'Đã xuất bản ✓' : 'Đã gỡ bài ✓' });
    fetchPosts();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    const path = `blog/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('site-assets').upload(path, file);
    if (error) { toast({ title: 'Lỗi upload', variant: 'destructive' }); return; }
    const { data } = supabase.storage.from('site-assets').getPublicUrl(path);
    setEditing({ ...editing, image_url: data.publicUrl });
    toast({ title: 'Đã upload ảnh ✓' });
    e.target.value = '';
  };

  if (editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{editing.id ? 'Sửa bài viết' : 'Tạo bài viết mới'}</h2>
          <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
            <X className="h-4 w-4 mr-1" /> Hủy
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Tiêu đề (H1)</label>
              <Input value={editing.title || ''} onChange={e => {
                const title = e.target.value;
                setEditing({ ...editing, title, slug: editing.id ? editing.slug : generateSlug(title) });
              }} placeholder="Tiêu đề bài viết" />
            </div>
            <div>
              <label className="text-sm font-medium">Slug (URL)</label>
              <Input value={editing.slug || ''} onChange={e => setEditing({ ...editing, slug: e.target.value })} placeholder="url-bai-viet" />
            </div>
            <div>
              <label className="text-sm font-medium">Tóm tắt (Excerpt)</label>
              <Textarea value={editing.excerpt || ''} onChange={e => setEditing({ ...editing, excerpt: e.target.value })} rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium">Meta Title (SEO)</label>
              <Input value={editing.meta_title || ''} onChange={e => setEditing({ ...editing, meta_title: e.target.value })} placeholder="Meta title cho SEO" />
            </div>
            <div>
              <label className="text-sm font-medium">Meta Description (SEO)</label>
              <Textarea value={editing.meta_description || ''} onChange={e => setEditing({ ...editing, meta_description: e.target.value })} rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium">Tác giả</label>
              <Input value={editing.author || ''} onChange={e => setEditing({ ...editing, author: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Ảnh đại diện</label>
              <div className="flex items-center gap-2">
                <Input type="file" accept="image/*" onChange={handleImageUpload} />
              </div>
              {editing.image_url && (
                <img src={editing.image_url} alt="" className="mt-2 h-32 rounded-lg object-cover" />
              )}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Nội dung (Markdown)</label>
            <Textarea
              value={editing.content || ''}
              onChange={e => setEditing({ ...editing, content: e.target.value })}
              rows={20}
              placeholder="Viết nội dung bài viết bằng Markdown..."
              className="font-mono text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="gold" onClick={handleSave} disabled={saving} className="gap-1.5">
            <Save className="h-4 w-4" /> {saving ? 'Đang lưu...' : 'Lưu bài viết'}
          </Button>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={editing.is_published ?? false}
              onChange={e => setEditing({ ...editing, is_published: e.target.checked })}
            />
            Xuất bản ngay
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Quản lý Blog</h2>
        <Button variant="gold" onClick={() => setEditing({ title: '', content: '', slug: '', is_published: false })} className="gap-1.5">
          <Plus className="h-4 w-4" /> Tạo bài viết
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-muted h-20 rounded-lg" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <p className="text-muted-foreground text-center py-10">Chưa có bài viết nào</p>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="flex items-center gap-4 bg-card rounded-lg border border-border p-4">
              {post.image_url && (
                <img src={post.image_url} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{post.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  /blog/{post.slug} • {post.created_at ? format(new Date(post.created_at), 'dd/MM/yyyy') : ''}
                </p>
              </div>
              <Badge variant={post.is_published ? 'default' : 'secondary'}>
                {post.is_published ? 'Đã xuất bản' : 'Nháp'}
              </Badge>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => togglePublish(post)} title={post.is_published ? 'Gỡ bài' : 'Xuất bản'}>
                  {post.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setEditing(post)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBlog;
