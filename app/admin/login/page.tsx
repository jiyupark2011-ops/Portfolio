import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { checkIsAdmin, getUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { error } = await searchParams;

  // Already signed in as admin → go straight to the editor.
  if (error !== "forbidden") {
    const supabase = await createClient();
    if ((await getUserId(supabase)) && (await checkIsAdmin(supabase))) redirect("/admin");
  }

  return (
    <main id="main" className="flex min-h-svh items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-[13px] font-bold tracking-[0.12em] text-primary-ink uppercase">Admin</p>
          <h1 className="mt-1 text-[26px] font-bold">
            <span className="highlight">편집 모드</span> 로그인
          </h1>
        </div>
        <div className="rounded-[20px] border border-line bg-surface p-6 shadow-sm">
          <LoginForm forbidden={error === "forbidden"} />
        </div>
        <p className="mt-6 text-center">
          <Link href="/" className="inline-flex min-h-11 items-center text-sm font-semibold text-ink-soft hover:text-ink">
            ← 공개 화면으로
          </Link>
        </p>
      </div>
    </main>
  );
}
