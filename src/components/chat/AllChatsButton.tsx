'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface AllChatsButtonProps {
  href: string;
}

export default function AllChatsButton({ href }: AllChatsButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Link
      href={href}
      onClick={() => setIsLoading(true)}
      className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-[11px] font-semibold text-zinc-300 hover:text-white inline-flex items-center gap-1 transition-all shadow-sm cursor-pointer"
      title="Return to Chat Hub / Discussions"
    >
      {isLoading ? (
        <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />
      ) : (
        <ArrowLeft className="w-3 h-3 text-zinc-400" />
      )}
      <span>All Chats</span>
    </Link>
  );
}
