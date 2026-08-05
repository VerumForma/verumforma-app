export const metadata = { title: 'VerumForma — App' }

// Public "coming soon" screen shown while the app is being built.
export default function ComingSoon() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#1A1A1A] px-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logos/verumforma-white-transparent.svg"
        alt="VerumForma"
        className="w-64 md:w-80 mb-4"
      />
      <div className="mt-6 flex items-center gap-3 text-[#6B6560]">
        <span className="h-px w-8 bg-[rgba(255,255,255,0.2)]" />
        <span className="text-[11px] md:text-xs uppercase tracking-[0.22em]">Construction in progress</span>
        <span className="h-px w-8 bg-[rgba(255,255,255,0.2)]" />
      </div>
    </main>
  )
}
