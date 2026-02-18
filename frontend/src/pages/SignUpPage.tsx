import { SignUp } from "@clerk/clerk-react";
import { Wheat } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full mb-4">
            <Wheat className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Join AgroTech
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
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
              rootBox: "mx-auto",
              card: "bg-white dark:bg-gray-800 shadow-xl"
            }
          }}
        />
      </div>
    </div>
  );
}
