export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_logs: {
        Row: {
          clicked_item: string | null
          created_at: string
          event_type: string
          id: string
          meta: Json | null
          query: string | null
          result_type: string | null
          session_id: string | null
        }
        Insert: {
          clicked_item?: string | null
          created_at?: string
          event_type: string
          id?: string
          meta?: Json | null
          query?: string | null
          result_type?: string | null
          session_id?: string | null
        }
        Update: {
          clicked_item?: string | null
          created_at?: string
          event_type?: string
          id?: string
          meta?: Json | null
          query?: string | null
          result_type?: string | null
          session_id?: string | null
        }
        Relationships: []
      }
      attractions: {
        Row: {
          area: string | null
          best_time: string | null
          category: string | null
          checkin: boolean | null
          created_at: string
          description: string | null
          family: boolean | null
          featured: boolean | null
          free_or_paid: string | null
          id: string
          image_url: string | null
          map_link: string | null
          name: string
          nightlife: boolean | null
          slug: string
          status: string | null
          tags: string[] | null
          ticket_price: number | null
          updated_at: string
          zone: string | null
        }
        Insert: {
          area?: string | null
          best_time?: string | null
          category?: string | null
          checkin?: boolean | null
          created_at?: string
          description?: string | null
          family?: boolean | null
          featured?: boolean | null
          free_or_paid?: string | null
          id?: string
          image_url?: string | null
          map_link?: string | null
          name: string
          nightlife?: boolean | null
          slug: string
          status?: string | null
          tags?: string[] | null
          ticket_price?: number | null
          updated_at?: string
          zone?: string | null
        }
        Update: {
          area?: string | null
          best_time?: string | null
          category?: string | null
          checkin?: boolean | null
          created_at?: string
          description?: string | null
          family?: boolean | null
          featured?: boolean | null
          free_or_paid?: string | null
          id?: string
          image_url?: string | null
          map_link?: string | null
          name?: string
          nightlife?: boolean | null
          slug?: string
          status?: string | null
          tags?: string[] | null
          ticket_price?: number | null
          updated_at?: string
          zone?: string | null
        }
        Relationships: []
      }
      auction_bids: {
        Row: {
          auction_item_id: string
          bid_amount: number
          bidder_name: string
          bidder_phone: string
          created_at: string
          id: string
        }
        Insert: {
          auction_item_id: string
          bid_amount: number
          bidder_name: string
          bidder_phone: string
          created_at?: string
          id?: string
        }
        Update: {
          auction_item_id?: string
          bid_amount?: number
          bidder_name?: string
          bidder_phone?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auction_bids_auction_item_id_fkey"
            columns: ["auction_item_id"]
            isOneToOne: false
            referencedRelation: "auction_items"
            referencedColumns: ["id"]
          },
        ]
      }
      auction_items: {
        Row: {
          bid_step: number
          created_at: string
          description_vi: string | null
          end_time: string
          id: string
          image_url: string | null
          is_active: boolean
          item_type: string
          list_price: number
          ref_id: string | null
          sort_order: number
          start_price: number
          start_time: string
          title_en: string | null
          title_vi: string
          updated_at: string
          view_count: number
        }
        Insert: {
          bid_step?: number
          created_at?: string
          description_vi?: string | null
          end_time: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          item_type?: string
          list_price?: number
          ref_id?: string | null
          sort_order?: number
          start_price?: number
          start_time?: string
          title_en?: string | null
          title_vi: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          bid_step?: number
          created_at?: string
          description_vi?: string | null
          end_time?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          item_type?: string
          list_price?: number
          ref_id?: string | null
          sort_order?: number
          start_price?: number
          start_time?: string
          title_en?: string | null
          title_vi?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string | null
          content: string
          created_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          is_published: boolean
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      booking_combos: {
        Row: {
          booking_id: string
          combo_menu_id: string | null
          combo_menu_name: string | null
          combo_name: string
          combo_package_id: string | null
          combo_package_name: string | null
          created_at: string
          dining_item_id: string | null
          dishes_snapshot: Json
          id: string
          price_vnd: number
          quantity: number
        }
        Insert: {
          booking_id: string
          combo_menu_id?: string | null
          combo_menu_name?: string | null
          combo_name?: string
          combo_package_id?: string | null
          combo_package_name?: string | null
          created_at?: string
          dining_item_id?: string | null
          dishes_snapshot?: Json
          id?: string
          price_vnd?: number
          quantity?: number
        }
        Update: {
          booking_id?: string
          combo_menu_id?: string | null
          combo_menu_name?: string | null
          combo_name?: string
          combo_package_id?: string | null
          combo_package_name?: string | null
          created_at?: string
          dining_item_id?: string | null
          dishes_snapshot?: Json
          id?: string
          price_vnd?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_combos_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_combos_combo_menu_id_fkey"
            columns: ["combo_menu_id"]
            isOneToOne: false
            referencedRelation: "combo_menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_combos_combo_package_id_fkey"
            columns: ["combo_package_id"]
            isOneToOne: false
            referencedRelation: "combo_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_combos_dining_item_id_fkey"
            columns: ["dining_item_id"]
            isOneToOne: false
            referencedRelation: "dining_items"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_food_items: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          menu_item_id: string
          name: string
          price_vnd: number
          quantity: number
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          menu_item_id: string
          name?: string
          price_vnd?: number
          quantity?: number
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          menu_item_id?: string
          name?: string
          price_vnd?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_food_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_code: string
          check_in: string
          check_out: string
          combo_notes: string | null
          combo_total: number
          company_name: string | null
          created_at: string
          decoration_notes: string | null
          deposit_amount: number
          discount_code: string | null
          discount_code_amount: number | null
          discount_code_type: string | null
          discount_code_value: number | null
          extra_person_count: number | null
          extra_person_surcharge: number | null
          group_size: number | null
          guest_email: string | null
          guest_name: string
          guest_notes: string | null
          guest_phone: string
          guests_count: number
          id: string
          individual_food_total: number | null
          language: string | null
          member_discount_amount: number | null
          member_discount_percent: number | null
          original_price_vnd: number | null
          payment_status: string
          promotion_discount_amount: number | null
          promotion_discount_percent: number | null
          promotion_id: string | null
          promotion_name: string | null
          remaining_amount: number
          room_breakdown: Json
          room_details: Json
          room_id: string
          room_quantity: number
          room_subtotal: number
          sepay_bank: string | null
          sepay_qr_url: string | null
          sepay_va: string | null
          special_services: string | null
          status: string
          total_price_vnd: number
          updated_at: string
        }
        Insert: {
          booking_code: string
          check_in: string
          check_out: string
          combo_notes?: string | null
          combo_total?: number
          company_name?: string | null
          created_at?: string
          decoration_notes?: string | null
          deposit_amount?: number
          discount_code?: string | null
          discount_code_amount?: number | null
          discount_code_type?: string | null
          discount_code_value?: number | null
          extra_person_count?: number | null
          extra_person_surcharge?: number | null
          group_size?: number | null
          guest_email?: string | null
          guest_name: string
          guest_notes?: string | null
          guest_phone: string
          guests_count?: number
          id?: string
          individual_food_total?: number | null
          language?: string | null
          member_discount_amount?: number | null
          member_discount_percent?: number | null
          original_price_vnd?: number | null
          payment_status?: string
          promotion_discount_amount?: number | null
          promotion_discount_percent?: number | null
          promotion_id?: string | null
          promotion_name?: string | null
          remaining_amount?: number
          room_breakdown?: Json
          room_details?: Json
          room_id: string
          room_quantity?: number
          room_subtotal?: number
          sepay_bank?: string | null
          sepay_qr_url?: string | null
          sepay_va?: string | null
          special_services?: string | null
          status?: string
          total_price_vnd?: number
          updated_at?: string
        }
        Update: {
          booking_code?: string
          check_in?: string
          check_out?: string
          combo_notes?: string | null
          combo_total?: number
          company_name?: string | null
          created_at?: string
          decoration_notes?: string | null
          deposit_amount?: number
          discount_code?: string | null
          discount_code_amount?: number | null
          discount_code_type?: string | null
          discount_code_value?: number | null
          extra_person_count?: number | null
          extra_person_surcharge?: number | null
          group_size?: number | null
          guest_email?: string | null
          guest_name?: string
          guest_notes?: string | null
          guest_phone?: string
          guests_count?: number
          id?: string
          individual_food_total?: number | null
          language?: string | null
          member_discount_amount?: number | null
          member_discount_percent?: number | null
          original_price_vnd?: number | null
          payment_status?: string
          promotion_discount_amount?: number | null
          promotion_discount_percent?: number | null
          promotion_id?: string | null
          promotion_name?: string | null
          remaining_amount?: number
          room_breakdown?: Json
          room_details?: Json
          room_id?: string
          room_quantity?: number
          room_subtotal?: number
          sepay_bank?: string | null
          sepay_qr_url?: string | null
          sepay_va?: string | null
          special_services?: string | null
          status?: string
          total_price_vnd?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      cafes: {
        Row: {
          area: string | null
          avg_price: number | null
          category: string | null
          checkin: boolean | null
          chill: boolean | null
          created_at: string
          description: string | null
          featured: boolean | null
          id: string
          image_url: string | null
          map_link: string | null
          name: string
          night_open: boolean | null
          sea_view: boolean | null
          slug: string
          status: string | null
          tags: string[] | null
          updated_at: string
          zone: string | null
        }
        Insert: {
          area?: string | null
          avg_price?: number | null
          category?: string | null
          checkin?: boolean | null
          chill?: boolean | null
          created_at?: string
          description?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          map_link?: string | null
          name: string
          night_open?: boolean | null
          sea_view?: boolean | null
          slug: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          zone?: string | null
        }
        Update: {
          area?: string | null
          avg_price?: number | null
          category?: string | null
          checkin?: boolean | null
          chill?: boolean | null
          created_at?: string
          description?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          map_link?: string | null
          name?: string
          night_open?: boolean | null
          sea_view?: boolean | null
          slug?: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          zone?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: []
      }
      combo_menu_dishes: {
        Row: {
          combo_menu_id: string
          created_at: string
          id: string
          image_url: string | null
          name_en: string
          name_vi: string
          sort_order: number
        }
        Insert: {
          combo_menu_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          name_en?: string
          name_vi: string
          sort_order?: number
        }
        Update: {
          combo_menu_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          name_en?: string
          name_vi?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "combo_menu_dishes_combo_menu_id_fkey"
            columns: ["combo_menu_id"]
            isOneToOne: false
            referencedRelation: "combo_menus"
            referencedColumns: ["id"]
          },
        ]
      }
      combo_menus: {
        Row: {
          combo_package_id: string
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          menu_number: number
          name_en: string
          name_vi: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          combo_package_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          menu_number?: number
          name_en?: string
          name_vi?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          combo_package_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          menu_number?: number
          name_en?: string
          name_vi?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "combo_menus_combo_package_id_fkey"
            columns: ["combo_package_id"]
            isOneToOne: false
            referencedRelation: "combo_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      combo_packages: {
        Row: {
          created_at: string
          description_en: string | null
          description_vi: string | null
          dishes_per_menu: number
          id: string
          image_url: string | null
          is_active: boolean
          menu_count: number
          name: string
          price_per_person: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_en?: string | null
          description_vi?: string | null
          dishes_per_menu?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          menu_count?: number
          name: string
          price_per_person?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_en?: string | null
          description_vi?: string | null
          dishes_per_menu?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          menu_count?: number
          name?: string
          price_per_person?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      cuisine_media: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          is_active: boolean
          media_group: string | null
          media_url: string
          sort_order: number
          thumbnail_url: string | null
          title: string | null
          type: string
          updated_at: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          media_group?: string | null
          media_url: string
          sort_order?: number
          thumbnail_url?: string | null
          title?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          media_group?: string | null
          media_url?: string
          sort_order?: number
          thumbnail_url?: string | null
          title?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      dining_categories: {
        Row: {
          created_at: string
          description_en: string | null
          description_vi: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name_en: string
          name_vi: string
          serving_hours: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_en?: string | null
          description_vi?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name_en: string
          name_vi: string
          serving_hours?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_en?: string | null
          description_vi?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name_en?: string
          name_vi?: string
          serving_hours?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      dining_items: {
        Row: {
          category_id: string
          combo_serves: number | null
          created_at: string
          description_en: string | null
          description_vi: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_combo: boolean
          name_en: string
          name_vi: string
          price_vnd: number
          show_price: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id: string
          combo_serves?: number | null
          created_at?: string
          description_en?: string | null
          description_vi?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_combo?: boolean
          name_en: string
          name_vi: string
          price_vnd?: number
          show_price?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          combo_serves?: number | null
          created_at?: string
          description_en?: string | null
          description_vi?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_combo?: boolean
          name_en?: string
          name_vi?: string
          price_vnd?: number
          show_price?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dining_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "dining_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          applies_to: string
          applies_to_items: Json | null
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          end_date: string
          id: string
          is_active: boolean
          max_uses: number
          max_uses_per_user: number
          min_order_amount: number
          start_date: string
          title_en: string
          title_vi: string
          updated_at: string
          used_count: number
        }
        Insert: {
          applies_to?: string
          applies_to_items?: Json | null
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          end_date: string
          id?: string
          is_active?: boolean
          max_uses?: number
          max_uses_per_user?: number
          min_order_amount?: number
          start_date?: string
          title_en?: string
          title_vi?: string
          updated_at?: string
          used_count?: number
        }
        Update: {
          applies_to?: string
          applies_to_items?: Json | null
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          end_date?: string
          id?: string
          is_active?: boolean
          max_uses?: number
          max_uses_per_user?: number
          min_order_amount?: number
          start_date?: string
          title_en?: string
          title_vi?: string
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      external_hotels: {
        Row: {
          address: string | null
          area: string | null
          beach_zone: string | null
          breakfast: boolean | null
          couple_friendly: boolean | null
          created_at: string
          description: string | null
          family_friendly: boolean | null
          featured: boolean | null
          group_friendly: boolean | null
          id: string
          image_url: string | null
          luxury_level: string | null
          map_link: string | null
          name: string
          near_beach: boolean | null
          parking: boolean | null
          phone: string | null
          pool: boolean | null
          price_from: number | null
          price_to: number | null
          slug: string
          stars: number | null
          status: string | null
          tags: string[] | null
          updated_at: string
          website: string | null
          zone: string | null
        }
        Insert: {
          address?: string | null
          area?: string | null
          beach_zone?: string | null
          breakfast?: boolean | null
          couple_friendly?: boolean | null
          created_at?: string
          description?: string | null
          family_friendly?: boolean | null
          featured?: boolean | null
          group_friendly?: boolean | null
          id?: string
          image_url?: string | null
          luxury_level?: string | null
          map_link?: string | null
          name: string
          near_beach?: boolean | null
          parking?: boolean | null
          phone?: string | null
          pool?: boolean | null
          price_from?: number | null
          price_to?: number | null
          slug: string
          stars?: number | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          website?: string | null
          zone?: string | null
        }
        Update: {
          address?: string | null
          area?: string | null
          beach_zone?: string | null
          breakfast?: boolean | null
          couple_friendly?: boolean | null
          created_at?: string
          description?: string | null
          family_friendly?: boolean | null
          featured?: boolean | null
          group_friendly?: boolean | null
          id?: string
          image_url?: string | null
          luxury_level?: string | null
          map_link?: string | null
          name?: string
          near_beach?: boolean | null
          parking?: boolean | null
          phone?: string | null
          pool?: boolean | null
          price_from?: number | null
          price_to?: number | null
          slug?: string
          stars?: number | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          website?: string | null
          zone?: string | null
        }
        Relationships: []
      }
      flash_sale_items: {
        Row: {
          created_at: string
          flash_sale_id: string
          id: string
          image_url: string | null
          item_id: string
          item_name_en: string
          item_name_vi: string
          item_type: string
          original_price: number
          quantity_limit: number
          quantity_sold: number
          sale_price: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          flash_sale_id: string
          id?: string
          image_url?: string | null
          item_id: string
          item_name_en?: string
          item_name_vi?: string
          item_type?: string
          original_price?: number
          quantity_limit?: number
          quantity_sold?: number
          sale_price?: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          flash_sale_id?: string
          id?: string
          image_url?: string | null
          item_id?: string
          item_name_en?: string
          item_name_vi?: string
          item_type?: string
          original_price?: number
          quantity_limit?: number
          quantity_sold?: number
          sale_price?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "flash_sale_items_flash_sale_id_fkey"
            columns: ["flash_sale_id"]
            isOneToOne: false
            referencedRelation: "flash_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      flash_sales: {
        Row: {
          created_at: string
          description_en: string | null
          description_vi: string | null
          end_time: string
          id: string
          is_active: boolean
          sort_order: number
          start_time: string
          title_en: string
          title_vi: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_en?: string | null
          description_vi?: string | null
          end_time: string
          id?: string
          is_active?: boolean
          sort_order?: number
          start_time: string
          title_en?: string
          title_vi: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_en?: string | null
          description_vi?: string | null
          end_time?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          start_time?: string
          title_en?: string
          title_vi?: string
          updated_at?: string
        }
        Relationships: []
      }
      food_order_items: {
        Row: {
          created_at: string
          food_order_id: string
          id: string
          menu_item_id: string
          price_vnd: number
          quantity: number
        }
        Insert: {
          created_at?: string
          food_order_id: string
          id?: string
          menu_item_id: string
          price_vnd?: number
          quantity?: number
        }
        Update: {
          created_at?: string
          food_order_id?: string
          id?: string
          menu_item_id?: string
          price_vnd?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "food_order_items_food_order_id_fkey"
            columns: ["food_order_id"]
            isOneToOne: false
            referencedRelation: "food_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      food_orders: {
        Row: {
          booking_code: string | null
          created_at: string
          customer_name: string
          discount_amount: number | null
          discount_code: string | null
          discount_type: string | null
          discount_value: number | null
          food_order_id: string
          guest_email: string | null
          id: string
          notes: string | null
          original_amount: number | null
          paid_amount: number
          payment_status: string
          phone: string
          room_number: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          booking_code?: string | null
          created_at?: string
          customer_name: string
          discount_amount?: number | null
          discount_code?: string | null
          discount_type?: string | null
          discount_value?: number | null
          food_order_id: string
          guest_email?: string | null
          id?: string
          notes?: string | null
          original_amount?: number | null
          paid_amount?: number
          payment_status?: string
          phone: string
          room_number?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          booking_code?: string | null
          created_at?: string
          customer_name?: string
          discount_amount?: number | null
          discount_code?: string | null
          discount_type?: string | null
          discount_value?: number | null
          food_order_id?: string
          guest_email?: string | null
          id?: string
          notes?: string | null
          original_amount?: number | null
          paid_amount?: number
          payment_status?: string
          phone?: string
          room_number?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      gallery_images: {
        Row: {
          category: string
          created_at: string
          description_en: string | null
          description_vi: string | null
          id: string
          image_url: string
          is_active: boolean
          sort_order: number
          title_en: string | null
          title_vi: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description_en?: string | null
          description_vi?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          sort_order?: number
          title_en?: string | null
          title_vi?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description_en?: string | null
          description_vi?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          sort_order?: number
          title_en?: string | null
          title_vi?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      global_discounts: {
        Row: {
          allow_stacking: boolean
          applies_to: string
          applies_to_items: Json | null
          created_at: string
          discount_percent: number
          end_date: string
          id: string
          is_active: boolean
          max_total_discount: number
          start_date: string
          title_en: string
          title_vi: string
          updated_at: string
        }
        Insert: {
          allow_stacking?: boolean
          applies_to?: string
          applies_to_items?: Json | null
          created_at?: string
          discount_percent?: number
          end_date: string
          id?: string
          is_active?: boolean
          max_total_discount?: number
          start_date?: string
          title_en?: string
          title_vi?: string
          updated_at?: string
        }
        Update: {
          allow_stacking?: boolean
          applies_to?: string
          applies_to_items?: Json | null
          created_at?: string
          discount_percent?: number
          end_date?: string
          id?: string
          is_active?: boolean
          max_total_discount?: number
          start_date?: string
          title_en?: string
          title_vi?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          booking_id: string
          deposit_amount: number
          id: string
          invoice_number: string
          issued_at: string
          payment_status: string
          remaining_amount: number
          status: string | null
          total_vnd: number
        }
        Insert: {
          booking_id: string
          deposit_amount?: number
          id?: string
          invoice_number: string
          issued_at?: string
          payment_status?: string
          remaining_amount?: number
          status?: string | null
          total_vnd?: number
        }
        Update: {
          booking_id?: string
          deposit_amount?: number
          id?: string
          invoice_number?: string
          issued_at?: string
          payment_status?: string
          remaining_amount?: number
          status?: string | null
          total_vnd?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      itineraries: {
        Row: {
          audience: string | null
          budget_level: string | null
          content_json: Json | null
          created_at: string
          days: number | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          slug: string
          sort_order: number | null
          title: string
          type: string | null
          updated_at: string
        }
        Insert: {
          audience?: string | null
          budget_level?: string | null
          content_json?: Json | null
          created_at?: string
          days?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          slug: string
          sort_order?: number | null
          title: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          audience?: string | null
          budget_level?: string | null
          content_json?: Json | null
          created_at?: string
          days?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          slug?: string
          sort_order?: number | null
          title?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      live_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          session_id: string | null
          user_name: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          session_id?: string | null
          user_name?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          session_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_comments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_reactions: {
        Row: {
          created_at: string
          icon: string
          id: string
          session_id: string | null
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          session_id?: string | null
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_reactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_recordings: {
        Row: {
          created_at: string
          duration_sec: number | null
          id: string
          is_visible: boolean
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string
          view_count: number
        }
        Insert: {
          created_at?: string
          duration_sec?: number | null
          id?: string
          is_visible?: boolean
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url: string
          view_count?: number
        }
        Update: {
          created_at?: string
          duration_sec?: number | null
          id?: string
          is_visible?: boolean
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
          view_count?: number
        }
        Relationships: []
      }
      live_sessions: {
        Row: {
          created_at: string
          cta_label: string
          cta_link: string | null
          current_recording_id: string | null
          embed_url: string | null
          ended_at: string | null
          id: string
          is_active: boolean
          mode: string
          product_image: string | null
          product_price: number
          product_ref_id: string | null
          product_title: string | null
          product_type: string | null
          recording_url: string | null
          started_at: string | null
          title_vi: string
          updated_at: string
          viewer_count: number
        }
        Insert: {
          created_at?: string
          cta_label?: string
          cta_link?: string | null
          current_recording_id?: string | null
          embed_url?: string | null
          ended_at?: string | null
          id?: string
          is_active?: boolean
          mode?: string
          product_image?: string | null
          product_price?: number
          product_ref_id?: string | null
          product_title?: string | null
          product_type?: string | null
          recording_url?: string | null
          started_at?: string | null
          title_vi?: string
          updated_at?: string
          viewer_count?: number
        }
        Update: {
          created_at?: string
          cta_label?: string
          cta_link?: string | null
          current_recording_id?: string | null
          embed_url?: string | null
          ended_at?: string | null
          id?: string
          is_active?: boolean
          mode?: string
          product_image?: string | null
          product_price?: number
          product_ref_id?: string | null
          product_title?: string | null
          product_type?: string | null
          recording_url?: string | null
          started_at?: string | null
          title_vi?: string
          updated_at?: string
          viewer_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_current_recording_id_fkey"
            columns: ["current_recording_id"]
            isOneToOne: false
            referencedRelation: "live_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_prices: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label_en: string
          label_vi: string
          menu_item_id: string
          price_vnd: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label_en?: string
          label_vi?: string
          menu_item_id: string
          price_vnd?: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label_en?: string
          label_vi?: string
          menu_item_id?: string
          price_vnd?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_prices_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category: string
          created_at: string
          description_en: string | null
          description_vi: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_combo: boolean
          is_popular: boolean
          name_en: string
          name_vi: string
          price_vnd: number
          show_price: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description_en?: string | null
          description_vi?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_combo?: boolean
          is_popular?: boolean
          name_en?: string
          name_vi: string
          price_vnd?: number
          show_price?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description_en?: string | null
          description_vi?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_combo?: boolean
          is_popular?: boolean
          name_en?: string
          name_vi?: string
          price_vnd?: number
          show_price?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      nearby_attractions: {
        Row: {
          created_at: string
          description_en: string | null
          description_vi: string | null
          distance: string
          icon: string
          id: string
          image_url: string | null
          is_active: boolean
          name_en: string
          name_vi: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_en?: string | null
          description_vi?: string | null
          distance?: string
          icon?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name_en?: string
          name_vi: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_en?: string | null
          description_vi?: string | null
          distance?: string
          icon?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name_en?: string
          name_vi?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          applies_to_tier: string | null
          benefits_en: string[]
          benefits_vi: string[]
          created_at: string
          description_en: string | null
          description_vi: string | null
          discount_percent: number | null
          group_discount_tiers: Json | null
          icon: string
          id: string
          image_url: string | null
          is_active: boolean
          promo_type: string
          sort_order: number
          title_en: string
          title_vi: string
          updated_at: string
        }
        Insert: {
          applies_to_tier?: string | null
          benefits_en?: string[]
          benefits_vi?: string[]
          created_at?: string
          description_en?: string | null
          description_vi?: string | null
          discount_percent?: number | null
          group_discount_tiers?: Json | null
          icon?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          promo_type?: string
          sort_order?: number
          title_en?: string
          title_vi: string
          updated_at?: string
        }
        Update: {
          applies_to_tier?: string | null
          benefits_en?: string[]
          benefits_vi?: string[]
          created_at?: string
          description_en?: string | null
          description_vi?: string | null
          discount_percent?: number | null
          group_discount_tiers?: Json | null
          icon?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          promo_type?: string
          sort_order?: number
          title_en?: string
          title_vi?: string
          updated_at?: string
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          area: string | null
          avg_price: number | null
          category: string | null
          created_at: string
          description: string | null
          family_friendly: boolean | null
          featured: boolean | null
          id: string
          image_url: string | null
          local_famous: boolean | null
          map_link: string | null
          name: string
          open_hours: string | null
          price_tier: string | null
          seafood: boolean | null
          slug: string
          specialties: string[] | null
          status: string | null
          tags: string[] | null
          updated_at: string
          zone: string | null
        }
        Insert: {
          area?: string | null
          avg_price?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          family_friendly?: boolean | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          local_famous?: boolean | null
          map_link?: string | null
          name: string
          open_hours?: string | null
          price_tier?: string | null
          seafood?: boolean | null
          slug: string
          specialties?: string[] | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          zone?: string | null
        }
        Update: {
          area?: string | null
          avg_price?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          family_friendly?: boolean | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          local_famous?: boolean | null
          map_link?: string | null
          name?: string
          open_hours?: string | null
          price_tier?: string | null
          seafood?: boolean | null
          slug?: string
          specialties?: string[] | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          zone?: string | null
        }
        Relationships: []
      }
      room_amenities: {
        Row: {
          category: string
          created_at: string
          icon: string
          id: string
          is_active: boolean
          name_en: string
          name_vi: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          name_en?: string
          name_vi: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          name_en?: string
          name_vi?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      room_daily_availability: {
        Row: {
          created_at: string
          date: string
          id: string
          note: string | null
          room_id: string
          rooms_available: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          note?: string | null
          room_id: string
          rooms_available?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          room_id?: string
          rooms_available?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_daily_availability_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_images: {
        Row: {
          caption: string | null
          caption_en: string | null
          caption_vi: string | null
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          room_id: string
          sort_order: number
        }
        Insert: {
          caption?: string | null
          caption_en?: string | null
          caption_vi?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          room_id: string
          sort_order?: number
        }
        Update: {
          caption?: string | null
          caption_en?: string | null
          caption_vi?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          room_id?: string
          sort_order?: number
        }
        Relationships: []
      }
      room_monthly_prices: {
        Row: {
          created_at: string
          id: string
          month: number
          price_sunday: number
          price_weekday: number
          price_weekend: number
          room_id: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          month: number
          price_sunday?: number
          price_weekday?: number
          price_weekend?: number
          room_id: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          month?: number
          price_sunday?: number
          price_weekday?: number
          price_weekend?: number
          room_id?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "room_monthly_prices_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_popup_settings: {
        Row: {
          badge_color: string | null
          badge_en: string | null
          badge_vi: string | null
          created_at: string
          cta_primary_en: string | null
          cta_primary_vi: string | null
          cta_secondary_en: string | null
          cta_secondary_vi: string | null
          highlights_en: string[] | null
          highlights_vi: string[] | null
          id: string
          is_active: boolean
          policy_en: string | null
          policy_vi: string | null
          room_id: string
          short_pitch_en: string | null
          short_pitch_vi: string | null
          updated_at: string
        }
        Insert: {
          badge_color?: string | null
          badge_en?: string | null
          badge_vi?: string | null
          created_at?: string
          cta_primary_en?: string | null
          cta_primary_vi?: string | null
          cta_secondary_en?: string | null
          cta_secondary_vi?: string | null
          highlights_en?: string[] | null
          highlights_vi?: string[] | null
          id?: string
          is_active?: boolean
          policy_en?: string | null
          policy_vi?: string | null
          room_id: string
          short_pitch_en?: string | null
          short_pitch_vi?: string | null
          updated_at?: string
        }
        Update: {
          badge_color?: string | null
          badge_en?: string | null
          badge_vi?: string | null
          created_at?: string
          cta_primary_en?: string | null
          cta_primary_vi?: string | null
          cta_secondary_en?: string | null
          cta_secondary_vi?: string | null
          highlights_en?: string[] | null
          highlights_vi?: string[] | null
          id?: string
          is_active?: boolean
          policy_en?: string | null
          policy_vi?: string | null
          room_id?: string
          short_pitch_en?: string | null
          short_pitch_vi?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      room_price_overrides: {
        Row: {
          created_at: string
          id: string
          note: string | null
          override_date: string
          price_vnd: number
          room_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          override_date: string
          price_vnd: number
          room_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          override_date?: string
          price_vnd?: number
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_price_overrides_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          amenities: string[] | null
          bed_type: string
          capacity: number
          created_at: string
          description_en: string | null
          description_ja: string | null
          description_vi: string | null
          description_zh: string | null
          has_balcony: boolean
          id: string
          image_url: string | null
          is_active: boolean | null
          name_en: string
          name_ja: string
          name_vi: string
          name_zh: string
          peak_multiplier: number | null
          price_vnd: number
          size_sqm: number
          total_rooms: number
          updated_at: string
          view_type: string
          weekend_multiplier: number | null
        }
        Insert: {
          amenities?: string[] | null
          bed_type?: string
          capacity?: number
          created_at?: string
          description_en?: string | null
          description_ja?: string | null
          description_vi?: string | null
          description_zh?: string | null
          has_balcony?: boolean
          id: string
          image_url?: string | null
          is_active?: boolean | null
          name_en: string
          name_ja: string
          name_vi: string
          name_zh: string
          peak_multiplier?: number | null
          price_vnd?: number
          size_sqm?: number
          total_rooms?: number
          updated_at?: string
          view_type?: string
          weekend_multiplier?: number | null
        }
        Update: {
          amenities?: string[] | null
          bed_type?: string
          capacity?: number
          created_at?: string
          description_en?: string | null
          description_ja?: string | null
          description_vi?: string | null
          description_zh?: string | null
          has_balcony?: boolean
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name_en?: string
          name_ja?: string
          name_vi?: string
          name_zh?: string
          peak_multiplier?: number | null
          price_vnd?: number
          size_sqm?: number
          total_rooms?: number
          updated_at?: string
          view_type?: string
          weekend_multiplier?: number | null
        }
        Relationships: []
      }
      search_logs: {
        Row: {
          budget: number | null
          created_at: string
          id: string
          keyword: string | null
          people_count: number | null
          result_count: number | null
          session_id: string | null
          vibes: string[] | null
          zone: string | null
        }
        Insert: {
          budget?: number | null
          created_at?: string
          id?: string
          keyword?: string | null
          people_count?: number | null
          result_count?: number | null
          session_id?: string | null
          vibes?: string[] | null
          zone?: string | null
        }
        Update: {
          budget?: number | null
          created_at?: string
          id?: string
          keyword?: string | null
          people_count?: number | null
          result_count?: number | null
          session_id?: string | null
          vibes?: string[] | null
          zone?: string | null
        }
        Relationships: []
      }
      service_bookings: {
        Row: {
          booking_date: string
          booking_time: string | null
          created_at: string
          discount_percent: number
          guest_email: string | null
          guest_name: string
          guest_phone: string
          guests_count: number
          id: string
          notes: string | null
          original_price_vnd: number
          payment_method: string
          pickup_location: string | null
          service_id: string
          status: string
          total_price_vnd: number
          updated_at: string
          user_id: string | null
          vehicle_type: string | null
        }
        Insert: {
          booking_date: string
          booking_time?: string | null
          created_at?: string
          discount_percent?: number
          guest_email?: string | null
          guest_name: string
          guest_phone: string
          guests_count?: number
          id?: string
          notes?: string | null
          original_price_vnd?: number
          payment_method?: string
          pickup_location?: string | null
          service_id: string
          status?: string
          total_price_vnd?: number
          updated_at?: string
          user_id?: string | null
          vehicle_type?: string | null
        }
        Update: {
          booking_date?: string
          booking_time?: string | null
          created_at?: string
          discount_percent?: number
          guest_email?: string | null
          guest_name?: string
          guest_phone?: string
          guests_count?: number
          id?: string
          notes?: string | null
          original_price_vnd?: number
          payment_method?: string
          pickup_location?: string | null
          service_id?: string
          status?: string
          total_price_vnd?: number
          updated_at?: string
          user_id?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: string
          created_at: string
          description_en: string | null
          description_vi: string | null
          icon: string
          id: string
          image_url: string | null
          is_active: boolean
          is_bookable: boolean
          is_free: boolean
          name_en: string
          name_vi: string
          price_vnd: number
          schedule: string | null
          sort_order: number
          updated_at: string
          vehicle_types: Json | null
        }
        Insert: {
          category?: string
          created_at?: string
          description_en?: string | null
          description_vi?: string | null
          icon?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_bookable?: boolean
          is_free?: boolean
          name_en?: string
          name_vi: string
          price_vnd?: number
          schedule?: string | null
          sort_order?: number
          updated_at?: string
          vehicle_types?: Json | null
        }
        Update: {
          category?: string
          created_at?: string
          description_en?: string | null
          description_vi?: string | null
          icon?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_bookable?: boolean
          is_free?: boolean
          name_en?: string
          name_vi?: string
          price_vnd?: number
          schedule?: string | null
          sort_order?: number
          updated_at?: string
          vehicle_types?: Json | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      smart_pricing_rules: {
        Row: {
          applies_to: string
          applies_to_items: Json | null
          badge_text_en: string | null
          badge_text_vi: string | null
          created_at: string
          day_of_week: number | null
          discount_percent: number
          id: string
          is_active: boolean
          min_days_advance: number | null
          occupancy_threshold: number | null
          rule_type: string
          sort_order: number
          specific_date: string | null
          title_en: string
          title_vi: string
          updated_at: string
        }
        Insert: {
          applies_to?: string
          applies_to_items?: Json | null
          badge_text_en?: string | null
          badge_text_vi?: string | null
          created_at?: string
          day_of_week?: number | null
          discount_percent?: number
          id?: string
          is_active?: boolean
          min_days_advance?: number | null
          occupancy_threshold?: number | null
          rule_type?: string
          sort_order?: number
          specific_date?: string | null
          title_en?: string
          title_vi?: string
          updated_at?: string
        }
        Update: {
          applies_to?: string
          applies_to_items?: Json | null
          badge_text_en?: string | null
          badge_text_vi?: string | null
          created_at?: string
          day_of_week?: number | null
          discount_percent?: number
          id?: string
          is_active?: boolean
          min_days_advance?: number | null
          occupancy_threshold?: number | null
          rule_type?: string
          sort_order?: number
          specific_date?: string | null
          title_en?: string
          title_vi?: string
          updated_at?: string
        }
        Relationships: []
      }
      special_date_prices: {
        Row: {
          created_at: string
          date: string
          id: string
          is_active: boolean
          note: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          is_active?: boolean
          note?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_active?: boolean
          note?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      special_room_prices: {
        Row: {
          created_at: string
          id: string
          price: number
          room_id: string
          special_date_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          price?: number
          room_id: string
          special_date_id: string
        }
        Update: {
          created_at?: string
          id?: string
          price?: number
          room_id?: string
          special_date_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "special_room_prices_special_date_id_fkey"
            columns: ["special_date_id"]
            isOneToOne: false
            referencedRelation: "special_date_prices"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      voucher_codes: {
        Row: {
          campaign_name: string
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          end_date: string
          id: string
          start_date: string
          status: string
          updated_at: string
          usage_limit: number
          used_count: number
        }
        Insert: {
          campaign_name?: string
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          end_date: string
          id?: string
          start_date?: string
          status?: string
          updated_at?: string
          usage_limit?: number
          used_count?: number
        }
        Update: {
          campaign_name?: string
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          end_date?: string
          id?: string
          start_date?: string
          status?: string
          updated_at?: string
          usage_limit?: number
          used_count?: number
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          matched_booking_code: string | null
          processed: boolean
          source: string
          transaction_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          matched_booking_code?: string | null
          processed?: boolean
          source?: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          matched_booking_code?: string | null
          processed?: boolean
          source?: string
          transaction_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
