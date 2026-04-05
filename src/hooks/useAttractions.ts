import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Attraction {
  id: string;
  name_vi: string;
  name_en: string;
  distance: string;
  icon: string;
  image_url: string | null;
  description_vi: string | null;
  description_en: string | null;
  sort_order: number;
  is_active: boolean;
}

export function useAttractions() {
  const queryClient = useQueryClient();

  const { data: attractions = [], isLoading } = useQuery({
    queryKey: ['attractions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nearby_attractions')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return (data || []) as unknown as Attraction[];
    },
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: ['attractions'] });

  return { attractions, isLoading, refetch };
}
