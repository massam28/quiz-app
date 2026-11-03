"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FirebaseError } from "firebase/app";
import { GoogleAuthProvider, onIdTokenChanged, signInWithPopup, signOut } from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import type { TeacherCheck } from "@/lib/auth/teacher";
import TeacherDashboard from "./TeacherDashboard";

// 교사 화면 단계: 확인 중 → 로그인 전 → (Google 로그인) → 서버 확인 → 교사 화면
// 교사 화면 본문은 서버가 허용 계정이라고 답한 뒤에만 보여줍니다.
type State =
  | { status: "loading" }
  | { status: "signedOut"; notice?: string }
  | { status: "checking" }
  | { status: "allowed"; email: string };

const NOT_CONFIGURED = "Firebase 설정이 아직 없어 로그인할 수 없습니다. 관리자에게 문의해 주세요.";

function loginErrorMessage(error: unknown): string | null {
  if (error instanceof FirebaseError) {
    if (error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request") {
      return null;
    }
    if (error.code === "auth/popup-blocked") {
      return "로그인 창이 차단되었습니다. 브라우저에서 팝업을 허용한 뒤 다시 눌러 주세요.";
    }
    if (error.code === "auth/unauthorized-domain") {
      return "이 주소에서는 로그인할 수 없습니다. Firebase 로그인 허용 도메인에 이 주소를 등록해야 합니다.";
    }
  }
  return "로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

export default function TeacherApp() {
  const [state, setState] = useState<State>(
    isFirebaseConfigured ? { status: "loading" } : { status: "signedOut", notice: NOT_CONFIGURED },
  );

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const auth = getFirebaseAuth();
    let latest = 0;

    return onIdTokenChanged(auth, async (user) => {
      const run = ++latest;
      if (!user) {
        // 안내 문구가 있는 로그아웃 상태는 그대로 둡니다.
        setState((prev) => (prev.status === "signedOut" ? prev : { status: "signedOut" }));
        return;
      }

      // 한 시간마다 토큰이 바뀔 때는 화면을 그대로 두고 다시 확인만 합니다.
      setState((prev) => (prev.status === "allowed" ? prev : { status: "checking" }));
      let check: TeacherCheck | null = null;
      try {
        const idToken = await user.getIdToken();
        const res = await fetch("/api/teacher/me", {
          headers: { Authorization: `Bearer ${idToken}` },
          cache: "no-store",
        });
        check = (await res.json()) as TeacherCheck;
      } catch {
        check = null;
      }
      if (run !== latest) return;

      if (check?.ok) {
        setState({ status: "allowed", email: check.email });
        return;
      }

      const notice =
        check?.reason === "not-allowed"
          ? `허용되지 않은 계정입니다. ${user.email ?? "이 계정"}(으)로는 교사 화면에 들어갈 수 없습니다. 교사용 Google 계정으로 다시 로그인해 주세요.`
          : check?.reason === "not-configured"
            ? NOT_CONFIGURED
            : "로그인 상태를 확인하지 못했습니다. 다시 로그인해 주세요.";
      setState({ status: "signedOut", notice });
      await signOut(auth);
    });
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    // 매번 계정을 고를 수 있게 합니다.
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      await signInWithPopup(getFirebaseAuth(), provider);
    } catch (error) {
      const notice = loginErrorMessage(error);
      setState({ status: "signedOut", notice: notice ?? undefined });
    }
  };

  const logout = async () => {
    setState({ status: "signedOut", notice: "로그아웃했습니다." });
    await signOut(getFirebaseAuth());
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-slate-500">교사</p>
        <h1 className="text-2xl font-bold">교사 화면</h1>
      </div>

      {(state.status === "loading" || state.status === "checking") && (
        <p className="rounded-xl border border-slate-200 bg-white p-4 text-slate-700">
          {state.status === "loading" ? "로그인 상태를 확인하고 있습니다…" : "교사 계정인지 확인하고 있습니다…"}
        </p>
      )}

      {state.status === "signedOut" && (
        <div className="flex flex-col gap-4">
          {state.notice && (
            <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 leading-relaxed text-amber-900">
              {state.notice}
            </p>
          )}
          <p className="text-lg leading-relaxed text-slate-700">
            교사 화면은 허용된 교사 Google 계정으로 로그인해야 볼 수 있습니다.
          </p>
          <button
            type="button"
            onClick={login}
            disabled={!isFirebaseConfigured}
            className="min-h-14 rounded-xl bg-blue-600 px-6 text-lg font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Google로 로그인
          </button>
        </div>
      )}

      {state.status === "allowed" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-blue-50 p-4">
            <p className="text-slate-700">
              <span className="font-semibold">{state.email}</span> 계정으로 로그인했습니다.
            </p>
            <button
              type="button"
              onClick={logout}
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-100"
            >
              로그아웃
            </button>
          </div>
          <TeacherDashboard />
        </>
      )}

      <Link
        href="/"
        className="flex min-h-14 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-lg font-semibold text-slate-700 hover:bg-slate-100"
      >
        첫 화면으로
      </Link>
    </section>
  );
}
