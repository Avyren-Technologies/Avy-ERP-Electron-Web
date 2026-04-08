import { useFileUrl } from '@/hooks/useFileUrl';

interface R2ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fileKey: string | null | undefined;
  platform?: boolean;
  fallback?: React.ReactNode;
}

export function R2Image({ fileKey, platform, fallback, alt, ...imgProps }: R2ImageProps) {
  const { url, isLoading } = useFileUrl({ key: fileKey, platform });

  if (!fileKey) return fallback ? <>{fallback}</> : null;
  if (isLoading) return fallback ? <>{fallback}</> : null;
  if (!url) return fallback ? <>{fallback}</> : null;

  return <img src={url} alt={alt} {...imgProps} />;
}
