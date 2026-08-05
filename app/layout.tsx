import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Playfair_Display } from 'next/font/google'
import './globals.css'

const geist = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist',
  weight: '100 900',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-playfair',
})

export const metadata: Metadata = {
  title: 'VerumForma',
  description: 'Plataforma de gestão de obra da VerumForma / Construzimbra.',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className={`${geist.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased bg-[var(--bg)] text-[var(--text)]">{children}</body>
    </html>
  )
}
