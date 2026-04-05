import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();
  const isVi = t('nav.rooms') === 'Hạng phòng';

  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug!)
        .eq('is_published', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Set meta title */}
      {post?.meta_title && <title>{post.meta_title}</title>}

      <article className="pt-28 sm:pt-36 pb-16 sm:pb-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link to="/blog">
            <Button variant="ghost" size="sm" className="mb-6 gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              {isVi ? 'Quay lại Blog' : 'Back to Blog'}
            </Button>
          </Link>

          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-64 bg-muted rounded-xl" />
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-5/6" />
                <div className="h-4 bg-muted rounded w-4/6" />
              </div>
            </div>
          ) : !post ? (
            <div className="text-center py-20">
              <h1 className="text-2xl font-bold text-foreground mb-4">
                {isVi ? 'Không tìm thấy bài viết' : 'Post not found'}
              </h1>
              <Link to="/blog">
                <Button variant="gold">{isVi ? 'Về trang Blog' : 'Back to Blog'}</Button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
                {post.title}
              </h1>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
                {post.author && (
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> {post.author}
                  </span>
                )}
                {post.published_at && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(post.published_at), 'dd/MM/yyyy')}
                  </span>
                )}
              </div>

              {post.image_url && (
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="w-full rounded-xl mb-8 aspect-[16/9] object-cover"
                />
              )}

              <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-display prose-a:text-primary">
                <ReactMarkdown>{post.content}</ReactMarkdown>
              </div>
            </>
          )}
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default BlogPost;
