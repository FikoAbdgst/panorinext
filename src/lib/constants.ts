export const APP_NAME = "PanoriCam";

export const BRAND = {
  primary: "#BF3131",
  primaryLight: "#F16767",
  cream: "#FEF3E2",
} as const;

/**
 * Ukuran "standar" overlay frame, dalam piksel.
 * Hanya pedoman lunak: admin tetap boleh mengunggah ukuran lain, tapi akan
 * diberi peringatan (bukan diblokir) jika berbeda dari nilai ini.
 */
export const FRAME_STANDARD_SIZE = { width: 380, height: 1000 } as const;

/** Bucket Supabase Storage. */
export const STORAGE_BUCKETS = {
  frames: "frames",
  paymentProofs: "payment-proofs",
  photoResults: "photo-results",
} as const;
