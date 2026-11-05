import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "flag-icons/css/flag-icons.min.css";
import "./globals.css";
import ScrollNav from "@/components/ScrollNav";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
});

export const metadata: Metadata = {
  title: "Chromatoplectrumology",
  description: "Play guitar in the browser. Pick an audio interface, practice scales, and hear your tone with effects.",
};

export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // lang/dir and data-theme are set on <html> by the language provider and the theme script, so React must not flag them
    // data-scroll-behavior tells Next to scroll instantly (not smoothly) when you navigate between pages
    <html lang="th" className={`${inter.variable} ${mono.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        {children}
        <ScrollNav />
      </body>
    </html>
  );
}
