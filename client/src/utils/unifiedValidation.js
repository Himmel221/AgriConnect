import { useState } from 'react';

const HOMOGRAPH_MAP = {
  'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'у': 'y', 'х': 'x',
  'А': 'A', 'Е': 'E', 'О': 'O', 'Р': 'P', 'С': 'C', 'У': 'Y', 'Х': 'X',
  'α': 'a', 'ο': 'o', 'ρ': 'p', 'τ': 't', 'υ': 'u', 'χ': 'x',
  'Α': 'A', 'Ο': 'O', 'Ρ': 'P', 'Τ': 'T', 'Υ': 'U', 'Χ': 'X',
  '０': '0', '１': '1', '２': '2', '３': '3', '４': '4', '５': '5', '６': '6', '７': '7', '８': '8', '９': '9',
  'ｇ': 'g', 'ｌ': 'l', 'ｏ': 'o', 'ｑ': 'q', 'ｓ': 's', 'ｚ': 'z',
  'Ｇ': 'G', 'Ｌ': 'L', 'Ｏ': 'O', 'Ｑ': 'Q', 'Ｓ': 'S', 'Ｚ': 'Z',
  '\u200B': '', '\u200C': '', '\u200D': '', '\uFEFF': '', '\u2060': '',
  '\u0000': '', '\u0001': '', '\u0002': '', '\u0003': '', '\u0004': '', '\u0005': '', '\u0006': '', '\u0007': '',
  '\u0008': '', '\u0009': '', '\u000A': '', '\u000B': '', '\u000C': '', '\u000D': '', '\u000E': '', '\u000F': '',
  '\u0010': '', '\u0011': '', '\u0012': '', '\u0013': '', '\u0014': '', '\u0015': '', '\u0016': '', '\u0017': '',
  '\u0018': '', '\u0019': '', '\u001A': '', '\u001B': '', '\u001C': '', '\u001D': '', '\u001E': '', '\u001F': '',
  '\u007F': ''
};

