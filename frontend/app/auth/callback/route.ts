import { getCurrentUser } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // 認証プロバイダーから渡される一時的な認証コード
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code); // codeをJWTトークンへ変換

    // セッションからトークンを取得
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (token) {
      // Go バックエンドでユーザー存在チェック
      const user = await getCurrentUser(token).catch(() => null);

      // ③ 存在しなければ /setup へ
      if (!user) {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_SITE_URL}/setup`,
        );
      }
    }
  }

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`);
}
