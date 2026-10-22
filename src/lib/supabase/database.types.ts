import type { FrameSlot } from "../frames/types";

export type { FrameSlot };

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TransactionStatus = "pending" | "approved" | "rejected";
export type PaymentMethod = "bank_transfer" | "qris";
export type FrameAccessType = "free" | "premium";

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          id: string;
          name: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: number;
          name: string;
          icon: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      frames: {
        Row: {
          id: number;
          name: string;
          slug: string;
          image_path: string | null;
          price: number;
          access_type: FrameAccessType;
          used: number;
          width: number;
          height: number;
          slots: FrameSlot[];
          category_id: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          slug: string;
          image_path?: string | null;
          price?: number;
          access_type?: FrameAccessType;
          used?: number;
          width: number;
          height: number;
          slots?: FrameSlot[];
          category_id?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          slug?: string;
          image_path?: string | null;
          price?: number;
          access_type?: FrameAccessType;
          used?: number;
          width?: number;
          height?: number;
          slots?: FrameSlot[];
          category_id?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "frames_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      packs: {
        Row: {
          id: number;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          duration_days: number;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          slug: string;
          description?: string | null;
          price?: number;
          duration_days?: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          slug?: string;
          description?: string | null;
          price?: number;
          duration_days?: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pack_frames: {
        Row: {
          pack_id: number;
          frame_id: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          pack_id: number;
          frame_id: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          pack_id?: number;
          frame_id?: number;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pack_frames_pack_id_fkey";
            columns: ["pack_id"];
            isOneToOne: false;
            referencedRelation: "packs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pack_frames_frame_id_fkey";
            columns: ["frame_id"];
            isOneToOne: false;
            referencedRelation: "frames";
            referencedColumns: ["id"];
          },
        ];
      };
      transaction_frames: {
        Row: {
          transaction_id: number;
          frame_id: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          transaction_id: number;
          frame_id: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          transaction_id?: number;
          frame_id?: number;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transaction_frames_transaction_id_fkey";
            columns: ["transaction_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transaction_frames_frame_id_fkey";
            columns: ["frame_id"];
            isOneToOne: false;
            referencedRelation: "frames";
            referencedColumns: ["id"];
          },
        ];
      };
      testimonials: {
        Row: {
          id: number;
          rating: number;
          emoji: string | null;
          name: string | null;
          message: string | null;
          frame_id: number | null;
          photo_path: string | null;
          photo_consent: boolean;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          rating: number;
          emoji?: string | null;
          name?: string | null;
          message?: string | null;
          frame_id?: number | null;
          photo_path?: string | null;
          photo_consent?: boolean;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          rating?: number;
          emoji?: string | null;
          name?: string | null;
          message?: string | null;
          frame_id?: number | null;
          photo_path?: string | null;
          photo_consent?: boolean;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "testimonials_frame_id_fkey";
            columns: ["frame_id"];
            isOneToOne: false;
            referencedRelation: "frames";
            referencedColumns: ["id"];
          },
        ];
      };
      premium_access: {
        Row: {
          id: number;
          transaction_id: number | null;
          pack_id: number;
          code: string;
          customer_name: string | null;
          whatsapp_number: string | null;
          first_used_at: string | null;
          expires_at: string | null;
          session_token: string | null;
          revoked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          transaction_id?: number | null;
          pack_id: number;
          code: string;
          customer_name?: string | null;
          whatsapp_number?: string | null;
          first_used_at?: string | null;
          expires_at?: string | null;
          session_token?: string | null;
          revoked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          transaction_id?: number | null;
          pack_id?: number;
          code?: string;
          customer_name?: string | null;
          whatsapp_number?: string | null;
          first_used_at?: string | null;
          expires_at?: string | null;
          session_token?: string | null;
          revoked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "premium_access_transaction_id_fkey";
            columns: ["transaction_id"];
            isOneToOne: true;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "premium_access_pack_id_fkey";
            columns: ["pack_id"];
            isOneToOne: false;
            referencedRelation: "packs";
            referencedColumns: ["id"];
          },
        ];
      };
      premium_access_frames: {
        Row: {
          access_id: number;
          frame_id: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          access_id: number;
          frame_id: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          access_id?: number;
          frame_id?: number;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "premium_access_frames_access_id_fkey";
            columns: ["access_id"];
            isOneToOne: false;
            referencedRelation: "premium_access";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "premium_access_frames_frame_id_fkey";
            columns: ["frame_id"];
            isOneToOne: false;
            referencedRelation: "frames";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: {
          id: number;
          order_id: string;
          frame_id: number | null;
          pack_id: number | null;
          customer_name: string;
          whatsapp_number: string | null;
          payment_method: PaymentMethod;
          amount: number;
          payment_proof: string | null;
          status: TransactionStatus;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          // order_id & amount diisi otomatis oleh trigger set_transaction_defaults.
          order_id?: string;
          frame_id?: number | null;
          pack_id?: number | null;
          customer_name: string;
          whatsapp_number?: string | null;
          payment_method: PaymentMethod;
          amount?: number;
          payment_proof?: string | null;
          status?: TransactionStatus;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          order_id?: string;
          frame_id?: number | null;
          pack_id?: number | null;
          customer_name?: string;
          whatsapp_number?: string | null;
          payment_method?: PaymentMethod;
          amount?: number;
          payment_proof?: string | null;
          status?: TransactionStatus;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_frame_id_fkey";
            columns: ["frame_id"];
            isOneToOne: false;
            referencedRelation: "frames";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_pack_id_fkey";
            columns: ["pack_id"];
            isOneToOne: false;
            referencedRelation: "packs";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      increment_frame_used: {
        Args: { p_frame_id: number };
        Returns: undefined;
      };
      get_transaction_status: {
        Args: { p_order_id: string };
        Returns: TransactionStatus | null;
      };
      approve_transaction_with_code: {
        Args: { p_transaction_id: number };
        Returns: {
          access_id: number;
          room_code: string;
          pack_id: number;
          pack_name: string;
          first_used_at: string | null;
          expires_at: string | null;
          revoked_at: string | null;
        }[];
      };
      redeem_premium_code: {
        Args: { p_code: string };
        Returns: {
          access_id: number;
          pack_id: number;
          pack_name: string;
          room_code: string;
          first_used_at: string;
          expires_at: string;
          session_token: string;
        }[];
      };
      generate_premium_code: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      transaction_status: TransactionStatus;
      frame_access_type: FrameAccessType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
