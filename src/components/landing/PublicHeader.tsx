"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export function PublicHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="absolute left-0 right-0 top-0 z-50">
      <nav id="main-nav" aria-label="Main navigation" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/logo-250.png"
              alt="dymaptic"
              width={140}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/#demo"
              className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
              Demo
            </Link>
            <Link
              href="/#pricing"
              className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
              Pricing
            </Link>
            <Link
              href="/#faq"
              className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
              FAQ
            </Link>
            <Link
              href="/help"
              className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
              Help
            </Link>
            <Link
              href="/signin"
              className="rounded-lg bg-coral px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-coral-dark"
            >
              Sign In
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-lg p-2 text-white md:hidden"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-white/10 py-4 md:hidden">
            <div className="flex flex-col gap-4">
              <Link
                href="/#demo"
                className="text-sm font-medium text-gray-300"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Demo
              </Link>
              <Link
                href="/#pricing"
                className="text-sm font-medium text-gray-300"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/#faq"
                className="text-sm font-medium text-gray-300"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                FAQ
              </Link>
              <Link
                href="/help"
                className="text-sm font-medium text-gray-300"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Help
              </Link>
              <Link
                href="/signin"
                className="inline-flex w-fit rounded-lg bg-coral px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
