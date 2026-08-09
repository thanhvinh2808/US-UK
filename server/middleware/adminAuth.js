export default function adminAuth(req, res, next) {
  const adminKeyHeader = req.headers['x-admin-key'];
  const secretKey = process.env.ADMIN_SECRET_KEY;

  if (!adminKeyHeader || adminKeyHeader !== secretKey) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing admin key' });
  }

  next();
}
