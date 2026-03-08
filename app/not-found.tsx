import Link from "next/link";
import { Button } from "@/components/shared/Button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-warm px-4">
      <div className="w-full max-w-md text-center">
        <p className="text-6xl">🕌</p>
        <h1 className="mt-4 text-2xl font-bold text-ink-black">
          Halaman Tidak Ditemukan
        </h1>
        <p className="mt-2 text-sm text-ink-mid">
          Sepertinya halaman yang Anda cari tidak ada atau telah dipindahkan.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/">
            <Button variant="primary">Ke Beranda</Button>
          </Link>
          <Link href="/chat">
            <Button variant="outline">Chat AI</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
