import type { Metadata } from "next";
import { Fira_Code, Fira_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";

import { ToastContainer } from "@/components/ui/Toast";

// Task 13.3: must run before hydration (strategy="beforeInteractive") or
// the page would paint with the wrong theme for a frame, then visibly
// snap to the correct one. Kept as a tiny inline string, not imported
// from useTheme.ts, since a Server Component pulling in a "use client"
// module just for one string constant isn't worth the coupling -- the
// storage key ("stixor-cs-theme-v1") must be kept in sync with
// `THEME_STORAGE_KEY` there by hand.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var theme = localStorage.getItem("stixor-cs-theme-v1");
    if (theme === "light" || theme === "dark") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  } catch (e) {}
})();
`;

const firaSans = Fira_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const firaCode = Fira_Code({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stixor CS Task Dashboard",
  description: "Customer Success task management dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${firaSans.variable} ${firaCode.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
