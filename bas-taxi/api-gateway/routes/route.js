import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

router.use('/auth', createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/auth': '',
    },
}));

router.use('/rides', createProxyMiddleware({
    target: process.env.RIDE_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/rides': '',
    },
}));

router.use('/admin', createProxyMiddleware({
    target: process.env.ADMIN_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/admin': '',
    },
}));

router.use('/balance', createProxyMiddleware({
    target: process.env.BALANCE_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/balance': '',
    },
}));

router.use('/geo', createProxyMiddleware({
    target: process.env.GEO_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/geo': '',
    },
}));

router.use('/review', createProxyMiddleware({
    target: process.env.REVIEW_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/review': '',
    },
}));

router.use('/sms', createProxyMiddleware({
    target: process.env.SMS_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/sms': '',
    },
}));
router.use('/payments', createProxyMiddleware({
    target: process.env.PAYMENT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/payments': '',
    },
}));

router.use('/uploads', createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL,
    changeOrigin: true,
}));

export default router;

