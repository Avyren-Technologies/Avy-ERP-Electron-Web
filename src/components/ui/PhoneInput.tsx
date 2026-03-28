import { useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Country {
    code: string;
    dialCode: string;
    flag: string;
    name: string;
}

const COUNTRIES: Country[] = [
    { code: "IN", dialCode: "+91", flag: "🇮🇳", name: "India" },
    { code: "US", dialCode: "+1", flag: "🇺🇸", name: "United States" },
    { code: "GB", dialCode: "+44", flag: "🇬🇧", name: "United Kingdom" },
    { code: "AE", dialCode: "+971", flag: "🇦🇪", name: "UAE" },
    { code: "SG", dialCode: "+65", flag: "🇸🇬", name: "Singapore" },
    { code: "AU", dialCode: "+61", flag: "🇦🇺", name: "Australia" },
    { code: "CA", dialCode: "+1", flag: "🇨🇦", name: "Canada" },
    { code: "DE", dialCode: "+49", flag: "🇩🇪", name: "Germany" },
    { code: "FR", dialCode: "+33", flag: "🇫🇷", name: "France" },
    { code: "JP", dialCode: "+81", flag: "🇯🇵", name: "Japan" },
    { code: "CN", dialCode: "+86", flag: "🇨🇳", name: "China" },
    { code: "BR", dialCode: "+55", flag: "🇧🇷", name: "Brazil" },
    { code: "ZA", dialCode: "+27", flag: "🇿🇦", name: "South Africa" },
    { code: "MY", dialCode: "+60", flag: "🇲🇾", name: "Malaysia" },
    { code: "NZ", dialCode: "+64", flag: "🇳🇿", name: "New Zealand" },
    { code: "SA", dialCode: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
    { code: "QA", dialCode: "+974", flag: "🇶🇦", name: "Qatar" },
    { code: "KW", dialCode: "+965", flag: "🇰🇼", name: "Kuwait" },
    { code: "BH", dialCode: "+973", flag: "🇧🇭", name: "Bahrain" },
    { code: "OM", dialCode: "+968", flag: "🇴🇲", name: "Oman" },
    { code: "NP", dialCode: "+977", flag: "🇳🇵", name: "Nepal" },
    { code: "LK", dialCode: "+94", flag: "🇱🇰", name: "Sri Lanka" },
    { code: "BD", dialCode: "+880", flag: "🇧🇩", name: "Bangladesh" },
    { code: "PK", dialCode: "+92", flag: "🇵🇰", name: "Pakistan" },
];

interface PhoneInputProps {
    label?: string;
    countryCode: string;
    phone: string;
    onCountryCodeChange: (code: string) => void;
    onPhoneChange: (phone: string) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
}

export function PhoneInput({
    label,
    countryCode = "+91",
    phone,
    onCountryCodeChange,
    onPhoneChange,
    placeholder = "Phone number",
    required = false,
    disabled = false,
}: PhoneInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const selectedCountry = COUNTRIES.find((c) => c.dialCode === countryCode) ?? COUNTRIES[0]!;
    const filtered = COUNTRIES.filter(
        (c) =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.dialCode.includes(searchTerm) ||
            c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            {label && (
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                    {label}
                    {required && <span className="text-danger-500 ml-0.5">*</span>}
                </label>
            )}
            <div className="flex gap-0">
                {/* Country code selector */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => !disabled && setIsOpen(!isOpen)}
                        disabled={disabled}
                        className={cn(
                            "flex items-center gap-1 px-2.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-r-0 border-neutral-200 dark:border-neutral-700 rounded-l-xl text-sm transition-all whitespace-nowrap",
                            disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        )}
                    >
                        <span className="text-base">{selectedCountry.flag}</span>
                        <span className="text-neutral-600 dark:text-neutral-300 text-xs font-medium">{selectedCountry.dialCode}</span>
                        <ChevronDown size={12} className="text-neutral-400" />
                    </button>

                    {isOpen && (
                        <div className="absolute z-50 mt-1 w-64 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                            <div className="p-2 border-b border-neutral-100 dark:border-neutral-700">
                                <div className="relative">
                                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                                    <input
                                        type="text"
                                        autoFocus
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search country..."
                                        className="w-full pl-8 pr-8 py-1.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none dark:text-white"
                                    />
                                    {searchTerm && (
                                        <button onClick={() => setSearchTerm("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                            <X size={12} className="text-neutral-400" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="overflow-y-auto max-h-48">
                                {filtered.map((c) => (
                                    <button
                                        key={c.code}
                                        type="button"
                                        onClick={() => { onCountryCodeChange(c.dialCode); setIsOpen(false); setSearchTerm(""); }}
                                        className={cn(
                                            "w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 dark:text-white flex items-center gap-2.5 transition-colors",
                                            c.dialCode === countryCode && "bg-primary-50 dark:bg-primary-900/20 font-semibold"
                                        )}
                                    >
                                        <span className="text-base">{c.flag}</span>
                                        <span className="flex-1">{c.name}</span>
                                        <span className="text-neutral-400 text-xs">{c.dialCode}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Phone number input */}
                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                        const cleaned = e.target.value.replace(/[^0-9]/g, "");
                        onPhoneChange(cleaned);
                    }}
                    placeholder={placeholder}
                    disabled={disabled}
                    maxLength={15}
                    className={cn(
                        "flex-1 min-w-0 px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-r-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                />
            </div>
        </div>
    );
}
