"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createFlipbookFrameAction } from "@/app/admin/(panel)/flipbook/actions";
import { Modal } from "@/components/admin/Modal";

import { FlipbookFrameForm } from "./FlipbookFrameForm";

export function FlipbookCreateModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-[#BF3131] px-4 py-2 text-sm font-medium text-white hover:bg-[#a52929]"
      >
        + Tambah tipe frame
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Tambah tipe frame flipbook"
        size="md"
      >
        <p className="mb-4 text-sm text-neutral-600">
          Satu tipe frame berisi 12 overlay PNG: 1 sampul, 10 halaman, dan 1
          penutup. Setelah dibuat, unggah overlay di halaman edit.
        </p>
        <FlipbookFrameForm
          mode="create"
          action={createFlipbookFrameAction}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Modal>
    </>
  );
}
