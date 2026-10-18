import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { PNG } from "pngjs";

import { detectSlots, hasTransparentPixels } from "../src/lib/frames/detect-slots";
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

  const solid = makeImage(100, 100, opaque);
  assert.equal(hasTransparentPixels(solid), false);
  assert.equal(detectSlots(solid).length, 0);

  const cover = getCoverSourceRect(400, 100, 100, 100);
  assert.deepEqual(cover, { sx: 150, sy: 0, sw: 100, sh: 100 });
  const coverTall = getCoverSourceRect(100, 400, 100, 100);
  assert.deepEqual(coverTall, { sx: 0, sy: 150, sw: 100, sh: 100 });

  console.log("[ok] uji sintetis detectSlots + getCoverSourceRect lulus");
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
  scanRealPngs(join(process.cwd(), "..", "public"));
}

main();
