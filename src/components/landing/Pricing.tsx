import Link from "next/link";

export function Pricing() {
  return (
    <section id="pricing" className="bg-dark-bg py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            Start free, upgrade when you need more capacity
          </p>
        </div>

        {/* Pricing cards */}
        <div className="mx-auto mt-16 grid max-w-6xl gap-6 lg:grid-cols-4">
          {/* Free tier */}
          <div className="flex flex-col rounded-2xl border border-dark-bg-light bg-dark-bg-light p-6 shadow-sm">
            <div className="flex-1">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white">Free</h3>
                <p className="mt-1 text-sm text-gray-400">
                  Try it out
                </p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$0</span>
              </div>

              <ul className="mb-6 space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-coral" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-300">3 maps total (lifetime)</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-coral" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-300">7-day history</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-coral" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-300">ArcGIS Online</span>
                </li>
              </ul>
            </div>

            <Link
              href="/signin"
              className="mt-auto block w-full rounded-lg border border-teal px-4 py-2.5 text-center text-sm font-semibold uppercase tracking-wide text-teal-light transition-colors hover:bg-teal/10"
            >
              Get Started
            </Link>
          </div>

          {/* Starter tier */}
          <div className="flex flex-col rounded-2xl border border-dark-bg-light bg-dark-bg-light p-6 shadow-sm">
            <div className="flex-1">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white">Starter</h3>
                <p className="mt-1 text-sm text-gray-400">
                  Small cities & counties
                </p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$49</span>
                <span className="text-gray-400">/mo</span>
                <p className="mt-1 text-xs text-gray-500">or $499/year (save 15%)</p>
              </div>

              <ul className="mb-6 space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-coral" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-300">25 maps/month</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-coral" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-300">90-day history</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-coral" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-300">ArcGIS Online</span>
                </li>
              </ul>
            </div>

            <Link
              href="/signin"
              className="mt-auto block w-full rounded-lg border border-teal px-4 py-2.5 text-center text-sm font-semibold uppercase tracking-wide text-teal-light transition-colors hover:bg-teal/10"
            >
              Get Started
            </Link>
          </div>

          {/* Professional tier */}
          <div className="relative flex flex-col rounded-2xl border-2 border-coral bg-dark-bg-light p-6 shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-coral px-3 py-0.5 text-xs font-semibold text-white">
              Most Popular
            </div>

            <div className="flex-1">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white">Professional</h3>
                <p className="mt-1 text-sm text-gray-400">
                  Mid-size agencies
                </p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$199</span>
                <span className="text-gray-400">/mo</span>
                <p className="mt-1 text-xs text-gray-500">or $1,999/year (save 16%)</p>
              </div>

              <ul className="mb-6 space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-coral" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-300">150 maps/month</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-coral" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-300">1-year history</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-coral" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-300">ArcGIS Online</span>
                </li>
              </ul>
            </div>

            <Link
              href="/signin"
              className="mt-auto block w-full rounded-lg bg-coral px-4 py-2.5 text-center text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-coral-dark"
            >
              Get Started
            </Link>
          </div>

          {/* Enterprise tier */}
          <div className="flex flex-col rounded-2xl border border-dark-bg-light bg-dark-bg-light p-6 shadow-sm">
            <div className="flex-1">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white">Enterprise</h3>
                <p className="mt-1 text-sm text-gray-400">
                  Large organizations
                </p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">Custom</span>
              </div>

              <ul className="mb-6 space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-coral" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-300">Unlimited maps</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-coral" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-300">Unlimited history</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-coral" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-300">ArcGIS Enterprise support</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-coral" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-300">Dedicated support</span>
                </li>
              </ul>
            </div>

            <a
              href="mailto:info@dymaptic.com?subject=Enterprise%20Inquiry%20-%20Accessible%20Map%20Agent"
              className="mt-auto block w-full rounded-lg border border-teal px-4 py-2.5 text-center text-sm font-semibold uppercase tracking-wide text-teal-light transition-colors hover:bg-teal/10"
            >
              Contact Us
            </a>
          </div>
        </div>

        {/* Additional info */}
        <div className="mx-auto mt-12 max-w-2xl text-center">
          <p className="text-sm text-gray-400">
            All plans include Markdown, HTML, and plain text export and are designed to support WCAG 2.1 Level AA accessibility efforts.
          </p>
          <p className="mt-4 text-sm text-gray-400">
            Have questions?{" "}
            <a href="#faq" className="font-medium text-teal-light hover:underline">
              Check our FAQ
            </a>{" "}
            or{" "}
            <a
              href="mailto:info@dymaptic.com"
              className="font-medium text-teal-light hover:underline"
            >
              contact us
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
