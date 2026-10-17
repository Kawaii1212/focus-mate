import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { Chatbot } from "@/components/Chatbot";
import { ChatbotErrorBoundary } from "@/components/ChatbotErrorBoundary";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FocusMate - Học tập cùng Mascot",
  description: "Nền tảng học tập Pomodoro kết hợp Mascot ảo thông minh và phòng học nhóm Co-Study",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={inter.className}>
      <body className={inter.className}>
        <Providers>
          {children}
          <ChatbotErrorBoundary>
            <Chatbot />
          </ChatbotErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
