import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-warm-dark text-white/80 py-16 px-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start justify-between gap-10">
        <div>
          <Link href="/" className="text-3xl font-serif text-white tracking-wide">
            date match.
          </Link>
          <p className="mt-3 text-sm text-white/50">
            &copy; {new Date().getFullYear()} Date Match. Built with care.
          </p>
        </div>

        <div className="flex gap-16">
          <div>
            <h4 className="text-xs uppercase tracking-widest text-white/40 mb-4">
              Company
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <a href="mailto:hello@datematch.com" className="hover:text-white transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
