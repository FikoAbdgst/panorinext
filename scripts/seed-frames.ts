/**
 * Seed frame dari overlay PNG lama (aset Laravel) ke Supabase.
 *
 * Alur per file:
 *   1. Baca PNG, cek area transparan, deteksi slot otomatis (detectSlots).
 *   2. Unggah PNG ke bucket `frames`.
 *   3. Insert baris `frames` (nama dari nama file, kategori dari folder,
 *      harga 0 kecuali diminta premium, width/height dari PNG).
 *
 * Pemakaian (dari folder `web`):
 *   pnpm seed:frames --dry-run           # hanya memindai, tanpa unggah/DB
 *   pnpm seed:frames                     # impor semua overlay valid
 *   pnpm seed:frames --limit=20          # hentikan setelah 20 frame
 *   pnpm seed:frames --premium=slug-a,slug-b --premium-price=25000
 *
 * Membutuhkan NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di
 * web/.env.local (script ini membaca berkas itu sendiri).
 */

import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, extname, join, relative, sep } from "node:path";

import { createClient } from "@supabase/supabase-js";
import { PNG } from "pngjs";

import { detectSlots, hasTransparentPixels } from "../src/lib/frames/detect-slots";
import type { AlphaImageData, FrameSlot } from "../src/lib/frames/types";
import type { Database } from "../src/lib/supabase/database.types";
import { slugify } from "../src/lib/utils/slug";

const FRAMES_BUCKET = "frames";

/** Folder sumber overlay (relatif terhadap cwd `web`). */
const SOURCE_DIRS = [join("..", "public"), join("..", "storage", "app", "public")];

/** Alias segmen folder -> nama kategori yang ada di seed.sql. */
const CATEGORY_ALIASES: Record<string, string> = {
  dino: "Dino",
  dinosaurs: "Dino",
  retro: "Retro",
  music: "Music",
  lagu: "Music",
  anime: "Anime",
  aot: "Anime",
  haikyuu: "Anime",
  demon: "Demon Slayer",
  demonslayer: "Demon Slayer",
  tiket: "Tiket",
  ticket: "Tiket",
  kartun: "Kartun",
  toy: "Kartun",
  stitch: "Kartun",
  aesthetic: "Aesthetic",
  kpop: "K-Pop",
  custom: "Custom",
};

type Options = {
  dryRun: boolean;
  limit: number | null;
  premiumSlugs: Set<string>;
  premiumPrice: number;
};

type Candidate = {
  file: string;
  relativeLabel: string;
  name: string;
  slug: string;
  width: number;
  height: number;
  slots: FrameSlot[];
  buffer: Buffer;
  categoryName: string | null;
};

function loadEnvLocal() {
  const file = join(process.cwd(), ".env.local");
  if (!existsSync(file)) {
    return;
  }
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) {
      continue;
    }
    const key = match[1];
    if (process.env[key]) {
      continue;
    }
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function parseOptions(argv: string[]): Options {
  const options: Options = {
    dryRun: false,
    limit: null,
    premiumSlugs: new Set(),
    premiumPrice: 25000,
  };
  for (const arg of argv) {
    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg.startsWith("--limit=")) {
      const value = Number(arg.slice("--limit=".length));
      options.limit = Number.isInteger(value) && value > 0 ? value : null;
    } else if (arg.startsWith("--premium=")) {
      for (const slug of arg.slice("--premium=".length).split(",")) {
        const trimmed = slug.trim();
        if (trimmed) {
          options.premiumSlugs.add(trimmed);
        }
      }
    } else if (arg.startsWith("--premium-price=")) {
      const value = Number(arg.slice("--premium-price=".length));
      if (Number.isFinite(value) && value >= 0) {
        options.premiumPrice = value;
      }
    }
  }
  return options;
}

