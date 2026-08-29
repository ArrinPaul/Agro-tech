import { SignUp } from "@clerk/clerk-react";
import { Leaf, Sprout, Warehouse, FlaskConical, GitMerge, CheckCircle2, ArrowRight } from "lucide-react";

const STEPS = [
  { icon: Sprout, label: "Track Crops", desc: "Monitor growth stages from planting to harvest" },
  { icon: Warehouse, label: "Manage Storage", desc: "Optimize warehouse capacity and allocations" },
  { icon: FlaskConical, label: "Control Resources", desc: "Track fertilizers, pesticides, and inventory" },
  { icon: GitMerge, label: "Smart Allocations", desc: "AI-powered crop-to-warehouse recommendations" },
];

const BENEFITS = [
  "Unlimited warehouses & crops",
  "AI-powered insights & forecasting",
  "Real-time collaboration",
  "Audit trail & compliance",
];

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-primary)" }}>
      {/* Left panel — value proposition */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[48%] relative overflow-hidden flex-col">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900 via-emerald-800 to-teal-950" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E\")" }} />
        
        {/* Glowing orbs */}
        <div className="absolute top-[-15%] left-[-5%] w-[500px] h-[500px] bg-teal-400/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/6 rounded-full blur-[140px]" />
        
        {/* Floating accents */}
        <div className="absolute top-20 right-20 w-16 h-16 border border-white/[0.06] rounded-2xl -rotate-12 animate-float" />
        <div className="absolute bottom-40 left-16 w-10 h-10 bg-emerald-400/[0.05] rounded-xl rotate-12" style={{ animation: "float 5s ease-in-out 0.5s infinite" }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-10 xl:p-14">
          {/* Logo */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/[0.15] shadow-lg shadow-black/10">
              <Leaf size={22} className="text-emerald-300" />
            </div>
            <div>
              <span className="text-white font-display font-bold text-lg tracking-tight">AgroTech</span>
              <span className="text-emerald-400/60 text-[10px] font-medium ml-2 tracking-widest uppercase">Platform</span>
            </div>
          </div>

          {/* Hero */}
          <div className="space-y-8 max-w-lg">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-emerald-300/80 text-[11px] font-medium tracking-wide uppercase">Get Started Free</span>
              </div>
              <h1 className="text-[3.25rem] xl:text-[3.5rem] font-display font-bold text-white leading-[1.05] tracking-tight">
                Start growing
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-200 via-emerald-300 to-teal-300 animate-gradient">
                  smarter today
                </span>
              </h1>
              <p className="text-emerald-100/50 text-base leading-relaxed max-w-sm">
                Join thousands of farms using AgroTech to optimize operations, reduce waste, and increase yields.
              </p>
            </div>

            {/* How it works steps */}
            <div className="space-y-3">
              {STEPS.map(({ icon: Icon, label, desc }, i) => (
                <div key={label} className="flex items-start gap-3.5 group">
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center group-hover:bg-white/[0.1] transition-colors">
                      <Icon size={16} className="text-emerald-400" />
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="absolute top-9 left-1/2 -translate-x-1/2 w-px h-3 bg-white/[0.06]" />
                    )}
                  </div>
                  <div className="pt-1">
                    <p className="text-white/90 font-medium text-[13px]">{label}</p>
                    <p className="text-emerald-200/30 text-[11px] mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-2.5">
            <p className="text-emerald-300/40 text-[10px] font-semibold uppercase tracking-widest">Included in every plan</p>
            <div className="grid grid-cols-2 gap-2">
              {BENEFITS.map((b) => (
                <div key={b} className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500/60 flex-shrink-0" />
                  <span className="text-white/50 text-[12px]">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — sign up form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10 relative">
        <div className="absolute inset-0 opacity-30 mesh-gradient" />
        
        <div className="w-full max-w-[440px] relative z-10 animate-slide-up">
          {/* Mobile logo */}
          <div className="text-center mb-10 lg:hidden">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-5 shadow-xl shadow-emerald-500/20">
              <Leaf className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold text-[var(--text-primary)] tracking-tight">
              Join AgroTech
            </h1>
            <p className="text-[var(--text-muted)] mt-2 text-sm">
              Start managing your farm in minutes
            </p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-[1.875rem] font-display font-bold text-[var(--text-primary)] tracking-tight leading-tight mb-2">
              Create your account
            </h2>
            <p className="text-[var(--text-muted)] text-[15px] leading-relaxed">
              Get started free — no credit card required
            </p>
          </div>

          {/* Clerk sign-up */}
          <div className="rounded-2xl border border-[var(--border)] p-8 shadow-lg" style={{ background: "var(--surface)" }}>
            <SignUp
              path="/sign-up"
              routing="path"
              signInUrl="/login"
              fallbackRedirectUrl="/"
              afterSignUpUrl="/"
              appearance={{
                elements: {
                  rootBox: "mx-auto w-full",
                  card: "shadow-none border-0 p-0 bg-transparent",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "border-2 border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] hover:border-emerald-500/30 text-[var(--text-primary)] rounded-xl h-12 font-medium transition-all duration-200 hover:shadow-md",
                  socialButtonsBlockButtonText: "font-semibold text-sm",
                  formFieldInput: "input h-12 text-sm rounded-xl",
                  formFieldLabel: "text-sm font-medium text-[var(--text-secondary)] mb-2",
                  formButtonPrimary: "btn btn-primary h-12 w-full text-sm font-semibold rounded-xl shadow hover:shadow-md transition-all duration-200",
                  footerActionLink: "text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold transition-colors",
                  footer: "pt-6",
                  dividerLine: "bg-[var(--border)]",
                  dividerText: "text-[var(--text-muted)] text-xs font-medium",
                  identityPreviewEditButtonIcon: "text-[var(--text-muted)]",
                  formFieldInputShowPasswordButton: "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
                  formResendCodeLink: "text-emerald-600 hover:text-emerald-700 dark:text-emerald-400",
                  otpCodeFieldInput: "border-2 border-[var(--border)] rounded-lg",
                  formFieldErrorText: "text-xs mt-1",
                  alertText: "text-xs",
                  alert: "rounded-xl border-l-4",
                }
              }}
            />
          </div>

          {/* Help text */}
          <div className="mt-6 text-center">
            <p className="text-[13px] text-[var(--text-muted)]">
              Already have an account?{" "}
              <a href="/login" className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold transition-colors">
                Sign in here
              </a>
            </p>
          </div>

          {/* Bottom CTA */}
          <div className="mt-8 pt-6 border-t border-[var(--border)] text-center">
            <div className="flex items-center justify-center gap-2 text-[var(--text-muted)]">
              <ArrowRight size={14} className="text-emerald-500" />
              <span className="text-[13px]">Set up your farm in under 2 minutes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
