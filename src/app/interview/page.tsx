"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatResponse {
  status?: string;
  messages?: Message[];
  userName?: string;
  suggestedReplies?: string[];
  error?: string;
}

interface SendResponse {
  reply?: string;
  isComplete?: boolean;
  suggestedReplies?: string[];
  error?: string;
}

function InterviewChat() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"loading" | "active" | "completed" | "error">("loading");
  const [userName, setUserName] = useState("");
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, suggestedReplies, scrollToBottom]);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    fetch(`/api/interview/chat?token=${token}`)
      .then((r) => r.json())
      .then((data: ChatResponse) => {
        if (data.error) {
          setStatus("error");
          return;
        }
        setMessages(data.messages ?? []);
        setUserName(data.userName ?? "");
        setSuggestedReplies(data.suggestedReplies ?? []);
        if (data.status === "completed" || data.status === "extracted") {
          setStatus("completed");
        } else {
          setStatus("active");
        }
      })
      .catch(() => setStatus("error"));
  }, [token]);

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    setInput("");
    setSuggestedReplies([]);
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/interview/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, message: msg }),
      });
      const data = (await res.json()) as SendResponse;

      if (data.error) {
        setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${data.error}` }]);
      } else if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply! }]);
        setSuggestedReplies(data.suggestedReplies ?? []);
        if (data.isComplete) setStatus("completed");
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ 网络错误，请稍后重试" }]);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#fdf6f0]">
        <p className="text-muted-foreground">缺少访谈链接参数</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#fdf6f0]">
        <p className="text-muted-foreground">链接无效或已过期</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#fdf6f0]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/40 bg-white/80 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <h1 className="font-serif text-lg font-semibold text-[#8b2252]">date match.</h1>
            <p className="text-xs text-muted-foreground">灵魂访谈 {userName ? `· ${userName}` : ""}</p>
          </div>
          {status === "completed" && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
              已完成
            </span>
          )}
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {status === "loading" && messages.length === 0 && (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#8b2252] border-t-transparent" />
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#8b2252] text-white"
                    : "bg-white text-[#2d1b14] shadow-sm"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <div className="flex space-x-1.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#8b2252]/40" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#8b2252]/40" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#8b2252]/40" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Quick replies + Input */}
      {status === "active" && (
        <footer className="sticky bottom-0 border-t border-border/40 bg-white/90 backdrop-blur-sm">
          {suggestedReplies.length > 0 && !loading && (
            <div className="mx-auto max-w-2xl overflow-x-auto px-4 pt-3 pb-1">
              <div className="flex gap-2">
                {suggestedReplies.map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    onClick={() => sendMessage(reply)}
                    className="shrink-0 rounded-full border border-[#8b2252]/30 bg-[#8b2252]/5 px-4 py-2 text-sm text-[#8b2252] transition-all hover:border-[#8b2252]/60 hover:bg-[#8b2252]/10 active:scale-95"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          )}
          <form
            className="mx-auto flex max-w-2xl gap-2 px-4 py-3"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入你的回答，或点击上方快捷选项…"
              disabled={loading}
              className="flex-1 rounded-full border border-border bg-[#fdf6f0] px-4 py-2.5 text-[15px] outline-none transition-colors placeholder:text-muted-foreground focus:border-[#8b2252]/50 focus:ring-1 focus:ring-[#8b2252]/20 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-full bg-[#8b2252] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              发送
            </button>
          </form>
        </footer>
      )}

      {status === "completed" && (
        <footer className="border-t border-border/40 bg-white/90 px-4 py-4 text-center">
          <p className="text-sm text-muted-foreground">
            访谈已完成，感谢你的分享 ✨ 你的回答将帮助我们为你找到更合适的人。
          </p>
        </footer>
      )}
    </div>
  );
}

export default function InterviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#fdf6f0]">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#8b2252] border-t-transparent" />
        </div>
      }
    >
      <InterviewChat />
    </Suspense>
  );
}
