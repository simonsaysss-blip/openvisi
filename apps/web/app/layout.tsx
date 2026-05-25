import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "OpenVisi Dashboard",
  description: "Dashboard-ready scaffold for OpenVisi AI visibility reports."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
