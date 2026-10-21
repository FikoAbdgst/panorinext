"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createRoomAction } from "@/app/admin/(panel)/rooms/actions";
import { Modal } from "@/components/admin/Modal";

import { RoomForm, type RoomPackOption } from "./RoomForm";

export function RoomCreateModal({ packs }: { packs: RoomPackOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-[#BF3131] px-4 py-2 text-sm font-medium text-white hover:bg-[#a52929]"
      >
        + Buat Ruang
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Buat Ruang Premium" size="md">
        <RoomForm
          mode="create"
          packs={packs}
          action={createRoomAction}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Modal>
    </>
  );
}
