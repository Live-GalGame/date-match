import Image from "next/image";
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
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  隐私政策
                </Link>
              </li>
              <li>
                <a href="mailto:hzy2210@gmail.com" className="hover:text-white transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sponsor banner */}
      <div className="max-w-5xl mx-auto mt-12 pt-8 border-t border-white/10">
        <p className="text-xs text-white/30 uppercase tracking-widest mb-4 text-center">感谢赞助商</p>
        <a
          href="https://packyapi.com"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col sm:flex-row items-center justify-center gap-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors px-6 py-5"
        >
          <Image
            src="/packycode-logo.svg"
            alt="PackyCode"
            width={140}
            height={32}
            className="opacity-70 group-hover:opacity-100 transition-opacity invert"
          />
          <p className="text-xs text-white/50 group-hover:text-white/70 transition-colors text-center sm:text-left">
            感谢 <span className="text-white/70 font-medium">PackyCode</span> 提供 API 赞助支持 ·
            稳定高效的 AI API 中转服务，支持 Claude Code、Codex、Gemini 等
          </p>
        </a>
      </div>
    </footer>
  );
}
