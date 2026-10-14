import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aura Skincare | AI Voice Customer Support (Aria)',
  description: 'AI Voice Customer Support Agent for Aura Skincare — DataStraw Assessment Test',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/output.css" />
      </head>
      <body className="antialiased selection:bg-aura-300 selection:text-aura-900 bg-[#fdf8f6] font-sans">
        {children}
      </body>
    </html>
  );
}
