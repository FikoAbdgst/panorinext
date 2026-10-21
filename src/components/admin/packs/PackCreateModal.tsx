"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createPackAction } from "@/app/admin/(panel)/packs/actions";
import { Modal } from "@/components/admin/Modal";

import { PackForm, type PackFrameOption } from "./PackForm";

export function PackCreateModal({ frames }: { frames: PackFrameOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-[#BF3131] px-4 py-2 text-sm font-medium text-white hover:bg-[#a52929]"
      >
        + Tambah Paket
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Tambah Paket" size="lg">
        <PackForm
          mode="create"
          frames={frames}
          action={createPackAction}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Modal>
    </>
  );
}
