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
          combo_name: string
          created_at: string
          dining_item_id: string
          id: string
          price_vnd: number
          quantity: number
        }
        Insert: {
          booking_id: string
          combo_name?: string
          created_at?: string
          dining_item_id: string
          id?: string
          price_vnd?: number
          quantity?: number
        }
        Update: {
          booking_id?: string
          combo_name?: string
          created_at?: string
          dining_item_id?: string
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
            foreignKeyName: "booking_combos_dining_item_id_fkey"
            columns: ["dining_item_id"]
            isOneToOne: false
            referencedRelation: "dining_items"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_code: string
          check_in: string
          check_out: string
          company_name: string | null
          created_at: string
          decoration_notes: string | null
          deposit_amount: number
          group_size: number | null
          guest_email: string | null
          guest_name: string
          guest_notes: string | null
          guest_phone: string
          guests_count: number
          id: string
          language: string | null
          member_discount_amount: number | null
          member_discount_percent: number | null
          original_price_vnd: number | null
          payment_status: string
          promotion_discount_amount: number | null
          promotion_discount_percent: number | null
          promotion_id: string | null
          remaining_amount: number
          room_id: string
          room_quantity: number
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
          company_name?: string | null
          created_at?: string
          decoration_notes?: string | null
          deposit_amount?: number
          group_size?: number | null
          guest_email?: string | null
          guest_name: string
          guest_notes?: string | null
          guest_phone: string
          guests_count?: number
          id?: string
          language?: string | null
          member_discount_amount?: number | null
          member_discount_percent?: number | null
          original_price_vnd?: number | null
          payment_status?: string
          promotion_discount_amount?: number | null
          promotion_discount_percent?: number | null
          promotion_id?: string | null
          remaining_amount?: number
          room_id: string
          room_quantity?: number
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
          company_name?: string | null
          created_at?: string
          decoration_notes?: string | null
          deposit_amount?: number
          group_size?: number | null
          guest_email?: string | null
          guest_name?: string
          guest_notes?: string | null
          guest_phone?: string
          guests_count?: number
          id?: string
          language?: string | null
          member_discount_amount?: number | null
          member_discount_percent?: number | null
          original_price_vnd?: number | null
          payment_status?: string
          promotion_discount_amount?: number | null
          promotion_discount_percent?: number | null
          promotion_id?: string | null
          remaining_amount?: number
          room_id?: string
          room_quantity?: number
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
          food_order_id: string
          guest_email: string | null
          id: string
          notes: string | null
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
          food_order_id: string
          guest_email?: string | null
          id?: string
          notes?: string | null
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
          food_order_id?: string
          guest_email?: string | null
          id?: string
          notes?: string | null
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
      menu_items: {
        Row: {
          category: string
          created_at: string
          description_en: string | null
          description_vi: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_popular: boolean
          name_en: string
          name_vi: string
          price_vnd: number
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
          is_popular?: boolean
          name_en?: string
          name_vi: string
          price_vnd?: number
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
          is_popular?: boolean
          name_en?: string
          name_vi?: string
          price_vnd?: number
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
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          room_id: string
          sort_order: number
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          room_id: string
          sort_order?: number
        }
        Update: {
          caption?: string | null
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
          capacity: number
          created_at: string
          description_en: string | null
          description_ja: string | null
          description_vi: string | null
          description_zh: string | null
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
          updated_at: string
          weekend_multiplier: number | null
        }
        Insert: {
          amenities?: string[] | null
          capacity?: number
          created_at?: string
          description_en?: string | null
          description_ja?: string | null
          description_vi?: string | null
          description_zh?: string | null
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
          updated_at?: string
          weekend_multiplier?: number | null
        }
        Update: {
          amenities?: string[] | null
          capacity?: number
          created_at?: string
          description_en?: string | null
          description_ja?: string | null
          description_vi?: string | null
          description_zh?: string | null
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
          updated_at?: string
          weekend_multiplier?: number | null
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
