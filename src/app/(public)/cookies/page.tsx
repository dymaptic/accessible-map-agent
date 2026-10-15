import Link from "next/link";
import { PublicHeader } from "@/components/landing/PublicHeader";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Cookie Policy - Accessible Map Agent",
  description: "Learn about how Accessible Map Agent uses cookies.",
};

export default function CookiesPage() {
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
          <h1>Cookie Policy</h1>

          <p className="lead">
            <strong>Accessible Map Agent</strong><br />
            <strong>Operated by Moravec Labs, LLC dba dymaptic</strong><br />
            <strong>Last Updated: February 2026</strong>
          </p>

          <hr />

          <h2>What Are Cookies?</h2>
          <p>
            Cookies are small text files stored on your device when you visit a website.
            They help websites remember your preferences and improve your experience.
          </p>
          <p>
            This Cookie Policy is part of and subject to our{" "}
            <Link href="/terms">Terms of Service</Link>. Please also review our{" "}
            <Link href="/privacy">Privacy Policy</Link> for information about how we handle your data.
          </p>

          <hr />

          <h2>How We Use Cookies</h2>
          <p>
            Accessible Map Agent uses a minimal set of cookies, primarily for authentication
            and essential functionality. We do <strong>not</strong> use cookies for advertising,
            tracking, or analytics.
          </p>

          <hr />

          <h2>Cookies We Use</h2>

          <h3>Essential Cookies (Required)</h3>
          <p>
            These cookies are necessary for the Service to function. You cannot opt out of
            these cookies while using the Service.
          </p>

          <table>
            <thead>
              <tr>
                <th>Cookie Name</th>
                <th>Purpose</th>
                <th>Duration</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>session_id</code></td>
                <td>Maintains your login session after ArcGIS authentication</td>
                <td>7 days</td>
                <td>First-party, HttpOnly</td>
              </tr>
              <tr>
                <td><code>oauth_state</code></td>
                <td>Protects against CSRF attacks during ArcGIS login</td>
                <td>10 minutes</td>
                <td>First-party, HttpOnly</td>
              </tr>
            </tbody>
          </table>

          <hr />

          <h2>Third-Party Cookies</h2>

          <h3>ArcGIS Online</h3>
          <p>
            When you sign in with ArcGIS Online, Esri may set cookies to manage your
            authentication session. We do not control these cookies. For information about
            Esri&apos;s cookie practices, see{" "}
            <a href="https://www.esri.com/en-us/privacy/privacy-statements/privacy-statement" target="_blank" rel="noopener noreferrer">
              Esri&apos;s Privacy Policy
            </a>.
          </p>

          <h3>ArcGIS Maps SDK</h3>
          <p>
            The embedded map viewer uses ArcGIS Maps SDK, which may set cookies for
            map tile caching and performance. These are managed by Esri.
          </p>

          <hr />

          <h2>We Do NOT Use</h2>
          <ul>
            <li><strong>Analytics Cookies</strong>: We use Plausible Analytics, which is cookie-free and does not track individual users. We do not use Google Analytics, Mixpanel, or similar services</li>
            <li><strong>Advertising Cookies</strong>: We do not display ads or use ad tracking</li>
            <li><strong>Social Media Cookies</strong>: We do not embed social media widgets that set tracking cookies</li>
            <li><strong>Cross-Site Tracking</strong>: We do not track you across other websites</li>
          </ul>

          <hr />

          <h2>Cookie Settings</h2>

          <h3>Essential Cookies</h3>
          <p>Cannot be disabled as they are required for the Service to function.</p>

          <h3>Browser Settings</h3>
          <p>You can control cookies through your browser:</p>
          <ul>
            <li><strong>Chrome</strong>: Settings → Privacy and Security → Cookies</li>
            <li><strong>Firefox</strong>: Settings → Privacy &amp; Security → Cookies</li>
            <li><strong>Safari</strong>: Preferences → Privacy → Cookies</li>
            <li><strong>Edge</strong>: Settings → Privacy, Search, and Services → Cookies</li>
          </ul>

          <hr />

          <h2>Data Stored in Cookies</h2>
          <p>Our cookies contain only:</p>
          <ul>
            <li>A random session identifier (not your personal information)</li>
            <li>Simple preference flags (true/false values)</li>
          </ul>
          <p>Your personal information is stored securely in our database, not in cookies.</p>

          <hr />

          <h2>Cookie Security</h2>
          <p>All our cookies use security best practices:</p>

          <table>
            <thead>
              <tr>
                <th>Security Feature</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>HttpOnly</strong></td>
                <td>Session cookies cannot be accessed by JavaScript, protecting against XSS attacks</td>
              </tr>
              <tr>
                <td><strong>Secure</strong></td>
                <td>Cookies are only transmitted over HTTPS</td>
              </tr>
              <tr>
                <td><strong>SameSite=Strict</strong></td>
                <td>Cookies are not sent with cross-site requests, protecting against CSRF</td>
              </tr>
              <tr>
                <td><strong>Expiration</strong></td>
                <td>Cookies expire after their purpose is fulfilled</td>
              </tr>
            </tbody>
          </table>

          <hr />

          <h2>Summary</h2>
          <table>
            <thead>
              <tr>
                <th>Cookie Type</th>
                <th>Used?</th>
                <th>Can Disable?</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Essential (Authentication)</td>
                <td>Yes</td>
                <td>No</td>
              </tr>
              <tr>
                <td>Analytics (Plausible, cookie-free)</td>
                <td>Yes*</td>
                <td>N/A</td>
              </tr>
              <tr>
                <td>Advertising</td>
                <td>No</td>
                <td>N/A</td>
              </tr>
              <tr>
                <td>Third-Party Tracking</td>
                <td>No</td>
                <td>N/A</td>
              </tr>
            </tbody>
          </table>
          <p className="text-sm">
            *Plausible Analytics collects aggregate usage data but does not set any cookies
            or collect personal information. See{" "}
            <a href="https://plausible.io/data-policy" target="_blank" rel="noopener noreferrer">
              Plausible&apos;s data policy
            </a> for details.
          </p>

          <hr />

          <h2>Contact Us</h2>
          <p>Questions about our cookie practices?</p>
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
