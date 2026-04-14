import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Mail } from "lucide-react";
import companyLogo from "@/assets/logo/Company-Logo.png";

const EFFECTIVE_DATE = "14 April 2026";
const LAST_UPDATED = "14 April 2026";
const COMPANY_NAME = "Avyren Technologies";
const PRODUCT_NAME = "Avy ERP";
const WEBSITE_URL = "https://avyrentechnologies.com";
const SUPPORT_EMAIL = "support@avyrentechnologies.com";
const LEGAL_EMAIL = "legal@avyrentechnologies.com";
const REGISTERED_ADDRESS = "India";

/* ─── Section component ─── */
function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
    return (
        <section id={id} className="scroll-mt-24">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4 tracking-tight">
                {title}
            </h2>
            <div className="text-neutral-600 dark:text-neutral-400 text-[15px] leading-relaxed space-y-3">
                {children}
            </div>
        </section>
    );
}

/* ─── Sub-section component ─── */
function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="mt-4">
            <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-2">{title}</h3>
            <div className="space-y-2">{children}</div>
        </div>
    );
}

export function TermsOfServiceScreen() {
    return (
        <div className="min-h-screen py-8 px-4 sm:px-6">
            {/* Header */}
            <div className="max-w-4xl mx-auto mb-8 animate-in fade-in duration-500">
                <div className="flex items-center justify-between mb-6">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                    <img src={companyLogo} alt={`${COMPANY_NAME} Logo`} className="h-40 w-auto object-contain" />
                </div>

                {/* Title card */}
                <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/40 dark:border-neutral-800 shadow-2xl shadow-primary-900/5 dark:shadow-black/20 rounded-[2rem] p-8 md:p-10 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-100 dark:bg-accent-900/30 mb-4">
                        <FileText className="w-7 h-7 text-accent-600 dark:text-accent-400" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white tracking-tight mb-2">
                        Terms of Service
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                        Effective Date: {EFFECTIVE_DATE} &middot; Last Updated: {LAST_UPDATED}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/40 dark:border-neutral-800 shadow-2xl shadow-primary-900/5 dark:shadow-black/20 rounded-[2rem] p-8 md:p-12 space-y-10">

                    {/* Agreement to Terms */}
                    <Section id="agreement" title="1. Agreement to Terms">
                        <p>
                            These Terms of Service ("<strong>Terms</strong>") constitute a legally binding agreement between you ("<strong>you</strong>", "<strong>User</strong>", or "<strong>Customer</strong>") and {COMPANY_NAME} ("<strong>we</strong>", "<strong>us</strong>", or "<strong>our</strong>"), governing your access to and use of the {PRODUCT_NAME} platform.
                        </p>
                        <p>
                            {PRODUCT_NAME} is a multi-tenant Software-as-a-Service (SaaS) enterprise resource planning platform accessible through our web application at <a href={WEBSITE_URL} className="text-primary-600 dark:text-primary-400 hover:underline font-medium">{WEBSITE_URL}</a>, our mobile applications for iOS and Android, and our desktop application.
                        </p>
                        <p>
                            By creating an account, subscribing to {PRODUCT_NAME}, or using any part of the platform, you acknowledge that you have read, understood, and agree to be bound by these Terms and our <Link to="/privacy-policy" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">Privacy Policy</Link>. If you are entering into these Terms on behalf of a company or other legal entity, you represent that you have the authority to bind that entity to these Terms.
                        </p>
                        <p>
                            If you do not agree to these Terms, you must not access or use {PRODUCT_NAME}.
                        </p>
                    </Section>

                    {/* Definitions */}
                    <Section id="definitions" title="2. Definitions">
                        <div className="mt-2 overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-neutral-200 dark:border-neutral-700">
                                        <th className="text-left py-2.5 pr-4 font-semibold text-neutral-800 dark:text-neutral-200 w-1/3">Term</th>
                                        <th className="text-left py-2.5 font-semibold text-neutral-800 dark:text-neutral-200">Definition</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    <tr><td className="py-2.5 pr-4 font-medium">Platform</td><td className="py-2.5">The {PRODUCT_NAME} web application, mobile applications, desktop application, and all associated APIs and services</td></tr>
                                    <tr><td className="py-2.5 pr-4 font-medium">Tenant</td><td className="py-2.5">An isolated company workspace within {PRODUCT_NAME}, identified by a unique subdomain</td></tr>
                                    <tr><td className="py-2.5 pr-4 font-medium">Company Admin</td><td className="py-2.5">The administrative user with full access within a Tenant, responsible for configuring settings, managing users, and managing the subscription</td></tr>
                                    <tr><td className="py-2.5 pr-4 font-medium">User</td><td className="py-2.5">Any individual who accesses the Platform, including Company Admins, employees, managers, and other role holders</td></tr>
                                    <tr><td className="py-2.5 pr-4 font-medium">Subscription</td><td className="py-2.5">The paid service plan that grants a Tenant access to selected modules and user tiers</td></tr>
                                    <tr><td className="py-2.5 pr-4 font-medium">Module</td><td className="py-2.5">A functional unit of the Platform (e.g., HR Management, Production, Inventory, Finance) that can be independently subscribed to</td></tr>
                                    <tr><td className="py-2.5 pr-4 font-medium">Customer Data</td><td className="py-2.5">All data entered into or generated within a Tenant, including employee records, business transactions, documents, and configurations</td></tr>
                                    <tr><td className="py-2.5 pr-4 font-medium">Super Admin</td><td className="py-2.5">{COMPANY_NAME}'s platform administrator with cross-tenant management capabilities</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </Section>

                    {/* Account Registration */}
                    <Section id="registration" title="3. Account Registration & Tenant Provisioning">
                        <SubSection title="3.1 Registration">
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>To use {PRODUCT_NAME}, you must register a company account by providing accurate, current, and complete information including your company name, industry, contact details, and the email address of the designated Company Admin</li>
                                <li>You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account</li>
                                <li>You must notify us immediately at <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary-600 dark:text-primary-400 hover:underline font-medium">{SUPPORT_EMAIL}</a> if you suspect any unauthorised access to your account</li>
                            </ul>
                        </SubSection>

                        <SubSection title="3.2 Tenant Provisioning">
                            <p>
                                Upon successful registration and subscription, {COMPANY_NAME} provisions an isolated tenant environment for your company. This includes a dedicated database schema, a unique subdomain (e.g., yourcompany.avyren.in), and access to the modules included in your subscription plan.
                            </p>
                        </SubSection>

                        <SubSection title="3.3 Company Admin Responsibilities">
                            <p>The Company Admin is responsible for:</p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>Configuring company settings, organisational structure, and system controls</li>
                                <li>Creating and managing user accounts and assigning appropriate roles and permissions</li>
                                <li>Ensuring that all users within the tenant comply with these Terms</li>
                                <li>Managing the subscription, module selections, and billing</li>
                                <li>Configuring data integrations with external systems, if applicable</li>
                            </ul>
                        </SubSection>
                    </Section>

                    {/* Subscription & Billing */}
                    <Section id="billing" title="4. Subscription, Billing & Payments">
                        <SubSection title="4.1 Subscription Model">
                            <p>{PRODUCT_NAME} pricing is based on two dimensions:</p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li><strong>Module Cost</strong> — Each module has an individual price, payable monthly or annually</li>
                                <li><strong>User Tier Cost</strong> — Pricing is tiered by the number of active users (Starter: 50-100, Growth: 101-200, Scale: 201-500, Enterprise: 501-1,000, Custom: 1,000+)</li>
                            </ul>
                            <p>Modules are independently purchasable. Some modules have dependencies — if a dependent module is required, it will be automatically included and billed.</p>
                        </SubSection>

                        <SubSection title="4.2 Billing Cycles">
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li><strong>Monthly Billing</strong> — Charged at the start of each billing month; cancellable with 30 days' written notice</li>
                                <li><strong>Annual Billing</strong> — Paid upfront for 12 months at a discounted rate; no mid-term cancellation refunds</li>
                            </ul>
                        </SubSection>

                        <SubSection title="4.3 Payment Terms">
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>Invoices are auto-generated at the start of each billing period and sent to the Company Admin's registered email</li>
                                <li>Payment is due within the period specified on the invoice</li>
                                <li>Accepted payment methods include credit/debit card, UPI, NEFT/RTGS, and other methods supported by our payment gateway</li>
                                <li>All prices are in Indian Rupees (INR) unless otherwise agreed for enterprise customers</li>
                                <li>Applicable taxes (GST) will be added to all charges</li>
                            </ul>
                        </SubSection>

                        <SubSection title="4.4 User Tier Adjustments">
                            <p>
                                If your active user count exceeds the ceiling of your subscribed tier, additional billing applies automatically. The Company Admin will be notified before the adjustment takes effect and will have the option to upgrade the tier.
                            </p>
                        </SubSection>

                        <SubSection title="4.5 Failed Payments & Suspension">
                            <p>
                                If a payment fails, we will notify the Company Admin and provide a grace period for resolution. If payment is not received within the grace period, the tenant may be suspended. During suspension, Users cannot log in or access data, but data is not deleted. Service is restored immediately upon payment of all outstanding amounts.
                            </p>
                        </SubSection>
                    </Section>

                    {/* Acceptable Use */}
                    <Section id="acceptable-use" title="5. Acceptable Use Policy">
                        <p>You agree to use {PRODUCT_NAME} only for lawful purposes and in accordance with these Terms. You shall <strong>not</strong>:</p>
                        <ul className="list-disc pl-5 space-y-1.5">
                            <li>Use the Platform for any illegal, fraudulent, or harmful purpose</li>
                            <li>Attempt to gain unauthorised access to any part of the Platform, other tenants' data, or our infrastructure</li>
                            <li>Reverse engineer, decompile, disassemble, or attempt to derive the source code of the Platform</li>
                            <li>Use automated scripts, bots, or other tools to scrape, crawl, or extract data from the Platform beyond what is provided by our APIs</li>
                            <li>Introduce viruses, malware, or any other malicious code into the Platform</li>
                            <li>Circumvent, disable, or interfere with security features, access controls, or tenant isolation mechanisms</li>
                            <li>Share your login credentials with others or allow multiple individuals to use a single account</li>
                            <li>Use the Platform in a manner that could damage, disable, overburden, or impair our servers or networks</li>
                            <li>Resell, sublicense, or redistribute access to the Platform without prior written consent</li>
                            <li>Upload, store, or transmit content that infringes on the intellectual property rights of others</li>
                            <li>Use the Platform to store or transmit personally identifiable information in violation of applicable data protection laws</li>
                        </ul>
                        <p className="mt-3">
                            Violation of this Acceptable Use Policy may result in immediate suspension or termination of your account, without refund, at our sole discretion.
                        </p>
                    </Section>

                    {/* Data Ownership & Processing */}
                    <Section id="data-ownership" title="6. Data Ownership & Processing">
                        <SubSection title="6.1 Your Data">
                            <p>
                                You retain full ownership of all Customer Data entered into or generated within your tenant. {COMPANY_NAME} does not claim any ownership over your business data, employee records, financial information, or any other data stored within your tenant environment.
                            </p>
                        </SubSection>

                        <SubSection title="6.2 Data Processing">
                            <p>
                                By using {PRODUCT_NAME}, you grant {COMPANY_NAME} a limited, non-exclusive licence to process your Customer Data solely for the purpose of providing, maintaining, and improving the Platform services. This includes hosting, backing up, transmitting, displaying, and performing technical operations necessary for service delivery.
                            </p>
                        </SubSection>

                        <SubSection title="6.3 Data Portability">
                            <p>
                                You may export your data at any time using the export features provided within the Platform (PDF, Excel, CSV). Upon written request, we will provide a complete export of your tenant data in a commonly used format within 30 days.
                            </p>
                        </SubSection>

                        <SubSection title="6.4 Data Isolation">
                            <p>
                                Each tenant's data is stored in a completely isolated database schema. No tenant can access another tenant's data. {COMPANY_NAME}'s Super Admin access to tenant data is restricted, logged, and only exercised for support purposes when explicitly authorised.
                            </p>
                        </SubSection>

                        <SubSection title="6.5 Aggregated & Anonymised Data">
                            <p>
                                We may use aggregated and anonymised data (which cannot be used to identify you or your company) for analytics, benchmarking, and platform improvement purposes. This data is never sold or shared with third parties in a manner that identifies individual tenants.
                            </p>
                        </SubSection>
                    </Section>

                    {/* Intellectual Property */}
                    <Section id="ip" title="7. Intellectual Property">
                        <SubSection title="7.1 Platform Ownership">
                            <p>
                                The {PRODUCT_NAME} platform, including all software, code, algorithms, user interfaces, designs, trademarks, logos, documentation, and proprietary technology, is the exclusive intellectual property of {COMPANY_NAME}. These Terms do not transfer any ownership or intellectual property rights to you.
                            </p>
                        </SubSection>

                        <SubSection title="7.2 Limited Licence">
                            <p>
                                Subject to your compliance with these Terms and payment of applicable fees, {COMPANY_NAME} grants you a limited, non-exclusive, non-transferable, revocable licence to access and use the Platform for your internal business operations during the term of your subscription.
                            </p>
                        </SubSection>

                        <SubSection title="7.3 Restrictions">
                            <p>You shall not:</p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>Copy, modify, or create derivative works based on the Platform</li>
                                <li>Remove, alter, or obscure any proprietary notices, labels, or marks on the Platform</li>
                                <li>Use {COMPANY_NAME}'s trademarks, logos, or branding without prior written consent</li>
                                <li>Claim that your product or service is endorsed by, affiliated with, or sponsored by {COMPANY_NAME} without authorisation</li>
                            </ul>
                        </SubSection>

                        <SubSection title="7.4 Feedback">
                            <p>
                                If you provide feedback, suggestions, or feature requests regarding the Platform, you grant {COMPANY_NAME} an irrevocable, perpetual, royalty-free licence to use, incorporate, and commercialise such feedback without obligation to you.
                            </p>
                        </SubSection>
                    </Section>

                    {/* Service Level */}
                    <Section id="sla" title="8. Service Level & Availability">
                        <SubSection title="8.1 Uptime">
                            <p>
                                {COMPANY_NAME} targets a platform uptime of <strong>99.9%</strong>, excluding scheduled maintenance windows. Scheduled maintenance will be announced at least 48 hours in advance and conducted during off-peak hours.
                            </p>
                        </SubSection>

                        <SubSection title="8.2 Performance Targets">
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>API response time (95th percentile): under 300 ms</li>
                                <li>Dashboard load time (cold, first visit): under 2 seconds</li>
                                <li>Standard report generation: under 5 seconds</li>
                                <li>Complex date-range reports: under 30 seconds</li>
                                <li>Document export (PDF/Excel): under 10 seconds</li>
                            </ul>
                        </SubSection>

                        <SubSection title="8.3 Offline Capability">
                            <p>
                                The mobile application provides offline-first functionality for critical operations (attendance, production, maintenance, inventory, visitor management). Data entered offline is stored locally and synchronised automatically when connectivity is restored, typically within 30 seconds.
                            </p>
                        </SubSection>

                        <SubSection title="8.4 Support">
                            <p>
                                Support is available through the in-app support ticket system. Tenants can submit tickets from the Platform, and our support team will respond within the timeframes defined in your subscription tier. Critical issues (platform unavailability, data corruption) are prioritised.
                            </p>
                        </SubSection>
                    </Section>

                    {/* Security */}
                    <Section id="security" title="9. Security & Compliance">
                        <p>{COMPANY_NAME} implements comprehensive security measures to protect the Platform and your data:</p>
                        <ul className="list-disc pl-5 space-y-1.5">
                            <li>All data in transit is encrypted via TLS 1.3; all data at rest is encrypted at the database and storage layer</li>
                            <li>Role-Based Access Control (RBAC) enforced at the API layer with hierarchical permission inheritance</li>
                            <li>JWT-based, tenant-scoped authentication that prevents cross-tenant access</li>
                            <li>Immutable audit logging for all data operations, retained for a minimum of 7 years</li>
                            <li>Automated daily backups with 24-hour RPO and 4-hour RTO</li>
                            <li>Account lockout policies, rate limiting, and optional multi-factor authentication</li>
                            <li>Schema-per-tenant database isolation ensuring no SQL query can cross tenant boundaries</li>
                        </ul>
                        <p className="mt-3">
                            {PRODUCT_NAME} is designed to support compliance with Indian statutory requirements including GST (CGST/SGST/IGST), Provident Fund (PF), Employee State Insurance (ESI), Tax Deducted at Source (TDS), Professional Tax (PT), and Labour Welfare Fund (LWF). Compliance responsibility for accurate data entry and timely filings rests with the Customer.
                        </p>
                    </Section>

                    {/* Termination */}
                    <Section id="termination" title="10. Termination & Suspension">
                        <SubSection title="10.1 Termination by You">
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li><strong>Monthly subscriptions</strong> may be cancelled with 30 days' written notice. Service continues until the end of the current billing period.</li>
                                <li><strong>Annual subscriptions</strong> run for the full 12-month term. No mid-term refunds are provided.</li>
                                <li>Upon cancellation, you may export your data during the remaining subscription period and the 90-day post-termination grace period.</li>
                            </ul>
                        </SubSection>

                        <SubSection title="10.2 Termination by Us">
                            <p>We may suspend or terminate your account if:</p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>You breach any provision of these Terms, including the Acceptable Use Policy</li>
                                <li>Payment remains outstanding beyond the grace period after failed payment notification</li>
                                <li>Your use of the Platform poses a security risk to other tenants or the Platform infrastructure</li>
                                <li>Required by law, regulation, or court order</li>
                            </ul>
                            <p>We will provide reasonable notice before termination (except in cases of severe security threats or legal obligations) and allow you to export your data.</p>
                        </SubSection>

                        <SubSection title="10.3 Effect of Termination">
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>Upon termination, your access to the Platform is immediately revoked</li>
                                <li>Your data is retained for 90 days post-termination to allow for data export</li>
                                <li>After the 90-day grace period, all tenant data is permanently deleted, unless retention is required by law</li>
                                <li>Provisions of these Terms that by their nature should survive termination (including intellectual property, limitation of liability, indemnification, and governing law) shall continue in effect</li>
                            </ul>
                        </SubSection>
                    </Section>

                    {/* Limitation of Liability */}
                    <Section id="liability" title="11. Limitation of Liability">
                        <SubSection title="11.1 Disclaimer of Warranties">
                            <p>
                                THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND ACCURACY.
                            </p>
                            <p>
                                While we strive to ensure the accuracy of all computations (including payroll, statutory deductions, GST calculations, and OEE metrics), {COMPANY_NAME} does not guarantee that all computations are error-free. It is the Customer's responsibility to verify critical financial and statutory calculations before submission to authorities.
                            </p>
                        </SubSection>

                        <SubSection title="11.2 Limitation of Liability">
                            <p>
                                TO THE MAXIMUM EXTENT PERMITTED BY LAW, {COMPANY_NAME.toUpperCase()}'S TOTAL LIABILITY FOR ANY CLAIM ARISING FROM OR RELATED TO THESE TERMS OR THE PLATFORM SHALL NOT EXCEED THE TOTAL AMOUNT PAID BY YOU FOR THE SUBSCRIPTION IN THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE CLAIM.
                            </p>
                            <p>
                                IN NO EVENT SHALL {COMPANY_NAME.toUpperCase()} BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, LOSS OF DATA, BUSINESS INTERRUPTION, OR LOSS OF GOODWILL, WHETHER ARISING FROM CONTRACT, TORT, NEGLIGENCE, STRICT LIABILITY, OR OTHERWISE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
                            </p>
                        </SubSection>

                        <SubSection title="11.3 Exceptions">
                            <p>
                                Nothing in these Terms limits or excludes liability for: (a) death or personal injury caused by negligence; (b) fraud or fraudulent misrepresentation; or (c) any liability that cannot be excluded or limited under applicable Indian law.
                            </p>
                        </SubSection>
                    </Section>

                    {/* Indemnification */}
                    <Section id="indemnification" title="12. Indemnification">
                        <p>
                            You agree to indemnify, defend, and hold harmless {COMPANY_NAME}, its directors, officers, employees, and agents from and against any claims, damages, losses, liabilities, costs, and expenses (including reasonable legal fees) arising out of or related to:
                        </p>
                        <ul className="list-disc pl-5 space-y-1.5">
                            <li>Your breach of these Terms or the Acceptable Use Policy</li>
                            <li>Your violation of any applicable law, regulation, or third-party right</li>
                            <li>Your use of the Platform in a manner not authorised by these Terms</li>
                            <li>Any data entered into the Platform by you or your authorised users that infringes the rights of any third party</li>
                            <li>Any claims by your employees, contractors, or users related to the accuracy of data processed through the Platform (including payroll, attendance, and statutory calculations)</li>
                        </ul>
                    </Section>

                    {/* Third-Party Integrations */}
                    <Section id="third-party" title="13. Third-Party Integrations & Services">
                        <p>
                            {PRODUCT_NAME} supports integrations with third-party systems including but not limited to:
                        </p>
                        <ul className="list-disc pl-5 space-y-1.5">
                            <li>Accounting software (Tally ERP, QuickBooks) for financial data synchronisation</li>
                            <li>Biometric and facial recognition devices for attendance data</li>
                            <li>IoT sensors for machine monitoring and production data</li>
                            <li>Payment gateways for subscription billing</li>
                            <li>Email and SMS notification providers</li>
                            <li>Cloud storage providers for document management</li>
                        </ul>
                        <p className="mt-2">
                            Third-party integrations are configured by the Company Admin. {COMPANY_NAME} is not responsible for the availability, accuracy, security, or data practices of third-party services. Your use of third-party integrations is subject to the terms and conditions of those third-party providers.
                        </p>
                    </Section>

                    {/* Modifications */}
                    <Section id="modifications" title="14. Modifications to Terms & Platform">
                        <SubSection title="14.1 Changes to Terms">
                            <p>
                                We reserve the right to modify these Terms at any time. When we make material changes, we will notify you at least 30 days before the changes take effect by posting the updated Terms on our website and sending a notification through the Platform or via email. Your continued use of the Platform after the effective date of the modified Terms constitutes your acceptance of the changes.
                            </p>
                            <p>
                                If you do not agree to the modified Terms, you may terminate your subscription before the changes take effect, subject to the termination provisions in Section 10.
                            </p>
                        </SubSection>

                        <SubSection title="14.2 Changes to the Platform">
                            <p>
                                {COMPANY_NAME} continuously develops and improves the Platform. We may add, modify, or remove features, modules, or functionalities at any time. We will provide reasonable notice for changes that materially affect your use of the Platform. New modules or features may be subject to additional fees.
                            </p>
                        </SubSection>
                    </Section>

                    {/* Force Majeure */}
                    <Section id="force-majeure" title="15. Force Majeure">
                        <p>
                            {COMPANY_NAME} shall not be liable for any failure or delay in performing its obligations under these Terms due to circumstances beyond its reasonable control, including but not limited to: natural disasters, epidemics or pandemics, war, terrorism, government actions, power failures, internet or telecommunications failures, cyberattacks, or failures of third-party service providers.
                        </p>
                    </Section>

                    {/* Governing Law */}
                    <Section id="governing-law" title="16. Governing Law & Dispute Resolution">
                        <SubSection title="16.1 Governing Law">
                            <p>
                                These Terms shall be governed by and construed in accordance with the laws of India, without regard to conflict of law principles.
                            </p>
                        </SubSection>

                        <SubSection title="16.2 Dispute Resolution">
                            <p>
                                Any dispute arising out of or in connection with these Terms shall be resolved as follows:
                            </p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li><strong>Informal Resolution:</strong> The parties shall first attempt to resolve the dispute through good-faith negotiation for a period of 30 days from the date of written notice of the dispute</li>
                                <li><strong>Mediation:</strong> If the dispute is not resolved through negotiation, the parties shall submit the dispute to mediation under the rules of the Indian Council of Arbitration</li>
                                <li><strong>Arbitration:</strong> If mediation fails, the dispute shall be finally settled by binding arbitration under the Arbitration and Conciliation Act, 1996. The arbitration shall be conducted in English, and the seat of arbitration shall be Bangalore, India</li>
                            </ul>
                        </SubSection>

                        <SubSection title="16.3 Jurisdiction">
                            <p>
                                Subject to the arbitration clause above, the courts of Bangalore, Karnataka, India shall have exclusive jurisdiction over any disputes arising from these Terms.
                            </p>
                        </SubSection>
                    </Section>

                    {/* Miscellaneous */}
                    <Section id="miscellaneous" title="17. General Provisions">
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Entire Agreement:</strong> These Terms, together with our Privacy Policy and any order forms or subscription agreements, constitute the entire agreement between you and {COMPANY_NAME} regarding the Platform and supersede all prior agreements, representations, and understandings.</li>
                            <li><strong>Severability:</strong> If any provision of these Terms is held to be unenforceable or invalid, that provision will be modified to the minimum extent necessary to make it enforceable, and the remaining provisions will continue in full force and effect.</li>
                            <li><strong>Waiver:</strong> No failure or delay by {COMPANY_NAME} in exercising any right under these Terms shall operate as a waiver of that right. A waiver of any provision shall not constitute a waiver of any other provision.</li>
                            <li><strong>Assignment:</strong> You may not assign or transfer your rights or obligations under these Terms without our prior written consent. {COMPANY_NAME} may assign these Terms in connection with a merger, acquisition, or sale of all or substantially all of its assets.</li>
                            <li><strong>Notices:</strong> All notices to {COMPANY_NAME} shall be sent to <a href={`mailto:${LEGAL_EMAIL}`} className="text-primary-600 dark:text-primary-400 hover:underline font-medium">{LEGAL_EMAIL}</a>. Notices to you will be sent to the email address associated with your Company Admin account or through the Platform.</li>
                            <li><strong>No Third-Party Beneficiaries:</strong> These Terms are between you and {COMPANY_NAME}. No third party has any right to enforce any provision of these Terms.</li>
                            <li><strong>Relationship of Parties:</strong> Nothing in these Terms creates a partnership, joint venture, employment, or agency relationship between you and {COMPANY_NAME}.</li>
                        </ul>
                    </Section>

                    {/* Contact Us */}
                    <Section id="contact" title="18. Contact Us">
                        <p>If you have any questions about these Terms, please contact us:</p>
                        <div className="mt-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-5 space-y-2">
                            <p className="font-semibold text-neutral-800 dark:text-neutral-200">{COMPANY_NAME}</p>
                            <p>Registered Address: {REGISTERED_ADDRESS}</p>
                            <p className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-accent-500" />
                                Legal Inquiries: <a href={`mailto:${LEGAL_EMAIL}`} className="text-primary-600 dark:text-primary-400 hover:underline font-medium">{LEGAL_EMAIL}</a>
                            </p>
                            <p className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-accent-500" />
                                General Support: <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary-600 dark:text-primary-400 hover:underline font-medium">{SUPPORT_EMAIL}</a>
                            </p>
                            <p>
                                Website: <a href={WEBSITE_URL} className="text-primary-600 dark:text-primary-400 hover:underline font-medium">{WEBSITE_URL}</a>
                            </p>
                        </div>
                    </Section>

                </div>

                {/* Footer */}
                <div className="mt-8 mb-4 text-center space-y-3 animate-in fade-in duration-1000 delay-300">
                    <div className="flex items-center justify-center gap-4 text-sm text-neutral-400 dark:text-neutral-500">
                        <Link to="/privacy-policy" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium">
                            Privacy Policy
                        </Link>
                        <span>&middot;</span>
                        <Link to="/login" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium">
                            Sign In
                        </Link>
                    </div>
                    <p className="text-[13px] font-medium text-neutral-400 dark:text-neutral-500">
                        &copy; {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
