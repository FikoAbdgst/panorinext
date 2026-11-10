export type FrameAccessType = "free" | "premium";

export type FrameSlot = {
  /** Kiri atas kotak slot sebelum diputar. */
  x: number;
  /** Atas kotak slot sebelum diputar. */
  y: number;
  /** Lebar slot lokal (mengikuti kemiringan slot). */
  w: number;
  /** Tinggi slot lokal (mengikuti kemiringan slot). */
  h: number;
  /**
   * Sudut putar slot dalam derajat, searah jarum jam, mengelilingi pusat slot.
   * Absen/0 berarti slot tegak lurus seperti frame biasa. Slot lama tanpa
   * properti ini tetap kompatibel.
   */
  rotation?: number;
};

/**
 * Representasi minimal data gambar yang hanya butuh kanal alpha.
 * Sengaja bukan `ImageData` (DOM) agar fungsi deteksi bisa diuji di Node.
 * `ImageData` dari browser kompatibel secara struktural.
 */
export type AlphaImageData = {
  data: Uint8ClampedArray | Uint8Array;
  width: number;
  height: number;
};

/** Baris frame pada katalog publik `/frame`. */
export type CatalogFrame = {
  id: number;
  name: string;
  image_path: string | null;
  price: number;
  access_type: FrameAccessType;
  used: number;
  width: number;
  height: number;
  slots: FrameSlot[];
  category_icon: string | null;
  category_name: string | null;
};

export type CatalogFilters = {
  categoryId?: number | null;
  freeOnly?: boolean;
  sortPopular?: "desc" | null;
  /** Filter jumlah slot foto pada frame. `null`/absen = semua. */
  slots?: number | null;
};
