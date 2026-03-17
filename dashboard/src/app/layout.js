import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Providers from "@/components/Providers";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata = {
  title: "Ai DM Bot | Automation Dashboard",
  description: "Next-gen Instagram automation and DM management",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} antialiased`} suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
