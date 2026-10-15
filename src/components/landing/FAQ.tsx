"use client";

import { useState } from "react";
import { FAQ_DATA } from "@/lib/content/faq";

function AccordionItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-dark-bg">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-5 text-left"
        aria-expanded={isOpen}
      >
        <span className="text-base font-medium text-white">{question}</span>
        <span className="ml-6 flex-shrink-0">
          <svg
            className={`h-5 w-5 text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? "max-h-96 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-gray-400">{answer}</p>
      </div>
    </div>
  );
}

export function FAQ() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <section id="faq" className="bg-dark-bg-light py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            Everything you need to know about Accessible Map Agent
          </p>
        </div>

        {/* FAQ categories */}
        <div className="mt-12 space-y-10">
          {FAQ_DATA.map((category) => (
            <div key={category.title}>
              <h3 className="mb-4 text-lg font-semibold text-coral">
                {category.title}
              </h3>
              <div className="rounded-xl bg-dark-bg px-6 shadow-sm">
                {category.questions.map((q, index) => {
                  const key = `${category.title}-${index}`;
                  return (
                    <AccordionItem
                      key={key}
                      question={q.question}
                      answer={q.answer}
                      isOpen={openItems[key] || false}
                      onToggle={() => toggleItem(key)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Still have questions */}
        <div className="mt-12 rounded-2xl bg-teal/10 p-8 text-center">
          <h3 className="text-lg font-semibold text-white">
            Still have questions?
          </h3>
          <p className="mt-2 text-gray-400">
            Can&apos;t find the answer you&apos;re looking for? Reach out to our
            team.
          </p>
          <a
            href="mailto:info@dymaptic.com"
            className="mt-4 inline-flex items-center gap-2 text-teal-light hover:underline"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Contact support
          </a>
        </div>
      </div>
    </section>
  );
}
