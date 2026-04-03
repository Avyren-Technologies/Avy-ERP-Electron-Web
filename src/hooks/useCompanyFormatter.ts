import { useMemo } from 'react';
import { useCompanySettings } from '@/features/company-admin/api/use-company-admin-queries';
import {
  coerceCompanyDateFormat,
  createCompanyFormatter,
  DEFAULT_FORMAT_SETTINGS,
  type CompanyFormatter,
  type CompanyFormatSettings,
} from '@/lib/format/company-formatter';

export function useCompanyFormatter(): CompanyFormatter {
  const { data } = useCompanySettings();
  const raw = data?.data;

  const settings: CompanyFormatSettings = useMemo(() => ({
    dateFormat: coerceCompanyDateFormat(raw?.dateFormat),
    timeFormat: raw?.timeFormat ?? DEFAULT_FORMAT_SETTINGS.timeFormat,
    timezone: raw?.timezone ?? DEFAULT_FORMAT_SETTINGS.timezone,
  }), [raw?.dateFormat, raw?.timeFormat, raw?.timezone]);

  return useMemo(() => createCompanyFormatter(settings), [settings]);
}
