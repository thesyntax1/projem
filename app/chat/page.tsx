"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProviderPanel from "@/components/ProviderPanel";
import ApiKeyModal from "@/components/ApiKeyModal";
import ChatWindow from "@/components/ChatWindow";
import DiskExplorer from "@/components/DiskExplorer";
import DownloadZipButton from "@/components/DownloadZipButton";
import { useAetherStore } from "@/lib/store";

export default function ChatPage() {
  const { sessionId, diskTree, setDiskTree } = useAetherStore();
  const [keyModalProvider, setKeyModalProvider] = useState<string | null>(null);

  const refreshDisk = useCallback(async () => {
    const res = await fetch(`/api/disk?sessionId=${sessionId}`);
    if (res.ok) {
      const data = await res.json();
      setDiskTree(data.tree);
    }
  }, [sessionId, setDiskTree]);

  useEffect(() => {
    refreshDisk();
  }, [refreshDisk]);

  async function handleReset() {
    await fetch("/api/disk/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId })
    });
    refreshDisk();
  }

  return (
    <main className="mx-auto flex h-screen max-w-7xl flex-col px-6 py-5">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-mist hover:text-chalk">
            <ArrowLeft size={16} />
          </Link>
          <ProviderPanel onOpenKeyModal={setKeyModalProvider} />
        </div>
        <DownloadZipButton />
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-[1fr_280px]">
        <ChatWindow onDiskChanged={refreshDisk} />
        <DiskExplorer tree={diskTree} onReset={handleReset} />
      </div>

      <ApiKeyModal providerId={keyModalProvider} onClose={() => setKeyModalProvider(null)} />
    </main>
  );
}
