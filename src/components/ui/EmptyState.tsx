import { Inbox, Search, AlertCircle, FileText } from 'lucide-react';

interface EmptyStateProps {
  icon?: 'search' | 'list' | 'error' | 'inbox';
  title: string;
  message?: string;
  action?: { label: string; onClick: () => void };
}

const icons = {
  search: Search,
  list: FileText,
  error: AlertCircle,
  inbox: Inbox,
};

export function EmptyState({ icon = 'list', title, message, action }: EmptyStateProps) {
  const Icon = icons[icon];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: 12 }}>
      <Icon size={48} style={{ color: '#cbd5e1' }} />
      <p style={{ fontSize: 16, fontWeight: 600, color: '#475569', margin: 0 }}>{title}</p>
      {message && <p style={{ fontSize: 14, color: '#94a3b8', margin: 0, maxWidth: 320, textAlign: 'center' }}>{message}</p>}
      {action && (
        <button
          onClick={action.onClick}
          style={{ marginTop: 8, padding: '8px 20px', backgroundColor: '#4F46E5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
