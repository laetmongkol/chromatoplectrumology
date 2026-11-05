import { redirect } from "next/navigation";
import { Suspense } from "react";
import { preferredSlug } from "@/lib/i18n";

// "/" has no language, so send the visitor to their own: remembered choice, browser setting, or the site default.
export default function Root() {
  return (
    <Suspense fallback={null}>
      <Go />
    </Suspense>
  );
}

async function Go(): Promise<never> {
  return redirect(`/${await preferredSlug()}`);
}
