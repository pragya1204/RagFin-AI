// app/layout.tsx
import "./globals.css";
import ClientLayout from "../components/ClientLayout"; // This file will contain your interactive (client) code.

export const metadata = {
  title: "RagFin AI",
  description: "An AI-powered platform for financial insights.",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <meta name="generator" content={metadata.generator} />
      </head>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}

