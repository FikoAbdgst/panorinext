import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { PNG } from "pngjs";

import { detectSlots, hasTransparentPixels } from "../src/lib/frames/detect-slots";
import {
  cloneAlphaImage,
  eraseColorRegion,
  eraseRect,
  mergeSlots,
  removeWhiteFringe,
  sortSlots,
} from "../src/lib/frames/edit-image";
import { getCoverSourceRect } from "../src/lib/frames/geometry";
import type { AlphaImageData } from "../src/lib/frames/types";

type RGBA = { r: number; g: number; b: number; a: number };

function makeImage(width: number, height: number, fill: RGBA): AlphaImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    data[i * 4] = fill.r;
    data[i * 4 + 1] = fill.g;
    data[i * 4 + 2] = fill.b;
    data[i * 4 + 3] = fill.a;
  }
  return { data, width, height };
}

function fillRect(
  image: AlphaImageData,
  x: number,
  y: number,
  w: number,
  h: number,
  color: RGBA,
) {
  const { data, width } = image;
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      const i = (yy * width + xx) * 4;
      data[i] = color.r;
      data[i + 1] = color.g;
      data[i + 2] = color.b;
      data[i + 3] = color.a;
    }
  }
}

function runSyntheticTests() {
  const opaque: RGBA = { r: 0, g: 0, b: 0, a: 255 };
  const clear: RGBA = { r: 0, g: 0, b: 0, a: 0 };

  const image = makeImage(400, 600, opaque);
  fillRect(image, 50, 80, 100, 150, clear);
  fillRect(image, 200, 300, 80, 120, clear);
  fillRect(image, 10, 10, 2, 2, clear);

  assert.equal(hasTransparentPixels(image), true);
  const slots = detectSlots(image);
  assert.equal(slots.length, 2, "noise 2x2 harus dibuang");
  assert.deepEqual(slots[0], { x: 50, y: 80, w: 100, h: 150 });
  assert.deepEqual(slots[1], { x: 200, y: 300, w: 80, h: 120 });

  const orderImage = makeImage(400, 600, opaque);
  fillRect(orderImage, 10, 300, 60, 60, clear);
  fillRect(orderImage, 200, 100, 60, 60, clear);
  const ordered = detectSlots(orderImage);
  assert.equal(ordered.length, 2);
  assert.equal(ordered[0].y, 100, "slot teratas harus lebih dulu");
  assert.equal(ordered[1].y, 300);

  // Latar luar transparan (menyentuh banyak sisi) bukan slot foto.
  const borderBackground = makeImage(60, 60, clear);
  fillRect(borderBackground, 5, 5, 50, 50, opaque);
  fillRect(borderBackground, 20, 20, 20, 20, clear);
  const borderSlots = detectSlots(borderBackground);
  assert.equal(borderSlots.length, 1, "latar luar harus diabaikan");
  assert.deepEqual(borderSlots[0], { x: 20, y: 20, w: 20, h: 20 });

  // Slot yang hanya menyentuh satu tepi tetap dipertahankan.
  const edgeSlot = makeImage(60, 60, opaque);
  fillRect(edgeSlot, 10, 0, 20, 20, clear);
  assert.equal(detectSlots(edgeSlot).length, 1);

  // Slot full-bleed yang menyentuh beberapa sisi tetapi tidak menutupi
  // hampir seluruh kanvas juga harus tetap terdeteksi.
  const fullBleedSlot = makeImage(100, 100, opaque);
  fillRect(fullBleedSlot, 0, 0, 100, 30, clear);
  const fullBleedSlots = detectSlots(fullBleedSlot);
  assert.equal(fullBleedSlots.length, 1, "slot full-bleed tidak boleh dibuang");
  assert.deepEqual(fullBleedSlots[0], { x: 0, y: 0, w: 100, h: 30 });

  const solid = makeImage(100, 100, opaque);
  assert.equal(hasTransparentPixels(solid), false);
  assert.equal(detectSlots(solid).length, 0);

  const cover = getCoverSourceRect(400, 100, 100, 100);
  assert.deepEqual(cover, { sx: 150, sy: 0, sw: 100, sh: 100 });
  const coverTall = getCoverSourceRect(100, 400, 100, 100);
  assert.deepEqual(coverTall, { sx: 0, sy: 150, sw: 100, sh: 100 });

  const gray: RGBA = { r: 128, g: 128, b: 128, a: 255 };
  const eraseImage = makeImage(100, 100, opaque);
  fillRect(eraseImage, 10, 10, 20, 20, gray);
  fillRect(eraseImage, 60, 10, 20, 20, gray);

  const contiguousImage = cloneAlphaImage(eraseImage);
  const contiguous = eraseColorRegion(contiguousImage, 15, 15, {
    tolerance: 5,
    contiguous: true,
  });
  assert.equal(contiguous.area, 400, "hanya region yang diklik yang dihapus");
  assert.deepEqual(contiguous.bounds, { x: 10, y: 10, w: 20, h: 20 });
  assert.equal(
    contiguousImage.data[(15 * 100 + 65) * 4 + 3],
    255,
    "region serupa yang terpisah harus tetap opaque",
  );
  assert.equal(detectSlots(contiguousImage).length, 1);

  const globalImage = cloneAlphaImage(eraseImage);
  const global = eraseColorRegion(globalImage, 15, 15, {
    tolerance: 5,
    contiguous: false,
  });
  assert.equal(global.area, 800, "mode global menghapus semua warna serupa");
  assert.equal(globalImage.data[(15 * 100 + 65) * 4 + 3], 0);

  const toleranceImage = makeImage(10, 10, gray);
  fillRect(toleranceImage, 0, 0, 2, 2, { r: 130, g: 128, b: 128, a: 255 });
  fillRect(toleranceImage, 8, 8, 2, 2, opaque);
  const toleranceResult = eraseColorRegion(toleranceImage, 5, 5, {
    tolerance: 4,
    contiguous: false,
  });
  assert.equal(toleranceResult.area, 96);
  assert.equal(toleranceImage.data[(8 * 10 + 8) * 4 + 3], 255);

  // Sisa putih tipis di tepi harus ikut dibersihkan (cleanup)...
  const cleanupImage = makeImage(40, 40, { r: 20, g: 10, b: 10, a: 255 });
  fillRect(cleanupImage, 10, 10, 10, 10, { r: 250, g: 250, b: 250, a: 255 });
  fillRect(cleanupImage, 11, 11, 8, 8, { r: 255, g: 255, b: 255, a: 255 });
  const cleanupResult = eraseColorRegion(cleanupImage, 15, 15, {
    tolerance: 2,
    cleanup: 1,
  });
  assert.equal(cleanupResult.area, 100, "fringe putih harus ikut terhapus");
  assert.deepEqual(cleanupResult.bounds, { x: 10, y: 10, w: 10, h: 10 });

  // ...atau diperluas tanpa cek warna (expand)...
  const expandImage = makeImage(40, 40, { r: 20, g: 10, b: 10, a: 255 });
  fillRect(expandImage, 10, 10, 10, 10, { r: 255, g: 255, b: 255, a: 255 });
  const expandResult = eraseColorRegion(expandImage, 15, 15, {
    tolerance: 2,
    expand: 1,
  });
  assert.equal(expandResult.area, 144, "expand 1px harus melebarkan area");
  assert.deepEqual(expandResult.bounds, { x: 9, y: 9, w: 12, h: 12 });

  // Feather membuat tepi semi-transparan bertingkat tanpa mengubah area slot.
  const featherImage = makeImage(40, 40, { r: 20, g: 10, b: 10, a: 255 });
  fillRect(featherImage, 10, 10, 20, 20, { r: 255, g: 255, b: 255, a: 255 });
  const featherResult = eraseColorRegion(featherImage, 15, 15, {
    tolerance: 2,
    feather: 2,
  });
  assert.equal(featherResult.area, 400);
  assert.deepEqual(featherResult.bounds, { x: 10, y: 10, w: 20, h: 20 });
  const alphaAt = (x: number, y: number) =>
    featherImage.data[(y * 40 + x) * 4 + 3];
  assert.equal(alphaAt(9, 15), Math.round(255 / 3));
  assert.equal(alphaAt(8, 15), Math.round((255 * 2) / 3));
  assert.equal(alphaAt(7, 15), 255, "di luar radius feather harus tetap opaque");

  const rectImage = makeImage(50, 50, opaque);
  const rectResult = eraseRect(rectImage, { x: -5, y: 10, w: 20, h: 30 });
  assert.deepEqual(rectResult.bounds, { x: 0, y: 10, w: 15, h: 30 });
  assert.equal(rectResult.area, 450);
  assert.equal(rectImage.data[(10 * 50 + 0) * 4 + 3], 0);
  assert.equal(rectImage.data[(10 * 50 + 20) * 4 + 3], 255);

  // Toleransi otomatis harus bisa membersihkan background rata tanpa set angka.
  const purple: RGBA = { r: 120, g: 60, b: 160, a: 255 };
  const autoImage = makeImage(20, 20, { r: 255, g: 255, b: 255, a: 255 });
  fillRect(autoImage, 5, 5, 10, 10, purple);
  const autoResult = eraseColorRegion(autoImage, 1, 1, {
    autoTolerance: true,
    contiguous: true,
    cleanup: 0,
  });
  assert.equal(autoResult.area, 300, "background putih harus terhapus");
  assert.equal(autoImage.data[(10 * 20 + 10) * 4 + 3], 255, "objek ungu tetap");

  // Halo putih di tepi area terhapus harus ikut dibersihkan dengan cleanupWhite.
  const haloImage = makeImage(30, 30, { r: 255, g: 255, b: 255, a: 255 });
  fillRect(haloImage, 10, 10, 10, 10, purple);
  fillRect(haloImage, 8, 10, 2, 10, { r: 245, g: 245, b: 248, a: 255 });
  const haloResult = eraseColorRegion(haloImage, 1, 1, {
    tolerance: 2,
    contiguous: true,
    cleanup: 0,
    cleanupWhite: true,
  });
  assert.ok(haloResult.area > 0);
  assert.equal(haloImage.data[(15 * 30 + 9) * 4 + 3], 0, "halo putih terhapus");
  assert.equal(haloImage.data[(15 * 30 + 15) * 4 + 3], 255, "objek tetap utuh");

  // Tombol pembersih global hanya memangkas putih yang menempel area transparan.
  const fringeImage = makeImage(30, 30, purple);
  fillRect(fringeImage, 20, 0, 10, 30, clear);
  fillRect(fringeImage, 19, 0, 1, 30, { r: 245, g: 245, b: 248, a: 255 });
  fillRect(fringeImage, 18, 0, 1, 30, purple);
  const fringeResult = removeWhiteFringe(fringeImage, { radius: 2 });
  assert.equal(fringeResult.area, 30);
  assert.equal(fringeImage.data[(15 * 30 + 19) * 4 + 3], 0);
  assert.equal(fringeImage.data[(15 * 30 + 18) * 4 + 3], 255);

  const merged = mergeSlots(
    [{ x: 10, y: 10, w: 20, h: 20 }],
    [
      { x: 11, y: 11, w: 19, h: 19 },
      { x: 50, y: 50, w: 10, h: 10 },
    ],
  );
  assert.equal(merged.length, 2, "slot yang tumpang tindih harus digabung");
  assert.deepEqual(merged[1], { x: 50, y: 50, w: 10, h: 10 });

  const rowOrder = sortSlots([
    { x: 100, y: 101, w: 20, h: 20 },
    { x: 10, y: 100, w: 20, h: 20 },
    { x: 10, y: 300, w: 20, h: 20 },
  ]);
  assert.deepEqual(
    rowOrder.map((slot) => slot.x),
    [10, 100, 10],
    "slot pada baris yang hampir sama harus diurutkan kiri ke kanan",
  );

  console.log(
    "[ok] uji sintetis detectSlots + getCoverSourceRect + edit gambar lulus",
  );
}

