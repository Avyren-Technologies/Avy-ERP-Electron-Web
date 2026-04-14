import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Mail } from "lucide-react";
import companyLogo from "@/assets/logo/Company-Logo.png";

const EFFECTIVE_DATE = "14 April 2026";
const LAST_UPDATED = "14 April 2026";
const COMPANY_NAME = "Avyren Technologies";
const PRODUCT_NAME = "Avy ERP";
const WEBSITE_URL = "https://avyrentechnologies.com";
const SUPPORT_EMAIL = "support@avyrentechnologies.com";
const PRIVACY_EMAIL = "privacy@avyrentechnologies.com";
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

export function PrivacyPolicyScreen() {
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
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 mb-4">
                        <Shield className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white tracking-tight mb-2">
                        Privacy Policy
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                        Effective Date: {EFFECTIVE_DATE} &middot; Last Updated: {LAST_UPDATED}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/40 dark:border-neutral-800 shadow-2xl shadow-primary-900/5 dark:shadow-black/20 rounded-[2rem] p-8 md:p-12 space-y-10">

                    {/* Introduction */}
                    <Section id="introduction" title="1. Introduction">
                        <p>
                            {COMPANY_NAME} ("<strong>we</strong>", "<strong>us</strong>", or "<strong>our</strong>") operates the {PRODUCT_NAME} platform, a multi-tenant Software-as-a-Service (SaaS) enterprise resource planning system designed for small and medium-sized manufacturing enterprises. {PRODUCT_NAME} is accessible through our web application at <a href={WEBSITE_URL} className="text-primary-600 dark:text-primary-400 hover:underline font-medium">{WEBSITE_URL}</a>, our mobile applications for iOS and Android (available on the Apple App Store and Google Play Store), and our desktop application.
                        </p>
                        <p>
                            This Privacy Policy describes how we collect, use, disclose, store, and protect your personal information when you use any of our platforms, services, or interact with us in any way. By accessing or using {PRODUCT_NAME}, you acknowledge that you have read and understood this Privacy Policy.
                        </p>
                        <p>
                            We are committed to protecting your privacy and ensuring that your personal data is handled in a safe and responsible manner, in compliance with applicable Indian data protection laws including the Digital Personal Data Protection Act, 2023 (DPDPA) and the Information Technology Act, 2000.
                        </p>
                    </Section>

                    {/* Information We Collect */}
                    <Section id="info-collected" title="2. Information We Collect">
                        <p>We collect the following categories of information depending on your role and usage of {PRODUCT_NAME}:</p>

                        <SubSection title="2.1 Account & Identity Information">
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>Full name, email address, phone number, and employee ID</li>
                                <li>Company name, company registration details, GSTIN, and PAN</li>
                                <li>Job title, designation, department, and reporting hierarchy</li>
                                <li>Login credentials (passwords are stored in hashed form and are never accessible in plaintext)</li>
                                <li>Multi-factor authentication (MFA) configuration data</li>
                                <li>Profile photographs (if uploaded)</li>
                            </ul>
                        </SubSection>

                        <SubSection title="2.2 Employee & HR Data (Tenant-Specific)">
                            <p>When a company uses the HRMS module, the following data may be collected and processed on behalf of the company (as a data processor):</p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>Date of birth, gender, marital status, blood group, and emergency contact details</li>
                                <li>Aadhaar number, PAN, UAN (Universal Account Number), and ESI number</li>
                                <li>Bank account details (account number, IFSC code, bank name) for salary disbursement</li>
                                <li>Salary structure, payroll components, deductions, tax declarations, and payslip history</li>
                                <li>Attendance records, biometric/face-scan data, GPS location data (for mobile attendance marking)</li>
                                <li>Leave balances, leave requests, and approval history</li>
                                <li>Performance review data, KPI scores, training records, and certifications</li>
                                <li>Loan, advance, and reimbursement records</li>
                                <li>Travel and expense claims</li>
                                <li>Grievance and disciplinary records</li>
                                <li>Offboarding and full-and-final settlement data</li>
                                <li>HR letters and certificates generated by the system</li>
                            </ul>
                        </SubSection>

                        <SubSection title="2.3 Operational & Business Data (Tenant-Specific)">
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>Production records, OEE (Overall Equipment Effectiveness) data, scrap and non-conformance logs</li>
                                <li>Machine maintenance records, preventive maintenance schedules, breakdown logs, and spare part usage</li>
                                <li>Calibration records for instruments and equipment</li>
                                <li>Inventory data including item masters, stock levels, goods receipt notes, and material requests</li>
                                <li>Sales invoices, quotations, customer POs, payment records, and customer ledger data</li>
                                <li>Vendor master data, purchase orders, advance shipping notices, and vendor performance metrics</li>
                                <li>Financial data including chart of accounts, journal entries, bank reconciliation, and financial statements</li>
                                <li>Quality inspection records, non-conformance reports (NCRs), and CAPA records</li>
                                <li>EHSS (Environmental Health, Safety & Sustainability) incident reports, risk assessments, and safety observations</li>
                                <li>CRM data including leads, opportunities, contacts, and communication history</li>
                                <li>Project management data including tasks, milestones, resource allocations, and cost tracking</li>
                            </ul>
                        </SubSection>

                        <SubSection title="2.4 Visitor & Security Data">
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>Visitor names, contact information, company affiliation, and photograph (taken at check-in)</li>
                                <li>Visitor check-in/check-out timestamps, host details, and purpose of visit</li>
                                <li>Vehicle and material gate pass information</li>
                                <li>Safety induction acknowledgement records</li>
                                <li>Watchlist and blocklist entries</li>
                                <li>Gate attendance logs for employees (timestamps, gate identifiers)</li>
                                <li>Goods verification records for inbound deliveries</li>
                            </ul>
                        </SubSection>

                        <SubSection title="2.5 Technical & Device Information">
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>IP address, browser type and version, operating system, and device identifiers</li>
                                <li>Mobile device model, app version, and push notification tokens</li>
                                <li>Session tokens and cookies for authentication and session management</li>
                                <li>Usage analytics — screens visited, features used, and interaction patterns (anonymised and aggregated)</li>
                                <li>Error logs and crash reports for application stability improvement</li>
                            </ul>
                        </SubSection>

                        <SubSection title="2.6 Payment & Subscription Data">
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>Subscription plan details, billing cycle preferences (monthly or annual), and module selections</li>
                                <li>Invoice history, payment transaction references, and payment method type (card, UPI, NEFT, etc.)</li>
                                <li>We do <strong>not</strong> store full credit/debit card numbers or CVV codes — payment processing is handled by our PCI-DSS-compliant payment gateway partners</li>
                            </ul>
                        </SubSection>
                    </Section>

                    {/* How We Use Your Information */}
                    <Section id="usage" title="3. How We Use Your Information">
                        <p>We use the collected information for the following purposes:</p>

                        <SubSection title="3.1 Platform Operation & Service Delivery">
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>To provision and manage your tenant environment and user accounts</li>
                                <li>To authenticate your identity and authorise access based on your role and permissions</li>
                                <li>To process and deliver the ERP services you and your company have subscribed to, including HR management, payroll processing, attendance tracking, production management, inventory control, financial accounting, and all other active modules</li>
                                <li>To generate reports, dashboards, KPIs, and analytics within your tenant scope</li>
                                <li>To synchronise data across mobile, web, and desktop platforms</li>
                                <li>To support offline-first functionality by caching operational data locally on mobile devices and synchronising it with our servers when connectivity is restored</li>
                            </ul>
                        </SubSection>

                        <SubSection title="3.2 Communication & Notifications">
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>To send system notifications including approval requests, task reminders, overdue alerts, and status updates via in-app notifications, email, SMS, and push notifications</li>
                                <li>To deliver OTP codes for authentication and password resets</li>
                                <li>To send billing-related communications such as invoices, payment confirmations, subscription renewal notices, and payment failure alerts</li>
                                <li>To communicate critical platform updates, security advisories, and scheduled maintenance windows</li>
                            </ul>
                        </SubSection>

                        <SubSection title="3.3 Security & Compliance">
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>To maintain immutable audit logs of all create, update, and delete operations across the platform</li>
                                <li>To detect and prevent unauthorised access, fraud, and security threats</li>
                                <li>To enforce tenant isolation — ensuring no data leaks across company boundaries</li>
                                <li>To comply with Indian statutory requirements including GST, PF, ESI, TDS, PT, and LWF computations</li>
                                <li>To enforce account lockout policies and rate limiting for security protection</li>
                            </ul>
                        </SubSection>

                        <SubSection title="3.4 Platform Improvement">
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>To analyse anonymised and aggregated usage patterns to improve platform features, performance, and user experience</li>
                                <li>To identify and resolve bugs, performance issues, and application errors</li>
                                <li>To develop new features and modules based on aggregated usage trends (never based on individual tenant business data)</li>
                            </ul>
                        </SubSection>
                    </Section>

                    {/* Data Storage & Security */}
                    <Section id="security" title="4. Data Storage & Security">
                        <SubSection title="4.1 Multi-Tenant Isolation">
                            <p>
                                {PRODUCT_NAME} operates a <strong>schema-per-tenant architecture</strong>. Each subscribing company's data is stored in a completely isolated PostgreSQL schema. No SQL query can cross tenant boundaries. Platform-level data (user accounts, billing, subscriptions) is stored in a separate shared schema and is access-controlled independently.
                            </p>
                        </SubSection>

                        <SubSection title="4.2 Encryption">
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li><strong>In Transit:</strong> All data transmitted between your device and our servers is encrypted using TLS 1.3. HTTP connections are automatically redirected to HTTPS.</li>
                                <li><strong>At Rest:</strong> All data at rest is encrypted at the database and object storage layer. Encryption keys are managed per-tenant where applicable.</li>
                                <li><strong>Passwords:</strong> User passwords are cryptographically hashed using industry-standard algorithms (bcrypt) and are never stored in plaintext.</li>
                            </ul>
                        </SubSection>

                        <SubSection title="4.3 Authentication & Access Controls">
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>JWT-based authentication with tenant-scoped tokens — a token from one company cannot access another company's data</li>
                                <li>Role-Based Access Control (RBAC) enforced at the API layer, not just the UI</li>
                                <li>Configurable session timeout (default: 30 minutes of inactivity)</li>
                                <li>Account lockout after configurable failed login attempts</li>
                                <li>Optional multi-factor authentication (MFA) available at platform, tenant, role, and individual user levels</li>
                                <li>Redis-cached permissions with 30-minute TTL, invalidated immediately on role or permission changes</li>
                            </ul>
                        </SubSection>

                        <SubSection title="4.4 Infrastructure">
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>Cloud-hosted infrastructure with automated daily backups</li>
                                <li>Recovery Point Objective (RPO): 24 hours</li>
                                <li>Recovery Time Objective (RTO): 4 hours</li>
                                <li>Database replication with synchronous primary and asynchronous read replicas</li>
                                <li>Document attachments stored in S3-compatible cloud object storage with per-tenant isolated storage paths</li>
                            </ul>
                        </SubSection>

                        <SubSection title="4.5 Audit Logging">
                            <p>
                                Every create, update, and delete operation across the platform generates an immutable audit log entry recording who performed the action, what was changed, when it occurred, and from which IP address. Audit logs are scoped to the tenant's schema and <strong>cannot be modified or deleted by anyone</strong>, including Super Admins. Audit logs are retained for a minimum of 7 years.
                            </p>
                        </SubSection>
                    </Section>

                    {/* Data Retention */}
                    <Section id="retention" title="5. Data Retention">
                        <p>We retain your data for the following periods, in compliance with Indian regulatory requirements and operational necessity:</p>
                        <div className="mt-3 overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-neutral-200 dark:border-neutral-700">
                                        <th className="text-left py-2.5 pr-4 font-semibold text-neutral-800 dark:text-neutral-200">Data Category</th>
                                        <th className="text-left py-2.5 pr-4 font-semibold text-neutral-800 dark:text-neutral-200">Retention Period</th>
                                        <th className="text-left py-2.5 font-semibold text-neutral-800 dark:text-neutral-200">Basis</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    <tr><td className="py-2.5 pr-4">Payroll & Tax Records</td><td className="py-2.5 pr-4">7 years</td><td className="py-2.5">Indian regulatory requirement</td></tr>
                                    <tr><td className="py-2.5 pr-4">Attendance Records</td><td className="py-2.5 pr-4">3 years minimum</td><td className="py-2.5">Factories Act requirement</td></tr>
                                    <tr><td className="py-2.5 pr-4">Visitor Records</td><td className="py-2.5 pr-4">1 year (configurable)</td><td className="py-2.5">Security compliance</td></tr>
                                    <tr><td className="py-2.5 pr-4">Audit Logs</td><td className="py-2.5 pr-4">7 years</td><td className="py-2.5">Non-deletable; compliance</td></tr>
                                    <tr><td className="py-2.5 pr-4">Production Records</td><td className="py-2.5 pr-4">5 years</td><td className="py-2.5">Quality & traceability</td></tr>
                                    <tr><td className="py-2.5 pr-4">Calibration Records</td><td className="py-2.5 pr-4">Equipment lifecycle + 5 years</td><td className="py-2.5">ISO 9001 requirement</td></tr>
                                    <tr><td className="py-2.5 pr-4">Financial Records</td><td className="py-2.5 pr-4">8 years</td><td className="py-2.5">Companies Act, GST Act</td></tr>
                                    <tr><td className="py-2.5 pr-4">Account Data</td><td className="py-2.5 pr-4">Duration of subscription + 90 days</td><td className="py-2.5">Service continuity</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-3">
                            Upon termination of a company's subscription, tenant data is retained for a grace period of 90 days to allow for data export. After this period, all tenant data is permanently deleted from our systems and backups, unless retention is required by law.
                        </p>
                    </Section>

                    {/* Data Sharing & Disclosure */}
                    <Section id="sharing" title="6. Data Sharing & Disclosure">
                        <p>We do <strong>not</strong> sell, rent, or trade your personal data to third parties for marketing purposes. We may share data in the following limited circumstances:</p>

                        <SubSection title="6.1 Within the Tenant">
                            <p>
                                Data within a company's tenant is accessible to authorised users based on their assigned roles and permissions. For example, an HR Manager can view employee records within their own company. A Production Manager can view production data. Access is always governed by the RBAC system configured by the Company Admin.
                            </p>
                        </SubSection>

                        <SubSection title="6.2 Service Providers">
                            <p>We use the following categories of third-party service providers who may process data on our behalf:</p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li><strong>Cloud Infrastructure Providers</strong> — for hosting, database, and storage services</li>
                                <li><strong>Payment Gateway Partners</strong> — for processing subscription payments (PCI-DSS compliant)</li>
                                <li><strong>Email & SMS Providers</strong> — for delivering transactional notifications (e.g., OTPs, approval alerts, invoice reminders)</li>
                                <li><strong>Error Monitoring Services</strong> — for application stability and crash reporting (anonymised data only)</li>
                            </ul>
                            <p>All service providers are bound by data processing agreements and are prohibited from using your data for their own purposes.</p>
                        </SubSection>

                        <SubSection title="6.3 Legal Obligations">
                            <p>We may disclose your information if required to do so by law, regulation, legal process, or enforceable governmental request, including:</p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>To comply with any applicable law, regulation, or legal process</li>
                                <li>To respond to lawful requests by public authorities, including tax authorities, labour commissioners, and law enforcement</li>
                                <li>To protect the rights, property, or safety of {COMPANY_NAME}, our users, or the public</li>
                            </ul>
                        </SubSection>

                        <SubSection title="6.4 Integration Partners">
                            <p>
                                If your Company Admin configures integrations with external systems (e.g., Tally ERP, QuickBooks, biometric devices, IoT sensors, payment gateways), data may be exchanged with those systems as required for the integration to function. Such integrations are configured and controlled by the Company Admin and are subject to the terms of those third-party services.
                            </p>
                        </SubSection>
                    </Section>

                    {/* Cookies & Local Storage */}
                    <Section id="cookies" title="7. Cookies & Local Storage">
                        <SubSection title="7.1 Web Application">
                            <p>Our web application uses the following types of cookies and local storage:</p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li><strong>Authentication Cookies</strong> — JWT tokens stored securely for session management (essential; cannot be disabled)</li>
                                <li><strong>Preference Cookies</strong> — Theme selection (light/dark mode), language preference, and UI state</li>
                                <li><strong>Tenant Context</strong> — To identify which company workspace you are accessing</li>
                            </ul>
                            <p>We do <strong>not</strong> use third-party advertising or tracking cookies.</p>
                        </SubSection>

                        <SubSection title="7.2 Mobile Application">
                            <p>
                                Our mobile applications use secure local storage (MMKV/SQLite) to store authentication tokens, cached operational data for offline-first functionality, and user preferences. Local data is encrypted and is accessible only to the {PRODUCT_NAME} application.
                            </p>
                        </SubSection>
                    </Section>

                    {/* Your Rights */}
                    <Section id="rights" title="8. Your Rights">
                        <p>Under applicable data protection laws, you have the following rights:</p>
                        <ul className="list-disc pl-5 space-y-1.5">
                            <li><strong>Right to Access</strong> — You may request a copy of the personal data we hold about you</li>
                            <li><strong>Right to Correction</strong> — You may request correction of inaccurate or incomplete personal data</li>
                            <li><strong>Right to Erasure</strong> — You may request deletion of your personal data, subject to legal retention obligations and contractual requirements</li>
                            <li><strong>Right to Data Portability</strong> — You may request your data in a commonly used, machine-readable format</li>
                            <li><strong>Right to Withdraw Consent</strong> — Where processing is based on consent, you may withdraw your consent at any time. This does not affect the lawfulness of processing prior to withdrawal.</li>
                            <li><strong>Right to Grievance Redressal</strong> — You may raise a complaint with us or with the applicable Data Protection Board of India</li>
                        </ul>
                        <p className="mt-3">
                            <strong>For Employees of Subscribing Companies:</strong> If you are an employee whose data is processed through {PRODUCT_NAME} by your employer, please contact your Company Admin or HR department for data access and correction requests. Your employer is the data controller for your employment data; {COMPANY_NAME} acts as a data processor.
                        </p>
                        <p>
                            To exercise any of your rights, contact us at <a href={`mailto:${PRIVACY_EMAIL}`} className="text-primary-600 dark:text-primary-400 hover:underline font-medium">{PRIVACY_EMAIL}</a>.
                        </p>
                    </Section>

                    {/* Children's Privacy */}
                    <Section id="children" title="9. Children's Privacy">
                        <p>
                            {PRODUCT_NAME} is an enterprise platform designed for business use and is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected personal data from a minor without appropriate consent, we will take steps to delete such information promptly.
                        </p>
                    </Section>

                    {/* Biometric Data */}
                    <Section id="biometric" title="10. Biometric & Location Data">
                        <SubSection title="10.1 Biometric Data">
                            <p>
                                If your company has enabled biometric attendance (face scan or fingerprint), {PRODUCT_NAME} may process biometric data for the sole purpose of attendance verification. Biometric data is processed with your explicit consent and is stored in encrypted form. Biometric templates are not shared with any third party. Your Company Admin controls whether biometric attendance is enabled.
                            </p>
                        </SubSection>
                        <SubSection title="10.2 Location Data">
                            <p>
                                The mobile application may collect GPS location data <strong>only</strong> when your company has enabled GPS-based attendance marking and <strong>only</strong> at the time of attendance punch. Location data is not collected continuously or in the background. You will be prompted for location permission, and you may deny this permission (though GPS attendance marking will not function without it).
                            </p>
                        </SubSection>
                    </Section>

                    {/* Offline Data */}
                    <Section id="offline" title="11. Offline Data & Synchronisation">
                        <p>
                            The {PRODUCT_NAME} mobile application is designed with offline-first capabilities for manufacturing environments with unreliable connectivity. When offline, operational data (attendance records, production slips, maintenance logs, material requests, visitor check-ins) is stored locally on your device in an encrypted local database. When connectivity is restored, this data is automatically synchronised with our servers. During the offline period, data exists only on your device.
                        </p>
                        <p>
                            If a data conflict occurs during synchronisation (the same record was modified both offline and on the server), server-side changes take precedence for most data types. Additive operational records (attendance punches, production slips) are never overwritten.
                        </p>
                    </Section>

                    {/* International Data */}
                    <Section id="international" title="12. International Data Transfers">
                        <p>
                            {PRODUCT_NAME}'s primary infrastructure is hosted in India. If you access the platform from outside India, your data may be transferred to and stored on servers located in India. By using {PRODUCT_NAME}, you consent to the transfer and processing of your data in India, subject to the protections described in this Privacy Policy.
                        </p>
                        <p>
                            Where we use cloud infrastructure providers, data may be stored in data centres in India or other jurisdictions where our providers operate. We ensure appropriate safeguards are in place through data processing agreements with all providers.
                        </p>
                    </Section>

                    {/* Changes to this Policy */}
                    <Section id="changes" title="13. Changes to This Privacy Policy">
                        <p>
                            We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make material changes, we will notify you by posting the updated policy on our website, updating the "Last Updated" date, and — for significant changes — sending a notification through the platform or via email.
                        </p>
                        <p>
                            We encourage you to review this Privacy Policy periodically to stay informed about how we protect your data.
                        </p>
                    </Section>

                    {/* Contact Us */}
                    <Section id="contact" title="14. Contact Us">
                        <p>If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
                        <div className="mt-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-5 space-y-2">
                            <p className="font-semibold text-neutral-800 dark:text-neutral-200">{COMPANY_NAME}</p>
                            <p>Registered Address: {REGISTERED_ADDRESS}</p>
                            <p className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-primary-500" />
                                Privacy Inquiries: <a href={`mailto:${PRIVACY_EMAIL}`} className="text-primary-600 dark:text-primary-400 hover:underline font-medium">{PRIVACY_EMAIL}</a>
                            </p>
                            <p className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-primary-500" />
                                General Support: <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary-600 dark:text-primary-400 hover:underline font-medium">{SUPPORT_EMAIL}</a>
                            </p>
                            <p>
                                Website: <a href={WEBSITE_URL} className="text-primary-600 dark:text-primary-400 hover:underline font-medium">{WEBSITE_URL}</a>
                            </p>
                        </div>
                    </Section>

                    {/* Grievance Officer */}
                    <Section id="grievance" title="15. Grievance Officer">
                        <p>
                            In accordance with the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023, the Grievance Officer for {COMPANY_NAME} can be reached at <a href={`mailto:${PRIVACY_EMAIL}`} className="text-primary-600 dark:text-primary-400 hover:underline font-medium">{PRIVACY_EMAIL}</a>. The Grievance Officer will acknowledge your complaint within 48 hours and endeavour to resolve it within 30 days.
                        </p>
                    </Section>

                </div>

                {/* Footer */}
                <div className="mt-8 mb-4 text-center space-y-3 animate-in fade-in duration-1000 delay-300">
                    <div className="flex items-center justify-center gap-4 text-sm text-neutral-400 dark:text-neutral-500">
                        <Link to="/terms-of-service" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium">
                            Terms of Service
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
