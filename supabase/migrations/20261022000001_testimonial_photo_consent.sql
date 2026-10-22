-- =============================================================================
-- PanoriCam - Izin foto & kurasi testimoni untuk landing page
--   photo_path   : objek di bucket privat photo-results (photostrip sesi)
--   photo_consent: user mengizinkan fotonya tampil sebagai testimoni
--   is_featured  : admin memilih testimoni yang tampil di landing page
-- =============================================================================

alter table public.testimonials
  add column if not exists photo_path text,
  add column if not exists photo_consent boolean not null default false,
  add column if not exists is_featured boolean not null default false;

alter table public.testimonials
  drop constraint if exists testimonials_featured_requires_consent;

alter table public.testimonials
  add constraint testimonials_featured_requires_consent
  check (not is_featured or photo_consent);

create index if not exists testimonials_featured_created_idx
  on public.testimonials (created_at desc)
  where is_featured;
