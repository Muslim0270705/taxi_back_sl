import express from 'express';
import multer from 'multer';
import {
    registerPassenger,
    registerDriver,
    login,
    verifyPhone,
    resendVerificationCodeController
} from '../controllers/auth.controller.js';

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/documents/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    },
});

const upload = multer({ storage });

router.post('/register/passenger', registerPassenger);
router.post('/register/driver', upload.single('document'), registerDriver);
router.post('/verify-phone', verifyPhone);
router.post('/resend-verification-code', resendVerificationCodeController);
router.post('/login', login);

export default router;
