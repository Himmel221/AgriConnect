import { isIPBanned, getBanInfo } from '../utils/emailValidation.js';

export const checkIPBan = async (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
  if (await isIPBanned(clientIP)) {
    const banInfo = await getBanInfo(clientIP);
    return res.status(403).json({
      message: 'Try again next time',
      banInfo,
      errorType: 'IP_BANNED'
    });
  }
  next();
}; 