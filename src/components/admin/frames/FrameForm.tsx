"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  createFrameUploadUrlAction,
  type FrameFormState,
} from "@/app/admin/(panel)/frames/actions";
import { FRAME_STANDARD_SIZE, STORAGE_BUCKETS } from "@/lib/constants";
import { detectSlots, hasTransparentPixels } from "@/lib/frames/detect-slots";
import {
  getImageData,
  loadImage,
  loadImageFromBlob,
  loadImageFromFile,
} from "@/lib/frames/image";
import type { FrameSlot } from "@/lib/frames/types";
import { getFramePublicUrl } from "@/lib/frames/url";
import { createClient } from "@/lib/supabase/client";

import { FrameImageEditor, type FrameImageEditResult } from "./FrameImageEditor";
import { SlotEditor } from "./SlotEditor";

type CategoryOption = {
  id: number;
  name: string;
};

type FrameFormFrame = {
  id: number;
  name: string;
  slug: string;
  access_type: "free" | "premium";
  category_id: number | null;
  width: number;
  height: number;
  slots: FrameSlot[];
  image_path: string | null;
};

type FrameFormProps = {
  mode: "create" | "edit";
  categories: CategoryOption[];
  action: (state: FrameFormState, formData: FormData) => Promise<FrameFormState>;
  frame?: FrameFormFrame;
  onSuccess?: () => void;
};

const INITIAL_STATE: FrameFormState = { status: "idle" };

