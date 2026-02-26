import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-warm-dark text-white/80 py-16 px-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start justify-between gap-10">
        <div>
          <Link href="/" className="text-3xl font-serif text-white tracking-wide">
            关系基因匹配
          </Link>
          <p className="mt-3 text-sm text-white/50">
            &copy; {new Date().getFullYear()} 关系基因匹配测试 · 用心构建
          </p>
        </div>

        <div className="flex gap-16">
          <div>
            <h4 className="text-xs uppercase tracking-widest text-white/40 mb-4">
              关于
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  首页
                </Link>
              </li>
              <li>
                <Link href="/onboarding/survey" className="hover:text-white transition-colors">
                  开始测试
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
