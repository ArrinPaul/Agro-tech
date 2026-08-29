import { SignIn } from "@clerk/clerk-react";
import { Leaf, BarChart3, Shield, Cpu, Zap, Globe } from "lucide-react";

const FEATURES = [
  { icon: BarChart3, label: "Real-time Analytics", desc: "Live dashboards tracking every metric across your operation" },
  { icon: Shield, label: "Enterprise Security", desc: "Role-based access with organization-level data isolation" },
  { icon: Cpu, label: "AI-Powered Insights", desc: "Smart recommendations for crop allocation & resource optimization" },
  { icon: Zap, label: "Instant Sync", desc: "Real-time database with zero-latency updates across all devices" },
];

const STATS = [
  { value: "99.9%", label: "Uptime" },
  { value: "50ms", label: "Avg Latency" },
  { value: "10K+", label: "Farms" },
];

export default function LoginPage() {
  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-primary)" }}>
      {/* Left panel — immersive branding */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[48%] relative overflow-hidden flex-col">
        {/* Layered background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-950" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        
        {/* Glowing orbs */}
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-400/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] bg-teal-300/6 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px]" />
        
        {/* Floating geometric accents */}
        <div className="absolute top-24 right-16 w-20 h-20 border border-white/[0.06] rounded-2xl rotate-12 animate-float" />
        <div className="absolute bottom-32 right-28 w-14 h-14 border border-emerald-400/[0.08] rounded-xl -rotate-6" style={{ animation: "float 4s ease-in-out 1s infinite" }} />
        <div className="absolute top-[45%] left-12 w-8 h-8 bg-emerald-400/[0.06] rounded-lg rotate-45" />

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

          {/* Hero section */}
          <div className="space-y-8 max-w-lg">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-emerald-300/80 text-[11px] font-medium tracking-wide uppercase">Intelligent Agriculture</span>
              </div>
              <h1 className="text-[3.25rem] xl:text-[3.75rem] font-display font-bold text-white leading-[1.05] tracking-tight">
                Precision Farming,
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 animate-gradient">
                  Amplified.
                </span>
              </h1>
              <p className="text-emerald-100/50 text-base leading-relaxed max-w-sm">
                The AI-native platform for agricultural teams who demand real-time control over crops, warehouses, and resources.
              </p>
            </div>

            {/* Feature grid */}
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="group p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-300">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-2.5 group-hover:bg-emerald-500/15 transition-colors">
                    <Icon size={15} className="text-emerald-400" />
                  </div>
                  <p className="text-white/90 font-medium text-[13px] mb-0.5">{label}</p>
                  <p className="text-emerald-200/30 text-[11px] leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom stats */}
          <div className="flex items-center gap-8">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="text-white font-display font-bold text-xl tracking-tight">{value}</p>
                <p className="text-emerald-300/40 text-[11px] font-medium mt-0.5">{label}</p>
              </div>
            ))}
            <div className="ml-auto flex items-center gap-2 text-emerald-300/30 text-[11px]">
              <Globe size={12} />
              <span>Available worldwide</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10 relative">
        {/* Subtle background pattern for right side */}
        <div className="absolute inset-0 opacity-30 mesh-gradient" />
        
        <div className="w-full max-w-[420px] relative z-10 animate-slide-up">
          {/* Mobile logo */}
          <div className="text-center mb-10 lg:hidden">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-5 shadow-xl shadow-emerald-500/20">
              <Leaf className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold text-[var(--text-primary)] tracking-tight">
              AgroTech
            </h1>
            <p className="text-[var(--text-muted)] mt-2 text-sm">
              Precision Farming, Amplified.
            </p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-[1.875rem] font-display font-bold text-[var(--text-primary)] tracking-tight leading-tight mb-2">
              Welcome back
            </h2>
            <p className="text-[var(--text-muted)] text-[15px] leading-relaxed">
              Sign in to access your dashboard
            </p>
          </div>

          {/* First time user hint */}
          <div className="mb-6 p-4 rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-800/30 dark:bg-blue-900/10">
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-[13px] font-medium text-blue-900 dark:text-blue-200 mb-1">
                  First time here?
                </p>
                <p className="text-[12px] text-blue-700 dark:text-blue-300">
                  If you don't have an account yet, please{" "}
                  <a href="/sign-up" className="font-semibold underline hover:text-blue-900 dark:hover:text-blue-100">
                    sign up first
                  </a>{" "}
                  before trying to sign in.
                </p>
              </div>
            </div>
          </div>

          {/* Clerk sign-in */}
          <div className="rounded-2xl border border-[var(--border)] p-8 shadow-lg" style={{ background: "var(--surface)" }}>
            <SignIn
              path="/login"
              routing="path"
              signUpUrl="/sign-up"
              fallbackRedirectUrl="/"
              afterSignInUrl="/"
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
              Having trouble signing in?{" "}
              <a href="/sign-up" className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold transition-colors">
                Create an account instead
              </a>
            </p>
          </div>

          {/* Trust footer */}
          <div className="mt-8 pt-6 border-t border-[var(--border)]">
            <div className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                <Shield size={11} className="text-emerald-500" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="w-px h-3 bg-[var(--border)]" />
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                <Zap size={11} className="text-amber-500" />
                <span>99.9% Uptime</span>
              </div>
              <div className="w-px h-3 bg-[var(--border)]" />
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                <Globe size={11} className="text-blue-500" />
                <span>GDPR Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
