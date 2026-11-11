import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Muhammad Faizal — Portfolio",
  description: "Portfolio Muhammad Faizal. Web developer, freelancer, dan creative enthusiast dari Makassar.",
  openGraph: {
    title: "Muhammad Faizal — Portfolio",
    description: "Explore my work, skills, GitHub activity, and say hello.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
