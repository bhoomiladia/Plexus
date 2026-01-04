import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { WalletProvider } from "@/components/WalletProvider";
import { ColorThemeProvider } from "@/hooks/useColorTheme";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Unirivo",
  description:
    "Collaborate, manage projects, and chat with your teammates — all in one place.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geist.variable} ${geistMono.variable} font-sans antialiased bg-gray-50 text-gray-900 dark:bg-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-300`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ColorThemeProvider>
            <WalletProvider>
              <AuthProvider>
                {children}
                <Analytics />
              </AuthProvider>
            </WalletProvider>
          </ColorThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
