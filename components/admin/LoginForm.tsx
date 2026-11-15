"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

const FORBIDDEN_MESSAGE = "편집 권한이 없는 계정이에요.";

/** Maps Supabase Auth error codes to a message that tells the user what to fix. */
function signInErrorMessage(code: string | undefined, status: number | undefined) {
  if (code === "email_not_confirmed")
    return "이메일 인증이 안 된 계정이에요. Supabase Dashboard에서 이 사용자를 인증(Confirm) 처리해 주세요.";
  if (code === "user_banned") return "사용이 정지된 계정이에요.";
  if (code === "over_request_rate_limit" || status === 429)
    return "로그인 시도가 너무 많아요. 잠시 후 다시 시도해 주세요.";
  if (!status || status >= 500) return "서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.";
  return "이메일 또는 비밀번호가 맞지 않아요.";
}

export function LoginForm({ forbidden }: { forbidden?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(forbidden ? FORBIDDEN_MESSAGE : null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);

    const supabase = createClient();
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) {
        console.error("[login] sign-in failed:", signInError.code, signInError.status, signInError.message);
        setError(signInErrorMessage(signInError.code, signInError.status));
        setPending(false);
        return;
      }

      const { data: isAdmin, error: rpcError } = await supabase.rpc("is_admin");
      if (rpcError) {
        console.error("[login] is_admin failed:", rpcError.code, rpcError.message);
        await supabase.auth.signOut();
        setError("권한을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.");
        setPending(false);
        return;
      }
      if (isAdmin !== true) {
        await supabase.auth.signOut();
        setError(FORBIDDEN_MESSAGE);
        setPending(false);
        return;
      }
    } catch (err) {
      console.error("[login] network error:", err);
      setError("서버에 연결하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.");
      setPending(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <Field id="email" label="이메일">
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>

      <Field id="password" label="비밀번호">
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-14"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
            aria-pressed={showPassword}
            className="absolute top-1/2 right-1 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5"
          >
            {showPassword ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
          </button>
        </div>
      </Field>

      {error && (
        <p role="alert" className="rounded-xl bg-coral/10 px-4 py-3 text-[15px] font-semibold text-coral-ink">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending || !email || !password}>
        {pending && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
        로그인
      </Button>
    </form>
  );
}
