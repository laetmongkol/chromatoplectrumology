import Link from "next/link";
import NavPopover from "@/components/NavPopover";
import SignOutButton from "@/components/SignOutButton";
import { getSession } from "@/lib/auth";

export interface AuthLabels {
  login: string;
  signup: string;
  logout: string;
  me: string;
  settings: string;
  menu: string;
}

export function authLabels(t: (key: string) => string): AuthLabels {
  return { login: t("nav.login"), signup: t("nav.signup"), logout: t("nav.logout"), me: t("nav.me"), settings: t("nav.settings"), menu: t("nav.menu") };
}

export interface NavItem {
  href: string;
  label: string;
}

/**
 * The account part of the nav (server component: reads the session).
 * Wide screens: log in / sign up links, or the player's name with a drop-down (my practice, settings, log out).
 * Narrow screens: one menu button holding the explore links and the same account items.
 * Admins open /admin by typing the path.
 */
export default async function AuthNav({ labels, slug, explore }: { labels: AuthLabels; slug: string; explore: NavItem[] }) {
  const session = await getSession();
  const exploreLinks = explore.map((i) => (
    <Link key={i.href} href={i.href} role="menuitem">
      {i.label}
    </Link>
  ));

  if (!session) {
    return (
      <>
        <Link className="nav-wide" href={`/${slug}/login`}>
          {labels.login}
        </Link>
        <Link className="nav-wide" href={`/${slug}/signup`}>
          {labels.signup}
        </Link>
        <NavPopover label={labels.menu} icon className="nav-narrow">
          {exploreLinks}
          <hr />
          <Link href={`/${slug}/login`} role="menuitem">
            {labels.login}
          </Link>
          <Link href={`/${slug}/signup`} role="menuitem">
            {labels.signup}
          </Link>
        </NavPopover>
      </>
    );
  }

  const account = (
    <>
      <Link href={`/${slug}/me`} role="menuitem">
        {labels.me}
      </Link>
      <Link href={`/${slug}/settings`} role="menuitem">
        {labels.settings}
      </Link>
      <SignOutButton label={labels.logout} />
    </>
  );
  const name = session.user.name.split(" ")[0] || labels.me;
  return (
    <>
      <NavPopover label={name} className="nav-wide">
        {account}
      </NavPopover>
      <NavPopover label={labels.menu} icon className="nav-narrow">
        {exploreLinks}
        <hr />
        {account}
      </NavPopover>
    </>
  );
}
