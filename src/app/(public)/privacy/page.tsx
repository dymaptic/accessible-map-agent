import Link from "next/link";
import { PublicHeader } from "@/components/landing/PublicHeader";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Privacy Policy - Accessible Map Agent",
  description: "Learn how Accessible Map Agent collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-dark-bg">
      <PublicHeader />
      <div className="h-24" />

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/" className="text-sm text-teal-light hover:text-coral hover:underline transition-colors">
            &larr; Back to Home
          </Link>
        </div>

        <article className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-a:text-teal-light hover:prose-a:text-coral prose-td:text-gray-300 prose-th:text-white prose-li:text-gray-300 prose-code:text-coral-light prose-hr:border-gray-700">
          <h1>Privacy Policy</h1>

          <p className="lead">
            <strong>Accessible Map Agent</strong><br />
            <strong>Operated by Moravec Labs, LLC dba dymaptic</strong><br />
            <strong>Last Updated: February 2026</strong>
          </p>

          <hr />

          <h2>Overview</h2>
          <p>
            Accessible Map Agent (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;the Service&rdquo;) is operated by Moravec Labs, LLC dba dymaptic.
            This Privacy Policy explains how we collect, use, store, and protect your information when
            you use our web application to generate accessible descriptions for ArcGIS web maps.
          </p>
          <p>
            We are committed to protecting your privacy and being transparent about what data we collect and how we use it.
          </p>
          <p>
            This Privacy Policy is part of and subject to our{" "}
            <Link href="/terms">Terms of Service</Link>. Please also review our{" "}
            <Link href="/cookies">Cookie Policy</Link> for information about how we use cookies.
          </p>

          <hr />

          <h2>Information We Collect</h2>

          <h3>Information from ArcGIS Online Authentication</h3>
          <p>When you sign in with your ArcGIS Online account, we receive and store:</p>

          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Purpose</th>
                <th>Retention</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>ArcGIS Username</strong></td>
                <td>Identify your account, manage your generations</td>
                <td>Indefinitely while account is active</td>
              </tr>
              <tr>
                <td><strong>Email Address</strong></td>
                <td>Contact you about your account or service issues</td>
                <td>Indefinitely while account is active</td>
              </tr>
              <tr>
                <td><strong>Organization ID</strong></td>
                <td>Track generation usage per organization</td>
                <td>Indefinitely while account is active</td>
              </tr>
              <tr>
                <td><strong>Organization Name</strong></td>
                <td>Display in the application interface</td>
                <td>Indefinitely while account is active</td>
              </tr>
              <tr>
                <td><strong>Display Name</strong></td>
                <td>Personalize the interface</td>
                <td>Indefinitely while account is active</td>
              </tr>
            </tbody>
          </table>

          <p>
            We do <strong>not</strong> receive or store your ArcGIS password. Authentication is handled
            entirely through ArcGIS Online&apos;s OAuth 2.0 system.
          </p>

          <h3>Information Generated Through Use</h3>
          <p>When you use the Service to generate map descriptions:</p>

          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Purpose</th>
                <th>Retention</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Map Title</strong></td>
                <td>Identify the generation in your history</td>
                <td>Based on subscription tier*</td>
              </tr>
              <tr>
                <td><strong>Map ID</strong></td>
                <td>Reference to the source web map</td>
                <td>Based on subscription tier*</td>
              </tr>
              <tr>
                <td><strong>Generated Description</strong></td>
                <td>The accessibility text we create for you</td>
                <td>Based on subscription tier*</td>
              </tr>
            </tbody>
          </table>
          <p className="text-sm">
            *Retention periods: Free tier (7 days), Starter (90 days), Professional (1 year), Enterprise (unlimited).
          </p>

          <h3>Information We Process But Do NOT Store (By Default)</h3>
          <p>When generating a description, we temporarily process:</p>
          <ul>
            <li><strong>Map Screenshot</strong>: A JPEG image of your current map view</li>
            <li><strong>Layer Metadata</strong>: Information about visible layers, symbology, and scale</li>
            <li><strong>Map Extent/Location</strong>: The geographic coordinates of your map view</li>
          </ul>
          <p><strong>By default, these items are:</strong></p>
          <ul>
            <li>Sent to our AI service (Anthropic&apos;s Claude) to generate the description</li>
            <li>Processed in memory only</li>
            <li><strong>Not stored</strong> on our servers or in our database</li>
            <li><strong>Not retained</strong> by our AI provider after processing</li>
          </ul>

          <h3>Optional Screenshot Sharing</h3>
          <p>
            You may opt in to share your map screenshots with dymaptic to help improve our description quality.
            If you enable this feature:
          </p>
          <ul>
            <li>Map screenshots are stored securely and may be reviewed by our team</li>
            <li>Screenshots help us understand how to improve future descriptions</li>
            <li>You can disable this option at any time in your organization settings</li>
            <li>This is entirely optional and does not affect your ability to use the service</li>
          </ul>

          <hr />

          <h2>How We Use Your Information</h2>

          <h3>To Provide the Service</h3>
          <ul>
            <li>Authenticate you via ArcGIS Online</li>
            <li>Generate accessible map descriptions using AI</li>
            <li>Track your generation quota (free and paid)</li>
            <li>Display your generation history</li>
          </ul>

          <h3>To Understand Usage Patterns</h3>
          <p>
            We use <a href="https://plausible.io" target="_blank" rel="noopener noreferrer">Plausible Analytics</a>,
            a privacy-friendly analytics service, to understand how the Service is used. Plausible does not use
            cookies, does not collect personal data, and does not track you across websites. All data is aggregated
            and cannot be used to identify individual users.
          </p>

          <h3>We Do NOT</h3>
          <ul>
            <li>Sell your personal information</li>
            <li>Use your data for advertising</li>
            <li>Share your data with third parties except as described below</li>
            <li>Access your ArcGIS maps or data beyond what you explicitly submit for description</li>
          </ul>

          <hr />

          <h2>AI Processing (Anthropic Claude)</h2>

          <h3>What Gets Sent to AI</h3>
          <p>When you click &ldquo;Generate Description,&rdquo; we send to Anthropic&apos;s Claude API:</p>
          <ol>
            <li>The screenshot image of your map view</li>
            <li>Metadata about visible layers and symbology</li>
            <li>The geographic location/extent of the view</li>
            <li>Our system instructions for generating accessible descriptions</li>
          </ol>

          <h3>Anthropic&apos;s Data Handling</h3>
          <p>According to Anthropic&apos;s API Terms of Service:</p>
          <ul>
            <li>API inputs and outputs are <strong>not used to train</strong> their models</li>
            <li>Data is processed to provide the service and then deleted</li>
            <li>Anthropic maintains SOC 2 Type II certification</li>
          </ul>

          <h3>Important Considerations</h3>
          <ul>
            <li>
              <strong>Private Maps</strong>: If your map contains sensitive or private data,
              that data will be visible in the screenshot sent to the AI. Only generate descriptions
              for maps you are comfortable sharing with a third-party AI service.
            </li>
            <li>
              <strong>No Human Review (Default)</strong>: Your map screenshots are processed automatically
              by AI; they are not reviewed by humans at dymaptic or Anthropic. If you opt in to screenshot
              sharing (see &ldquo;Optional Screenshot Sharing&rdquo; above), screenshots may be reviewed
              by our team to improve description quality.
            </li>
          </ul>

          <hr />

          <h2>Data Sharing</h2>
          <p>We share your information only in these limited circumstances:</p>

          <table>
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Data Shared</th>
                <th>Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Anthropic (AI Provider)</strong></td>
                <td>Map screenshots, layer metadata</td>
                <td>Generate accessibility descriptions</td>
              </tr>
              <tr>
                <td><strong>ArcGIS Online</strong></td>
                <td>Authentication tokens</td>
                <td>Verify your identity and access web maps</td>
              </tr>
              <tr>
                <td><strong>Microsoft Azure (Hosting)</strong></td>
                <td>All stored data (encrypted)</td>
                <td>Host our application and database</td>
              </tr>
              <tr>
                <td><strong>Plausible Analytics</strong></td>
                <td>Aggregate page view data (no personal information)</td>
                <td>Understand usage patterns to improve the Service</td>
              </tr>
            </tbody>
          </table>

          <p>We do not sell, rent, or trade your personal information.</p>

          <hr />

          <h2>Data Security</h2>
          <p>We implement industry-standard security measures:</p>
          <ul>
            <li><strong>Encryption in Transit</strong>: All data transmitted via HTTPS/TLS</li>
            <li><strong>Encryption at Rest</strong>: Database contents encrypted</li>
            <li><strong>Access Controls</strong>: Only authorized personnel can access systems</li>
            <li><strong>Secure Authentication</strong>: OAuth 2.0 with ArcGIS Online</li>
            <li><strong>Session Security</strong>: HttpOnly, Secure cookies with expiration</li>
          </ul>

          <hr />

          <h2>Your Rights and Choices</h2>

          <h3>Access Your Data</h3>
          <p>You can view your generation history at any time within the application.</p>

          <h3>Delete Your Data</h3>
          <ul>
            <li><strong>Individual Generations</strong>: Delete any generation from your history page</li>
            <li><strong>Account Deletion</strong>: Contact us to request complete deletion of your account and all associated data</li>
          </ul>

          <h3>Data Portability</h3>
          <p>You can copy your generated descriptions (Markdown or HTML) at any time.</p>

          <hr />

          <h2>Data Retention</h2>
          <table>
            <thead>
              <tr>
                <th>Data Type</th>
                <th>Retention Period</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Account Information</td>
                <td>Until you request deletion</td>
              </tr>
              <tr>
                <td>Generation History</td>
                <td>Based on subscription tier: Free (7 days), Starter (90 days), Professional (1 year), Enterprise (unlimited)</td>
              </tr>
              <tr>
                <td>Shared Screenshots (if opted in)</td>
                <td>Retained for internal quality improvement; contact us to request deletion</td>
              </tr>
              <tr>
                <td>Soft-Deleted Generations</td>
                <td>30 days from deletion, then permanently removed</td>
              </tr>
              <tr>
                <td>Session Data</td>
                <td>7 days, or until logout</td>
              </tr>
            </tbody>
          </table>

          <hr />

          <h2>When We Contact You</h2>
          <p>
            We may send you email communications related to your use of the Service. These include:
          </p>

          <h3>Transactional Emails (Required)</h3>
          <p>These emails are necessary for the operation of your account and cannot be opted out of:</p>
          <ul>
            <li><strong>Subscription confirmations</strong>: When you request, activate, or cancel a subscription</li>
            <li><strong>Usage notifications</strong>: When you reach 80% of your quota, exhaust your quota, or hit your limit</li>
            <li><strong>Renewal reminders</strong>: 30 days and 7 days before your subscription expires</li>
            <li><strong>Account status changes</strong>: Grace period notifications, subscription expiration</li>
            <li><strong>Legal notices</strong>: Terms of Service updates, policy changes, and other notices required under our Terms</li>
          </ul>

          <h3>Product Updates &amp; Tips (Opt-Out)</h3>
          <p>
            We may occasionally send you helpful information about the Service, including:
          </p>
          <ul>
            <li><strong>Product updates</strong>: New features, improvements, and changes to the Service</li>
            <li><strong>Usage tips</strong>: Best practices for creating accessible map descriptions</li>
            <li><strong>Accessibility resources</strong>: Relevant industry news and educational content</li>
          </ul>
          <p>
            You can unsubscribe from these communications at any time by clicking the unsubscribe link
            included in every email, or by contacting us directly. Unsubscribing from product updates
            will not affect your transactional emails.
          </p>

          <h3>How to Contact Us</h3>
          <p>
            All emails from Accessible Map Agent are sent from addresses at the <code>dymaptic.com</code> domain.
            You can reply directly to any email we send — replies go to a real person.
          </p>

          <h3>What We Don&apos;t Send</h3>
          <ul>
            <li>Third-party promotional content</li>
            <li>Advertising from other companies</li>
            <li>Emails to users who have opted out of product updates</li>
          </ul>

          <hr />

          <h2>Contact Us</h2>
          <p>If you have questions about this Privacy Policy or our data practices:</p>
          <p>
            <strong>Moravec Labs, LLC dba dymaptic</strong><br />
            An Oregon limited liability company<br />
            3327 NE 59th Ave., Portland, OR 97213<br />
            Email: <a href="mailto:support@dymaptic.com">support@dymaptic.com</a>
          </p>
        </article>
      </main>

      <Footer />
    </div>
  );
}
