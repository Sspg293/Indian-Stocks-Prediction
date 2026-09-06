import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bharat Markets — Indian Stock Prediction",
  description: "Indian stock market dashboard with technical analysis and prediction signals."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
