"use client";

import { useState, type ReactNode } from "react";

import { Modal } from "@/components/admin/Modal";
import type {
  AdminTransactionRow,
  TransactionStatus,
} from "@/lib/transactions/queries";
import {
  buildTransactionStatusMessage,
  buildWhatsappUrl,
} from "@/lib/whatsapp";

import {
  PremiumAccessHandoff,
  TransactionActions,
} from "./TransactionActions";

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  bank_transfer: "E-Wallet",
  qris: "QRIS",
};

const STATUS_BADGE: Record<TransactionStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-800" },
  approved: { label: "Disetujui", className: "bg-green-100 text-green-800" },
  rejected: { label: "Ditolak", className: "bg-red-100 text-red-700" },
};

export function formatRupiah(value: number): string {
  return `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getWhatsappLink(
  trx: AdminTransactionRow,
): { label: string; href: string } | null {
  if (!trx.whatsapp_number) return null;

  return {
    label: trx.whatsapp_number,
    href: buildWhatsappUrl(
      trx.whatsapp_number,
      buildTransactionStatusMessage({
        status: trx.status,
        customerName: trx.customer_name,
        packName: trx.pack_name ?? trx.frame_name,
        orderId: trx.order_id,
        roomCode: trx.room_code,
      }),
    ),
  };
}

export function TransactionTable({ transactions }: { transactions: AdminTransactionRow[] }) {
  const [detail, setDetail] = useState<AdminTransactionRow | null>(null);

  if (transactions.length === 0) {
    return (
      <p className="rounded-lg border border-neutral-200 bg-white px-4 py-6 text-sm text-neutral-500">
        Tidak ada transaksi.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Paket / Frame</th>
              <th className="px-4 py-3">Pemesan</th>
              <th className="px-4 py-3">Metode</th>
              <th className="px-4 py-3">Jumlah</th>
              <th className="px-4 py-3">Bukti</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Dibuat</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {transactions.map((trx) => {
              const badge = STATUS_BADGE[trx.status];
              const wa = getWhatsappLink(trx);
              return (
                <tr key={trx.id} className="align-middle">
                  <td className="px-4 py-3 font-mono text-xs text-neutral-700">
                    {trx.order_id}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    <div>{trx.pack_name ?? trx.frame_name ?? "—"}</div>
                    {trx.room_code ? (
                      <span className="font-mono text-xs text-[#BF3131]">
                        {trx.room_code}
                      </span>
                    ) : trx.pack_name ? (
                      <span className="text-xs text-neutral-400">Paket</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    <div>{trx.customer_name}</div>
                    {wa ? (
                      <a
                        href={wa.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#BF3131] underline"
                      >
                        {wa.label}
                      </a>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {PAYMENT_METHOD_LABEL[trx.payment_method] ?? trx.payment_method}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{formatRupiah(trx.amount)}</td>
                  <td className="px-4 py-3">
                    {trx.payment_proof_url ? (
                      <a
                        href={trx.payment_proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#BF3131] underline"
                      >
                        Lihat
                      </a>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{formatDate(trx.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-end gap-2">
                      <button
                        type="button"
                        onClick={() => setDetail(trx)}
                        className="text-xs font-medium text-[#BF3131] underline"
                      >
                        Detail
                      </button>
                      {trx.status === "pending" ? (
                        <TransactionActions
                          id={trx.id}
                          customerName={trx.customer_name}
                          whatsappNumber={trx.whatsapp_number}
                          packName={trx.pack_name}
                          showHandoff={false}
                        />
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title="Detail Transaksi"
        size="md"
      >
        {detail ? (
          <TransactionDetail
            trx={detail}
            onDone={() => setDetail(null)}
          />
        ) : null}
      </Modal>
    </>
  );
}

function TransactionDetail({
  trx,
  onDone,
}: {
  trx: AdminTransactionRow;
  onDone: () => void;
}) {
  const badge = STATUS_BADGE[trx.status];
  const wa = getWhatsappLink(trx);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm text-neutral-700">{trx.order_id}</span>
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {trx.pack_name ? (
          <DetailItem label="Paket" value={trx.pack_name} />
        ) : (
          <DetailItem label="Frame" value={trx.frame_name ?? "—"} />
        )}
        <DetailItem
          label="Metode Pembayaran"
          value={PAYMENT_METHOD_LABEL[trx.payment_method] ?? trx.payment_method}
        />
        <DetailItem label="Jumlah" value={formatRupiah(trx.amount)} />
        <DetailItem label="Dibuat" value={formatDate(trx.created_at)} />
        <DetailItem label="Nama Pemesan" value={trx.customer_name} />
        <DetailItem
          label="Nomor WhatsApp"
          value={
            wa ? (
              <a
                href={wa.href}
                target="_blank"
                rel="noreferrer"
                className="text-[#BF3131] underline"
              >
                {wa.label}
              </a>
            ) : (
              "—"
            )
          }
        />
        {trx.approved_at ? (
          <DetailItem label="Disetujui" value={formatDate(trx.approved_at)} />
        ) : null}
      </dl>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase text-neutral-500">
          Bukti Pembayaran
        </p>
        {trx.payment_proof_url ? (
          <a href={trx.payment_proof_url} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={trx.payment_proof_url}
              alt="Bukti pembayaran"
              className="max-h-72 w-auto rounded-lg border border-neutral-200"
            />
          </a>
        ) : (
          <p className="text-sm text-neutral-500">Tidak ada bukti pembayaran.</p>
        )}
      </div>

      {trx.status === "approved" && trx.room_code ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-neutral-500">
            Akses Ruang Premium
          </p>
          <PremiumAccessHandoff
            customerName={trx.customer_name}
            whatsappNumber={trx.whatsapp_number}
            packName={trx.pack_name}
            code={trx.room_code}
          />
          {trx.room_expires_at ? (
            <p className="mt-2 text-xs text-neutral-500">
              Berakhir: {formatDate(trx.room_expires_at)}
            </p>
          ) : (
            <p className="mt-2 text-xs text-neutral-500">
              Masa aktif dimulai saat kode pertama kali dipakai.
            </p>
          )}
        </div>
      ) : null}

      {trx.status === "approved" && !trx.room_code && trx.frame_id !== null ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-neutral-500">
            Akses Booth
          </p>
          <a
            href={`/booth?frame_id=${trx.frame_id}&order_id=${trx.order_id}`}
            target="_blank"
            rel="noreferrer"
            className="break-all text-sm text-[#BF3131] underline"
          >
            /booth?frame_id={trx.frame_id}&amp;order_id={trx.order_id}
          </a>
        </div>
      ) : null}

      {trx.status === "pending" ? (
        <div className="border-t border-neutral-200 pt-4">
          <p className="mb-2 text-xs font-semibold uppercase text-neutral-500">Aksi</p>
          <TransactionActions
            id={trx.id}
            customerName={trx.customer_name}
            whatsappNumber={trx.whatsapp_number}
            packName={trx.pack_name}
            onDone={onDone}
          />
        </div>
      ) : null}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-neutral-500">{label}</dt>
      <dd className="text-sm text-neutral-800">{value}</dd>
    </div>
  );
}
