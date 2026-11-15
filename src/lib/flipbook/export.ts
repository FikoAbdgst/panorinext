import { getCoverSourceRect } from "@/lib/frames/geometry";
import { getSlotRotation } from "@/lib/frames/rotation";
import type { FrameSlot } from "@/lib/frames/types";
import type {
  FlipbookAsset,
  FlipbookFrame,
} from "@/lib/flipbook/types";

/** Halaman flipbook memakai rasio 4:3, sama seperti frame kamera. */
export const FLIPBOOK_PAGE_WIDTH = 1200;
export const FLIPBOOK_PAGE_HEIGHT = 900;
export const FLIPBOOK_PAGE_ASPECT = FLIPBOOK_PAGE_WIDTH / FLIPBOOK_PAGE_HEIGHT;

const FONT_STACK = '"Poppins", "Segoe UI", system-ui, sans-serif';
const PAPER = "#FFFBF3";
const PAPER_DARK = "#FEF3E2";
const INK = "#2A0A0A";
const MUTED = "#7A5A50";
const RED = "#BF3131";

export type FlipbookMeta = {
  dateLabel: string;
};

export type FlipbookGifOptions = {
  photos: string[];
  meta: FlipbookMeta;
  frame?: FlipbookFrame | null;
  onProgress?: (percentage: number, text: string) => void;
};

/** Overlay PNG yang sudah dimuat ke elemen gambar. */
type LoadedAsset = {
  image: HTMLImageElement;
  width: number;
  height: number;
  slots: FrameSlot[];
};

/** Kumpulan overlay satu tipe frame flipbook. */
type LoadedFrameAssets = {
  cover: LoadedAsset | null;
  pages: Array<LoadedAsset | null>;
  back: LoadedAsset | null;
};

type PageKind =
  | { type: "cover" }
  | { type: "photo"; index: number }
  | { type: "back" };

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context tidak tersedia");
  }
  return ctx;
}

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Gagal memuat foto flipbook"));
    image.src = src;
  });
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return;
  }
  const { sx, sy, sw, sh } = getCoverSourceRect(
    sourceWidth,
    sourceHeight,
    width,
    height,
  );
  ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);
}

async function loadAsset(
  asset: FlipbookAsset | null | undefined,
): Promise<LoadedAsset | null> {
  if (!asset || !asset.imageUrl) {
    return null;
  }
  const image = await loadImageElement(asset.imageUrl);
  return {
    image,
    width: asset.width > 0 ? asset.width : image.naturalWidth,
    height: asset.height > 0 ? asset.height : image.naturalHeight,
    slots: asset.slots,
  };
}

async function loadFrameAssets(
  frame: FlipbookFrame | null | undefined,
): Promise<LoadedFrameAssets | null> {
  if (!frame) {
    return null;
  }
  const [cover, back, pages] = await Promise.all([
    loadAsset(frame.cover),
    loadAsset(frame.back),
    Promise.all(frame.pages.map((asset) => loadAsset(asset))),
  ]);
  return { cover, back, pages };
}

/**
 * Menggambar foto ke dalam kotak halaman memakai overlay PNG katalog.
 *
 * Overlay diskalakan agar pas (contain) di dalam kotak, lalu foto yang sama
 * mengisi seluruh slot frame. Bagian transparan overlay menampilkan foto,
 * bagian opaque menutupinya seperti photostrip.
 */
