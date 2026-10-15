import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Access Restricted | Accessible Map Agent",
  description: "Your organization has restricted access to specific users.",
};

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen flex-col bg-dark-bg">
      {/* Header */}
      <header className="px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-3">
          <Image
            src="/images/logo-250.png"
            alt="dymaptic"
            width={140}
            height={40}
            className="h-8 w-auto"
            priority
          />
        </Link>
      </header>

      {/* Main content */}
      <main className="flex flex-1 items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md text-center">
          {/* Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-coral/20">
            <svg
              className="h-10 w-10 text-coral"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-white">
            Access Restricted
          </h1>

          {/* Description */}
          <p className="mt-4 text-lg text-gray-400">
            Your organization has restricted access to Accessible Map Agent for specific users.
          </p>
          <p className="mt-2 text-gray-500">
            If you believe you should have access, please contact your ArcGIS organization administrator.
          </p>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signout"
              className="inline-flex items-center justify-center rounded-lg border border-gray-600 bg-transparent px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-gray-500 hover:bg-white/5"
            >
              Sign in with a different account
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg bg-coral px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-coral-dark"
            >
              Learn more about AMA
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-6 text-center text-sm text-gray-500 sm:px-6 lg:px-8">
        <p>
          Need help?{" "}
          <a
            href="mailto:support@dymaptic.com"
            className="text-coral hover:underline"
          >
            Contact support
          </a>
        </p>
      </footer>
    </div>
  );
}
