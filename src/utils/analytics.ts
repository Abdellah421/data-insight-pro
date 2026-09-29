/**
 * DataInsight Pro Analytics Abstraction
 * Privacy-friendly event tracking without sending sensitive dataset content.
 */

export type AnalyticsEvent =
  | 'landing_page_view'
  | 'analyze_data_clicked'
  | 'csv_uploaded'
  | 'excel_uploaded'
  | 'json_uploaded'
  | 'analysis_completed'
  | 'tool_page_viewed'
  | 'export_clicked'
  | 'pdf_generated';

interface EventProperties {
  format?: string;
  rowCount?: number;
  columnCount?: number;
  toolName?: string;
  exportType?: string;
  [key: string]: any;
}

export function trackEvent(event: AnalyticsEvent, properties?: EventProperties): void {
  // In development / privacy mode, log events safely without sensitive data payload
  if (import.meta.env.DEV) {
    console.log(`[Analytics Event] ${event}`, properties || {});
  }

  // Future integration point for privacy-compliant analytics (e.g. Plausible / Google Analytics)
  // NEVER attach raw dataset rows or user data
}
