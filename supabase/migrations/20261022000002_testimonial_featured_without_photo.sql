-- =============================================================================
-- PanoriCam - Testimoni tanpa foto boleh tampil di landing page
--   Foto tetap opsional: hanya testimoni dengan izin foto yang menampilkan
--   gambar. Testimoni teks (tanpa foto) tetap bisa dikurasi admin.
-- =============================================================================

alter table public.testimonials
  drop constraint if exists testimonials_featured_requires_consent;
