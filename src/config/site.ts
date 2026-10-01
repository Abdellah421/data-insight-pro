const fallbackSiteUrl = 'https://datainsightpro.com';

export const SITE_URL = String(import.meta.env.VITE_SITE_URL || fallbackSiteUrl).replace(/\/$/, '');
export const SITE_NAME = 'DataInsight Pro';
export const SITE_TITLE = 'DataInsight Pro | Free Online Data Analysis Tool';
export const SITE_DESCRIPTION =
  'Analyze CSV, Excel and JSON files online for free. Explore, clean, visualize and analyze your data with DataInsight Pro.';
