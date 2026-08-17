import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t, lang } = useLanguage();

  const columns = [
    {
      title: lang === 'en' ? "Product" : "المنتج",
      links: [
        { name: t('features'), href: "#" },
        { name: t('pricing'), href: "#" },
      ],
    },
    {
      title: lang === 'en' ? "Company" : "الشركة",
      links: [
        { name: t('about'), href: "#" },
        { name: t('contact'), href: "#" },
      ],
    },
    {
      title: lang === 'en' ? "Legal" : "القانونية",
      links: [
        { name: t('privacy'), href: "#" },
        { name: t('terms'), href: "#" },
      ],
    },
  ];

  return (
    <footer className="bg-black relative overflow-hidden border-t border-white/10 pt-16 pb-8 z-10">
      {/* Background Logo Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 z-0">
        <img src="/sakina-logo.png" alt="" className="w-[500px] h-[500px] object-contain blur-sm" />
      </div>

      <div className="mx-auto w-full max-w-5xl px-6 relative z-10">
        <div className="grid gap-10 pb-10 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 text-white">
              <img src="/sakina-logo.png" alt="Sakina AI" className="w-9 h-9 rounded-full object-cover border border-white/20" />
              <span className="font-mono text-base uppercase tracking-widest font-semibold">
                Sakina AI
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-white/50 leading-relaxed">
              {t('tagline')}
            </p>

            <div className="mt-6 flex max-w-xs gap-2">
              <input
                type="email"
                aria-label="Email address"
                placeholder={lang === 'en' ? "you@company.com" : "بريدك الإلكتروني"}
                className="h-9 w-full rounded-md border border-white/20 bg-transparent px-3 text-sm text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none"
              />
              <button
                type="button"
                className="h-9 shrink-0 rounded-md bg-white px-3 font-mono text-xs uppercase tracking-wider text-black transition-opacity hover:opacity-90 font-medium"
              >
                {lang === 'en' ? 'Join' : 'انضم'}
              </button>
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-10 font-mono text-xs uppercase tracking-wider sm:grid-cols-3 lg:col-span-4">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="text-white">{col.title}</h3>
                <ul className="mt-4 flex flex-col gap-3">
                  {col.links.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="text-white/50 transition-colors hover:text-white"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 pb-4 font-mono text-xs uppercase tracking-wider text-white/50 sm:flex-row">
          <span>{t('copyright')}</span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {t('online')}
          </span>
        </div>
      </div>
    </footer>
  );
}
