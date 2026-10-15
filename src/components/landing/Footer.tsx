import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer id="footer" className="bg-dark-bg text-gray-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Image
              src="/images/logo-250.png"
              alt="dymaptic"
              width={140}
              height={40}
              className="h-8 w-auto"
            />
            <p className="mt-4 max-w-md text-sm">
              AI-powered map descriptions informed by ADA Title II and WCAG 2.1
              accessibility guidelines. Making geographic information accessible to everyone.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Product
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/#demo" className="text-sm hover:text-white">
                  Demo
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="text-sm hover:text-white">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-sm hover:text-white">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/signin" className="text-sm hover:text-white">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/terms" className="text-sm hover:text-white">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-sm hover:text-white">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <a
                  href="mailto:info@dymaptic.com"
                  className="text-sm hover:text-white"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-dark-bg-light pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm">
              &copy; 2026{" "}
              <a
                href="https://dymaptic.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-coral hover:text-coral-light hover:underline"
              >
                dymaptic
                <span className="sr-only"> (opens in new tab)</span>
              </a>
              . All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span>Powered by</span>
              <a
                href="https://www.anthropic.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-teal-light hover:underline"
              >
                Claude AI
                <span className="sr-only"> (opens in new tab)</span>
              </a>
              <span>&</span>
              <a
                href="https://www.esri.com/en-us/arcgis/products/arcgis-online/overview"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-teal-light hover:underline"
              >
                ArcGIS
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            </div>
          </div>
          {/* Build info */}
          {process.env.NEXT_PUBLIC_BUILD_TIME && (
            <p className="mt-4 text-center text-xs text-gray-500">
              Build: {new Date(process.env.NEXT_PUBLIC_BUILD_TIME).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                timeZoneName: "short",
              })}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
