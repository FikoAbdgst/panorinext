"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createCategoryAction } from "@/app/admin/(panel)/categories/actions";
import { Modal } from "@/components/admin/Modal";

import { CategoryForm } from "./CategoryForm";

export function CategoryCreateModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-[#BF3131] px-4 py-2 text-sm font-medium text-white hover:bg-[#a52929]"
      >
        + Tambah Kategori
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Tambah Kategori" size="sm">
        <CategoryForm
          mode="create"
          action={createCategoryAction}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Modal>
    </>
  );
}
