module.exports = (req, res, next) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';

    const allowedOrigins = isProduction
      ? JSON.parse(process.env.ALLOWED_PRODUCTION_DOMAIN)
      : JSON.parse(process.env.ALLOWED_DEV_DOMAIN);

    const origin = req.headers.origin || req.headers.referer || req.headers.host;
    let isValid = allowedOrigins.some(v => v.includes(origin.slice(0, v.length)));

    if (!isValid) {
      res.status(401).json({
        success: false,
        error: 'Private Server: Not allowed from ' + origin,
        secure: req.secure ? 'secure' : 'not secure',
        origin: req.originalUrl || req.url || ''
      });
      return;
    }
    else {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Methods', 'GET, POST');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, csrf-token');
      res.header('Access-Control-Allow-Credentials', false);
      next();
    }
  } catch (error) {
    res.json({ success: false, error: 'Is not valid url' });
  }
}
