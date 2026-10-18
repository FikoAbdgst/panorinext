-- =============================================================================
-- PanoriCam - Seed data
-- Kategori awal (selaras dengan FrameSeeder Laravel lama).
-- =============================================================================

insert into public.categories (name, icon)
values
  ('Aesthetic',    '✨'),
  ('Anime',        '🎌'),
  ('Demon Slayer', '⚔️'),
  ('Dino',         '🦖'),
  ('Kartun',       '🧸'),
  ('Music',        '🎵'),
  ('K-Pop',        '🎤'),
  ('Retro',        '📼'),
  ('Tiket',        '🎟️'),
  ('Custom',       '⭐')
on conflict (name) do update set icon = excluded.icon;
