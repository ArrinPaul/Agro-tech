import { SignIn } from "@clerk/clerk-react";
import { Leaf, BarChart3, Shield, Cpu } from "lucide-react";

const FEATURES = [
  { icon: BarChart3, label: "Real-time Analytics", desc: "Live dashboards & reports" },
  { icon: Shield, label: "Enterprise Security", desc: "Role-based access control" },
  { icon: Cpu, label: "AI-Powered Insights", desc: "Smart crop recommendations" },
];

export default function LoginPage() {
  return (
    <div className="min-h-screen flex mesh-gradient">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative overflow-hidden flex-col justify-between p-10 xl:p-14">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800" />
        <div className="absolute inset-0 opacity-10 dot-pattern" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-400/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
              <Leaf size={22} className="text-white" />
            </div>
            <span className="text-white font-display font-bold text-xl tracking-tight">AgroTech</span>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl xl:text-5xl font-display font-bold text-white leading-[1.1] tracking-tight">
            Smart Crop &<br />Warehouse<br />Management
          </h1>
          <p className="text-emerald-100/80 text-lg max-w-md leading-relaxed">
            AI-powered platform for modern agricultural operations. Optimize resources, reduce waste, and maximize yield.
          </p>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-4">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10 flex-shrink-0">
                <Icon size={18} className="text-emerald-200" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">{label}</p>
                <p className="text-emerald-200/60 text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-[420px] animate-slide-up">
          {/* Mobile logo */}
          <div className="text-center mb-10 lg:hidden">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-5 shadow-lg shadow-emerald-500/20">
              <Leaf className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold text-[var(--text-primary)] tracking-tight">
              Welcome to AgroTech
            </h1>
            <p className="text-[var(--text-muted)] mt-2 text-sm">
              Smart Crop & Warehouse Management Platform
            </p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-10">
            <h2 className="text-2xl font-display font-bold text-[var(--text-primary)] tracking-tight">
              Welcome back
            </h2>
            <p className="text-[var(--text-muted)] mt-1.5 text-sm">
              Sign in to your account to continue
            </p>
          </div>

          <SignIn
            path="/login"
            routing="path"
            signUpUrl="/sign-up"
            afterSignInUrl="/"
            appearance={{
              elements: {
                rootBox: "mx-auto w-full",
                card: "shadow-none border-0 p-0 bg-transparent",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] rounded-xl h-11 font-medium transition-all",
                formFieldInput: "input",
                formButtonPrimary: "btn btn-primary h-11 w-full text-sm",
                footerActionLink: "text-emerald-600 hover:text-emerald-700 font-medium",
              }
            }}
          />

          <div className="mt-10 pt-6 border-t border-[var(--border)]">
            <p className="text-center text-xs text-[var(--text-muted)]">
              Trusted by agricultural operations worldwide
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
