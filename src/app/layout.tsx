import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dog Food Hackathon | Hackathon Platform",
  description: "An open-source, self-hostable hackathon submission and judging platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <main className="flex flex-col min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
