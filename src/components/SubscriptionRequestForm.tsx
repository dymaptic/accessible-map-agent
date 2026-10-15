"use client";

import { useState } from "react";
import { PLAN_CONFIG } from "@/lib/subscriptions";

type PlanTier = "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
type BillingFrequency = "MONTHLY" | "ANNUAL";
type PaymentMethod = "ACH" | "CHECK" | "PAYMENT_LINK";

interface SubscriptionRequestFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultTier?: PlanTier;
  defaultFrequency?: BillingFrequency;
}

export function SubscriptionRequestForm({
  onSuccess,
  onCancel,
  defaultTier = "STARTER",
  defaultFrequency = "ANNUAL",
}: SubscriptionRequestFormProps) {
  const [selectedTier, setSelectedTier] = useState<PlanTier>(defaultTier);
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>(defaultFrequency);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("ACH");
  const [billingContactName, setBillingContactName] = useState("");
  const [billingContactEmail, setBillingContactEmail] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [specialRequirements, setSpecialRequirements] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const tiers = [
    { value: "STARTER" as const, config: PLAN_CONFIG.STARTER },
    { value: "PROFESSIONAL" as const, config: PLAN_CONFIG.PROFESSIONAL },
    { value: "ENTERPRISE" as const, config: PLAN_CONFIG.ENTERPRISE },
  ];

  const getPrice = (tier: PlanTier, frequency: BillingFrequency) => {
    const config = PLAN_CONFIG[tier];
    if (config.monthlyPrice === null) return "Contact Us";
    if (frequency === "ANNUAL" && config.annualPrice) {
      return `$${config.annualPrice}/year`;
    }
    return `$${config.monthlyPrice}/month`;
  };

  const getAnnualSavings = (tier: PlanTier) => {
    const config = PLAN_CONFIG[tier];
    if (!config.monthlyPrice || !config.annualPrice) return null;
    const yearlyAtMonthly = config.monthlyPrice * 12;
    const savings = ((yearlyAtMonthly - config.annualPrice) / yearlyAtMonthly) * 100;
    return Math.round(savings);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/subscription-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestedTier: selectedTier,
          billingFrequency,
          preferredPaymentMethod: paymentMethod,
          billingContactName,
          billingContactEmail,
          billingAddress,
          poNumber: poNumber || null,
          specialRequirements: specialRequirements || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit request");
      }

      setSuccess(true);

      // Trigger quota refresh in header after a brief delay to ensure DB write completes
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("quota-updated"));
      }, 100);

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-green-800">Request Submitted!</h3>
        <p className="mt-2 text-sm text-green-700">
          Thank you for your subscription request. We&apos;ve granted you 5 bonus map descriptions
          that you can use immediately. Our team will review your request and send an invoice
          within 1-2 business days.
        </p>
        <p className="mt-4 text-sm text-green-600">
          Check your email at <strong>{billingContactEmail}</strong> for the invoice.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Billing Frequency */}
      <div>
        <label className="mb-3 block text-sm font-medium text-gray-900">
          Billing Frequency
        </label>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setBillingFrequency("MONTHLY")}
            className={`flex-1 rounded-lg border-2 px-4 py-3 text-center transition-all ${
              billingFrequency === "MONTHLY"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="font-medium text-gray-900">Monthly</div>
            <div className="text-sm text-gray-500">Pay month-to-month</div>
          </button>
          <button
            type="button"
            onClick={() => setBillingFrequency("ANNUAL")}
            className={`flex-1 rounded-lg border-2 px-4 py-3 text-center transition-all ${
              billingFrequency === "ANNUAL"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="font-medium text-gray-900">Annual</div>
            <div className="text-sm text-gray-500">Save ~15% with annual billing</div>
          </button>
        </div>
      </div>

      {/* Tier Selection */}
      <div>
        <label className="mb-3 block text-sm font-medium text-gray-900">
          Select Plan
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          {tiers.map(({ value, config }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSelectedTier(value)}
              className={`rounded-lg border-2 p-4 text-left transition-all ${
                selectedTier === value
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="font-semibold text-gray-900">{config.displayName}</div>
              <div className="mt-1 text-sm text-gray-500">
                {config.monthlyQuota === null ? "Unlimited" : `${config.monthlyQuota} maps/month`}
              </div>
              <div className="mt-2 text-lg font-bold text-gray-900">
                {getPrice(value, billingFrequency)}
              </div>
              {billingFrequency === "ANNUAL" && getAnnualSavings(value) && (
                <div className="mt-1 text-xs text-green-600">
                  Save {getAnnualSavings(value)}% vs monthly
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Billing Contact */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Billing Contact</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Contact Name *
            </label>
            <input
              type="text"
              required
              value={billingContactName}
              onChange={(e) => setBillingContactName(e.target.value)}
              placeholder="Jane Smith"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Contact Email *
            </label>
            <input
              type="email"
              required
              value={billingContactEmail}
              onChange={(e) => setBillingContactEmail(e.target.value)}
              placeholder="billing@agency.gov"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Billing Address *
          </label>
          <textarea
            required
            rows={3}
            value={billingAddress}
            onChange={(e) => setBillingAddress(e.target.value)}
            placeholder="123 Main St&#10;City, State 12345"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              PO Number (optional)
            </label>
            <input
              type="text"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              placeholder="PO-12345"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Preferred Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ACH">ACH Transfer</option>
              <option value="CHECK">Check</option>
              <option value="PAYMENT_LINK">Payment Link</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Special Requirements (optional)
          </label>
          <textarea
            rows={2}
            value={specialRequirements}
            onChange={(e) => setSpecialRequirements(e.target.value)}
            placeholder="Any special billing requirements, compliance needs, etc."
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-lg bg-blue-50 p-4">
        <h4 className="font-medium text-blue-900">What happens next?</h4>
        <ul className="mt-2 space-y-1 text-sm text-blue-800">
          <li>1. You&apos;ll receive 5 bonus map descriptions immediately</li>
          <li>2. Our team will review your request and send an invoice</li>
          <li>3. Once payment is received, your subscription will be activated</li>
          <li>4. We accept ACH transfers, checks, and payment links</li>
        </ul>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-300"
        >
          {submitting ? "Submitting..." : "Submit Request"}
        </button>
      </div>
    </form>
  );
}
