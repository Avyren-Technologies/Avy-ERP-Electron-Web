import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, ArrowLeft, AlertTriangle, FileSpreadsheet, EyeOff,
  Users, Wrench, Eye, Package, ClipboardList, Factory, BarChart3,
  Receipt, ShieldCheck, Heart, CheckCircle, Ruler, HardHat,
  FolderKanban, PieChart, Smartphone, ChevronRight, ChevronDown,
  Zap, Globe, Clock, Star, Mail, BookOpen, Headphones,
  RefreshCw, Settings, Layers, Target, TrendingUp, Award,
  Menu, X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import companyLogo from "@/assets/logo/Company-Logo.png";

/* ═══════════════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════════════ */

function useCountUp(target: number, duration = 1800, startDelay = 300) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let interval: ReturnType<typeof setInterval> | undefined;
          const timeout = setTimeout(() => {
            const steps = 60;
            const increment = target / steps;
            let current = 0;
            let step = 0;
            interval = setInterval(() => {
              step++;
              current += increment;
              if (step >= steps) {
                setCount(target);
                if (interval) clearInterval(interval);
              } else {
                setCount(Math.floor(current));
              }
            }, duration / steps);
          }, startDelay);
          return () => {
            clearTimeout(timeout);
            if (interval) clearInterval(interval);
          };
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration, startDelay]);

  return { count, ref };
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

function useScrollState() {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return { scrolled };
}

const PRODUCT_NAV_LINKS = [
  { label: "Architecture", href: "/#architecture" },
  { label: "Modules", href: "/#modules" },
  { label: "Platforms", href: "/#platforms" },
  { label: "Product", href: "/product", isActive: true },
];

/* ═══════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════ */

function SectionEyebrow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-px w-8 bg-primary-500" />
      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 font-inter">
        {label}
      </span>
      <div className="h-px w-8 bg-primary-500" />
    </div>
  );
}

