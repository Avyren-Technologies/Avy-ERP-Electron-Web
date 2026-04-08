import { useFileUrl } from '@/hooks/useFileUrl';

interface R2LinkProps {
  fileKey: string | null | undefined;
  platform?: boolean;
  children: React.ReactNode;
  className?: string;
  download?: string;
  title?: string;
}

export function R2Link({ fileKey, platform, children, className, download, title }: R2LinkProps) {
  const { url, isLoading } = useFileUrl({ key: fileKey, platform });

  if (!fileKey || isLoading || !url) {
    return <span className={className}>{children}</span>;
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className} download={download} title={title}>
      {children}
    </a>
  );
}
