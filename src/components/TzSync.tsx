"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Tells the server the visitor's time zone (a cookie), so "today" and streaks follow their own midnight. Refreshes once if it changed. */
export default function TzSync({ current }: { current: number | null }) {
  const router = useRouter();
  useEffect(() => {
    const off = new Date().getTimezoneOffset();
    if (off === current) return;
    document.cookie = `tzoff=${off}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }, [current, router]);
  return null;
}
