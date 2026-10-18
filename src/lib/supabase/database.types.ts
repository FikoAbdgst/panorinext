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
      testimonials: {
        Row: {
          id: number;
          rating: number;
          emoji: string | null;
          name: string | null;
          message: string | null;
          frame_id: number | null;
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
      transactions: {
        Row: {
          id: number;
          order_id: string;
          frame_id: number;
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
          frame_id: number;
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
          frame_id?: number;
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
    };
    Enums: {
      transaction_status: TransactionStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