function GlassCard({ children, className, hover = true }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <div
      className={cn(
        "relative bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-neutral-700/40",
        hover && "transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-500/5",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden">
        <div className="absolute inset-0 liquid-glass-shimmer opacity-40" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function GradientHeadline({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn(
      "text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-accent-500 to-primary-500 dark:from-primary-400 dark:via-accent-400 dark:to-primary-400",
      className,
    )}>
      {children}
    </span>
  );
}

function WorkflowPipeline({ steps }: { steps: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1 py-4">
      {steps.map((step, i) => (
        <React.Fragment key={step}>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-950/40 border border-primary-200/60 dark:border-primary-800/40">
            <span className="text-[10px] font-bold text-primary-400 dark:text-primary-500">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-xs font-semibold text-primary-700 dark:text-primary-300 font-inter whitespace-nowrap">{step}</span>
          </div>
          {i < steps.length - 1 && (
            <ChevronRight className="w-3.5 h-3.5 text-primary-300 dark:text-primary-700 flex-shrink-0" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DATA CONSTANTS
   ═══════════════════════════════════════════════════════ */

const HERO_STATS = [
  { value: 16, suffix: "+", label: "Integrated Modules" },
  { value: 14, suffix: "", label: "Industry Templates" },
  { value: 4, suffix: "", label: "Deployment Phases" },
  { value: 2, suffix: "", label: "Months Per Phase" },
];

const PROBLEMS = [
  {
    icon: AlertTriangle,
    title: "No Single Source of Truth",
    desc: "Finance, Inventory, and Production all have different numbers. Every meeting starts with an argument about whose spreadsheet is right.",
    color: "text-warning-500",
    bg: "bg-warning-50 dark:bg-warning-950/30",
  },
  {
    icon: FileSpreadsheet,
    title: "Manual Reconciliation",
    desc: "Teams spend hours copying data between systems. One wrong formula in a shared sheet can cascade errors across departments.",
    color: "text-danger-500",
    bg: "bg-danger-50 dark:bg-danger-950/30",
  },
  {
    icon: EyeOff,
    title: "Zero Real-Time Visibility",
    desc: "Management decisions made on yesterday's data. By the time you see a problem in a report, it has already cost you money.",
    color: "text-info-500",
    bg: "bg-info-50 dark:bg-info-950/30",
  },
];

interface ModuleCard {
  icon: LucideIcon;
  name: string;
  desc: string;
  phase: string;
  phaseColor: string;
}

const PLATFORM_MODULES: ModuleCard[] = [
  { icon: Users, name: "HRMS & Payroll", desc: "Hire to retire", phase: "Phase 1", phaseColor: "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300" },
  { icon: Wrench, name: "Asset & Maintenance", desc: "Prevent, track, resolve", phase: "Phase 1", phaseColor: "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300" },
  { icon: Eye, name: "Visitor Management", desc: "Register to checkout", phase: "Phase 1", phaseColor: "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300" },
  { icon: Package, name: "Inventory & Warehouse", desc: "Track to dispatch", phase: "Phase 2", phaseColor: "bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300" },
  { icon: ClipboardList, name: "Procurement & Vendor", desc: "Source to pay", phase: "Phase 2", phaseColor: "bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300" },
  { icon: Factory, name: "Production & Shop Floor", desc: "Plan to ship", phase: "Phase 2", phaseColor: "bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300" },
  { icon: BarChart3, name: "Finance & Accounting", desc: "Payable to profit", phase: "Phase 3", phaseColor: "bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300" },
  { icon: Receipt, name: "Sales & Invoicing", desc: "Quote to cash", phase: "Phase 3", phaseColor: "bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300" },
  { icon: ShieldCheck, name: "Security Module", desc: "Verify and protect", phase: "Phase 3", phaseColor: "bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300" },
  { icon: Heart, name: "CRM", desc: "Lead to loyalty", phase: "Phase 4", phaseColor: "bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300" },
  { icon: CheckCircle, name: "Quality Management", desc: "Inspect and certify", phase: "Phase 4", phaseColor: "bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300" },
  { icon: Ruler, name: "Calibration", desc: "Measure with confidence", phase: "Phase 4", phaseColor: "bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300" },
  { icon: HardHat, name: "EHSS", desc: "Safety and compliance", phase: "Phase 4", phaseColor: "bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300" },
  { icon: FolderKanban, name: "Project Management", desc: "Plan to deliver", phase: "Phase 4", phaseColor: "bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300" },
  { icon: PieChart, name: "Reports & Analytics", desc: "Data-driven decisions", phase: "All Phases", phaseColor: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800/40 dark:text-neutral-300" },
  { icon: Smartphone, name: "Mobile + Offline", desc: "Works anywhere", phase: "All Phases", phaseColor: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800/40 dark:text-neutral-300" },
];

const PHASES = [
  {
    number: 1,
    title: "People, Assets & Visitors",
    timeline: "Months 1\u20132",
    modules: ["HRMS & Payroll", "Asset & Maintenance", "Visitor Management"],
    outcomes: ["Employee self-service live", "PM schedules automated", "Visitor check-in digitised"],
    color: "from-primary-500 to-primary-600",
    borderColor: "border-primary-500/30",
  },
  {
    number: 2,
    title: "Supply Chain & Production",
    timeline: "Months 3\u20134",
    modules: ["Inventory & Warehouse", "Procurement & Vendor", "Production & Shop Floor"],
    outcomes: ["Real-time stock visibility", "PO-to-GRN automated", "OEE dashboard live"],
    color: "from-accent-500 to-accent-600",
    borderColor: "border-accent-500/30",
  },
  {
    number: 3,
    title: "Finance, Sales & Security",
    timeline: "Months 5\u20136",
    modules: ["Finance & Accounting", "Sales & Invoicing", "Security Module"],
    outcomes: ["Three-way match active", "GST-compliant invoicing", "Gate attendance integrated"],
    color: "from-success-500 to-success-600",
    borderColor: "border-success-500/30",
  },
  {
    number: 4,
    title: "CRM, Quality, Compliance & Projects",
    timeline: "Months 7\u20138",
    modules: ["CRM", "Quality Management", "Calibration", "EHSS", "Project Management"],
    outcomes: ["Production-aware CRM live", "CAPA workflows active", "Full compliance tracking"],
    color: "from-warning-500 to-warning-600",
    borderColor: "border-warning-500/30",
  },
];

interface ModuleDeepDive {
  id: string;
  name: string;
  category: string;
  description: string;
  workflow: string[];
  core: string[];
  advanced: string[];
  connects: string[];
  icon: LucideIcon;
  exclusive?: string;
}

const MODULE_DEEP_DIVES: ModuleDeepDive[] = [
  {
    id: "hrms",
    name: "HRMS & Payroll",
    category: "Phase 1 — People",
    icon: Users,
    description: "Complete employee lifecycle management from recruitment through retirement. Integrates attendance, leave, payroll, compliance, and performance into a single system.",
    workflow: ["Recruit", "Onboard", "Attend & Leave", "Payroll", "Compliance", "Appraise", "Offboard"],
    core: [
      "Full employee lifecycle management",
      "6-step payroll wizard with statutory compliance",
      "Leave management with configurable policies",
      "Attendance (biometric/GPS/manual entry)",
      "Statutory compliance (PF/ESI/PT/TDS)",
      "Employee & Manager self-service portal",
    ],
    advanced: [
      "360\u00B0 performance reviews with KRA/KPI",
      "Training & skill matrix tracking",
      "Loan & advance management with EMI",
      "Travel & expense claims with approval",
      "Auto-generated HR letters (offer, appoint, relieving)",
      "Grievance & discipline system",
    ],
    connects: ["Security", "Production", "Finance"],
  },
  {
    id: "asset",
    name: "Asset & Maintenance",
    category: "Phase 1 — People",
    icon: Wrench,
    description: "Register every machine and asset, schedule preventive maintenance, and track breakdowns with timer-based resolution tracking for full operational visibility.",
    workflow: ["Register", "Schedule PM", "Execute", "Track Breakdown", "Resolve", "Analyse", "Report"],
    core: [
      "Machine master registry with specs",
      "Preventive maintenance scheduling",
      "Breakdown management with timer",
      "Spare parts tracking & consumption",
      "IOT reason master for root cause",
      "MTTR & MTBF tracking",
    ],
    advanced: [
      "Auto-generated PM tasks from schedules",
      "Escalation workflows for overdue tasks",
      "Machine-spare part mapping matrix",
      "OEE availability feed to Production",
      "Low-stock auto PO triggers to Procurement",
      "Machine health scoring dashboard",
    ],
    connects: ["Production", "Inventory", "Vendor Management"],
  },
  {
    id: "visitor",
    name: "Visitor Management",
    category: "Phase 1 — People",
    icon: Eye,
    description: "Digitise visitor flows from pre-registration to checkout with safety induction enforcement, real-time dashboards, and complete audit trails.",
    workflow: ["Pre-Register", "Invite", "Arrive", "Verify ID", "Safety Induction", "Badge", "Check-Out"],
    core: [
      "Pre-registration with QR codes",
      "Walk-in & self-service check-in",
      "Safety induction enforcement",
      "Digital/printed badge generation",
      "Real-time on-site visitor dashboard",
      "Host notification & approval workflow",
    ],
    advanced: [
      "Contractor compliance tracking",
      "Emergency evacuation muster list",
      "Watchlist & blocklist management",
      "Group/event visit management",
      "Recurring visitor passes",
      "Vehicle & material gate pass",
    ],
    connects: ["Security", "HR"],
  },
  {
    id: "inventory",
    name: "Inventory & Warehouse",
    category: "Phase 2 — Supply Chain",
    icon: Package,
    description: "End-to-end stock management across warehouses with real-time visibility, multi-location support, and full traceability from receipt to dispatch.",
    workflow: ["Configure Items", "Receive (GRN)", "Store", "Request", "Issue", "Count", "Report"],
    core: [
      "Item master with HSN/GST mapping",
      "Multi-warehouse support",
      "GRN with condition tracking",
      "Material request & approval workflow",
      "Stock ledger with movement history",
      "Reorder alerts & min-max levels",
    ],
    advanced: [
      "Bin/location tracking (rack/shelf/bin)",
      "Serial/lot number tracing",
      "BOM & MRP integration",
      "Stock valuation (FIFO/Weighted Average)",
      "Physical count reconciliation",
      "Slow-moving & dead-stock detection",
    ],
    connects: ["Vendor Management", "Production", "Sales", "Maintenance"],
  },
  {
    id: "procurement",
    name: "Procurement & Vendor",
    category: "Phase 2 — Supply Chain",
    icon: ClipboardList,
    description: "Complete procurement lifecycle from vendor registration through three-way matching, with a vendor self-service portal and performance scoring.",
    workflow: ["Register Vendor", "Create PO", "Vendor Ships (ASN)", "Gate Verify", "GRN", "Three-Way Match", "Pay"],
    core: [
      "Vendor master with compliance docs",
      "PO with multi-level approval",
      "ASN for advance delivery notice",
      "GRN with discrepancy handling",
      "Vendor self-service portal",
      "Three-way match (PO/GRN/Invoice)",
    ],
    advanced: [
      "Vendor performance scoring (QCDS)",
      "Auto-PO from reorder triggers",
      "PO amendment tracking with audit",
      "Blacklist management",
      "Vendor quality integration (IQC feed)",
      "Price variance analysis",
    ],
    connects: ["Inventory", "Finance", "Security", "Quality"],
  },
  {
    id: "production",
    name: "Production & Shop Floor",
    category: "Phase 2 — Supply Chain",
    icon: Factory,
    description: "Real-time production tracking with OEE dashboards, shift-wise logging, scrap recording, and direct feeds to payroll for incentive computation.",
    workflow: ["Plan", "Assign Machine", "Log Output", "Record Scrap", "Calculate OEE", "Compute Incentives", "Report"],
    core: [
      "Real-time OEE dashboard",
      "Shift-wise production slips",
      "Scrap & non-conformance recording",
      "Incentive computation engine",
      "Target vs actual tracking",
      "Machine-wise performance analytics",
    ],
    advanced: [
      "Mobile shop-floor entry (offline-capable)",
      "Batch entry mode for high-volume lines",
      "Rejection reason analysis (Pareto)",
      "Employee productivity tracking",
      "Shift comparison reports",
      "Production-to-payroll incentive feed",
    ],
    connects: ["Maintenance", "HR (Payroll)", "Inventory", "Quality"],
  },
  {
    id: "finance",
    name: "Finance & Accounting",
    category: "Phase 3 — Finance",
    icon: BarChart3,
    description: "Complete financial management from chart of accounts through GST filing, with automatic entries from payroll, sales, and procurement modules.",
    workflow: ["Chart of Accounts", "Record Transactions", "Match Payments", "Reconcile Bank", "Generate Statements", "File GST", "Report"],
    core: [
      "Chart of accounts (pre-configured for India)",
      "Accounts receivable & payable",
      "Payment recording (inward/outward)",
      "Journal entries & general ledger",
      "Bank reconciliation",
      "Financial statements (P&L, Balance Sheet, Cash Flow)",
    ],
    advanced: [
      "Auto-entries from payroll/sales/GRN",
      "GST returns support (GSTR-1/2B/3B)",
      "Three-way match for payables",
      "Advance payment tracking",
      "Cost centre reporting",
      "Tally integration (import/export)",
    ],
    connects: ["Sales", "Vendor Management", "HR (Payroll)"],
  },
  {
    id: "sales",
    name: "Sales & Invoicing",
    category: "Phase 3 — Finance",
    icon: Receipt,
    description: "GST-compliant invoicing with customer management, credit control, and seamless integration with inventory and finance modules.",
    workflow: ["Register Customer", "Receive PO", "Create Quote", "Generate Invoice", "Record Payment", "Reconcile"],
    core: [
      "Customer master with credit limits",
      "GST-compliant invoicing",
      "Quote-to-invoice conversion",
      "Partial payment tracking",
      "Customer ledger & ageing analysis",
      "Proforma invoice support",
    ],
    advanced: [
      "Auto CGST/SGST vs IGST determination",
      "HSN-based GST rate lookup",
      "Credit/debit note management",
      "E-way bill data generation",
      "Revenue dashboards & forecasting",
      "CRM deal-to-invoice integration",
    ],
    connects: ["Finance", "Inventory", "CRM"],
  },
  {
    id: "security",
    name: "Security Module",
    category: "Phase 3 — Finance",
    icon: ShieldCheck,
    description: "Gate-level attendance and goods verification with shift-specific dashboards, multi-gate support, and direct feeds to HR for attendance processing.",
    workflow: ["Employee Arrives", "Scan/Verify", "Record Punch", "Track Gate Count", "Verify Goods", "Manage Shifts"],
    core: [
      "Employee gate attendance (biometric/QR/manual)",
      "Real-time gate headcount",
      "Late arrival/early departure flags",
      "Goods inward verification (ASN-based)",
      "Outward goods gate pass",
      "Shift-specific dashboard",
    ],
    advanced: [
      "Multi-gate support with zone tracking",
      "Emergency lockdown mode",
      "Visitor integration (expected arrival list)",
      "Manual invoice verification at gate",
      "Multi-punch handling & deduplication",
      "Attendance feeds to HR module",
    ],
    connects: ["HR", "Visitor Management", "Vendor Management"],
  },
  {
    id: "crm",
    name: "CRM",
    category: "Phase 4 — Advanced",
    icon: Heart,
    description: "Production-aware CRM that gives sales teams live visibility into shop-floor capacity, OEE, and dispatch risk directly on the deal screen.",
    workflow: ["Capture Lead", "Qualify", "Create Opportunity", "Propose", "Negotiate", "Close", "Invoice"],
    core: [
      "Contact & account management",
      "Lead capture & qualification scoring",
      "Opportunity pipeline (Kanban view)",
      "Activity & communication log",
      "Sales forecasting",
      "Pipeline dashboards & analytics",
    ],
    advanced: [
      "PRODUCTION-AWARE CRM (Avy ERP Exclusive) \u2014 Sales sees live OEE, open work orders, and dispatch risk on deal screen",
      "Quote-to-invoice integration",
      "Account 360\u00B0 view with order history",
      "Win/loss analysis with reason tracking",
      "Quota vs actual tracking per rep",
      "Campaign-to-deal attribution",
    ],
    connects: ["Sales & Invoicing", "Production"],
    exclusive: "Production-Aware CRM is an Avy ERP Exclusive \u2014 no other ERP connects shop-floor reality to sales pipeline.",
  },
  {
    id: "quality",
    name: "Quality Management",
    category: "Phase 4 — Advanced",
    icon: CheckCircle,
    description: "Full quality lifecycle from incoming inspection through final QC, with CAPA management, sampling plans, and vendor quality scoring.",
    workflow: ["Receive Goods", "IQC Inspect", "Release/Reject", "In-Process Check", "Final QC", "Ship with COC"],
    core: [
      "Incoming quality control (IQC)",
      "In-process quality control (IPQC)",
      "Final/outgoing QC (FQC)",
      "Non-conformance reports (NCR)",
      "Sampling plans (AQL-based)",
      "Lot disposition tracking",
    ],
    advanced: [
      "CAPA management (5-Why, Fishbone)",
      "Document control with versioning",
      "First pass yield tracking",
      "Quality cost reporting (CoQ)",
      "Customer-specific inspection plans",
      "Vendor quality scoring feed",
    ],
    connects: ["Inventory", "Production", "Vendor Management", "Calibration"],
  },
  {
    id: "calibration",
    name: "Calibration",
    category: "Phase 4 — Advanced",
    icon: Ruler,
    description: "Instrument lifecycle management with automated scheduling, multi-point measurement recording, and certificate generation for ISO compliance.",
    workflow: ["Register Instrument", "Schedule", "Execute Calibration", "Record Readings", "Disposition", "Certificate", "Track"],
    core: [
      "Instrument/equipment master registry",
      "Auto-generated calibration tasks",
      "Multi-point measurement recording",
      "Pass/fail/conditional disposition",
      "Calibration certificates (PDF export)",
      "Due date tracking & overdue alerts",
    ],
    advanced: [
      "Out-of-tolerance retrospective review",
      "21 CFR Part 11 e-signatures",
      "Immutable audit trail",
      "Overdue escalation workflow",
      "Calibration agency tracking",
      "ISO 9001 compliance mapping",
    ],
    connects: ["Quality Management", "Maintenance"],
  },
  {
    id: "ehss",
    name: "EHSS",
    category: "Phase 4 — Advanced",
    icon: HardHat,
    description: "Environment, Health, Safety & Sustainability management with incident tracking, risk assessment, PPE compliance, and regulatory reporting.",
    workflow: ["Identify Hazard", "Assess Risk", "Report Incident", "Investigate", "Correct", "Train", "Monitor"],
    core: [
      "Incident register (injury/near-miss/damage)",
      "Risk assessment (5\u00D75 matrix)",
      "Safety observation cards",
      "PPE issuance & tracking",
      "Environmental monitoring",
      "Safety training register",
    ],
    advanced: [
      "Job safety analysis (JSA)",
      "Contractor safety compliance",
      "Lost time injury rate (LTIR) tracking",
      "Waste management records",
      "Emergency drill management",
      "Regulatory compliance tracking",
    ],
    connects: ["HR", "Maintenance", "Quality"],
  },
  {
    id: "project",
    name: "Project Management",
    category: "Phase 4 — Advanced",
    icon: FolderKanban,
    description: "End-to-end project execution with WBS hierarchy, resource allocation, Gantt charts, timesheet tracking, and budget vs actual monitoring.",
    workflow: ["Setup Project", "Define WBS", "Assign Resources", "Track Tasks", "Monitor Milestones", "Control Costs", "Report"],
    core: [
      "Project setup with WBS hierarchy",
      "Task management (Kanban + Gantt)",
      "Resource allocation & utilisation",
      "Milestone tracking with dependencies",
      "Timesheet entry & approval",
      "Budget vs actual tracking",
    ],
    advanced: [
      "Critical path highlighting",
      "Cost overrun alerts & forecasting",
      "Resource availability checking",
      "Project portfolio view",
      "Schedule variance analysis (SPI/CPI)",
      "Cross-project resource view",
    ],
    connects: ["HR", "Finance", "Inventory", "Vendor Management"],
  },
];

const USPS = [
  { number: "01", title: "Manufacturing-First, Not Adapted", desc: "Built from day one for shop floors, production lines, and supply chains. Not a generic ERP with a manufacturing add-on bolted on.", highlight: false },
  { number: "02", title: "Phased Adoption \u2014 No Big Bang", desc: "Go live in 2-month sprints. Each phase is trained, tested, and running before the next begins. Zero business disruption.", highlight: false },
  { number: "03", title: "One Data Backbone \u2014 Zero Duplication", desc: "Every module reads from and writes to the same database. An entry in procurement is instantly visible in finance, inventory, and production.", highlight: false },
  { number: "04", title: "Mobile + Offline \u2014 Works Anywhere", desc: "Shop-floor operators, security guards, and maintenance technicians work offline. Data syncs automatically when connectivity returns.", highlight: false },
  { number: "05", title: "Production-Aware CRM", desc: "The only ERP where your sales team sees live OEE, open work orders, and dispatch risk on the deal screen. Promise what you can deliver.", highlight: true },
  { number: "06", title: "Custom Module Development", desc: "Need a module that does not exist? We build it. Your requirements become product features with your timeline in mind.", highlight: false },
  { number: "07", title: "Any Feature, On Request", desc: "Competitors say \u201CThat\u2019s not on our roadmap.\u201D We say \u201CLet\u2019s scope it.\u201D Every feature request is evaluated, quoted, and built if viable.", highlight: false },
];

type CellValue = "\u2705" | "\u26A0\uFE0F" | "\u274C" | "\uD83D\uDCB2";
interface CompRow { feature: string; avy: CellValue; sap: CellValue; oracle: CellValue; salesforce: CellValue; zoho: CellValue; odoo: CellValue }

const COMPARISON: CompRow[] = [
  { feature: "Built ground-up for manufacturing", avy: "\u2705", sap: "\u274C", oracle: "\u274C", salesforce: "\u274C", zoho: "\u274C", odoo: "\u26A0\uFE0F" },
  { feature: "Phased module-by-module deployment", avy: "\u2705", sap: "\u274C", oracle: "\u26A0\uFE0F", salesforce: "\u274C", zoho: "\u26A0\uFE0F", odoo: "\u2705" },
  { feature: "Custom module development", avy: "\u2705", sap: "\uD83D\uDCB2", oracle: "\uD83D\uDCB2", salesforce: "\u274C", zoho: "\u274C", odoo: "\u26A0\uFE0F" },
  { feature: "Feature requests per client", avy: "\u2705", sap: "\u274C", oracle: "\u274C", salesforce: "\u274C", zoho: "\u274C", odoo: "\u26A0\uFE0F" },
  { feature: "Named dedicated consultant", avy: "\u2705", sap: "\uD83D\uDCB2", oracle: "\uD83D\uDCB2", salesforce: "\u274C", zoho: "\u274C", odoo: "\u274C" },
  { feature: "Mobile app with offline", avy: "\u2705", sap: "\u26A0\uFE0F", oracle: "\u26A0\uFE0F", salesforce: "\u26A0\uFE0F", zoho: "\u26A0\uFE0F", odoo: "\u26A0\uFE0F" },
  { feature: "Production-Aware CRM", avy: "\u2705", sap: "\u274C", oracle: "\u274C", salesforce: "\u274C", zoho: "\u274C", odoo: "\u274C" },
  { feature: "Indian statutory compliance built-in", avy: "\u2705", sap: "\uD83D\uDCB2", oracle: "\u26A0\uFE0F", salesforce: "\u274C", zoho: "\u2705", odoo: "\u26A0\uFE0F" },
  { feature: "Industry-specific templates", avy: "\u2705", sap: "\uD83D\uDCB2", oracle: "\u26A0\uFE0F", salesforce: "\u274C", zoho: "\u274C", odoo: "\u26A0\uFE0F" },
  { feature: "BOM & MRP integrated natively", avy: "\u2705", sap: "\u2705", oracle: "\u2705", salesforce: "\u274C", zoho: "\u26A0\uFE0F", odoo: "\u2705" },
  { feature: "Quality with CAPA, 8D, audit trails", avy: "\u2705", sap: "\uD83D\uDCB2", oracle: "\u26A0\uFE0F", salesforce: "\u274C", zoho: "\u274C", odoo: "\u26A0\uFE0F" },
  { feature: "Calibration tracking (auto-block)", avy: "\u2705", sap: "\u274C", oracle: "\u274C", salesforce: "\u274C", zoho: "\u274C", odoo: "\u274C" },
  { feature: "EHSS + Permit to Work", avy: "\u2705", sap: "\uD83D\uDCB2", oracle: "\u274C", salesforce: "\u274C", zoho: "\u274C", odoo: "\u274C" },
  { feature: "Single data backbone", avy: "\u2705", sap: "\u2705", oracle: "\u2705", salesforce: "\u274C", zoho: "\u26A0\uFE0F", odoo: "\u2705" },
  { feature: "Hypercare support post go-live", avy: "\u2705", sap: "\uD83D\uDCB2", oracle: "\uD83D\uDCB2", salesforce: "\u274C", zoho: "\u274C", odoo: "\u274C" },
  { feature: "Flexible support SLAs", avy: "\u2705", sap: "\uD83D\uDCB2", oracle: "\uD83D\uDCB2", salesforce: "\u26A0\uFE0F", zoho: "\u26A0\uFE0F", odoo: "\u26A0\uFE0F" },
  { feature: "No forced big-bang implementation", avy: "\u2705", sap: "\u274C", oracle: "\u26A0\uFE0F", salesforce: "\u2705", zoho: "\u2705", odoo: "\u2705" },
  { feature: "Transparent phased pricing", avy: "\u2705", sap: "\u274C", oracle: "\u274C", salesforce: "\u26A0\uFE0F", zoho: "\u2705", odoo: "\u2705" },
  { feature: "In-app contextual docs", avy: "\u2705", sap: "\u26A0\uFE0F", oracle: "\u26A0\uFE0F", salesforce: "\u26A0\uFE0F", zoho: "\u2705", odoo: "\u26A0\uFE0F" },
];

const INDUSTRIES = [
  { icon: Factory, name: "Discrete Manufacturing" },
  { icon: Zap, name: "Pharma & Life Sciences" },
  { icon: Layers, name: "Chemicals & Specialty" },
  { icon: Package, name: "Food & Beverage" },
  { icon: Settings, name: "Auto & Auto Ancillary" },
  { icon: Smartphone, name: "Electronics & EMS" },
  { icon: Wrench, name: "Steel Foundry & Metal" },
  { icon: Award, name: "Textiles & Apparel" },
  { icon: Target, name: "Engineering & Capital Goods" },
  { icon: RefreshCw, name: "Plastics & Rubber" },
  { icon: Heart, name: "Medical Devices" },
  { icon: TrendingUp, name: "Logistics & 3PL" },
];

const DEPLOYMENT_STEPS = [
  { step: "01", title: "Understand", desc: "Deep-dive into your processes, pain points, and goals with our domain consultants." },
  { step: "02", title: "Map & Configure", desc: "Configure masters, workflows, and approval chains to mirror your actual operations." },
  { step: "03", title: "Test & Adjust", desc: "UAT with your team. Every edge case tested. Configuration refined until it fits." },
  { step: "04", title: "Train Users", desc: "Role-specific training for operators, managers, and admins. Hands-on, not slides." },
  { step: "05", title: "Go Live", desc: "Parallel run, cutover, and hypercare support. We are there until you are confident." },
  { step: "06", title: "Autopilot", desc: "Ongoing support, quarterly reviews, and continuous improvement. We never disappear." },
];

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

export function ProductShowcaseScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrolled } = useScrollState();

  function scrollToModules() {
    const el = document.getElementById("platform-overview");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="w-full flex flex-col items-center font-inter bg-[var(--background)] text-[var(--foreground)]">

      {/* ═══════════════ LIQUID GLASS NAVBAR ═══════════════ */}
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 flex justify-center",
          "nav-outer transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
          scrolled ? "pt-3 px-4 md:px-8 pb-2" : "pt-5 px-5 md:px-10 pb-3",
        )}
      >
        <div
          className={cn(
            "liquid-glass-nav group/nav relative flex items-center justify-between w-full",
            "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
            scrolled
              ? "max-w-4xl h-11 rounded-full px-1.5 md:px-2"
              : "max-w-5xl h-14 rounded-[26px] px-2 md:px-4",
          )}
        >
          {/* Liquid glass layers */}
          <div className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden">
            <div className="absolute inset-0 bg-white/[0.45] dark:bg-neutral-950/[0.55]" />
            <div className="absolute inset-x-0 top-0 h-[55%] bg-gradient-to-b from-white/70 via-white/20 to-transparent dark:from-white/[0.12] dark:via-white/[0.03] dark:to-transparent" />
            <div className="absolute -top-4 -left-8 w-40 h-20 rounded-full bg-primary-400/[0.12] dark:bg-primary-500/[0.08] blur-2xl" />
            <div className="absolute -bottom-4 -right-8 w-36 h-16 rounded-full bg-accent-400/[0.10] dark:bg-accent-500/[0.06] blur-2xl" />
            <div className="absolute inset-0 nav-shimmer opacity-60" />
          </div>

          {/* Glass border */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{
              padding: "1px",
              background: "linear-gradient(160deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.15) 40%, rgba(139,92,246,0.12) 70%, rgba(255,255,255,0.3) 100%)",
              WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }}
          />

          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className={cn(
              "relative z-20 flex items-center flex-shrink-0 transition-all duration-500 mt-1",
              scrolled ? "pl-3 translate-y-0" : "pl-4 -translate-y-1",
            )}
          >
            <img
              src={companyLogo}
              alt="Avyren Technologies"
              className={cn(
                "object-contain drop-shadow-md transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                scrolled ? "h-16 md:h-20" : "h-20 md:h-24",
              )}
            />
          </button>

          {/* Desktop nav links */}
          <div className="relative z-10 hidden md:flex items-center gap-0.5">
            {PRODUCT_NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => link.isActive ? undefined : navigate(link.href)}
                className={cn(
                  "relative px-4 py-1.5 rounded-full text-[13px] font-semibold tracking-[-0.01em] transition-all duration-300",
                  link.isActive
                    ? "text-primary-600 dark:text-primary-400 bg-primary-50/60 dark:bg-primary-950/30"
                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/[0.07]",
                )}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Right: Back + Sign In + mobile toggle */}
          <div className="relative z-10 flex items-center gap-2">
            <button
              onClick={() => navigate("/")}
              className={cn(
                "hidden sm:flex items-center gap-1.5 rounded-full font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/[0.07] transition-all duration-300",
                scrolled ? "px-3 py-1 text-[11px]" : "px-4 py-1.5 text-[13px]",
              )}
            >
              <ArrowLeft className={cn(scrolled ? "w-3 h-3" : "w-3.5 h-3.5")} />
              Back to Home
            </button>

            <button
              onClick={() => navigate("/login")}
              className={cn(
                "nav-cta group relative inline-flex items-center gap-1.5 rounded-full font-semibold overflow-hidden transition-all duration-500",
                scrolled ? "px-3.5 py-[5px] text-[11px]" : "px-4 py-[7px] text-[13px]",
              )}
            >
              <div className="absolute inset-0 rounded-full bg-neutral-900/90 dark:bg-white/90 transition-opacity duration-500" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-600 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              <span className="relative text-white dark:text-neutral-900 group-hover:text-white dark:group-hover:text-white tracking-[-0.01em]">Sign In</span>
              <ArrowRight className={cn(
                "relative text-white dark:text-neutral-900 group-hover:text-white dark:group-hover:text-white group-hover:translate-x-0.5 transition-all",
                scrolled ? "w-3 h-3" : "w-3.5 h-3.5",
              )} />
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-full text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/[0.07] transition-all"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

          {/* Mobile dropdown */}
          <div
            className={cn(
              "absolute top-[calc(100%+8px)] left-2 right-2 md:hidden overflow-hidden",
              "transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
              mobileMenuOpen ? "max-h-64 opacity-100 scale-100" : "max-h-0 opacity-0 scale-[0.97]",
            )}
          >
            <div className="liquid-glass-dropdown p-2 rounded-2xl">
              <div className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden">
                <div className="absolute inset-0 bg-white/50 dark:bg-neutral-950/60" />
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent dark:from-white/10 dark:to-transparent" />
              </div>
              <div
                className="pointer-events-none absolute inset-0 rounded-[inherit]"
                style={{
                  padding: "1px",
                  background: "linear-gradient(160deg, rgba(255,255,255,0.6), rgba(255,255,255,0.1) 50%, rgba(139,92,246,0.08) 100%)",
                  WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                }}
              />
              {PRODUCT_NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  onClick={() => {
                    if (!link.isActive) navigate(link.href);
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    "relative z-10 w-full text-left px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-colors",
                    link.isActive
                      ? "text-primary-600 dark:text-primary-400 bg-primary-50/40 dark:bg-primary-950/20"
                      : "text-neutral-600 dark:text-neutral-300 hover:bg-white/40 dark:hover:bg-white/[0.06] hover:text-neutral-900 dark:hover:text-white",
                  )}
                >
                  {link.label}
                </button>
              ))}
              <button
                onClick={() => { navigate("/"); setMobileMenuOpen(false); }}
                className="relative z-10 w-full text-left px-4 py-2.5 rounded-xl text-[13px] font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-white/40 dark:hover:bg-white/[0.06] hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══════════════ SECTION 1: PRODUCT HERO ═══════════════ */}
      <section className="relative w-full overflow-hidden">
        <div className="absolute inset-0 dot-grid text-neutral-300/50 dark:text-neutral-700/30 pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary-400/15 dark:bg-primary-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-accent-400/15 dark:bg-accent-600/10 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-32 md:pt-40 pb-16 md:pb-24 text-center">
          {/* Status badge */}
          <div className="hero-stagger-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50/80 dark:bg-primary-950/40 border border-primary-200/50 dark:border-primary-800/30 mb-6">
            <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
            <span className="text-xs font-semibold text-primary-700 dark:text-primary-300 font-inter">
              Manufacturing ERP — Built for Industrial Enterprises
            </span>
          </div>

          {/* Headline */}
          <h1 className="hero-stagger-3 text-[2.5rem] md:text-[3.5rem] lg:text-[4rem] font-black leading-[1.05] tracking-tight text-neutral-900 dark:text-white mb-5">
            One Platform. Every Operation.{" "}
            <br className="hidden md:block" />
            <GradientHeadline>Zero Compromise.</GradientHeadline>
          </h1>

          {/* Subheadline */}
          <p className="hero-stagger-4 text-lg md:text-xl text-neutral-500 dark:text-neutral-400 leading-relaxed mb-8 max-w-2xl mx-auto">
            Real-time visibility across every department. End-to-end traceability from raw material to dispatch.
            Modular growth that matches your pace — not ours.
          </p>

          {/* Stats */}
          <div className="hero-stagger-5 flex flex-wrap justify-center gap-6 md:gap-0 md:divide-x md:divide-neutral-200 dark:md:divide-neutral-800 mb-10">
            {HERO_STATS.map((s, i) => {
              const { count, ref } = useCountUp(s.value, 1800, 300 + i * 150);
              return (
                <div key={s.label} ref={ref} className="flex flex-col items-center px-5 md:px-8">
                  <span className="text-2xl md:text-3xl font-black tracking-tight text-neutral-900 dark:text-white stat-glow">
                    {count}{s.suffix}
                  </span>
                  <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.15em] mt-1.5">
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* CTAs */}
          <div className="hero-stagger-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => window.open("mailto:support@avyrentechnologies.com?subject=Live%20Demo%20Request", "_blank")}
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-bold text-base shadow-2xl shadow-neutral-900/20 dark:shadow-black/30 overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-accent-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative group-hover:text-white">Request a Live Demo</span>
              <ArrowRight className="relative w-4 h-4 group-hover:translate-x-1 group-hover:text-white transition-all" />
            </button>
            <button
              onClick={scrollToModules}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700 hover:text-primary-600 dark:hover:text-primary-400 transition-all"
            >
              Explore All Modules
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════ SECTION 2: THE PROBLEM WE SOLVE ═══════════════ */}
      <Section id="problem">
        <SectionEyebrow label="The Problem" />
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-4 text-center max-w-3xl mx-auto">
          Running on disconnected systems is costing you more than you{" "}
          <GradientHeadline>realise.</GradientHeadline>
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-center mb-12 max-w-xl mx-auto">
          Most manufacturers operate with a patchwork of tools that do not talk to each other.
        </p>
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {PROBLEMS.map((p) => (
            <GlassCard key={p.title} className="p-6">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", p.bg)}>
                <p.icon className={cn("w-6 h-6", p.color)} />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2 font-inter">{p.title}</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{p.desc}</p>
            </GlassCard>
          ))}
        </div>
        <blockquote className="text-center max-w-2xl mx-auto">
          <p className="text-lg italic text-neutral-600 dark:text-neutral-300 leading-relaxed">
            &ldquo;If your finance team and production team cannot agree on what was manufactured yesterday,
            you do not have an information problem — you have a systems problem.&rdquo;
          </p>
        </blockquote>
      </Section>

      {/* ═══════════════ SECTION 3: PLATFORM OVERVIEW ═══════════════ */}
      <Section id="platform-overview" dark>
        <SectionEyebrow label="Platform Overview" />
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-4 text-center">
          One backbone. 16 modules. <GradientHeadline>Fully integrated.</GradientHeadline>
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-center mb-12 max-w-xl mx-auto">
          Every module shares a single data layer. An entry in one module is instantly visible across the platform.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {PLATFORM_MODULES.map((m) => (
            <GlassCard key={m.name} className="p-4 text-center group hover:shadow-lg hover:shadow-primary-500/10 dark:hover:shadow-primary-500/5">
              <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-primary-500/10 to-accent-500/10 dark:from-primary-500/20 dark:to-accent-500/20 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:shadow-md group-hover:shadow-primary-400/20 transition-all duration-300">
                <m.icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1 font-inter">{m.name}</h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-2">{m.desc}</p>
              <span className={cn("inline-block text-[10px] font-bold px-2 py-0.5 rounded-full", m.phaseColor)}>
                {m.phase}
              </span>
            </GlassCard>
          ))}
        </div>
        {/* Master Data Flow — radial hub design */}
        <div className="relative w-full max-w-4xl mx-auto">
          {/* Central hub */}
          <div className="flex flex-col items-center mb-10 relative z-10">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center shadow-xl shadow-primary-500/25 data-node z-20">
                <Layers className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -inset-4 rounded-[2rem] border-2 border-primary-300/30 dark:border-primary-700/20 animate-pulse z-10" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 mt-5 font-inter bg-[var(--background)] px-2 z-20">Single Data Backbone</p>
          </div>

          {/* Connectors container */}
          <div className="absolute top-[40px] left-0 right-0 h-1/2 flex justify-center z-0 pointer-events-none">
             {/* Horizontal main bus (hidden on mobile, visible on md) */}
             <div className="hidden md:block absolute top-[60px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-transparent via-primary-300 dark:via-primary-700 to-transparent opacity-50" />
          </div>

          {/* Master nodes fanning out */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 px-4 md:px-0">
            {[
              { name: "Employee", icon: Users },
              { name: "Item", icon: Package },
              { name: "Vendor", icon: ClipboardList },
              { name: "Customer", icon: Heart },
              { name: "Machine", icon: Factory },
              { name: "Accounts", icon: BarChart3 },
            ].map((node) => (
              <div key={node.name} className="flex flex-col items-center relative group pt-6 md:pt-0">
                {/* Vertical drop line to node */}
                <div className="absolute top-0 md:-top-[26px] left-1/2 -mt-4 md:mt-0 w-[2px] h-10 md:h-[26px] bg-gradient-to-b from-primary-300 dark:from-primary-700 to-primary-100 dark:to-primary-900 opacity-50" />
                
                <div className="data-node flex flex-col items-center gap-2 px-4 py-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-700/80 shadow-md hover:shadow-xl hover:border-primary-400 dark:hover:border-primary-500 transition-all duration-300 w-full relative z-20 hover:-translate-y-1">
                  <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-1 group-hover:bg-primary-100 dark:group-hover:bg-primary-800/50 transition-colors">
                     <node.icon className="w-4 h-4 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-[13px] font-bold text-neutral-800 dark:text-neutral-200 font-inter text-center leading-tight">{node.name}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm font-medium text-neutral-500 dark:text-neutral-400 mt-10">
            All masters are shared across modules — create once, use everywhere.
          </p>
        </div>
      </Section>

      {/* ═══════════════ SECTION 4: PHASED ADOPTION ═══════════════ */}
      <Section id="phased-adoption">
        <SectionEyebrow label="Implementation" />
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-4 text-center">
          4 Phases. 2 Months Each. <GradientHeadline>Live and trained before the next starts.</GradientHeadline>
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-center mb-12 max-w-xl mx-auto">
          No big-bang go-live. Each phase is implemented, tested, and operational before the next one begins.
        </p>
        <div className="relative grid md:grid-cols-4 gap-6 mb-16 mt-8">
          {/* Colorful animated connector line — aligned to center of the phase number circles */}
          <div className="hidden md:block absolute z-0" style={{ top: "48px", transform: "translateY(-50%)", left: "12.5%", right: "12.5%" }}>
            <div className="w-full animated-dash-x opacity-60 dark:opacity-40 text-primary-500" style={{ height: '3px' }} />
          </div>
          {PHASES.map((phase) => (
            <GlassCard key={phase.number} className="relative z-10 p-6 border-t-0">
              <div className={cn("inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br text-white font-black text-lg mb-4 shadow-lg", phase.color)}>
                {phase.number}
              </div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-1 font-inter">{phase.title}</h3>
              <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-3">{phase.timeline}</p>
              <div className="space-y-1.5 mb-4">
                {phase.modules.map((m) => (
                  <div key={m} className="text-xs text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-primary-500 flex-shrink-0" />
                    {m}
                  </div>
                ))}
              </div>
              <div className="border-t border-neutral-200/50 dark:border-neutral-700/50 pt-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1.5">Outcomes</p>
                {phase.outcomes.map((o) => (
                  <div key={o} className="text-[11px] text-success-600 dark:text-success-400 flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3 flex-shrink-0" />
                    {o}
                  </div>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
        <div className="flex justify-center mt-6">
          <div className="relative group cursor-default">
            {/* Ambient glow behind the badge */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 via-accent-500 to-primary-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition duration-500" />
            
            <div className="relative flex items-center gap-4 px-8 py-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-950/50 flex-shrink-0">
                <Clock className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-0.5">Deployment Timeline</span>
                <span className="text-xl md:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">8 Months <span className="font-medium text-neutral-400 dark:text-neutral-500 text-lg">to Full Enterprise ERP</span></span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══════════════ SECTION 5: MODULE DEEP-DIVES ═══════════════ */}
      <Section id="module-deep-dives" dark>
        <SectionEyebrow label="Deep Dives" />
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-4 text-center">
          Every module. <GradientHeadline>Every detail.</GradientHeadline>
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-center mb-10 max-w-xl mx-auto">
          Explore each module's workflow, capabilities, and integrations.
        </p>

        {/* ── Module selector tabs (OUTSIDE the container) ── */}
        <div className="w-full max-w-5xl mx-auto mb-6">
          <div className="flex flex-wrap justify-center gap-2">
            {MODULE_DEEP_DIVES.map((mod, i) => (
              <button
                key={mod.id}
                onClick={() => setActiveTab(i)}
                className={cn(
                  "group flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all duration-300 font-inter border",
                  activeTab === i
                    ? "bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/25 scale-[1.02]"
                    : "bg-white/70 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-400 border-neutral-200/60 dark:border-neutral-700/40 hover:border-primary-300 dark:hover:border-primary-600 hover:text-primary-600 dark:hover:text-primary-400 hover:shadow-md",
                )}
              >
                <mod.icon className={cn("w-4 h-4", activeTab === i ? "text-white" : "text-neutral-400 dark:text-neutral-500 group-hover:text-primary-500")} />
                {mod.name}
              </button>
            ))}
          </div>
        </div>

        {/* ── macOS App Container (fixed size) ── */}
        {(() => {
          const mod = MODULE_DEEP_DIVES[activeTab];
          return (
            <div className="w-full max-w-5xl mx-auto rounded-2xl shadow-2xl shadow-neutral-900/10 dark:shadow-black/40 border border-neutral-200/60 dark:border-neutral-700/40 overflow-hidden">
              {/* macOS Title Bar */}
              <div className="bg-gradient-to-b from-neutral-100 to-neutral-50 dark:from-neutral-800 dark:to-neutral-850 backdrop-blur-sm px-5 py-2.5 flex items-center gap-4 border-b border-neutral-200/50 dark:border-neutral-700/50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#FF5F57" }} />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#FFBD2E" }} />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#27C93F" }} />
                </div>
                <div className="flex-1 flex justify-center">
                  <span className="text-[12px] font-semibold text-neutral-500 dark:text-neutral-400 font-inter">{mod.name} — Avy ERP</span>
                </div>
                <div className="w-[52px]" />
              </div>

              {/* Content area — strictly fixed height */}
              <div className="relative bg-white dark:bg-neutral-900 h-[640px] md:h-[720px] overflow-y-auto">
                <div
                  key={mod.id}
                  className="p-6 md:p-8"
                  style={{ animation: "hero-fade-in 0.35s ease-out" }}
                >
                  {/* Module header */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
                      <mod.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 dark:text-white font-inter leading-tight">{mod.name}</h3>
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary-600 dark:text-primary-400">{mod.category}</span>
                    </div>
                  </div>

                  <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed mb-6 max-w-3xl">{mod.description}</p>

                  {/* CRM Exclusive callout */}
                  {mod.exclusive && (
                    <div className="mb-6 px-5 py-4 rounded-xl bg-gradient-to-r from-accent-50/80 to-primary-50/60 dark:from-accent-950/40 dark:to-primary-950/30 border border-accent-300/50 dark:border-accent-700/30 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center flex-shrink-0 shadow-md">
                          <Star className="w-4.5 h-4.5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-accent-700 dark:text-accent-300 font-inter mb-0.5">Production-Aware CRM (Avy ERP Exclusive)</p>
                          <p className="text-xs text-accent-600/80 dark:text-accent-400/80 leading-relaxed">{mod.exclusive}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Workflow pipeline with flowing connectors ── */}
                  <div className="mb-7">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-200 dark:via-neutral-700 to-transparent" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-500 font-inter px-2">Workflow</span>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-200 dark:via-neutral-700 to-transparent" />
                    </div>
                    {/* Row 1 of workflow — first 4 steps */}
                    <div className="flex flex-wrap items-center gap-y-3 py-2">
                      {mod.workflow.map((step, i) => (
                        <React.Fragment key={step}>
                          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-br from-white to-neutral-50/80 dark:from-neutral-800 dark:to-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/50 shadow-sm hover:shadow-md hover:border-primary-300/60 dark:hover:border-primary-700/50 transition-all duration-300">
                            <span className="flex items-center justify-center w-5 h-5 rounded-md bg-primary-500/10 dark:bg-primary-500/20 text-[9px] font-black text-primary-600 dark:text-primary-400">{String(i + 1).padStart(2, "0")}</span>
                            <span className="text-[12px] font-semibold text-neutral-800 dark:text-neutral-200 font-inter whitespace-nowrap">{step}</span>
                          </div>
                          {i < mod.workflow.length - 1 && (
                            <div className="w-8 h-0 flex items-center flex-shrink-0 mx-0.5">
                              <div className="workflow-connector w-full rounded-full" />
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Capabilities grid */}
                  <div className="grid md:grid-cols-2 gap-5 mb-6">
                    <div className="rounded-xl border border-neutral-200/60 dark:border-neutral-700/40 p-5 bg-white/60 dark:bg-neutral-800/30">
                      <p className="text-xs font-bold text-neutral-900 dark:text-white mb-3 font-inter flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-success-500" />
                        Core Capabilities
                      </p>
                      <ul className="space-y-2.5">
                        {mod.core.map((c) => (
                          <li key={c} className="flex items-start gap-2.5 text-[13px] text-neutral-600 dark:text-neutral-300 leading-snug">
                            <div className="w-1.5 h-1.5 rounded-full bg-success-500 mt-1.5 flex-shrink-0" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-neutral-200/60 dark:border-neutral-700/40 p-5 bg-white/60 dark:bg-neutral-800/30">
                      <p className="text-xs font-bold text-neutral-900 dark:text-white mb-3 font-inter flex items-center gap-2">
                        <Star className="w-3.5 h-3.5 text-accent-500" />
                        Advanced Features
                      </p>
                      <ul className="space-y-2.5">
                        {mod.advanced.map((a) => (
                          <li key={a} className="flex items-start gap-2.5 text-[13px] text-neutral-600 dark:text-neutral-300 leading-snug">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent-500 mt-1.5 flex-shrink-0" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Integrations */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-5 border-t border-neutral-200/50 dark:border-neutral-700/50">
                    <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 font-inter">Connects to:</span>
                    {mod.connects.map((c) => (
                      <span key={c} className="text-xs px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200/50 dark:border-primary-800/30 font-semibold">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </Section>

      {/* ═══════════════ SECTION 6: USPs ═══════════════ */}
      <Section id="usps">
        <SectionEyebrow label="Why Avy ERP" />
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-4 text-center">
          5 things no other ERP will <GradientHeadline>do for you.</GradientHeadline>
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-center mb-12 max-w-xl mx-auto">
          These are not incremental improvements. They are fundamental differentiators.
        </p>
        <div className="space-y-4 max-w-3xl mx-auto">
          {USPS.map((usp) => (
            <GlassCard
              key={usp.number}
              className={cn(
                "p-6",
                usp.highlight && "border-accent-300/60 dark:border-accent-700/60 bg-gradient-to-r from-accent-50/40 to-primary-50/40 dark:from-accent-950/30 dark:to-primary-950/30",
              )}
            >
              <div className="flex items-start gap-5">
                <span className={cn(
                  "text-4xl md:text-5xl font-black tracking-tighter flex-shrink-0 leading-none",
                  usp.highlight
                    ? "text-transparent bg-clip-text bg-gradient-to-br from-accent-500 to-primary-500"
                    : "text-transparent bg-clip-text bg-gradient-to-b from-neutral-300 to-neutral-200 dark:from-neutral-700 dark:to-neutral-800",
                )}>
                  {usp.number}
                </span>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-1 font-inter flex items-center gap-2">
                    {usp.title}
                    {usp.highlight && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300">
                        Avy ERP Exclusive
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{usp.desc}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </Section>

      {/* ═══════════════ SECTION 7: COMPETITOR COMPARISON ═══════════════ */}
      <Section id="comparison" dark>
        <SectionEyebrow label="Comparison" />
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-4 text-center">
          Built for manufacturers. <GradientHeadline>Not retrofitted. Not restricted.</GradientHeadline>
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-center mb-8 max-w-xl mx-auto">
          See how Avy ERP compares to the alternatives on features that matter to manufacturers.
        </p>
        <div className="overflow-x-auto -mx-6 px-6 pb-4">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-neutral-200/50 dark:border-neutral-700/50">
                <th className="text-left py-3 px-3 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-inter">Feature</th>
                <th className="py-3 px-3 text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-500 dark:from-primary-400 dark:to-accent-400 uppercase tracking-wider font-inter bg-gradient-to-b from-primary-50/80 to-accent-50/40 dark:from-primary-950/30 dark:to-accent-950/20 rounded-t-lg">Avy ERP</th>
                <th className="py-3 px-3 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-inter">SAP S/4HANA</th>
                <th className="py-3 px-3 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-inter">Oracle NetSuite</th>
                <th className="py-3 px-3 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-inter">Salesforce MFG</th>
                <th className="py-3 px-3 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-inter">Zoho ERP</th>
                <th className="py-3 px-3 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-inter">Odoo</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, i) => (
                <tr key={row.feature} className={cn(
                  "border-b border-neutral-100/50 dark:border-neutral-800/50 transition-colors",
                  i % 2 === 0 ? "bg-white/30 dark:bg-neutral-900/30" : "",
                )}>
                  <td className="py-2.5 px-3 text-xs font-medium text-neutral-700 dark:text-neutral-300 font-inter">{row.feature}</td>
                  <td className="py-2.5 px-3 text-center bg-gradient-to-b from-primary-50/40 to-accent-50/20 dark:from-primary-950/15 dark:to-accent-950/10 text-base">{row.avy}</td>
                  <td className="py-2.5 px-3 text-center text-base">{row.sap}</td>
                  <td className="py-2.5 px-3 text-center text-base">{row.oracle}</td>
                  <td className="py-2.5 px-3 text-center text-base">{row.salesforce}</td>
                  <td className="py-2.5 px-3 text-center text-base">{row.zoho}</td>
                  <td className="py-2.5 px-3 text-center text-base">{row.odoo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="flex items-center gap-1.5">{"\u2705"} Built-in</span>
          <span className="flex items-center gap-1.5">{"\u26A0\uFE0F"} Partial / Add-on</span>
          <span className="flex items-center gap-1.5">{"\u274C"} Not available</span>
          <span className="flex items-center gap-1.5">{"\uD83D\uDCB2"} Available at extra cost</span>
        </div>
        <p className="text-[10px] text-neutral-400 dark:text-neutral-600 text-center mt-4 max-w-xl mx-auto">
          Disclaimer: Comparison based on publicly available information as of April 2026. Feature availability may vary by edition, region, and licensing tier.
        </p>
      </Section>

      {/* ═══════════════ SECTION 8: FLEXIBILITY ═══════════════ */}
      <Section id="flexibility">
        <SectionEyebrow label="Flexibility" />
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-4 text-center">
          We don't sell software. We solve your <GradientHeadline>operations problem.</GradientHeadline>
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-center mb-12 max-w-xl mx-auto">
          SAP, Oracle, and Zoho sell you licenses. We partner with you to fix what is broken.
        </p>
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <GlassCard className="p-6">
            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center mb-4">
              <Headphones className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2 font-inter">Flexible Support Plans</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Choose from standard, priority, or dedicated support tiers. SLAs that match your operational rhythm, not a one-size-fits-all contract.
            </p>
          </GlassCard>
          <GlassCard className="p-6">
            <div className="w-10 h-10 rounded-xl bg-accent-50 dark:bg-accent-950/40 flex items-center justify-center mb-4">
              <Settings className="w-5 h-5 text-accent-600 dark:text-accent-400" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2 font-inter">Customised Module Configuration</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Every module is configured to your processes — your approval chains, your document templates, your numbering series. No two deployments are the same.
            </p>
          </GlassCard>
          <GlassCard className="p-6">
            <div className="w-10 h-10 rounded-xl bg-success-50 dark:bg-success-950/40 flex items-center justify-center mb-4">
              <Layers className="w-5 h-5 text-success-600 dark:text-success-400" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2 font-inter">Custom Module Development</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Need something that does not exist? We scope it, quote it, and build it. Your unique requirement becomes a first-class module in the platform.
            </p>
          </GlassCard>
        </div>
        {/* On Request vs Standard */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <GlassCard className="p-6 border-danger-200/50 dark:border-danger-800/30" hover={false}>
            <p className="text-xs font-bold text-danger-500 uppercase tracking-wider mb-2 font-inter">Competitors say</p>
            <p className="text-lg font-bold text-neutral-900 dark:text-white italic font-inter">
              &ldquo;That&rsquo;s not on our roadmap.&rdquo;
            </p>
          </GlassCard>
          <GlassCard className="p-6 border-success-200/50 dark:border-success-800/30 bg-success-50/30 dark:bg-success-950/20" hover={false}>
            <p className="text-xs font-bold text-success-500 uppercase tracking-wider mb-2 font-inter">Avyren says</p>
            <p className="text-lg font-bold text-neutral-900 dark:text-white italic font-inter">
              &ldquo;Let&rsquo;s scope it. We&rsquo;ll build it.&rdquo;
            </p>
          </GlassCard>
        </div>
      </Section>

      {/* ═══════════════ SECTION 9: DEPLOYMENT PHILOSOPHY ═══════════════ */}
      <Section id="deployment" dark>
        <SectionEyebrow label="Deployment" />
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-4 text-center max-w-3xl mx-auto">
          We don't hurry. We don't implement all at once and <GradientHeadline>create chaos.</GradientHeadline>
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-center mb-12 max-w-xl mx-auto">
          Our 6-step deployment methodology ensures every phase is stable before we move to the next.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {DEPLOYMENT_STEPS.map((s, i) => (
            <GlassCard key={s.step} className="p-4 text-center">
              <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary-500 to-accent-500 mb-2">
                {s.step}
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1.5 font-inter">{s.title}</h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">{s.desc}</p>
            </GlassCard>
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <GlassCard className="p-5 text-center" hover={false}>
            <Users className="w-6 h-6 text-primary-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-1 font-inter">Dedicated Consultant</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">A named consultant who knows your business, not a rotating helpdesk agent.</p>
          </GlassCard>
          <GlassCard className="p-5 text-center" hover={false}>
            <RefreshCw className="w-6 h-6 text-accent-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-1 font-inter">Parallel Run</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Old and new systems run side-by-side until you are confident in the switch.</p>
          </GlassCard>
          <GlassCard className="p-5 text-center" hover={false}>
            <ShieldCheck className="w-6 h-6 text-success-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-1 font-inter">Hypercare Period</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Extended support after go-live with priority SLAs and daily check-ins.</p>
          </GlassCard>
        </div>
      </Section>

      {/* ═══════════════ SECTION 10: INDUSTRIES SERVED ═══════════════ */}
      <Section id="industries">
        <SectionEyebrow label="Industries" />
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-4 text-center">
          Built for the complexity of manufacturing. <GradientHeadline>Ready for your industry.</GradientHeadline>
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-center mb-12 max-w-xl mx-auto">
          Pre-configured templates for 14 manufacturing verticals, with industry-specific workflows and compliance requirements.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
          {INDUSTRIES.map((ind) => (
            <GlassCard key={ind.name} className="p-5 text-center group">
              <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-primary-500/10 to-accent-500/10 dark:from-primary-500/20 dark:to-accent-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ind.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white font-inter">{ind.name}</h3>
            </GlassCard>
          ))}
        </div>
        <GlassCard className="p-5 text-center max-w-2xl mx-auto" hover={false}>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Each template includes <span className="font-bold text-neutral-900 dark:text-white">pre-configured masters, approval chains, document formats, and compliance checklists</span> specific to your industry.
            Start with a template. Customise to fit.
          </p>
        </GlassCard>
      </Section>

      {/* ═══════════════ SECTION 11: SUPPORT & SUCCESS ═══════════════ */}
      <Section id="support" dark>
        <SectionEyebrow label="Support" />
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-4 text-center">
          We don't disappear <GradientHeadline>after go-live.</GradientHeadline>
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-center mb-12 max-w-xl mx-auto">
          Implementation is only the beginning. Our support ensures you get lasting value from every module.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <GlassCard className="p-6 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-2 font-inter">Dedicated Consultant</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              A named consultant assigned to your company. They know your setup, your team, and your pain points.
            </p>
          </GlassCard>
          <GlassCard className="p-6 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-accent-50 dark:bg-accent-950/40 flex items-center justify-center mb-4">
              <Headphones className="w-6 h-6 text-accent-600 dark:text-accent-400" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-2 font-inter">Helpdesk with SLAs</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              In-app ticket system with defined response and resolution times. Escalation paths that actually work.
            </p>
          </GlassCard>
          <GlassCard className="p-6 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-success-50 dark:bg-success-950/40 flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-2 font-inter">In-App Documentation</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Contextual help on every screen. Users find answers without leaving the app or calling support.
            </p>
          </GlassCard>
          <GlassCard className="p-6 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-info-50 dark:bg-info-950/40 flex items-center justify-center mb-4">
              <RefreshCw className="w-6 h-6 text-info-600 dark:text-info-400" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-2 font-inter">Regular Product Updates</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Continuous improvement with quarterly releases. New features, bug fixes, and compliance updates included.
            </p>
          </GlassCard>
        </div>
        <GlassCard className="p-5 text-center max-w-xl mx-auto" hover={false}>
          <div className="flex items-center justify-center gap-3">
            <Smartphone className="w-5 h-5 text-primary-500" />
            <p className="text-sm font-semibold text-neutral-900 dark:text-white font-inter">
              Full mobile app support — your team stays productive from the shop floor to the field.
            </p>
          </div>
        </GlassCard>
      </Section>

      {/* ═══════════════ SECTION 12: CALL TO ACTION ═══════════════ */}
      <section className="relative w-full overflow-hidden">
        <div className="absolute inset-0 dot-grid text-neutral-300/50 dark:text-neutral-700/30 pointer-events-none" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary-400/15 dark:bg-primary-600/10 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 py-20 md:py-28 text-center">
          <SectionEyebrow label="Get Started" />
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-6">
            Ready to see Avy ERP <GradientHeadline>in action?</GradientHeadline>
          </h2>

          <div className="grid md:grid-cols-3 gap-4 mb-12">
            {[
              { step: "1", title: "Live Demo", desc: "45-minute walkthrough of the modules relevant to your operations." },
              { step: "2", title: "Discovery Workshop", desc: "Half-day workshop to map your processes and identify quick wins." },
              { step: "3", title: "Tailored Proposal", desc: "Phased implementation plan with transparent pricing and timelines." },
            ].map((s) => (
              <GlassCard key={s.step} className="p-5 text-center">
                <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm mb-3">
                  {s.step}
                </div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1 font-inter">{s.title}</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{s.desc}</p>
              </GlassCard>
            ))}
          </div>

          <button
            onClick={() => window.open("mailto:support@avyrentechnologies.com?subject=Live%20Demo%20Request", "_blank")}
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-bold text-base shadow-2xl shadow-neutral-900/20 dark:shadow-black/30 overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] mb-10"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-accent-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="relative group-hover:text-white">Request a Live Demo</span>
            <ArrowRight className="relative w-4 h-4 group-hover:translate-x-1 group-hover:text-white transition-all" />
          </button>

          <div className="space-y-2 mb-8">
            <p className="text-sm font-bold text-neutral-900 dark:text-white font-inter">Avyren Technologies</p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
              <a href="https://www.avyrentechnologies.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <Globe className="w-3.5 h-3.5" />
                www.avyrentechnologies.com
              </a>
              <a href="mailto:support@avyrentechnologies.com" className="flex items-center gap-1.5 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <Mail className="w-3.5 h-3.5" />
                support@avyrentechnologies.com
              </a>
            </div>
          </div>

          <div className="border-t border-neutral-200/50 dark:border-neutral-700/50 pt-6 space-y-3">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center justify-center gap-1.5 font-inter">
              Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> for the makers of the world
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-600 font-inter">
              &copy; {new Date().getFullYear()} Avyren Technologies. All rights reserved.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SECTION WRAPPER
   ═══════════════════════════════════════════════════════ */

function Section({ children, id, dark }: { children: React.ReactNode; id: string; dark?: boolean }) {
  const { ref, inView } = useInView(0.05);
  return (
    <section
      id={id}
      ref={ref}
      className={cn(
        "relative w-full transition-all duration-700",
        dark ? "bg-neutral-50/50 dark:bg-neutral-950/50" : "",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
      )}
    >
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 flex flex-col items-center">
        {children}
      </div>
    </section>
  );
}
