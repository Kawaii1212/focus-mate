import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Enter",
  description: "Enter Generated Project",
  openGraph: {
    title: "Enter - chat to build websites & apps",
    description: "Go from your creative idea to launch your Apps in minutes by Chat and Enter.",
    images: [
      {
        url: "https://jtrrmltzqcfjkvribmwe.supabase.co/storage/v1/object/public/enter/enter-og-image-square-1.jpeg",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
