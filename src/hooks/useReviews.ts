import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Review {
  id: string;
  guest_name: string;
  guest_email: string | null;
  rating: number;
  title: string | null;
  content: string;
  image_url: string | null;
  room_type: string | null;
  stay_date: string | null;
  is_approved: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
}

export function useReviews(approvedOnly = true) {
  const qc = useQueryClient();
  const { data: reviews = [], isLoading: loading } = useQuery({
    queryKey: ['reviews', approvedOnly],
    queryFn: async () => {
      let q = supabase.from('reviews' as any).select('*').order('is_featured', { ascending: false }).order('created_at', { ascending: false });
      if (approvedOnly) q = q.eq('is_approved', true);
      const { data } = await q;
      return (data as unknown as Review[]) || [];
    },
    staleTime: 60_000,
  });

  const refetch = () => qc.invalidateQueries({ queryKey: ['reviews'] });
  return { reviews, loading, refetch };
}

export async function submitReview(input: {
  guest_name: string;
  guest_email?: string;
  rating: number;
  title?: string;
  content: string;
  room_type?: string;
  stay_date?: string;
  image_url?: string;
}) {
  return supabase.from('reviews' as any).insert({
    ...input,
    is_approved: false,
  } as any);
}
