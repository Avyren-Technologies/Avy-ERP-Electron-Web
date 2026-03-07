// Step 09 — Key Contacts

import {
    SectionCard, FormInput, FormSelect, PhoneInput, AddButton, ItemCard, TwoCol
} from '../atoms';
import { CONTACT_TYPES, COUNTRY_CODES } from '../constants';
import { useTenantOnboardingStore } from '../store';
import type { Contact } from '../types';

export function Step09Contacts() {
    const { step9, addContact, removeContact, updateContact } = useTenantOnboardingStore();
    const contacts = step9.contacts;

    return (
        <div className="space-y-0 animate-in fade-in slide-in-from-right-3 duration-300">
            <SectionCard
                title="Key Company Contacts"
                subtitle="Contacts for HR, Finance, IT, Legal, and Operations — used for notifications and escalations"
            >
                <div className="bg-info-50 border border-info-200 rounded-xl px-4 py-3 mb-4">
                    <p className="text-xs text-info-800">
                        Add at least one primary contact. These contacts receive system alerts, billing notices, and
                        support communications. Unlike users, contacts don't have login access.
                    </p>
                </div>

                <div className="space-y-0">
                    {contacts.map((c, idx) => (
                        <ItemCard
                            key={c.id}
                            title={c.name || 'New Contact'}
                            subtitle={[c.designation, c.department].filter(Boolean).join(' · ')}
                            badge={`Contact ${idx + 1}`}
                            badgeVariant={c.type === 'Primary' ? 'primary' : 'info'}
                            onRemove={contacts.length > 1 ? () => removeContact(c.id) : undefined}
                            defaultOpen={idx === 0}
                        >
                            <ContactForm
                                contact={c}
                                onChange={(u) => updateContact(c.id, u)}
                            />
                        </ItemCard>
                    ))}
                </div>

                <AddButton label="Add Another Contact" onClick={addContact} />
            </SectionCard>
        </div>
    );
}

function ContactForm({
    contact,
    onChange,
}: {
    contact: Contact;
    onChange: (u: Partial<Contact>) => void;
}) {
    return (
        <div className="space-y-4">
            <TwoCol>
                <FormInput
                    label="Full Name"
                    placeholder="e.g. Priya Sharma"
                    value={contact.name}
                    onChange={(v) => onChange({ name: v })}
                    required
                />
                <FormInput
                    label="Designation / Title"
                    placeholder="e.g. HR Manager"
                    value={contact.designation}
                    onChange={(v) => onChange({ designation: v })}
                />
            </TwoCol>

            <TwoCol>
                <FormInput
                    label="Department"
                    placeholder="e.g. Human Resources"
                    value={contact.department}
                    onChange={(v) => onChange({ department: v })}
                />
                <FormSelect
                    label="Contact Type"
                    value={contact.type}
                    onChange={(v) => onChange({ type: v })}
                    options={CONTACT_TYPES}
                />
            </TwoCol>

            <TwoCol>
                <FormInput
                    label="Email Address"
                    placeholder="priya@company.com"
                    value={contact.email}
                    onChange={(v) => onChange({ email: v })}
                    type="email"
                    required
                />
                <PhoneInput
                    label="Mobile Number"
                    countryCode={contact.countryCode}
                    phone={contact.mobile}
                    onCountryCodeChange={(v) => onChange({ countryCode: v })}
                    onPhoneChange={(v) => onChange({ mobile: v })}
                    options={COUNTRY_CODES}
                />
            </TwoCol>

            <FormInput
                label="LinkedIn Profile (Optional)"
                placeholder="https://linkedin.com/in/username"
                value={contact.linkedin}
                onChange={(v) => onChange({ linkedin: v })}
                type="url"
            />
        </div>
    );
}
