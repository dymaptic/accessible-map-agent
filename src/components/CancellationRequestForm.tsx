"use client";

import { useState } from "react";

interface CancellationRequestFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  currentTier: string;
}

export function CancellationRequestForm({
  onSuccess,
  onCancel,
  currentTier,
}: CancellationRequestFormProps) {
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/subscription-requests/cancellation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName,
          contactEmail,
          reason,
          feedback: feedback || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit cancellation request");
      }

      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-blue-800">Cancellation Request Submitted</h3>
        <p className="mt-2 text-sm text-blue-700">
          We&apos;ve received your cancellation request. Our team will review it and contact you
          at <strong>{contactEmail}</strong> to confirm the cancellation and discuss any final details.
        </p>
        <p className="mt-4 text-sm text-blue-600">
          Your subscription will remain active until we process your request.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg bg-amber-50 p-4">
        <h4 className="font-medium text-amber-900">Before you go...</h4>
        <p className="mt-1 text-sm text-amber-800">
          We&apos;re sorry to see you considering cancellation. Your {currentTier} subscription
          will remain active until the end of your current billing period after cancellation is processed.
        </p>
      </div>

      {/* Contact Info */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Contact Information</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Your Name *
            </label>
            <input
              type="text"
              required
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Jane Smith"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="you@agency.gov"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Reason for Cancellation */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Reason for Cancellation *
        </label>
        <select
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Select a reason...</option>
          <option value="budget">Budget constraints</option>
          <option value="not_using">Not using the service enough</option>
          <option value="switching">Switching to a different solution</option>
          <option value="project_ended">Project or contract ended</option>
          <option value="missing_features">Missing features we need</option>
          <option value="too_expensive">Too expensive for our needs</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Additional Feedback */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Additional Feedback (optional)
        </label>
        <textarea
          rows={3}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Is there anything we could have done better? Any features you wish we had?"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Info Box */}
      <div className="rounded-lg bg-gray-50 p-4">
        <h4 className="font-medium text-gray-900">What happens next?</h4>
        <ul className="mt-2 space-y-1 text-sm text-gray-700">
          <li>1. Our team will review your cancellation request</li>
          <li>2. We&apos;ll contact you to confirm and discuss any questions</li>
          <li>3. Your subscription remains active until the end of your billing period</li>
          <li>4. You&apos;ll retain access to your existing map descriptions based on retention policy</li>
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
            Keep My Subscription
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:bg-gray-300"
        >
          {submitting ? "Submitting..." : "Submit Cancellation Request"}
        </button>
      </div>
    </form>
  );
}
