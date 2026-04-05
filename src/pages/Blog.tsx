import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';

const Blog = () => {
  const { t } = useLanguage();
  const isVi = t('nav.rooms') === 'Hạng phòng';

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Banner */}
      <section className="pt-28 pb-16 sm:pt-36 sm:pb-20 bg-foreground text-background">
        <div className="container mx-auto px-4 text-center">
          <p className="text-primary font-display text-xs tracking-[0.4em] uppercase mb-3">
            {isVi ? 'Tin tức & Cẩm nang' : 'News & Guide'}
          </p>
          <h1 className="font-display text-3xl sm:text-5xl font-bold mb-4">
            {isVi ? 'Blog Tuấn Đạt Luxury' : 'Tuấn Đạt Luxury Blog'}
          </h1>
          <p className="text-background/70 max-w-xl mx-auto">
            {isVi
              ? 'Khám phá Sầm Sơn cùng Tuấn Đạt – từ kinh nghiệm du lịch đến địa điểm ăn uống hấp dẫn.'
              : 'Discover Sầm Sơn with Tuấn Đạt – from travel tips to the best dining spots.'}
          </p>
        </div>
      </section>

      {/* Blog List */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse bg-card rounded-2xl overflow-hidden border border-border">
                  <div className="h-48 bg-muted" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">
                {isVi ? 'Chưa có bài viết nào. Hãy quay lại sau!' : 'No posts yet. Check back soon!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Link
                    to={`/blog/${post.slug}`}
                    className="group block bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    {post.image_url && (
                      <div className="aspect-[16/10] overflow-hidden">
                        <img
                          src={post.image_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      {post.published_at && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(post.published_at), 'dd/MM/yyyy')}
                        </div>
                      )}
                      <h2 className="font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{post.excerpt}</p>
                      )}
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                        {isVi ? 'Đọc thêm' : 'Read more'} <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
