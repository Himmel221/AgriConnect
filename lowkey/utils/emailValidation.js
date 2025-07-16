// emailValidation.js 
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


const bannedIPs = new Map();


setInterval(() => {
  const now = Date.now();
  for (const [ip, banData] of bannedIPs.entries()) {
    if (banData.expiresAt < now) {
      bannedIPs.delete(ip);
    }
  }
}, 60 * 60 * 1000); 

/**
 * Extract domain from email address
 * @param {string} email - Email address
 * @returns {string} Domain part of email
 */
const extractDomain = (email) => {
  const parts = email.toLowerCase().split('@');
  return parts.length === 2 ? parts[1] : null;
};

/**
 * Check if email provider is allowed
 * @param {string} email - Email address to validate
 * @returns {boolean} True if provider is allowed
 */
export const isAllowedEmailProvider = (email) => {
  const domain = extractDomain(email);
  if (!domain) return false;
  return ALLOWED_EMAIL_PROVIDERS.includes(domain);
};


export const banIP = (ip) => {
  const banExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
  bannedIPs.set(ip, {
    bannedAt: new Date(),
    expiresAt: banExpiry,
    reason: 'Temporary email provider used'
  });
  console.log(`IP ${ip} banned for 24 hours due to temporary email provider`);
};


export const isIPBanned = (ip) => {
  const banData = bannedIPs.get(ip);
  if (!banData) return false;
  
  if (banData.expiresAt < Date.now()) {
    bannedIPs.delete(ip);
    return false;
  }
  
  return true;
};


export const getBanInfo = (ip) => {
  const banData = bannedIPs.get(ip);
  if (!banData) return null;
  
  if (banData.expiresAt < Date.now()) {
    bannedIPs.delete(ip);
    return null;
  }
  
  return {
    bannedAt: banData.bannedAt,
    expiresAt: banData.expiresAt,
    reason: banData.reason,
    remainingTime: Math.ceil((banData.expiresAt - Date.now()) / (1000 * 60 * 60)) // hours
  };
};

export const checkEmail = (email, ip) => {
  if (isIPBanned(ip)) {
    const banInfo = getBanInfo(ip);
    return {
      isValid: false,
      error: 'Try again next time',
      banInfo
    };
  }
  
  if (!isAllowedEmailProvider(email)) {
    banIP(ip);
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