"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignOutButton({ label }: { label: string }) {
  const router = useRouter();
  return (
    <button
      className="linkbtn"
      onClick={async () => {
        await authClient.signOut();
        router.refresh();
      }}
    >
      {label}
    </button>
  );
}
