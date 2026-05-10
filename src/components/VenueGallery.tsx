import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Media {
  id: string;
  media_type: string;
  url: string;
  caption: string | null;
}

export default function VenueGallery({ venue }: { venue: 'pool' | 'restaurant' }) {
  const [media, setMedia] = useState<Media[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('venue_media')
        .select('id,media_type,url,caption')
        .eq('venue_type', venue)
        .eq('is_active', true)
        .order('sort_order');
      setMedia(data || []);
    })();
  }, [venue]);

  if (media.length === 0) return null;
  const images = media.filter((m) => m.media_type === 'image');
  const videos = media.filter((m) => m.media_type === 'video');

  return (
    <div className="space-y-6">
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((img) => (
            <div key={img.id} className="aspect-[4/3] overflow-hidden rounded-lg bg-secondary">
              <img src={img.url} alt={img.caption || ''} loading="lazy" className="w-full h-full object-cover hover:scale-[1.04] transition-transform duration-500" />
            </div>
          ))}
        </div>
      )}
      {videos.map((v) => (
        <div key={v.id} className="aspect-video rounded-lg overflow-hidden bg-black">
          {v.url.includes('youtube') || v.url.includes('youtu.be') ? (
            <iframe src={v.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen />
          ) : (
            <video src={v.url} controls className="w-full h-full" />
          )}
        </div>
      ))}
    </div>
  );
}
