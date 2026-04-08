import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RoomAmenity {
  id: string;
  category: 'room_features' | 'benefits' | 'highlights';
  name_vi: string;
  name_en: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
}

async function fetchAmenities() {
  const { data, error } = await supabase
    .from('room_amenities')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return (data || []) as RoomAmenity[];
}

export function useRoomAmenities() {
  const queryClient = useQueryClient();

  const { data: amenities = [], isLoading } = useQuery({
    queryKey: ['room-amenities'],
    queryFn: fetchAmenities,
    staleTime: 5 * 60 * 1000,
  });

  const roomFeatures = amenities.filter(a => a.category === 'room_features' && a.is_active);
  const benefits = amenities.filter(a => a.category === 'benefits' && a.is_active);
  const highlights = amenities.filter(a => a.category === 'highlights' && a.is_active);

  const upsertAmenity = useMutation({
    mutationFn: async (amenity: Partial<RoomAmenity> & { id?: string }) => {
      if (amenity.id) {
        const { error } = await supabase.from('room_amenities').update(amenity).eq('id', amenity.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('room_amenities').insert(amenity as any);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['room-amenities'] }),
  });

  const deleteAmenity = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('room_amenities').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['room-amenities'] }),
  });

  return {
    amenities,
    roomFeatures,
    benefits,
    highlights,
    isLoading,
    upsertAmenity,
    deleteAmenity,
  };
}
