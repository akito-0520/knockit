import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ContactForm from "@/components/contact/ContactForm";

export default async function ContactPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) redirect("/login");

  return (
    <main className="p-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">問い合わせ</h1>
        <Link href="/settings">
          <Button variant="outline">設定へ</Button>
        </Link>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        バグ報告・要望など、運営宛のお問い合わせをお送りいただけます。
      </p>
      <ContactForm token={token} />
    </main>
  );
}
