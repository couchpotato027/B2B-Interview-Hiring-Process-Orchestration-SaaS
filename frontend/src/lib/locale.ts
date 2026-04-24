import { format } from 'date-fns';
import { enUS, es, fr, de, hi } from 'date-fns/locale';
import i18n from './i18n';

const locales: Record<string, any> = {
  en: enUS,
  es: es,
  fr: fr,
  de: de,
  hi: hi
};

export const formatLocalizedDate = (date: Date | string | number, formatStr: string = 'PP') => {
  const currentLang = i18n.language || 'en';
  const locale = locales[currentLang] || enUS;
  
  return format(new Date(date), formatStr, { locale });
};

export const formatLocalizedNumber = (num: number, options?: Intl.NumberFormatOptions) => {
  const currentLang = i18n.language || 'en';
  return new Intl.NumberFormat(currentLang, options).format(num);
};

export const formatLocalizedCurrency = (num: number, currency: string = 'USD') => {
  const currentLang = i18n.language || 'en';
  const currencyMap: Record<string, string> = {
      en: 'USD',
      es: 'EUR',
      fr: 'EUR',
      de: 'EUR',
      hi: 'INR'
  };
  
  return new Intl.NumberFormat(currentLang, {
    style: 'currency',
    currency: currencyMap[currentLang] || currency
  }).format(num);
};
