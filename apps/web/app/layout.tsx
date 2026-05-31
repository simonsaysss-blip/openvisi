import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "OpenVisi | AI Visibility Platform",
  description: "The Trust Layer for AI Visibility benchmarks, evidence, reports, and prediction registry workflows."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
