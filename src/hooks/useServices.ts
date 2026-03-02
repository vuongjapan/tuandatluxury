import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VehicleType {
  type: string;
  type_en: string;
  capacity: number;
  luggage: number;
  price: number;
}

export interface Service {
  id: string;
  name_vi: string;
  name_en: string;
  description_vi: string | null;
  description_en: string | null;
  icon: string;
  image_url: string | null;
  category: string;
  is_bookable: boolean;
  is_free: boolean;
  price_vnd: number;
  schedule: string | null;
  vehicle_types: VehicleType[] | null;
  sort_order: number;
  is_active: boolean;
}

export const useServices = () => {
  const { data: services = [], isLoading, refetch } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return (data || []) as unknown as Service[];
    },
  });

  const amenities = services.filter(s => s.category === 'amenity');
  const shuttles = services.filter(s => s.category === 'shuttle');

  return { services, amenities, shuttles, isLoading, refetch };
};
