import '../styles/globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Tandem AI',
    template: '%s | Tandem AI'
  },
  description: 'AI-assisted valuation, built for judgment.',
  applicationName: 'Tandem AI',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-surface text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
