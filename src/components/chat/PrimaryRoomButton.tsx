'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';

interface PrimaryRoomButtonProps {
  href: string;
  roomName: string;
}

export default function PrimaryRoomButton({ href, roomName }: PrimaryRoomButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Link
      href={href}
      onClick={() => setIsLoading(true)}
      className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white text-xs font-semibold inline-flex items-center gap-2 transition-all cursor-pointer"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
          <span>Opening #{roomName}...</span>
        </>
      ) : (
        <>
          <span>Open #{roomName}</span>
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </Link>
  );
}
