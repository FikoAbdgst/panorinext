/**
 * Menghitung area sumber (crop) untuk menampilkan gambar dengan mode "cover"
 * ke dalam kotak tujuan berukuran dstW x dstH. Rasio gambar tetap terjaga,
 * kelebihan dipotong dari tengah.
 */
export function getCoverSourceRect(
  imgW: number,
  imgH: number,
  dstW: number,
  dstH: number,
): { sx: number; sy: number; sw: number; sh: number } {
  if (imgW <= 0 || imgH <= 0 || dstW <= 0 || dstH <= 0) {
    return { sx: 0, sy: 0, sw: imgW, sh: imgH };
  }

  const imgAspect = imgW / imgH;
  const dstAspect = dstW / dstH;

  if (imgAspect > dstAspect) {
    const sw = imgH * dstAspect;
    return { sx: (imgW - sw) / 2, sy: 0, sw, sh: imgH };
  }

  const sh = imgW / dstAspect;
  return { sx: 0, sy: (imgH - sh) / 2, sw: imgW, sh };
}
