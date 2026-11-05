import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";
import { getSession } from "@/lib/auth";

export interface AuthLabels {
  login: string;
  signup: string;
  logout: string;
}

export function authLabels(t: (key: string) => string): AuthLabels {
  return { login: t("nav.login"), signup: t("nav.signup"), logout: t("nav.logout") };
}

/** Login / sign-up links, or log out when signed in (admins open /admin by typing the path). Server component: reads the session. */
export default async function AuthNav({ labels, slug }: { labels: AuthLabels; slug: string }) {
  const session = await getSession();
  if (!session) {
    return (
      <>
        <Link href={`/${slug}/login`}>{labels.login}</Link>
        <Link href={`/${slug}/signup`}>{labels.signup}</Link>
      </>
    );
  }
  return (
    <>
      <SignOutButton label={labels.logout} />
    </>
  );
}
