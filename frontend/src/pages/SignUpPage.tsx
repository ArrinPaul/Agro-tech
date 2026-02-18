import { SignUp } from "@clerk/clerk-react";
import { Leaf, ArrowRight } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center mesh-gradient p-6">
      <div className="w-full max-w-[440px] animate-slide-up">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-5 shadow-lg shadow-emerald-500/20">
            <Leaf className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold text-[var(--text-primary)] tracking-tight">
            Create your account
          </h1>
          <p className="text-[var(--text-muted)] mt-1.5 text-sm">
            Start managing your farm operations today
          </p>
        </div>

        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/login"
          afterSignUpUrl="/"
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

        <div className="mt-10 pt-6 border-t border-[var(--border)] text-center">
          <div className="inline-flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <ArrowRight size={12} />
            <span>Free to get started — no credit card required</span>
          </div>
        </div>
      </div>
    </div>
  );
}
