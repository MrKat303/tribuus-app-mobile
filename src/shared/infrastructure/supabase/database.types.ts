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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chat_conversation_members: {
        Row: {
          conversation_id: string
          joined_at: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          accent: string
          created_at: string
          id: string
          kind: string
          name: string | null
          updated_at: string
        }
        Insert: {
          accent?: string
          created_at?: string
          id?: string
          kind: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          accent?: string
          created_at?: string
          id?: string
          kind?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      chat_message_reactions: {
        Row: {
          created_at: string
          emoji: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          aspect_ratio: number | null
          audio_duration_ms: number | null
          audio_uri: string | null
          audio_waveform: Json | null
          conversation_id: string
          id: string
          image_uri: string | null
          reactions: Json
          reply_to: Json | null
          sender_id: string
          sent_at: string
          text: string | null
        }
        Insert: {
          aspect_ratio?: number | null
          audio_duration_ms?: number | null
          audio_uri?: string | null
          audio_waveform?: Json | null
          conversation_id: string
          id: string
          image_uri?: string | null
          reactions?: Json
          reply_to?: Json | null
          sender_id: string
          sent_at?: string
          text?: string | null
        }
        Update: {
          aspect_ratio?: number | null
          audio_duration_ms?: number | null
          audio_uri?: string | null
          audio_waveform?: Json | null
          conversation_id?: string
          id?: string
          image_uri?: string | null
          reactions?: Json
          reply_to?: Json | null
          sender_id?: string
          sent_at?: string
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: number
          created_at: string
          user_id: string
        }
        Insert: {
          comment_id: number
          created_at?: string
          user_id: string
        }
        Update: {
          comment_id?: number
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          created_at: string
          id: string
          is_open: boolean
          location: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_open?: boolean
          location: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          is_open?: boolean
          location?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      community_members: {
        Row: {
          community_id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          community_id: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          community_id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      place_recommendations: {
        Row: {
          author_id: string
          confidence: number
          created_at: string
          id: string
          photo_uri: string | null
          place_id: string
          tags: string[]
          text: string
          updated_at: string
        }
        Insert: {
          author_id: string
          confidence?: number
          created_at?: string
          id?: string
          photo_uri?: string | null
          place_id: string
          tags?: string[]
          text: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          confidence?: number
          created_at?: string
          id?: string
          photo_uri?: string | null
          place_id?: string
          tags?: string[]
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "place_recommendations_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "place_recommendations_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          activity_score: number
          address: string
          category: string
          created_at: string
          id: string
          local_relevance: number
          location: unknown
          name: string
          neighborhood: string | null
          owner_id: string
          popularity: number
          provider: string
          provider_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          activity_score?: number
          address?: string
          category: string
          created_at?: string
          id?: string
          local_relevance?: number
          location: unknown
          name: string
          neighborhood?: string | null
          owner_id: string
          popularity?: number
          provider: string
          provider_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          activity_score?: number
          address?: string
          category?: string
          created_at?: string
          id?: string
          local_relevance?: number
          location?: unknown
          name?: string
          neighborhood?: string | null
          owner_id?: string
          popularity?: number
          provider?: string
          provider_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      poll_options: {
        Row: {
          id: number
          label: string
          position: number
          post_id: number
          vote_count: number
        }
        Insert: {
          id?: never
          label: string
          position: number
          post_id: number
          vote_count?: number
        }
        Update: {
          id?: never
          label?: string
          position?: number
          post_id?: number
          vote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "post_polls"
            referencedColumns: ["post_id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          option_id: number
          post_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          option_id: number
          post_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          option_id?: number
          post_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_post_id_option_id_fkey"
            columns: ["post_id", "option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["post_id", "id"]
          },
          {
            foreignKeyName: "poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_bookmarks: {
        Row: {
          created_at: string
          post_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: number
          like_count: number
          parent_comment_id: number | null
          post_id: number
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: never
          like_count?: number
          parent_comment_id?: number | null
          post_id: number
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: never
          like_count?: number
          parent_comment_id?: number | null
          post_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_images: {
        Row: {
          created_at: string
          id: number
          position: number
          post_id: number
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: never
          position: number
          post_id: number
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: never
          position?: number
          post_id?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_images_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          post_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_polls: {
        Row: {
          created_at: string
          post_id: number
          question: string
        }
        Insert: {
          created_at?: string
          post_id: number
          question: string
        }
        Update: {
          created_at?: string
          post_id?: number
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_polls_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          audio_name: string | null
          audio_path: string | null
          author_id: string
          category: string
          comment_count: number
          community_id: string
          content: string
          created_at: string
          has_poll: boolean
          id: number
          image_path: string | null
          like_count: number
          location: string | null
          published_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          audio_name?: string | null
          audio_path?: string | null
          author_id: string
          category?: string
          comment_count?: number
          community_id: string
          content?: string
          created_at?: string
          has_poll?: boolean
          id?: never
          image_path?: string | null
          like_count?: number
          location?: string | null
          published_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          audio_name?: string | null
          audio_path?: string | null
          author_id?: string
          category?: string
          comment_count?: number
          community_id?: string
          content?: string
          created_at?: string
          has_poll?: boolean
          id?: never
          image_path?: string | null
          like_count?: number
          location?: string | null
          published_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_interests: {
        Row: {
          created_at: string
          interest: string
          user_id: string
        }
        Insert: {
          created_at?: string
          interest: string
          user_id: string
        }
        Update: {
          created_at?: string
          interest?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          bio: string
          created_at: string
          display_name: string
          id: string
          initials: string
          location: string
          onboarding_completed_at: string | null
          primary_community_id: string | null
          updated_at: string
          username: string
        }
        Insert: {
          avatar_path?: string | null
          bio?: string
          created_at?: string
          display_name: string
          id: string
          initials: string
          location?: string
          onboarding_completed_at?: string | null
          primary_community_id?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          avatar_path?: string | null
          bio?: string
          created_at?: string
          display_name?: string
          id?: string
          initials?: string
          location?: string
          onboarding_completed_at?: string | null
          primary_community_id?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_primary_community_id_fkey"
            columns: ["primary_community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_locations: {
        Row: {
          accuracy_m: number | null
          consented_at: string | null
          country_code: string | null
          created_at: string
          latitude: number | null
          locality: string
          longitude: number | null
          region: string | null
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy_m?: number | null
          consented_at?: string | null
          country_code?: string | null
          created_at?: string
          latitude?: number | null
          locality: string
          longitude?: number | null
          region?: string | null
          source: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy_m?: number | null
          consented_at?: string | null
          country_code?: string | null
          created_at?: string
          latitude?: number | null
          locality?: string
          longitude?: number | null
          region?: string | null
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_locations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_onboarding: {
        Args: {
          p_accuracy_m?: number
          p_bio: string
          p_community_id: string
          p_country_code?: string
          p_display_name: string
          p_interests: string[]
          p_latitude?: number
          p_location_label: string
          p_location_source?: string
          p_longitude?: number
          p_region?: string
          p_username: string
        }
        Returns: {
          avatar_path: string | null
          bio: string
          created_at: string
          display_name: string
          id: string
          initials: string
          location: string
          onboarding_completed_at: string | null
          primary_community_id: string | null
          updated_at: string
          username: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      list_chat_conversations: {
        Args: never
        Returns: {
          accent: string
          id: string
          initials: string
          kind: string
          last_message: string
          name: string
          online: boolean
          unread_count: number
          updated_at: string
        }[]
      }
      places_in_view: {
        Args: {
          max_lat: number
          max_long: number
          min_lat: number
          min_long: number
          result_limit?: number
        }
        Returns: {
          activity_score: number
          address: string
          category: string
          created_at: string
          id: string
          latitude: number
          local_relevance: number
          longitude: number
          name: string
          neighborhood: string
          owner_id: string
          popularity: number
          provider: string
          provider_id: string
        }[]
      }
      publish_feed_post: {
        Args: {
          p_audio_name?: string
          p_audio_path?: string
          p_image_paths?: string[]
          p_poll_options?: string[]
          p_poll_question?: string
          p_post_id: number
        }
        Returns: number
      }
      set_feed_poll_vote: {
        Args: { p_option_id: number; p_post_id: number }
        Returns: undefined
      }
      upsert_place_recommendation: {
        Args: {
          p_photo_uri?: string
          p_place_id: string
          p_tags: string[]
          p_text: string
        }
        Returns: {
          author_id: string
          confidence: number
          created_at: string
          id: string
          photo_uri: string | null
          place_id: string
          tags: string[]
          text: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "place_recommendations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