export const sanitize = {
  normalizeUnicode: (text) => {
    if (!text || typeof text !== 'string') return '';
    
    let normalized = text.normalize('NFC');
    
    for (const [homograph, replacement] of Object.entries(HOMOGRAPH_MAP)) {
      normalized = normalized.replace(new RegExp(homograph, 'g'), replacement);
    }
    
    normalized = normalized.replace(/[^\x00-\x7F\u00A0-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\u2C60-\u2C7F\uA720-\uA7FF]/g, '');
    
    return normalized;
  },

  text: (text, options = {}) => {
    const {
      allowNumbers = true,
      allowSpecialChars = false,
      allowedSpecialChars = '',
      maxLength = 255,
      removeExtraSpaces = true,
      allowSpaces = true
    } = options;
    
    if (!text) return '';
    
    let sanitized = sanitize.normalizeUnicode(text);
    
    let allowedPattern = 'A-Za-z';
    if (allowNumbers) allowedPattern += '0-9';
    if (allowSpecialChars && allowedSpecialChars) {
      allowedPattern += allowedSpecialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    if (allowSpaces) allowedPattern += '\\s';
    
    sanitized = sanitized.replace(new RegExp(`[^${allowedPattern}]`, 'g'), '');
    
    if (removeExtraSpaces && allowSpaces) {
      sanitized = sanitized.replace(/\s+/g, ' ').trim();
    }
    
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    
    return sanitized;
  },

  name: (name) => {
    if (!name) return '';
    
    let sanitized = sanitize.normalizeUnicode(name);
    
    sanitized = sanitized.replace(/[^A-Za-z\s\-']/g, '');
    
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    sanitized = sanitized.replace(/\b\w/g, (char) => char.toUpperCase());
    
    return sanitized;
  },

  username: (username) => {
    if (!username) return '';
    
    let sanitized = sanitize.normalizeUnicode(username);
    
    sanitized = sanitized.replace(/[^A-Za-z0-9_-]/g, '');
    
    sanitized = sanitized.toLowerCase();
    
    return sanitized;
  },

  email: (email) => {
    if (!email) return '';
    
    let sanitized = sanitize.normalizeUnicode(email);
    
    sanitized = sanitized.replace(/[^a-zA-Z0-9@._-]/g, '');
    
    const atCount = (sanitized.match(/@/g) || []).length;
    if (atCount > 1) {
      const parts = sanitized.split('@');
      sanitized = parts[0] + '@' + parts.slice(1).join('');
    }
    
    return sanitized.toLowerCase();
  },

  phone: (phone) => {
    if (!phone) return '';
    
    let sanitized = sanitize.normalizeUnicode(phone);
    
    sanitized = sanitized.replace(/[^0-9+\-()\s]/g, '');
    
    sanitized = sanitized.replace(/\s+/g, '').trim();
    
    return sanitized;
  },

  accountNumber: (accountNumber) => {
    if (!accountNumber) return '';
    
    let sanitized = sanitize.normalizeUnicode(accountNumber);
    
    sanitized = sanitized.replace(/[^0-9]/g, '');
    
    return sanitized;
  },

  referenceNumber: (referenceNumber) => {
    if (!referenceNumber) return '';
    
    let sanitized = sanitize.normalizeUnicode(referenceNumber);
    
    sanitized = sanitized.replace(/[^A-Za-z0-9\-_]/g, '');
    
    return sanitized.toUpperCase();
  },

  numeric: (value, options = {}) => {
    const {
      allowDecimal = true,
      allowNegative = false,
      precision = 2
    } = options;
    
    if (!value) return '';
    
    let sanitized = sanitize.normalizeUnicode(value.toString());
    
    let pattern = allowDecimal ? '[^0-9.]' : '[^0-9]';
    if (allowNegative) pattern = allowDecimal ? '[^0-9.-]' : '[^0-9-]';
    
    sanitized = sanitized.replace(new RegExp(pattern, 'g'), '');
    
    if (allowDecimal && sanitized.includes('.')) {
      const parts = sanitized.split('.');
      if (parts[1] && parts[1].length > precision) {
        sanitized = parts[0] + '.' + parts[1].substring(0, precision);
      }
    }
    
    return sanitized;
  }
};

export const validate = {
  email: (email) => {
    const sanitized = sanitize.email(email);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    return {
      isValid: emailRegex.test(sanitized),
      value: sanitized,
      error: emailRegex.test(sanitized) ? null : 'Invalid email format'
    };
  },

  phone: (phone, options = {}) => {
    const { minLength = 10, maxLength = 15 } = options;
    const sanitized = sanitize.phone(phone);
    const cleanDigits = sanitized.replace(/[^0-9]/g, '');
    
    return {
      isValid: cleanDigits.length >= minLength && cleanDigits.length <= maxLength,
      value: sanitized,
      error: cleanDigits.length < minLength ? `Phone number must be at least ${minLength} digits` :
             cleanDigits.length > maxLength ? `Phone number must not exceed ${maxLength} digits` : null
    };
  },

  accountNumber: (accountNumber, options = {}) => {
    const { minLength = 8, maxLength = 20 } = options;
    const sanitized = sanitize.accountNumber(accountNumber);
    
    return {
      isValid: sanitized.length >= minLength && sanitized.length <= maxLength,
      value: sanitized,
      error: sanitized.length < minLength ? `Account number must be at least ${minLength} digits` :
             sanitized.length > maxLength ? `Account number must not exceed ${maxLength} digits` : null
    };
  },

  referenceNumber: (referenceNumber, options = {}) => {
    const { minLength = 5, maxLength = 50 } = options;
    const sanitized = sanitize.referenceNumber(referenceNumber);
    
    return {
      isValid: sanitized.length >= minLength && sanitized.length <= maxLength,
      value: sanitized,
      error: sanitized.length < minLength ? `Reference number must be at least ${minLength} characters` :
             sanitized.length > maxLength ? `Reference number must not exceed ${maxLength} characters` : null
    };
  },

  numeric: (value, options = {}) => {
    const {
      min = 0,
      max = Infinity,
      allowDecimal = true,
      allowNegative = false,
      precision = 2
    } = options;
    
    const sanitized = sanitize.numeric(value, { allowDecimal, allowNegative, precision });
    const numValue = parseFloat(sanitized);
    
    if (isNaN(numValue)) {
      return {
        isValid: false,
        value: sanitized,
        error: 'Please enter a valid number'
      };
    }
    
    if (numValue < min) {
      return {
        isValid: false,
        value: sanitized,
        error: `Value must be at least ${min}`
      };
    }
    
    if (numValue > max) {
      return {
        isValid: false,
        value: sanitized,
        error: `Value cannot exceed ${max}`
      };
    }
    
    return {
      isValid: true,
      value: sanitized,
      error: null
    };
  },

  name: (name, options = {}) => {
    const { minLength = 1, maxLength = 50 } = options;
    const sanitized = sanitize.name(name);
    
    return {
      isValid: sanitized.length >= minLength && sanitized.length <= maxLength,
      value: sanitized,
      error: sanitized.length < minLength ? `Name must be at least ${minLength} characters` :
             sanitized.length > maxLength ? `Name must not exceed ${maxLength} characters` : null
    };
  },

  username: (username, options = {}) => {
    const { minLength = 3, maxLength = 30 } = options;
    const sanitized = sanitize.username(username);
    
    return {
      isValid: sanitized.length >= minLength && sanitized.length <= maxLength,
      value: sanitized,
      error: sanitized.length < minLength ? `Username must be at least ${minLength} characters` :
             sanitized.length > maxLength ? `Username must not exceed ${maxLength} characters` : null
    };
  }
};

export const inputFilters = {
  numeric: (e) => {
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End', 'PageUp', 'PageDown'
    ];
    
    const allowedChars = /[0-9.]/;
    
    if (allowedKeys.includes(e.key)) return true;
    
    if (allowedChars.test(e.key)) {
      if (e.key === '.' && e.target.value.includes('.')) {
        e.preventDefault();
        return false;
      }
      return true;
    }
    
    e.preventDefault();
    return false;
  },

  integer: (e) => {
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End', 'PageUp', 'PageDown'
    ];
    
    const allowedChars = /[0-9]/;
    
    if (allowedKeys.includes(e.key)) return true;
    
    if (allowedChars.test(e.key)) return true;
    
    e.preventDefault();
    return false;
  },

  accountNumber: (e) => {
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ];
    
    const allowedChars = /[0-9]/;
    
    if (allowedKeys.includes(e.key)) return true;
    
    if (allowedChars.test(e.key)) return true;
    
    e.preventDefault();
    return false;
  },

  referenceNumber: (e) => {
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ];
    
    const allowedChars = /[A-Za-z0-9\-_]/;
    
    if (allowedKeys.includes(e.key)) return true;
    
    if (allowedChars.test(e.key)) return true;
    
    e.preventDefault();
    return false;
  },

  name: (e) => {
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End', 'Space'
    ];
    
    const allowedChars = /[A-Za-z\s\-']/;
    
    if (allowedKeys.includes(e.key)) return true;
    
    if (allowedChars.test(e.key)) return true;
    
    e.preventDefault();
    return false;
  },

  phone: (e) => {
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ];
    
    const allowedChars = /[0-9+\-()\s]/;
    
    if (allowedKeys.includes(e.key)) return true;
    
    if (allowedChars.test(e.key)) return true;
    
    e.preventDefault();
    return false;
  }
};

