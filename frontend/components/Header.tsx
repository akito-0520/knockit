"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center">
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition"
        >
          <Image
            src="/icon.png"
            alt="Knockit"
            width={48}
            height={48}
            className="w-12 h-12"
            priority
          />
          <span className="text-lg font-bold tracking-tight">knockit</span>
        </Link>
      </div>
    </header>
  );
}
