import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Canvas Platform",
  description: "A canvas platform for creating and editing text and table elements",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
