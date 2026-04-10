import { Metadata } from "next";
import "./globals.css";
import Topbar from "@/components/topbar";
import { UserProvider } from "@/context/UserContext";

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
      <body className="min-h-full flex flex-col">
        <UserProvider>
          <Topbar />
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
