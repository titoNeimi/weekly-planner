import { Metadata } from "next";
import "./globals.css";
import Topbar from "@/components/topbar";
import Footer from "@/components/footer";
import CommandPalette from "@/components/command-palette";
import { UserProvider } from "@/context/UserContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { SearchProvider } from "@/context/SearchContext";
import { DensityProvider } from "@/context/DensityContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Toaster } from "sonner";
export const metadata: Metadata = {
  title: "Weekly Planner",
  description: "A simple weekly planner built with Next.js and Tailwind CSS.",
};

// Applied before hydration so the correct theme is painted on first frame —
// the class it sets on <html> is why <html> below carries suppressHydrationWarning.
const THEME_INIT_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )theme=([^;]*)/);var t=m?decodeURIComponent(m[1]):"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <ThemeProvider>
          <LanguageProvider>
            <DensityProvider>
              <UserProvider>
                <SearchProvider>
                  <Topbar />
                  <div className="flex flex-1 flex-col">{children}</div>
                  <Footer />
                  <Toaster position="bottom-right" richColors />
                  <CommandPalette />
                </SearchProvider>
              </UserProvider>
            </DensityProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
