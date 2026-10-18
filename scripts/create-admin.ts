/**
 * Membuat akun admin pertama: user Supabase Auth + baris `admins`.
 *
 * Pemakaian (dari folder `web`):
 *   pnpm create:admin
 *   pnpm create:admin --email=admin@contoh.com --password=Rahasia123 --name=Budi
 *
 * Default mengikuti AdminSeeder Laravel: admin123@gmail.com / Admin123.
 * Idempoten: bila user sudah ada, memakai ulang lalu menyegarkan password-nya.
 *
 * Membutuhkan NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di web/.env.local.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "../src/lib/supabase/database.types";

const DEFAULT_EMAIL = "admin123@gmail.com";
const DEFAULT_PASSWORD = "Admin123";
const DEFAULT_NAME = "Admin";

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

function readArg(argv: string[], flag: string): string | null {
  const prefix = `${flag}=`;
  const match = argv.find((item) => item.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
}

function createServiceClient(url: string, serviceRoleKey: string) {
  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

type ServiceClient = ReturnType<typeof createServiceClient>;

async function findUserIdByEmail(
  supabase: ServiceClient,
  email: string,
): Promise<string | null> {
  const target = email.toLowerCase();
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      throw error;
    }
    const users = data?.users ?? [];
    const found = users.find((user) => user.email?.toLowerCase() === target);
    if (found) {
      return found.id;
    }
    if (users.length < 200) {
      return null;
    }
  }
  return null;
}

async function main() {
  loadEnvLocal();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "[create-admin] NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diisi di web/.env.local.",
    );
    process.exit(1);
  }

  const argv = process.argv.slice(2);
  const email = readArg(argv, "--email") ?? DEFAULT_EMAIL;
  const password = readArg(argv, "--password") ?? DEFAULT_PASSWORD;
  const name = readArg(argv, "--name") ?? DEFAULT_NAME;

  const supabase = createServiceClient(supabaseUrl, serviceRoleKey);

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  let userId = created?.user?.id ?? null;

  if (createError) {
    const alreadyExists =
      createError.code === "email_exists" || /already/i.test(createError.message);
    if (!alreadyExists) {
      console.error(`[create-admin] Gagal membuat user: ${createError.message}`);
      process.exit(1);
    }

    userId = await findUserIdByEmail(supabase, email);
    if (!userId) {
      console.error(`[create-admin] User ${email} sudah ada tetapi tidak ditemukan.`);
      process.exit(1);
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password,
    });
    if (updateError) {
      console.error(`[create-admin] Gagal memperbarui password: ${updateError.message}`);
      process.exit(1);
    }
    console.log(`[create-admin] User ${email} sudah ada, password disegarkan.`);
  }

  if (!userId) {
    console.error("[create-admin] ID user tidak ditemukan setelah pembuatan akun.");
    process.exit(1);
  }

  const { error: upsertError } = await supabase
    .from("admins")
    .upsert({ id: userId, name, email }, { onConflict: "id" });
  if (upsertError) {
    console.error(`[create-admin] Gagal menyimpan baris admins: ${upsertError.message}`);
    process.exit(1);
  }

  console.log("[create-admin] Selesai.");
  console.log(`  Email    : ${email}`);
  console.log(`  Password : ${password}`);
}

main().catch((error: unknown) => {
  console.error("[create-admin] Terjadi kesalahan:", error);
  process.exit(1);
});