export function FrameForm({ mode, categories, action, frame, onSuccess }: FrameFormProps) {
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    if (state.status === "success") {
      onSuccessRef.current?.();
    }
  }, [state]);

  const [name, setName] = useState(frame?.name ?? "");
  const [slug, setSlug] = useState(frame?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [categoryId, setCategoryId] = useState(
    frame?.category_id !== null && frame?.category_id !== undefined
      ? String(frame.category_id)
      : "",
  );
  const [accessType, setAccessType] = useState<"free" | "premium">(
    frame?.access_type ?? "free",
  );

  const [dimensions, setDimensions] = useState({
    width: frame?.width ?? FRAME_STANDARD_SIZE.width,
    height: frame?.height ?? FRAME_STANDARD_SIZE.height,
  });
  const [slots, setSlots] = useState<FrameSlot[]>(frame?.slots ?? []);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    frame?.image_path ? getFramePublicUrl(frame.image_path) : null,
  );
  const [imagePath, setImagePath] = useState<string | null>(frame?.image_path ?? null);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const imageRef = useRef<HTMLImageElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const uploadedPathRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (mode !== "edit" || imageRef.current || !previewUrl) {
      return;
    }
    loadImage(previewUrl, true)
      .then((image) => {
        imageRef.current = image;
      })
      .catch(() => {
        // Preview tetap tampil, hanya deteksi ulang yang tidak tersedia.
      });
  }, [mode, previewUrl]);

  const runDetection = (image: HTMLImageElement) => {
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    setDimensions({ width, height });

    let imageData;
    try {
      imageData = getImageData(image, width, height);
    } catch {
      setWarnings([
        "Tidak dapat membaca piksel PNG (kemungkinan dibatasi CORS). Gunakan unggah ulang PNG.",
      ]);
      return;
    }

    if (!hasTransparentPixels(imageData)) {
      setSlots([]);
      setWarnings([
        "PNG tidak memiliki area transparan. Slot foto tidak dapat dideteksi otomatis; tambahkan slot manual.",
      ]);
      return;
    }

    const detected = detectSlots(imageData);
    setSlots(detected);

    const next: string[] = [];
    if (detected.length === 0) {
      next.push("Tidak ada slot yang terdeteksi otomatis. Tambahkan slot secara manual.");
    }
    if (
      width !== FRAME_STANDARD_SIZE.width ||
      height !== FRAME_STANDARD_SIZE.height
    ) {
      next.push(
        `Ukuran frame ${width}×${height} berbeda dari standar ${FRAME_STANDARD_SIZE.width}×${FRAME_STANDARD_SIZE.height}. Pastikan ini disengaja.`,
      );
    }
    setWarnings(next);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileError(null);
    if (!file) {
      return;
    }
    if (file.type !== "image/png" && !file.name.toLowerCase().endsWith(".png")) {
      setFileError("File overlay harus berformat PNG.");
      event.target.value = "";
      return;
    }

    try {
      const { image, objectUrl } = await loadImageFromFile(file);
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      objectUrlRef.current = objectUrl;
      imageRef.current = image;
      setPreviewUrl(objectUrl);
      setPendingBlob(file);
      setImagePath(null);
      uploadedPathRef.current = null;
      setIsEditorOpen(false);
      runDetection(image);
    } catch {
      setFileError("Gagal membaca gambar.");
    }
  };

  const handleApplyEdit = async (result: FrameImageEditResult) => {
    const { image, objectUrl } = await loadImageFromBlob(result.blob);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    objectUrlRef.current = objectUrl;
    imageRef.current = image;
    setPreviewUrl(objectUrl);
    setPendingBlob(result.blob);
    setImagePath(null);
    uploadedPathRef.current = null;
    setDimensions({ width: result.width, height: result.height });
    setSlots(result.slots);
    setFileError(null);
    setWarnings(
      result.slots.length === 0
        ? ["Belum ada slot. Hapus area slot lalu terapkan ulang."]
        : [],
    );
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending || isUploading) {
      return;
    }

    const form = event.currentTarget;
    if (!pendingBlob && !imagePath) {
      setFileError("File PNG overlay wajib diunggah.");
      return;
    }

    if (state.status === "error") {
      uploadedPathRef.current = null;
    }

    void (async () => {
      const formData = new FormData(form);

      if (pendingBlob) {
        setIsUploading(true);
        setFileError(null);
        try {
          let path = uploadedPathRef.current;
          if (!path) {
            const target = await createFrameUploadUrlAction(slug);
            if ("error" in target) {
              setFileError(target.error);
              return;
            }

            const supabase = createClient();
            const { error } = await supabase.storage
              .from(STORAGE_BUCKETS.frames)
              .uploadToSignedUrl(target.path, target.token, pendingBlob, {
                contentType: "image/png",
              });
            if (error) {
              setFileError(`Gagal mengunggah PNG: ${error.message}`);
              return;
            }

            path = target.path;
            uploadedPathRef.current = path;
          }

          formData.set("image_path", path);
          setImagePath(path);
        } catch {
          setFileError("Gagal mengunggah PNG. Coba lagi.");
          return;
        } finally {
          setIsUploading(false);
        }
      }

      startTransition(() => {
        formAction(formData);
      });
    })();
  };

  const handleRedetect = () => {
    if (imageRef.current) {
      runDetection(imageRef.current);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {state.status === "error" && state.message ? (
        <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Nama Frame</span>
          <input
            name="name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (!slugTouched && mode === "create") {
                setSlug(
                  event.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, ""),
                );
              }
            }}
            required
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Slug (opsional)</span>
          <input
            name="slug"
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
            placeholder="otomatis dari nama"
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Kategori</span>
          <select
            name="category_id"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2"
          >
            <option value="">Tanpa kategori</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Tipe Akses</span>
          <select
            name="access_type"
            value={accessType}
            onChange={(event) =>
              setAccessType(event.target.value as "free" | "premium")
            }
            className="rounded-lg border border-neutral-300 px-3 py-2"
          >
            <option value="free">Gratis</option>
            <option value="premium">Premium (masuk paket)</option>
          </select>
          <span className="text-xs text-neutral-500">
            Frame premium hanya bisa dipakai lewat paket dan kode ruang.
          </span>
        </label>
      </div>

      <div className="rounded-xl border border-neutral-200 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-neutral-800">
              {mode === "create" ? "Unggah Overlay PNG" : "Overlay PNG"}
            </h2>
            <p className="text-xs text-neutral-500">
              Lubang transparan pada PNG menjadi slot foto.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditorOpen(true)}
              disabled={!previewUrl || isUploading || isPending}
              className="rounded-lg bg-[#BF3131] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#a52929] disabled:opacity-50"
            >
              Edit PNG
            </button>
            <button
              type="button"
              onClick={handleRedetect}
              disabled={!previewUrl || isUploading || isPending}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 disabled:opacity-50"
            >
              Deteksi Ulang Slot
            </button>
          </div>
        </div>

        <input
          type="file"
          accept="image/png"
          onChange={handleFileChange}
          className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#BF3131] file:px-4 file:py-2 file:text-white"
        />
        {mode === "edit" ? (
          <p className="mt-1 text-xs text-neutral-500">
            Biarkan kosong jika tidak ingin mengganti overlay.
          </p>
        ) : null}
        <p className="mt-2 text-xs text-neutral-500">
          Tidak ada area transparan? Klik Edit PNG, lalu hapus area slot dengan
          Magic Wand atau Kotak Slot.
        </p>
        {isUploading ? (
          <p className="mt-2 text-sm text-neutral-600">
            Mengunggah PNG ke storage...
          </p>
        ) : null}
        {!isUploading && (pendingBlob || imagePath) ? (
          <p className="mt-2 text-sm text-green-700">PNG siap disimpan.</p>
        ) : null}
        {fileError ? <p className="mt-2 text-sm text-red-600">{fileError}</p> : null}

        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <SlotEditor
            imageUrl={previewUrl}
            width={dimensions.width}
            height={dimensions.height}
            slots={slots}
            onChange={setSlots}
          />

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-neutral-700">Lebar (px)</span>
                <input
                  type="number"
                  value={dimensions.width}
                  readOnly
                  className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-neutral-700">Tinggi (px)</span>
                <input
                  type="number"
                  value={dimensions.height}
                  readOnly
                  className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2"
                />
              </label>
            </div>

            {warnings.length > 0 ? (
              <ul className="space-y-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {warnings.map((warning) => (
                  <li key={warning}>• {warning}</li>
                ))}
              </ul>
            ) : null}

            <p className="text-sm">
              <span className="inline-flex items-center rounded-full bg-[#FEF3E2] px-3 py-1 font-semibold text-[#BF3131]">
                {slots.length} Slot
              </span>
              <span className="ml-2 text-xs text-neutral-500">
                terdeteksi / diatur manual.
              </span>
            </p>
          </div>
        </div>
      </div>

      <input type="hidden" name="width" value={dimensions.width} />
      <input type="hidden" name="height" value={dimensions.height} />
      <input type="hidden" name="slots" value={JSON.stringify(slots)} />
      <input type="hidden" name="image_path" value={imagePath ?? ""} />

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending || isUploading || (!pendingBlob && !imagePath)}
          className="rounded-lg bg-[#BF3131] px-5 py-2 font-medium text-white hover:bg-[#a52929] disabled:opacity-60"
        >
          {isPending
            ? "Menyimpan..."
            : isUploading
              ? "Mengunggah..."
              : mode === "create"
                ? "Simpan Frame"
                : "Perbarui Frame"}
        </button>
      </div>

      {isEditorOpen ? (
        <FrameImageEditor
          key={previewUrl ?? "none"}
          open
          imageUrl={previewUrl}
          initialSlots={slots}
          onClose={() => setIsEditorOpen(false)}
          onApply={handleApplyEdit}
        />
      ) : null}
    </form>
  );
}
