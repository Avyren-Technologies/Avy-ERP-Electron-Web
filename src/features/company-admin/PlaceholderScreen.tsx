import { useLocation } from 'react-router-dom';

export function PlaceholderScreen() {
  const location = useLocation();
  const name = location.pathname.split('/').pop() || 'Screen';
  const title = name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
        <p className="text-sm text-neutral-500 mt-1">Coming soon...</p>
      </div>
    </div>
  );
}