function collectPngFiles(dir: string, acc: string[] = [], depth = 0): string[] {
  if (depth > 4) {
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

function humanName(fileBase: string): string {
  const cleaned = fileBase
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) {
    return "Frame";
  }
  return cleaned
    .split(" ")
    .map((word) => (word.length > 1 ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

function inferCategory(relativePath: string): string | null {
  const parts = relativePath.toLowerCase().split(/[\\/]/);
  for (const part of parts) {
    const alias = CATEGORY_ALIASES[part];
    if (alias) {
      return alias;
    }
  }
  return null;
}

function readCandidate(
  file: string,
  sourceRoot: string,
  usedSlugs: Set<string>,
): Candidate | null {
  let png: PNG;
  try {
    png = PNG.sync.read(readFileSync(file));
  } catch {
    return null;
  }
  const image: AlphaImageData = {
    data: png.data,
    width: png.width,
    height: png.height,
  };
  if (!hasTransparentPixels(image)) {
    return null;
  }
  const slots = detectSlots(image);
  if (slots.length === 0) {
    return null;
  }

  const fileBase = basename(file, extname(file));
  const relativePath = relative(sourceRoot, file);
  const relativeLabel = `${basename(sourceRoot)}${sep}${relativePath}`;

  let slug = slugify(fileBase) || `frame-${usedSlugs.size + 1}`;
  if (usedSlugs.has(slug)) {
    let suffix = 2;
    while (usedSlugs.has(`${slug}-${suffix}`)) {
      suffix += 1;
    }
    slug = `${slug}-${suffix}`;
  }
  usedSlugs.add(slug);

  return {
    file,
    relativeLabel,
    name: humanName(fileBase),
    slug,
    width: png.width,
    height: png.height,
    slots,
    buffer: readFileSync(file),
    categoryName: inferCategory(relativePath),
  };
}

async function main() {
  loadEnvLocal();
  const options = parseOptions(process.argv.slice(2));

  const sourceRoots = SOURCE_DIRS.map((dir) => join(process.cwd(), dir)).filter((dir) =>
    existsSync(dir),
  );
  if (sourceRoots.length === 0) {
    console.error("[seed-frames] Folder sumber tidak ditemukan:", SOURCE_DIRS.join(", "));
    process.exitCode = 1;
    return;
  }

  const usedSlugs = new Set<string>();
  const candidates: Candidate[] = [];
  let scanned = 0;

  for (const root of sourceRoots) {
    for (const file of collectPngFiles(root)) {
      scanned += 1;
      const candidate = readCandidate(file, root, usedSlugs);
      if (candidate) {
        candidates.push(candidate);
      }
    }
  }

  console.log(
    `[seed-frames] ${scanned} PNG dipindai, ${candidates.length} overlay valid terdeteksi.`,
  );

  const limited = options.limit ? candidates.slice(0, options.limit) : candidates;

  if (options.dryRun) {
    for (const candidate of limited) {
      const premium = options.premiumSlugs.has(candidate.slug)
        ? ` (premium Rp${options.premiumPrice})`
        : "";
      console.log(
        `  ${candidate.slug} | ${candidate.name}${premium} | ${candidate.width}x${candidate.height} | ` +
          `${candidate.slots.length} slot | kategori ${candidate.categoryName ?? "-"} | ${candidate.relativeLabel}`,
      );
    }
    console.log("[seed-frames] Mode dry-run: tidak ada unggahan/insert.");
    return;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "[seed-frames] NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diisi di web/.env.local.",
    );
    process.exitCode = 1;
    return;
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: categories, error: categoryError } = await supabase
    .from("categories")
    .select("id, name");
  if (categoryError) {
    console.error("[seed-frames] Gagal memuat kategori:", categoryError.message);
    process.exitCode = 1;
    return;
  }
  const categoryIdByName = new Map((categories ?? []).map((row) => [row.name, row.id]));

  const { data: existingFrames, error: existingError } = await supabase
    .from("frames")
    .select("slug");
  if (existingError) {
    console.error("[seed-frames] Gagal memuat frame lama:", existingError.message);
    process.exitCode = 1;
    return;
  }
  const existingSlugs = new Set((existingFrames ?? []).map((row) => row.slug));

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (const candidate of limited) {
    if (existingSlugs.has(candidate.slug)) {
      skipped += 1;
      continue;
    }

    const imagePath = `${candidate.slug}-${randomUUID()}.png`;
    const { error: uploadError } = await supabase.storage
      .from(FRAMES_BUCKET)
      .upload(imagePath, candidate.buffer, { contentType: "image/png", upsert: false });
    if (uploadError) {
      failed += 1;
      console.error(`  [gagal unggah] ${candidate.slug}: ${uploadError.message}`);
      continue;
    }

    const price = options.premiumSlugs.has(candidate.slug) ? options.premiumPrice : 0;
    const categoryId = candidate.categoryName
      ? categoryIdByName.get(candidate.categoryName) ?? null
      : null;

    const { error: insertError } = await supabase.from("frames").insert({
      name: candidate.name,
      slug: candidate.slug,
      category_id: categoryId,
      price,
      width: candidate.width,
      height: candidate.height,
      slots: candidate.slots,
      image_path: imagePath,
    });
    if (insertError) {
      await supabase.storage.from(FRAMES_BUCKET).remove([imagePath]);
      failed += 1;
      console.error(`  [gagal insert] ${candidate.slug}: ${insertError.message}`);
      continue;
    }

    existingSlugs.add(candidate.slug);
    imported += 1;
    if (imported % 25 === 0) {
      console.log(`  ... ${imported} frame diimpor`);
    }
  }

  console.log(
    `[seed-frames] Selesai. Diimpor ${imported}, dilewati (sudah ada) ${skipped}, gagal ${failed}.`,
  );
}

main().catch((error) => {
  console.error("[seed-frames] Error tak terduga:", error);
  process.exitCode = 1;
});