export const useValidation = (type, options = {}) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState(null);
  
  const handleChange = (e) => {
    const newValue = e.target.value;
    const sanitized = sanitize[type] ? sanitize[type](newValue, options) : newValue;
    const validation = validate[type] ? validate[type](sanitized, options) : { isValid: true, value: sanitized, error: null };
    
    setValue(validation.value);
    setError(validation.error);
    
    return validation;
  };
  
  const handleKeyDown = (e) => {
    const filter = inputFilters[type];
    if (filter) {
      return filter(e);
    }
    return true;
  };
  
  return {
    value,
    error,
    handleChange,
    handleKeyDown,
    setValue,
    setError
  };
};

export const utils = {
  formatNumber: (value, options = {}) => {
    const { precision = 2, locale = 'en-PH' } = options;
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) return '';
    
    return numValue.toLocaleString(locale, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    });
  },

  hasHomographs: (text) => {
    if (!text) return false;
    
    for (const homograph of Object.keys(HOMOGRAPH_MAP)) {
      if (text.includes(homograph)) return true;
    }
    return false;
  },

  getHomographs: (text) => {
    if (!text) return [];
    
    const found = [];
    for (const homograph of Object.keys(HOMOGRAPH_MAP)) {
      if (text.includes(homograph)) {
        found.push(homograph);
      }
    }
    return found;
  }
};

export default {
  sanitize,
  validate,
  inputFilters,
  useValidation,
  utils
}; 