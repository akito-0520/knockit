import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md text-center space-y-6">
        <Image
          src="/icon.png"
          alt="Knockit"
          width={96}
          height={96}
          className="mx-auto"
          priority
        />
        <h1 className="text-5xl font-bold">Knockit</h1>
        <p className="text-lg text-muted-foreground">
          家族にあなたの今を、そっと伝える。
        </p>
        <p className="text-sm text-muted-foreground">
          会議中・作業中・休憩中など、部屋の状況をリアルタイムで共有できます。
        </p>
        <div className="pt-4">
          <Link href="/login">
            <Button size="lg">はじめる</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
