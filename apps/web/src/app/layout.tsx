import { Metadata } from "next";
import "./globals.css";
import Topbar from "@/components/topbar";
import Footer from "@/components/footer";
import { UserProvider } from "@/context/UserContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { Toaster } from "sonner";
export const metadata: Metadata = {
  title: "Weekly Planner",
  description: "A simple weekly planner built with Next.js and Tailwind CSS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col">
        <LanguageProvider>
          <UserProvider>
            <Topbar />
            <div className="flex flex-1 flex-col">{children}</div>
            <Footer />
            <Toaster position="bottom-right" richColors />
          </UserProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
