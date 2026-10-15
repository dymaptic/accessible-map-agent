import Link from "next/link";
import { PublicHeader } from "@/components/landing/PublicHeader";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Terms of Service - Accessible Map Agent",
  description: "Terms of Service for using Accessible Map Agent by dymaptic.",
};

export default function TermsPage() {
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
          <h1>Terms of Service</h1>

          <p className="lead">
            <strong>Accessible Map Agent</strong><br />
            <strong>Operated by Moravec Labs, LLC dba dymaptic</strong><br />
            <strong>Last Updated: February 2026</strong>
          </p>

          <p>
            These Terms of Service (the &ldquo;Terms&rdquo;) are between you and Moravec Labs, LLC,
            dba dymaptic, an Oregon limited liability company with its principal place of business
            at 3327 NE 59th Ave., Portland, OR 97213.
          </p>

          <hr />

          <h2>1. Agreement to Terms</h2>
          <p>
            By accessing or using Accessible Map Agent (&ldquo;the Service&rdquo;), you agree to be bound by these
            Terms of Service (&ldquo;Terms&rdquo;). If you are using the Service on behalf of an organization, you
            represent that you have authority to bind that organization to these Terms.
          </p>
          <p>
            If you do not agree to these Terms, you may not use the Service.
          </p>

          <hr />

          <h2>2. Description of Service</h2>
          <p>
            Accessible Map Agent is a web application that generates text descriptions for ArcGIS web maps
            to assist with ADA-compliance. The Service uses artificial intelligence (Anthropic&apos;s Claude) to
            analyze map screenshots and metadata, producing text descriptions intended to help blind and
            low-vision users understand geographic information.
          </p>
          <p>
            The Service is designed to help organizations meet accessibility requirements including:
          </p>
          <ul>
            <li>ADA Title II web content accessibility requirements</li>
            <li>WCAG 2.1 Success Criterion 1.1.1 (Non-Text Content, Level AA)</li>
            <li>Section 508 federal accessibility standards</li>
          </ul>

          <hr />

          <h2>3. Account and Authentication</h2>
          <p>
            To use the Service, you must authenticate with a valid ArcGIS Online account. By signing in, you:
          </p>
          <ul>
            <li>Authorize us to access your ArcGIS username, email, organization ID, and display name</li>
            <li>Agree to comply with Esri&apos;s Terms of Use for ArcGIS Online</li>
            <li>Accept responsibility for all activity under your account</li>
          </ul>
          <p>
            You must not share your account credentials or allow others to access your account.
          </p>

          <hr />

          <h2>4. Subscription Plans and Pricing</h2>

          <h3>Free Tier</h3>
          <p>
            Each ArcGIS organization receives 3 free map descriptions (lifetime total, shared across all users).
            Free tier descriptions are retained for 7 days.
          </p>

          <h3>Paid Subscriptions</h3>
          <table>
            <thead>
              <tr>
                <th>Plan</th>
                <th>Monthly Price</th>
                <th>Annual Price</th>
                <th>Maps/Month</th>
                <th>History Retention</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Starter</td>
                <td>$49</td>
                <td>$499</td>
                <td>25</td>
                <td>90 days</td>
              </tr>
              <tr>
                <td>Professional</td>
                <td>$199</td>
                <td>$1,999</td>
                <td>150</td>
                <td>1 year</td>
              </tr>
              <tr>
                <td>Enterprise</td>
                <td>Custom</td>
                <td>Custom</td>
                <td>Unlimited</td>
                <td>Unlimited</td>
              </tr>
            </tbody>
          </table>

          <h3>Billing Terms</h3>
          <ul>
            <li>Subscriptions are billed in advance (monthly or annually)</li>
            <li>Quotas reset at the beginning of each billing period</li>
            <li>Unused quota does not roll over to the next period</li>
            <li>All prices are in US dollars</li>
          </ul>

          <h3>Payment Methods</h3>
          <p>
            We accept payment via ACH bank transfer, check, and purchase orders (for qualifying organizations).
            Invoices are due within 30 days of receipt.
          </p>

          <hr />

          <h2>5. Cancellation and Refunds</h2>

          <h3>Cancellation</h3>
          <p>
            You may request cancellation at any time through the Settings page. Upon cancellation:
          </p>
          <ul>
            <li>Your subscription remains active until the end of the current billing period</li>
            <li>Your account reverts to the Free tier after the subscription ends</li>
            <li>Existing descriptions are retained according to Free tier limits (7 days)</li>
          </ul>

          <h3>Refunds</h3>
          <p>
            Refunds are handled on a case-by-case basis. Contact us at{" "}
            <a href="mailto:support@dymaptic.com">support@dymaptic.com</a> to discuss your situation.
            We generally do not provide refunds for:
          </p>
          <ul>
            <li>Unused quota within a billing period</li>
            <li>Partial months of service</li>
            <li>Descriptions you chose not to use</li>
          </ul>

          <hr />

          <h2>6. Acceptable Use</h2>
          <p>You agree to use the Service only for lawful purposes. You must not:</p>
          <ul>
            <li>Use the Service to process maps containing illegal content</li>
            <li>Attempt to circumvent usage quotas or access controls</li>
            <li>Interfere with or disrupt the Service or its infrastructure</li>
            <li>Reverse engineer, decompile, or attempt to extract source code</li>
            <li>Use automated systems to access the Service beyond normal use</li>
            <li>Resell or redistribute the Service without authorization</li>
            <li>Misrepresent generated descriptions as human-written when disclosure is required</li>
          </ul>

          <hr />

          <h2>7. AI-Generated Content</h2>

          <h3>Nature of Generated Descriptions</h3>
          <p>
            Descriptions are generated by artificial intelligence and should be treated as a starting point,
            not a final product. AI can make mistakes, misidentify features, or produce inaccurate information.
            Dymaptic makes no warranty or representation regarding the accuracy, completeness, or reliability
            of AI outputs.
          </p>

          <h3>Your Responsibilities</h3>
          <p>You are responsible for:</p>
          <ul>
            <li>Reviewing all generated descriptions for accuracy before use</li>
            <li>Editing descriptions to correct errors or add organization-specific details</li>
            <li>Ensuring descriptions meet your accessibility compliance requirements</li>
            <li>Any consequences of using unreviewed or inaccurate descriptions</li>
          </ul>

          <h3>No Guarantee of Compliance</h3>
          <p>
            While our descriptions are designed to help meet accessibility standards, we do not guarantee
            that generated content will satisfy all legal accessibility requirements. Compliance ultimately
            depends on how descriptions are used and integrated into your applications. You remain solely
            responsible for evaluating and using AI outputs and the Service for compliance with all legal
            obligations under applicable law.
          </p>

          <hr />

          <h2>8. Intellectual Property</h2>

          <h3>Your Content</h3>
          <p>
            You retain all rights to your maps, data, and any original content you submit to the Service.
            By using the Service, you grant us a limited license to process your content solely to provide
            the Service. You represent that you own or license sufficient intellectual property rights in
            your content to permit its use by dymaptic, as contemplated by these Terms, and that to your
            knowledge such usage will not infringe the rights of any third party. By using the Service, you 
            grant us a limited license to process your content solely to provide the Service.
          </p>

          <h3>Generated Descriptions</h3>
          <p>
            You own the generated descriptions and may use them for any lawful purpose, including
            commercial use, without attribution to dymaptic.
          </p>

          <h3>Our Property</h3>
          <p>
            The Service, including its design, features, and underlying technology, and including any
            derivative works, modifications or improvements to them, are and will remain the property
            of dymaptic. These Terms do not grant you any rights to our trademarks, logos, or branding.
          </p>

          <hr />

          <h2>9. Data and Privacy</h2>
          <p>
            Your use of the Service is also governed by our{" "}
            <Link href="/privacy">Privacy Policy</Link> and{" "}
            <Link href="/cookies">Cookie Policy</Link>, which describe how we collect, use, and protect
            your information.
          </p>
          <p>Here are the key points from those policies as they relate to these Terms:</p>
          <ul>
            <li>Map screenshots are sent to Anthropic&apos;s AI service for processing</li>
            <li>By default, screenshots are not stored after processing</li>
            <li>Generated descriptions are stored according to your subscription tier</li>
            <li>We do not sell your data or use it for advertising</li>
          </ul>

          <hr />

          <h2>10. Third-Party Services</h2>
          <p>The Service integrates with third-party services:</p>
          <ul>
            <li>
              <strong>ArcGIS Online (Esri)</strong>: Authentication and map access, governed by{" "}
              <a href="https://www.esri.com/en-us/legal/terms/full-master-agreement" target="_blank" rel="noopener noreferrer">
                Esri&apos;s Terms of Use
              </a>
            </li>
            <li>
              <strong>Anthropic Claude</strong>: AI processing, governed by{" "}
              <a href="https://www.anthropic.com/legal/consumer-terms" target="_blank" rel="noopener noreferrer">
                Anthropic&apos;s Terms of Service
              </a>
            </li>
          </ul>
          <p>
            We are not responsible for the availability, accuracy, or policies of third-party services, 
            and providing links to third-party websites and resources does not imply an endorsement, 
            affiliation, or sponsorship of any kind. You agree that dymaptic has no responsibility or 
            liability for any third-party services or any data exported to a third-party service. 
            Dymaptic does not guarantee that the Service will maintain integrations with any third-party 
            service and dymaptic may disable integrations of the Service with any third-party service 
            at any time with or without notice to you. For clarity, these Terms govern your use of and 
            access to the Service, even if accessed through an integration with a third-party service. 
            To the extent your use of the Service constitutes a violation of any third-party terms of 
            use or service of which dymaptic receives notice, then your use of the Service may be 
            immediately terminated.
          </p>

          <hr />

          <h2>11. Service Availability</h2>
          <p>
            We strive to maintain high availability but do not guarantee uninterrupted access. The Service
            may be temporarily unavailable due to:
          </p>
          <ul>
            <li>Scheduled maintenance (we will provide advance notice when possible)</li>
            <li>Unscheduled outages or technical issues</li>
            <li>Third-party service disruptions (ArcGIS Online, Anthropic, hosting providers)</li>
            <li>Events beyond our reasonable control</li>
          </ul>

          <hr />

          <h2>12. Disclaimer of Warranties</h2>
          <p>
            THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND,
            EITHER EXPRESS OR IMPLIED. USE OF THE SERVICE DOES NOT CERTIFY COMPLIANCE WITH THE AMERICANS
            WITH DISABILITIES ACT OF 1990, SECTION 508 OF THE REHABILITATION ACT OF 1973 OR ANY OTHER
            APPLICABLE LAW. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES,
            INCLUDING BUT NOT LIMITED TO:
          </p>
          <ul>
            <li>MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE</li>
            <li>ACCURACY, RELIABILITY, OR COMPLETENESS OF GENERATED CONTENT</li>
            <li>NON-INFRINGEMENT OF THIRD-PARTY RIGHTS</li>
            <li>UNINTERRUPTED OR ERROR-FREE OPERATION</li>
            <li>COMPLIANCE WITH ANY SPECIFIC ACCESSIBILITY STANDARD</li>
          </ul>

          <hr />

          <h2>13. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, DYMAPTIC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
            SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
          </p>
          <ul>
            <li>LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES</li>
            <li>ACCESSIBILITY COMPLIANCE FAILURES OR RELATED LEGAL CLAIMS</li>
            <li>ERRORS OR INACCURACIES IN GENERATED DESCRIPTIONS</li>
            <li>SERVICE INTERRUPTIONS OR DATA LOSS</li>
          </ul>
          <p>
            OUR TOTAL LIABILITY FOR ANY CLAIMS ARISING FROM THESE TERMS OR YOUR USE OF THE SERVICE SHALL NOT
            EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
          </p>

          <hr />

          <h2>14. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless dymaptic, its officers, employees, and agents from any
            claims, damages, losses, or expenses (including reasonable attorney&apos;s fees) arising from:
          </p>
          <ul>
            <li>Your use of the Service</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any third-party rights</li>
            <li>Content you submit to the Service</li>
            <li>Claims regarding your failure to comply with applicable law</li>
          </ul>
          <p>
            Your defense or indemnification obligations will not apply to the extent the underlying
            allegation arises from dymaptic&apos;s fraud, willful misconduct, violations of law, or breach
            of these Terms.
          </p>

          <hr />

          <h2>15. Termination</h2>
          <p>
            We may suspend or terminate your access to the Service at any time if you violate these Terms
            or engage in conduct that we determine, in our sole discretion, is harmful to the Service or
            other users.
          </p>
          <p>
            Upon termination:
          </p>
          <ul>
            <li>Your right to use the Service immediately ceases</li>
            <li>You remain responsible for any outstanding payment obligations</li>
            <li>Provisions that by their nature should survive will remain in effect</li>
          </ul>

          <hr />

          <h2>16. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. If we make material changes, we will notify you
            by email or through the Service. Your continued use of the Service after changes take effect
            constitutes acceptance of the updated Terms.
          </p>

          <hr />

          <h2>17. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of Oregon, United States, without regard to 
            conflict of law principles. Any disputes arising from these Terms or your use of the Service 
            shall be resolved in the state or federal courts located in Portland, Oregon, which courts 
            will have exclusive jurisdiction and venue to adjudicate any dispute arising out of these 
            Terms or your use of the Service. The parties expressly disclaim the United Nations Convention 
            on Contracts for the International Sale of Goods, and its provisions will not govern these 
            Terms. If you are using the Service on behalf of a government entity, the applicable laws of 
            your jurisdiction govern these Terms.
          </p>

          <hr />

          <h2>18. US Government Customers</h2>
          <p>
             The Service is a commercial item, developed at private expense, provided to you under these 
             terms. If you are a US government entity or US government contractor, dymaptic licenses or 
             provides subscriptions to you in accordance with these Terms under FAR Subparts 12.211/12.212 
             or DFARS Subpart 227.7202. Dymaptic data and services are licensed or subscribed under the 
             same DFARS Subpart 227.7202 policy as commercial computer software for acquisitions made under 
             DFARS. Provisions of these Terms that are inconsistent with federal law regulation will not 
             apply. If any court, arbitrator, or board holds that a US government customer has greater 
             rights to any portion of the Service under applicable public procurement law, such rights 
             will extend only to the portions affected.
          </p>

          <hr />

          <h2>19. General Provisions</h2>
          <ul>
            <li>
              <strong>Notices:</strong> All notices, demands, waivers, and other communications under these Terms 
              (each, a &ldquo;<strong>Notice</strong>&ldquo;) must be in writing. Any Notices provided under 
              these Terms may be delivered electronically to your email address or other authorized addresses 
              provided to dymaptic. Notice is effective only: (a) upon receipt by the receiving party, and (b) 
              if the party giving the Notice has complied with all requirements of this Section. You agree to 
              receive electronic communications from dymaptic based on your use of the Service and related to 
              these Terms.
            </li>
            <li>
              <strong>Amendment</strong>: Dymaptic may update these Terms at any time, to be effective the earlier of 
              30 days after the updates are posted by dymaptic, or after you otherwise receive Notice, except that 
              updates made in response to changes to law or regulation take effect immediately upon the earlier of 
              posting or Notice. Changes will not apply retroactively. No other amendment to or modification of 
              these Terms is effective unless it is in writing and signed by both parties.
            </li>
            <li>
              <strong>Entire Agreement</strong>: These Terms, together with our Privacy Policy and Cookie Policy, 
              constitute the entire agreement between you and dymaptic regarding the Service.
            </li>
            <li>
              <strong>Severability</strong>:  If any provision is found unenforceable, the remaining provisions 
              remain in effect.
            </li>
            <li>
              <strong>Force Majeure</strong>: Dymaptic will not be liable for any failure of or delay in the 
              provision of the Service for the period that such failure or delay is due to causes beyond 
              dymaptic&apos;s reasonable control. Such causes may include, but are not limited to, acts of God, 
              war, strikes, labor disputes, cyber attacks, laws, regulations, government orders, or any other 
              force majeure event.
            </li>
            <li>
              <strong>Waiver</strong>: Our failure to enforce any right or provision does not constitute a waiver.
            </li>
            <li>
              <strong>Assignment</strong>: You may not assign these Terms without our consent. We may assign 
              our rights and obligations without restriction.
            </li>
          </ul>

          <hr />

          <h2>Contact Us</h2>
          <p>Questions about these Terms?</p>
          <p>
            <strong>Moravec Labs, LLC dba dymaptic</strong><br />
            Email: <a href="mailto:support@dymaptic.com">support@dymaptic.com</a>
          </p>
        </article>
      </main>

      <Footer />
    </div>
  );
}
