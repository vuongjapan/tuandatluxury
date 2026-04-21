import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Service {
  id: string;
  sort_order: number;
  name: string;
  description: string | null;
  badge_text: string | null;
  badge_color: string | null; // gold | navy | teal
  image_url: string | null;
  image_effect: string; // zoom | parallax | fade | slide
  button_text: string | null;
  button_link: string | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
}

export const useServices = () => {
  const { data: services = [], isLoading, refetch } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('services')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) {
        console.warn('Failed to fetch services:', error);
        return [] as Service[];
      }
      return (data || []) as Service[];
    },
    staleTime: 30 * 1000,
  });

  const safe = Array.isArray(services) ? services : [];
  const featured = safe.filter((s) => s.is_featured && s.is_active);
  const minor = safe.filter((s) => !s.is_featured && s.is_active);

  // Backwards-compat aliases used elsewhere in the codebase
  const amenities = safe;
  const shuttles: Service[] = [];

  return { services: safe, featured, minor, amenities, shuttles, isLoading, refetch };
};
