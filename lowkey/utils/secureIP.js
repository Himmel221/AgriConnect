const getSecureIP = (req) => {
  const trustedProxies = process.env.TRUSTED_PROXIES ? 
    process.env.TRUSTED_PROXIES.split(',').map(ip => ip.trim()) : 
    ['127.0.0.1', '::1'];
  
  const clientIP = req.connection.remoteAddress || 
                   req.socket.remoteAddress || 
                   req.ip || 
                   'unknown';
  
  if (req.headers['x-forwarded-for']) {
    const forwardedIPs = req.headers['x-forwarded-for'].split(',').map(ip => ip.trim());
    
    if (trustedProxies.includes(clientIP)) {
      return forwardedIPs[0];
    }
  }
  
  return clientIP;
};

const sanitizeIP = (ip) => {
  if (!ip || ip === 'unknown') return 'unknown';
  
  const cleanIP = ip.replace(/[^0-9.:]/g, '');
  
  if (cleanIP.startsWith('::ffff:')) {
    return cleanIP.substring(7);
  }
  
  return cleanIP;
};

export { getSecureIP, sanitizeIP }; 