function drawFramedPhoto(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  frame: LoadedAsset,
  box: { x: number; y: number; w: number; h: number },
): void {
  const frameWidth = frame.width;
  const frameHeight = frame.height;
  if (frameWidth <= 0 || frameHeight <= 0) {
    drawCoverImage(ctx, image, box.x, box.y, box.w, box.h);
    return;
  }

  const scale = Math.min(box.w / frameWidth, box.h / frameHeight);
  const drawWidth = frameWidth * scale;
  const drawHeight = frameHeight * scale;
  const offsetX = box.x + (box.w - drawWidth) / 2;
  const offsetY = box.y + (box.h - drawHeight) / 2;

  if (frame.slots.length === 0) {
    drawCoverImage(ctx, image, offsetX, offsetY, drawWidth, drawHeight);
    ctx.drawImage(frame.image, offsetX, offsetY, drawWidth, drawHeight);
    return;
  }

  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;
  if (imageWidth <= 0 || imageHeight <= 0) {
    return;
  }

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  for (const slot of frame.slots) {
    if (slot.w <= 0 || slot.h <= 0) {
      continue;
    }
    const { sx, sy, sw, sh } = getCoverSourceRect(
      imageWidth,
      imageHeight,
      slot.w,
      slot.h,
    );
    const rotation = getSlotRotation(slot);
    if (!rotation) {
      ctx.drawImage(image, sx, sy, sw, sh, slot.x, slot.y, slot.w, slot.h);
      continue;
    }
    ctx.save();
    ctx.translate(slot.x + slot.w / 2, slot.y + slot.h / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(
      image,
      sx,
      sy,
      sw,
      sh,
      -slot.w / 2,
      -slot.h / 2,
      slot.w,
      slot.h,
    );
    ctx.restore();
  }

  ctx.drawImage(frame.image, 0, 0, frameWidth, frameHeight);
  ctx.restore();
}

function drawPaperTexture(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.fillStyle = "rgba(191, 49, 49, 0.07)";
  const gap = 34;
  for (let y = gap; y < height; y += gap) {
    for (let x = gap; x < width; x += gap) {
      ctx.beginPath();
      ctx.arc(x, y, 1.15, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: {
    align?: CanvasTextAlign;
    color?: string;
    size?: number;
    weight?: number;
    letterSpacing?: number;
  } = {},
): void {
  const {
    align = "left",
    color = INK,
    size = 20,
    weight = 700,
    letterSpacing = 0,
  } = options;
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT_STACK}`;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";

  if (letterSpacing <= 0) {
    ctx.fillText(text, x, y);
    ctx.restore();
    return;
  }

  /* Canvas belum punya letterSpacing yang konsisten, jadi digambar manual
   * per karakter agar label kecil tetap terasa seperti cetakan. */
  const characters = Array.from(text);
  const widths = characters.map((character) => ctx.measureText(character).width);
  const totalWidth =
    widths.reduce((sum, width) => sum + width, 0) +
    letterSpacing * Math.max(0, characters.length - 1);
  let cursor = align === "center" ? x - totalWidth / 2 : align === "right" ? x - totalWidth : x;
  characters.forEach((character, index) => {
    ctx.fillText(character, cursor, y);
    cursor += widths[index] + letterSpacing;
  });
  ctx.restore();
}

function drawPhotoPage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  meta: FlipbookMeta,
  index: number,
  total: number,
  frame: LoadedAsset | null = null,
): void {
  const width = FLIPBOOK_PAGE_WIDTH;
  const height = FLIPBOOK_PAGE_HEIGHT;

  /* Halaman berframe diekspor penuh tanpa header, tanggal, atau nomor
   * halaman supaya sama dengan tampilan viewer. */
  if (frame) {
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, width, height);
    drawFramedPhoto(ctx, image, frame, {
      x: 0,
      y: 0,
      w: width,
      h: height,
    });
    return;
  }

  drawPaperTexture(ctx, width, height);
  ctx.fillStyle = "rgba(191, 49, 49, 0.22)";
  ctx.fillRect(120, 58, width - 240, 1.5);

  drawLabel(ctx, "PANORICAM", 120, 44, {
    color: RED,
    size: 19,
    weight: 800,
    letterSpacing: 4,
  });
  drawLabel(ctx, "FLIPBOOK", 120 + 190, 44, {
    color: MUTED,
    size: 19,
    weight: 600,
    letterSpacing: 4,
  });
  drawLabel(ctx, meta.dateLabel.toUpperCase(), width - 120, 44, {
    align: "right",
    color: MUTED,
    size: 17,
    weight: 600,
    letterSpacing: 2,
  });

  const boxX = 120;
  const boxY = 76;
  const boxWidth = width - boxX * 2;
  const boxHeight = 716;

  const photoX = boxX;
  const photoY = boxY;
  const photoWidth = boxWidth;
  const photoHeight = boxHeight;

  ctx.save();
  ctx.shadowColor = "rgba(42, 10, 10, 0.2)";
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 14;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(photoX - 14, photoY - 14, photoWidth + 28, photoHeight + 28);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.rect(photoX, photoY, photoWidth, photoHeight);
  ctx.clip();
  ctx.fillStyle = PAPER_DARK;
  ctx.fillRect(photoX, photoY, photoWidth, photoHeight);
  drawCoverImage(ctx, image, photoX, photoY, photoWidth, photoHeight);
  ctx.restore();

  ctx.strokeStyle = "rgba(191, 49, 49, 0.3)";
  ctx.lineWidth = 2;
  ctx.strokeRect(
    photoX - 13,
    photoY - 13,
    photoWidth + 26,
    photoHeight + 26,
  );

  drawLabel(ctx, meta.dateLabel, 120, 848, {
    color: INK,
    size: 26,
    weight: 800,
  });
  drawLabel(ctx, "PANORICAM FLIPBOOK", 120, 878, {
    color: MUTED,
    size: 17,
    weight: 600,
    letterSpacing: 3,
  });

  drawLabel(ctx, `${pad(index + 1)} / ${pad(total)}`, width - 120, 862, {
    align: "right",
    color: RED,
    size: 25,
    weight: 800,
    letterSpacing: 2,
  });

  ctx.fillStyle = "rgba(191, 49, 49, 0.18)";
  ctx.fillRect(width - 300, 838, 180, 1.5);
}

function drawCoverPhoto(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  meta: FlipbookMeta,
  total: number,
): void {
  const width = FLIPBOOK_PAGE_WIDTH;
  const height = FLIPBOOK_PAGE_HEIGHT;

  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, width, height);

  drawCoverImage(ctx, image, 0, 0, width, height);

  const vertical = ctx.createLinearGradient(0, 0, 0, height);
  vertical.addColorStop(0, "rgba(42, 10, 10, 0.62)");
  vertical.addColorStop(0.35, "rgba(42, 10, 10, 0.08)");
  vertical.addColorStop(0.62, "rgba(42, 10, 10, 0.38)");
  vertical.addColorStop(1, "rgba(42, 10, 10, 0.96)");
  ctx.fillStyle = vertical;
  ctx.fillRect(0, 0, width, height);

  const side = ctx.createLinearGradient(0, 0, width, 0);
  side.addColorStop(0, "rgba(42, 10, 10, 0.55)");
  side.addColorStop(0.35, "rgba(42, 10, 10, 0)");
  side.addColorStop(1, "rgba(42, 10, 10, 0.35)");
  ctx.fillStyle = side;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(254, 243, 226, 0.5)";
  ctx.lineWidth = 2;
  ctx.strokeRect(34, 34, width - 68, height - 68);

  drawLabel(ctx, "PANORICAM", 68, 88, {
    color: "#FEF3E2",
    size: 24,
    weight: 800,
    letterSpacing: 7,
  });
  drawLabel(ctx, "FLIPBOOK", 68, 120, {
    color: "rgba(254, 243, 226, 0.72)",
    size: 15,
    weight: 600,
    letterSpacing: 9,
  });

  ctx.fillStyle = "#FEF3E2";
  ctx.fillRect(68, 150, 64, 3);

  drawLabel(ctx, "FLIPBOOK", 68, height - 190, {
    color: "#FEF3E2",
    size: 82,
    weight: 800,
    letterSpacing: 2,
  });

  ctx.fillStyle = "rgba(254, 243, 226, 0.45)";
  ctx.fillRect(68, height - 158, width - 136, 1.5);

  drawLabel(ctx, meta.dateLabel, 68, height - 108, {
    color: "rgba(254, 243, 226, 0.8)",
    size: 22,
    weight: 500,
  });
  drawLabel(ctx, `${total} HALAMAN`, width - 68, height - 108, {
    align: "right",
    color: "rgba(254, 243, 226, 0.8)",
    size: 19,
    weight: 700,
    letterSpacing: 3,
  });
}

function drawPlainCover(
  ctx: CanvasRenderingContext2D,
  meta: FlipbookMeta,
  total: number,
): void {
  const width = FLIPBOOK_PAGE_WIDTH;
  const height = FLIPBOOK_PAGE_HEIGHT;

  drawPaperTexture(ctx, width, height);

  ctx.strokeStyle = "rgba(191, 49, 49, 0.85)";
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  drawLabel(ctx, "PANORICAM", 76, 96, {
    color: RED,
    size: 24,
    weight: 800,
    letterSpacing: 7,
  });
  drawLabel(ctx, "FLIPBOOK", 76, 128, {
    color: MUTED,
    size: 15,
    weight: 600,
    letterSpacing: 9,
  });

  ctx.save();
  ctx.fillStyle = "rgba(191, 49, 49, 0.16)";
  for (let y = 190; y < height - 190; y += 26) {
    for (let x = width - 168; x < width - 86; x += 26) {
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  drawLabel(ctx, "FLIPBOOK", width / 2, height / 2 - 14, {
    align: "center",
    color: INK,
    size: 128,
    weight: 800,
    letterSpacing: 6,
  });
  drawLabel(ctx, `${total} HALAMAN, SATU CERITA`, width / 2, height / 2 + 52, {
    align: "center",
    color: RED,
    size: 23,
    weight: 700,
    letterSpacing: 5,
  });

  ctx.fillStyle = "rgba(191, 49, 49, 0.5)";
  ctx.fillRect(width / 2 - 70, height / 2 + 84, 140, 2);

  drawLabel(ctx, meta.dateLabel, 76, height - 84, {
    color: MUTED,
    size: 22,
    weight: 500,
  });
  drawLabel(ctx, "PANORICAM", width - 76, height - 84, {
    align: "right",
    color: RED,
    size: 19,
    weight: 700,
    letterSpacing: 4,
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  meta: FlipbookMeta,
  total: number,
  asset: LoadedAsset | null,
): void {
  /* Overlay sampul adalah desain final: foto pertama digambar penuh di
   * belakangnya, lalu PNG overlay menutup halaman. Area transparan overlay
   * memperlihatkan foto. */
  if (asset) {
    if (image) {
      drawCoverImage(ctx, image, 0, 0, FLIPBOOK_PAGE_WIDTH, FLIPBOOK_PAGE_HEIGHT);
    } else {
      drawPaperTexture(ctx, FLIPBOOK_PAGE_WIDTH, FLIPBOOK_PAGE_HEIGHT);
    }
    ctx.drawImage(
      asset.image,
      0,
      0,
      FLIPBOOK_PAGE_WIDTH,
      FLIPBOOK_PAGE_HEIGHT,
    );
    return;
  }

  if (image) {
    drawCoverPhoto(ctx, image, meta, total);
    return;
  }
  drawPlainCover(ctx, meta, total);
}

function drawPlainBackCover(
  ctx: CanvasRenderingContext2D,
  meta: FlipbookMeta,
  total: number,
): void {
  const width = FLIPBOOK_PAGE_WIDTH;
  const height = FLIPBOOK_PAGE_HEIGHT;

  drawPaperTexture(ctx, width, height);

  ctx.fillStyle = RED;
  ctx.fillRect(48, 48, width - 96, height - 96);

  ctx.save();
  ctx.fillStyle = "rgba(254, 243, 226, 0.14)";
  const gap = 42;
  for (let y = 90; y < height - 60; y += gap) {
    for (let x = 90; x < width - 60; x += gap) {
      ctx.beginPath();
      ctx.arc(x, y, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  ctx.strokeStyle = "rgba(254, 243, 226, 0.35)";
  ctx.lineWidth = 2;
  ctx.strokeRect(78, 78, width - 156, height - 156);

  drawLabel(ctx, "PANORICAM", width / 2, 190, {
    align: "center",
    color: "rgba(254, 243, 226, 0.85)",
    size: 22,
    weight: 800,
    letterSpacing: 8,
  });

  drawLabel(ctx, "Sampai jumpa", width / 2, height / 2 - 26, {
    align: "center",
    color: "#FEF3E2",
    size: 72,
    weight: 800,
  });
  drawLabel(ctx, "di halaman berikutnya.", width / 2, height / 2 + 58, {
    align: "center",
    color: "rgba(254, 243, 226, 0.86)",
    size: 42,
    weight: 600,
  });

  drawLabel(ctx, `${total} halaman · ${meta.dateLabel}`, width / 2, height - 150, {
    align: "center",
    color: "rgba(254, 243, 226, 0.7)",
    size: 20,
    weight: 500,
  });
}

function drawPhotoBackCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  meta: FlipbookMeta,
  total: number,
): void {
  const width = FLIPBOOK_PAGE_WIDTH;
  const height = FLIPBOOK_PAGE_HEIGHT;

  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, width, height);
  drawCoverImage(ctx, image, 0, 0, width, height);

  const vertical = ctx.createLinearGradient(0, 0, 0, height);
  vertical.addColorStop(0, "rgba(42, 10, 10, 0.78)");
  vertical.addColorStop(0.45, "rgba(42, 10, 10, 0.34)");
  vertical.addColorStop(1, "rgba(42, 10, 10, 0.9)");
  ctx.fillStyle = vertical;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(254, 243, 226, 0.45)";
  ctx.lineWidth = 2;
  ctx.strokeRect(34, 34, width - 68, height - 68);

  drawLabel(ctx, "PANORICAM", width / 2, 120, {
    align: "center",
    color: "rgba(254, 243, 226, 0.85)",
    size: 22,
    weight: 800,
    letterSpacing: 8,
  });

  drawLabel(ctx, "Sampai jumpa", width / 2, height / 2 - 20, {
    align: "center",
    color: "#FEF3E2",
    size: 72,
    weight: 800,
  });
  drawLabel(ctx, "di halaman berikutnya.", width / 2, height / 2 + 64, {
    align: "center",
    color: "rgba(254, 243, 226, 0.88)",
    size: 42,
    weight: 600,
  });

  ctx.fillStyle = "rgba(254, 243, 226, 0.4)";
  ctx.fillRect(width / 2 - 90, height - 190, 180, 1.5);

  drawLabel(ctx, `${total} halaman · ${meta.dateLabel}`, width / 2, height - 140, {
    align: "center",
    color: "rgba(254, 243, 226, 0.75)",
    size: 20,
    weight: 500,
  });
}

function drawBackCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  meta: FlipbookMeta,
  total: number,
  asset: LoadedAsset | null,
): void {
  if (asset) {
    if (image) {
      drawCoverImage(ctx, image, 0, 0, FLIPBOOK_PAGE_WIDTH, FLIPBOOK_PAGE_HEIGHT);
    } else {
      drawPaperTexture(ctx, FLIPBOOK_PAGE_WIDTH, FLIPBOOK_PAGE_HEIGHT);
    }
    ctx.drawImage(
      asset.image,
      0,
      0,
      FLIPBOOK_PAGE_WIDTH,
      FLIPBOOK_PAGE_HEIGHT,
    );
    return;
  }

  if (image) {
    drawPhotoBackCover(ctx, image, meta, total);
    return;
  }
  drawPlainBackCover(ctx, meta, total);
}

function renderPageCanvas(
  images: Array<HTMLImageElement | null>,
  meta: FlipbookMeta,
  kind: PageKind,
  total = images.length,
  displayIndex?: number,
  assets: LoadedFrameAssets | null = null,
): HTMLCanvasElement {
  const canvas = createCanvas(FLIPBOOK_PAGE_WIDTH, FLIPBOOK_PAGE_HEIGHT);
  const ctx = getContext(canvas);

  if (kind.type === "cover") {
    drawCover(
      ctx,
      images[0] ?? null,
      meta,
      total,
      assets?.cover ?? null,
    );
  } else if (kind.type === "back") {
    drawBackCover(
      ctx,
      images[images.length - 1] ?? null,
      meta,
      total,
      assets?.back ?? null,
    );
  } else {
    const image = images[kind.index];
    if (!image) {
      drawPaperTexture(ctx, canvas.width, canvas.height);
    } else {
      drawPhotoPage(
        ctx,
        image,
        meta,
        displayIndex ?? kind.index,
        total,
        assets?.pages[displayIndex ?? kind.index] ?? null,
      );
    }
  }

  return canvas;
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
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

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function createCoverPng(
  photos: string[],
  meta: FlipbookMeta,
  frame: FlipbookFrame | null = null,
): Promise<Blob> {
  const [coverImage, coverAsset] = await Promise.all([
    photos[0] ? loadImageElement(photos[0]).catch(() => null) : Promise.resolve(null),
    loadAsset(frame?.cover),
  ]);
  return canvasToPngBlob(
    renderPageCanvas(
      [coverImage],
      meta,
      { type: "cover" },
      photos.length,
      undefined,
      {
        cover: coverAsset,
        pages: Array.from({ length: 10 }, () => null),
        back: null,
      },
    ),
  );
}

export async function createPhotoPagePng(
  photos: string[],
  meta: FlipbookMeta,
  index: number,
  frame: FlipbookFrame | null = null,
): Promise<Blob> {
  const [image, pageAsset] = await Promise.all([
    loadImageElement(photos[index]),
    loadAsset(frame?.pages[index]),
  ]);
  const pages: Array<LoadedAsset | null> = Array.from(
    { length: 10 },
    () => null,
  );
  pages[index] = pageAsset;
  return canvasToPngBlob(
    renderPageCanvas(
      [image],
      meta,
      { type: "photo", index: 0 },
      photos.length,
      index,
      { cover: null, pages, back: null },
    ),
  );
}

export async function createBackCoverPng(
  photos: string[],
  meta: FlipbookMeta,
  frame: FlipbookFrame | null = null,
): Promise<Blob> {
  const lastPhoto = photos[photos.length - 1];
  const [backImage, backAsset] = await Promise.all([
    lastPhoto
      ? loadImageElement(lastPhoto).catch(() => null)
      : Promise.resolve(null),
    loadAsset(frame?.back),
  ]);
  return canvasToPngBlob(
    renderPageCanvas(
      [backImage],
      meta,
      { type: "back" },
      photos.length,
      undefined,
      {
        cover: null,
        pages: Array.from({ length: 10 }, () => null),
        back: backAsset,
      },
    ),
  );
}

export async function createContactSheetPng(
  photos: string[],
  meta: FlipbookMeta,
  frame: FlipbookFrame | null = null,
): Promise<Blob> {
  if (photos.length === 0) {
    throw new Error("Belum ada foto untuk dibuat kontak sheet");
  }

  const [images, pageAssets] = await Promise.all([
    Promise.all(photos.map((photo) => loadImageElement(photo))),
    Promise.all((frame?.pages ?? []).map((asset) => loadAsset(asset))),
  ]);
  const columns = photos.length <= 4 ? 2 : photos.length <= 6 ? 3 : 4;
  const rows = Math.ceil(photos.length / columns);
  const cellWidth = 480;
  const photoHeight = 360;
  const captionHeight = 62;
  const cellHeight = photoHeight + captionHeight;
  const gap = 30;
  const padding = 80;
  const headerHeight = 152;

  const width = padding * 2 + columns * cellWidth + (columns - 1) * gap;
  const height =
    padding * 2 +
    headerHeight +
    rows * cellHeight +
    Math.max(0, rows - 1) * gap;

  const canvas = createCanvas(width, height);
  const ctx = getContext(canvas);

  drawPaperTexture(ctx, width, height);

  ctx.fillStyle = RED;
  ctx.fillRect(padding, padding, 64, 4);

  drawLabel(ctx, "PANORICAM FLIPBOOK", padding, padding + 58, {
    color: RED,
    size: 20,
    weight: 800,
    letterSpacing: 5,
  });
  drawLabel(ctx, `${photos.length} HALAMAN`, padding, padding + 126, {
    color: INK,
    size: 56,
    weight: 800,
  });
  drawLabel(ctx, meta.dateLabel, width - padding, padding + 72, {
    align: "right",
    color: MUTED,
    size: 21,
    weight: 500,
  });

  const startY = padding + headerHeight;

  images.forEach((image, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = padding + column * (cellWidth + gap);
    const y = startY + row * (cellHeight + gap);

    ctx.save();
    ctx.shadowColor = "rgba(42, 10, 10, 0.16)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(x, y, cellWidth, cellHeight + 8);
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 10, y + 10, cellWidth - 20, photoHeight - 20);
    ctx.clip();
    ctx.fillStyle = PAPER_DARK;
    ctx.fillRect(x + 10, y + 10, cellWidth - 20, photoHeight - 20);
    const pageAsset = pageAssets[index] ?? null;
    if (pageAsset) {
      drawFramedPhoto(ctx, image, pageAsset, {
        x: x + 10,
        y: y + 10,
        w: cellWidth - 20,
        h: photoHeight - 20,
      });
    } else {
      drawCoverImage(ctx, image, x + 10, y + 10, cellWidth - 20, photoHeight - 20);
    }
    ctx.restore();

    drawLabel(ctx, `Halaman ${pad(index + 1)}`, x + 22, y + photoHeight + 30, {
      color: INK,
      size: 22,
      weight: 700,
    });
    drawLabel(
      ctx,
      `${pad(index + 1)} / ${pad(photos.length)}`,
      x + cellWidth - 22,
      y + photoHeight + 30,
      {
        align: "right",
        color: RED,
        size: 20,
        weight: 800,
        letterSpacing: 1,
      },
    );
  });

  drawLabel(ctx, "Dibuat di PanoriCam — photobooth online", width / 2, height - 38, {
    align: "center",
    color: MUTED,
    size: 18,
    weight: 500,
    letterSpacing: 1,
  });

  return canvasToPngBlob(canvas);
}

const GIF_WIDTH = 480;
const GIF_HEIGHT = 360;
const GIF_FLIP_STEPS = 5;

export async function createFlipbookGif({
  photos,
  meta,
  frame,
  onProgress,
}: FlipbookGifOptions): Promise<Blob> {
  if (photos.length === 0) {
    throw new Error("Belum ada foto untuk dibuat GIF");
  }

  onProgress?.(2, "Memuat foto...");

  const [images, assets] = await Promise.all([
    Promise.all(photos.map((photo) => loadImageElement(photo))),
    loadFrameAssets(frame),
  ]);

  onProgress?.(8, "Menyusun halaman...");

  const pageCanvases: HTMLCanvasElement[] = [
    renderPageCanvas(images, meta, { type: "cover" }, images.length, undefined, assets),
    ...images.map((_, index) =>
      renderPageCanvas(
        images,
        meta,
        { type: "photo", index },
        images.length,
        index,
        assets,
      ),
    ),
    renderPageCanvas(images, meta, { type: "back" }, images.length, undefined, assets),
  ].map((canvas) => {
    const scaled = createCanvas(GIF_WIDTH, GIF_HEIGHT);
    const ctx = getContext(scaled);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(canvas, 0, 0, GIF_WIDTH, GIF_HEIGHT);
    return scaled;
  });

  const { default: GIF } = await import("gif.js");

  return new Promise<Blob>((resolve, reject) => {
    const frameCanvas = createCanvas(GIF_WIDTH, GIF_HEIGHT);
    const ctx = getContext(frameCanvas);

    const gif = new GIF({
      workers: 4,
      quality: 10,
      width: GIF_WIDTH,
      height: GIF_HEIGHT,
      dither: false,
      workerScript: "/js/gif.worker.js",
    });

    gif.on("finished", (blob: Blob) => resolve(blob));
    gif.on("error", (error: Error) => reject(error));
    gif.on("progress", (progress: number) => {
      onProgress?.(20 + Math.round(progress * 78), "Menyusun GIF flipbook...");
    });

    const addFrame = (delay: number) => {
      gif.addFrame(frameCanvas, { delay, copy: true });
    };

    const drawScaled = (canvas: HTMLCanvasElement) => {
      ctx.clearRect(0, 0, GIF_WIDTH, GIF_HEIGHT);
      ctx.fillStyle = INK;
      ctx.fillRect(0, 0, GIF_WIDTH, GIF_HEIGHT);
      ctx.drawImage(canvas, 0, 0, GIF_WIDTH, GIF_HEIGHT);
    };

    /* Sampul ditahan lebih lama supaya sempat terbaca. */
    drawScaled(pageCanvases[0]);
    addFrame(1300);

    for (let pageIndex = 1; pageIndex < pageCanvases.length; pageIndex += 1) {
      const previous = pageCanvases[pageIndex - 1];
      const next = pageCanvases[pageIndex];

      for (let step = 1; step <= GIF_FLIP_STEPS; step += 1) {
        const progress = step / GIF_FLIP_STEPS;
        const visibleWidth = Math.max(0, GIF_WIDTH * (1 - progress));

        drawScaled(next);

        if (visibleWidth > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, visibleWidth, GIF_HEIGHT);
          ctx.clip();
          ctx.drawImage(previous, 0, 0, GIF_WIDTH, GIF_HEIGHT);
          const shade = ctx.createLinearGradient(0, 0, Math.max(1, visibleWidth), 0);
          shade.addColorStop(0, `rgba(0, 0, 0, ${0.32 * progress + 0.08})`);
          shade.addColorStop(1, `rgba(0, 0, 0, ${0.12 * progress})`);
          ctx.fillStyle = shade;
          ctx.fillRect(0, 0, visibleWidth, GIF_HEIGHT);
          ctx.restore();
        }

        ctx.fillStyle = `rgba(255, 251, 243, ${0.18 * progress})`;
        ctx.fillRect(0, 0, GIF_WIDTH, GIF_HEIGHT);
        addFrame(75);
      }

      drawScaled(next);
      addFrame(pageIndex === pageCanvases.length - 1 ? 1500 : 950);
    }

    onProgress?.(20, "Merender GIF flipbook...");
    gif.render();
  });
}

export function buildMeta(date: Date = new Date()): FlipbookMeta {
  return {
    dateLabel: date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
  };
}

function flipbookStamp(date: Date = new Date()): string {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

export function flipbookFilename(suffix: string, date: Date = new Date()): string {
  return `panoricam-flipbook-${flipbookStamp(date)}-${suffix}.png`;
}

export function flipbookGifFilename(date: Date = new Date()): string {
  return `panoricam-flipbook-${flipbookStamp(date)}.gif`;
}
