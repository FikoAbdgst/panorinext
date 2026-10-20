import type { AlphaImageData } from "./types";

/** Memuat gambar dari URL atau object URL. */
export function loadImage(src: string, crossOrigin = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gagal memuat gambar"));
    img.src = src;
  });
}

/** Memuat File lokal menjadi elemen gambar + object URL (panggil revokeObjectUrl bila selesai). */
export async function loadImageFromFile(
  file: File,
): Promise<{ image: HTMLImageElement; objectUrl: string }> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    return { image, objectUrl };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

/** Mengambil ImageData (RGBA) dari sebuah elemen gambar. */
export function getImageData(image: CanvasImageSource, width: number, height: number): AlphaImageData {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Canvas 2D context tidak tersedia");
  }
  ctx.drawImage(image, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}

/** Memuat Blob gambar dan mengembalikan object URL yang harus di-revoke pemanggil. */
export async function loadImageFromBlob(
  blob: Blob,
): Promise<{ image: HTMLImageElement; objectUrl: string }> {
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await loadImage(objectUrl);
    return { image, objectUrl };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

/**
 * Memuat gambar dari URL. Fetch ke Blob diprioritaskan agar canvas tidak
 * ter-taint; fallback ke elemen gambar dipakai bila fetch gagal.
 */
export async function loadImageFromUrl(
  src: string,
): Promise<{ image: HTMLImageElement; objectUrl: string | null }> {
  try {
    const response = await fetch(src, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Gagal memuat gambar (${response.status})`);
    }
    const blob = await response.blob();
    return await loadImageFromBlob(blob);
  } catch {
    const image = await loadImage(src, true);
    return { image, objectUrl: null };
  }
}

/** Mengubah data piksel RGBA menjadi Blob PNG. */
export function imageDataToPngBlob(image: AlphaImageData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return Promise.reject(new Error("Canvas 2D context tidak tersedia"));
  }
  const pixels = new ImageData(
    new Uint8ClampedArray(image.data),
    image.width,
    image.height,
  );
  ctx.putImageData(pixels, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }
      reject(new Error("Gagal membuat PNG"));
    }, "image/png");
  });
}
