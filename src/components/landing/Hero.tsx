import Link from "next/link";
import { MapsCounter } from "./MapsCounter";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-dark-bg py-20 sm:py-32">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="grid"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Headline */}
          <h1 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
            Make Your Maps{" "}
            <span className="text-coral">
              Accessible
            </span>{" "}
            to Everyone
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-300">
            AI-powered descriptions for ArcGIS web maps. Generate comprehensive,
            screen-reader-friendly alternative text that helps blind and
            low-vision users understand your geographic data.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signin"
              className="inline-flex w-full items-center justify-center rounded-lg bg-coral px-6 py-3.5 text-base font-semibold uppercase tracking-wide text-white shadow-lg transition-all hover:bg-coral-dark hover:shadow-xl sm:w-auto"
            >
              Get Started Free
              <svg
                className="ml-2 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <a
              href="#demo"
              className="inline-flex w-full items-center justify-center rounded-lg border border-teal px-6 py-3.5 text-base font-semibold uppercase tracking-wide text-teal-light transition-all hover:bg-teal/10 sm:w-auto"
            >
              See It In Action
            </a>
          </div>

          {/* Maps counter */}
          <MapsCounter />

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-coral"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              3 Free Maps
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-coral"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              No Credit Card Required
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-coral"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Sign in with ArcGIS
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