function collectPngFiles(dir: string, acc: string[] = [], depth = 0): string[] {
  if (depth > 3) {
    return acc;
  }
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let stats;
    try {
      stats = statSync(full);
    } catch {
      continue;
    }
    if (stats.isDirectory()) {
      collectPngFiles(full, acc, depth + 1);
    } else if (/\.png$/i.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

function scanRealPngs(publicDir: string) {
  const files = collectPngFiles(publicDir);
  let withTransparency = 0;
  let withSlots = 0;
  const slotReport: string[] = [];

  for (const file of files) {
    let png: PNG;
    try {
      png = PNG.sync.read(readFileSync(file));
    } catch {
      continue;
    }
    const image: AlphaImageData = {
      data: png.data,
      width: png.width,
      height: png.height,
    };
    if (!hasTransparentPixels(image)) {
      continue;
    }
    withTransparency += 1;
    const slots = detectSlots(image);
    if (slots.length === 0) {
      continue;
    }
    withSlots += 1;
    const boxes = slots
      .slice(0, 6)
      .map((slot) => `(${slot.x},${slot.y} ${slot.w}x${slot.h})`)
      .join(" ");
    slotReport.push(
      `  ${file.replace(publicDir, "public")} [${png.width}x${png.height}] -> ${slots.length} slot ${boxes}`,
    );
  }

  console.log(`\n[real] ${files.length} PNG dipindai.`);
  console.log(`[real] ${withTransparency} PNG punya area transparan.`);
  console.log(`[real] ${withSlots} PNG terdeteksi punya slot.`);
  if (slotReport.length > 0) {
    console.log(slotReport.slice(0, 60).join("\n"));
    if (slotReport.length > 60) {
      console.log(`  ... dan ${slotReport.length - 60} lainnya`);
    }
  }
}

function main() {
  runSyntheticTests();
  scanRealPngs(join(process.cwd(), "public"));
}

main();
