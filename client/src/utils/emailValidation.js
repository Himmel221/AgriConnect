// Frontend email validation utility

const ALLOWED_EMAIL_PROVIDERS = [
  'gmail.com',
  'yahoo.com', 
  'ymail.com',
  'rocketmail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'zoho.com',
  'protonmail.com',
  'proton.me',
  'gmx.com',
  'gmx.net',
  'mail.com',
  'tutanota.com',
  'yandex.com',
  'yandex.ru',
  'fastmail.com'
];

const extractDomain = (email) => {
  const parts = email.toLowerCase().split('@');
  return parts.length === 2 ? parts[1] : null;
};


export const isAllowedEmailProvider = (email) => {
  const domain = extractDomain(email);
  if (!domain) return false;
  return ALLOWED_EMAIL_PROVIDERS.includes(domain);
};


export const validateEmailProvider = (email) => {
  if (!email || !email.trim()) {
    return {
      isValid: false,
      error: 'Email is required'
    };
  }

  if (!isAllowedEmailProvider(email)) {
    return {
      isValid: false,
      error: 'Try again next time'
    };
  }

  return {
    isValid: true,
    error: null
  };
};

export { ALLOWED_EMAIL_PROVIDERS }; 