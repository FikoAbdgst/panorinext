"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createFrameAction } from "@/app/admin/(panel)/frames/actions";
import { Modal } from "@/components/admin/Modal";

import { FrameForm } from "./FrameForm";

type CategoryOption = {
  id: number;
  name: string;
};

export function FrameCreateModal({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-[#BF3131] px-4 py-2 text-sm font-medium text-white hover:bg-[#a52929]"
      >
        + Tambah Frame
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Tambah Frame" size="lg">
        <FrameForm
          mode="create"
          categories={categories}
          action={createFrameAction}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Modal>
    </>
  );
}
