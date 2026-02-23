const steps = [
  {
    number: "01",
    title: "完成深度问卷",
    description:
      "基于心理学的关系兼容性测试，涵盖安全联结、互动模式、意义系统等五大维度，大约 10 分钟。",
    gradient: "from-[#5a2d3e] to-[#8b4a6b]",
    preview: (
      <div className="bg-white/90 backdrop-blur rounded-2xl p-5 shadow-lg max-w-[260px]">
        <p className="text-sm font-medium text-foreground mb-3">
          你最认同哪种「爱的安全感」来源？
        </p>
        <div className="space-y-1.5">
          {["事事有回应", "我的后盾与港湾", "自由的牵挂", "共同进步的战友"].map(
            (v, i) => (
              <div
                key={v}
                className={`px-3 py-2 rounded-xl text-[11px] font-medium transition-all ${
                  i === 2
                    ? "bg-primary/10 text-foreground ring-1 ring-primary/40"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {v}
              </div>
            )
          )}
        </div>
      </div>
    ),
  },
  {
    number: "02",
    title: "每周收到你的匹配",
    description:
      "加入匹配后，我们会在每周轮次中为你找到最契合的人，并告诉你们为什么合拍。",
    gradient: "from-[#2d3a5a] to-[#4a6b8b]",
    preview: (
      <div className="bg-white/90 backdrop-blur rounded-2xl p-5 shadow-lg max-w-[260px]">
        <h4 className="font-serif text-base mb-3 text-foreground">你的匹配：小明</h4>
        <div className="space-y-1.5 text-sm text-muted-foreground mb-3">
          <p>📧 xiaoming@example.com</p>
          <p>🎯 94.7% 契合度</p>
        </div>
        <p className="text-xs font-medium text-foreground mb-2">匹配原因：</p>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li className="flex gap-1.5">
            <span className="text-primary mt-0.5">•</span>
            你们在「安全联结」维度上高度契合
          </li>
          <li className="flex gap-1.5">
            <span className="text-primary mt-0.5">•</span>
            你们都看重：情绪价值、个人成长
          </li>
          <li className="flex gap-1.5">
            <span className="text-primary mt-0.5">•</span>
            面对冲突时，你们都是海豚型
          </li>
        </ul>
      </div>
    ),
  },
  {
    number: "03",
    title: "开启一场真诚的对话",
    description:
      "我们把对方的联系方式发给你。接下来的故事，由你们自己书写——约一杯咖啡，聊聊彼此的人生剧本，看看会发生什么。",
    gradient: "from-[#3d2d5a] to-[#6b4a8b]",
    preview: null,
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 px-6 bg-background">
      <h2 className="text-4xl font-serif text-center mb-16">如何运作</h2>
      <div className="max-w-5xl mx-auto space-y-8">
        {steps.map((step) => (
          <div
            key={step.number}
            className={`relative rounded-3xl bg-gradient-to-br ${step.gradient} p-8 md:p-12 overflow-hidden min-h-[280px]`}
          >
            <div className="absolute inset-0 bg-[url('/stars.svg')] opacity-20 bg-repeat" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
              <div className={step.preview ? "flex-1" : "flex-1 max-w-2xl"}>
                <h3 className="text-2xl md:text-3xl font-serif text-white mb-3">
                  {step.title}
                </h3>
                <p className={`text-white/70 text-base md:text-lg ${step.preview ? "max-w-md" : ""}`}>
                  {step.description}
                </p>
              </div>
              {step.preview && (
                <div className="flex-shrink-0">{step.preview}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
