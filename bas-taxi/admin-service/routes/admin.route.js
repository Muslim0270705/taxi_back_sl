import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateMiddleware } from '../middlewares/validate.middleware.js';
import {
    getUsers,
    approveDriver,
    getRides,
    getReviews,
    updateSettings, getDriverRequests, rejectDriver,
} from '../controllers/admin.controller.js';
import {rejectDriverSchema} from "../validators/reject-driver.js";
import {updateCostSchema} from "../validators/update-cost.validator.js";
import {authorizeRoles} from "../middlewares/role.middleware.js";

const router = Router();

router.get('/admin/users', authMiddleware, authorizeRoles('admin', 'moderator'), getUsers);

router.get('/admin/driver-requests', authMiddleware, authorizeRoles('admin', 'moderator'), getDriverRequests);

router.post('/admin/approve-driver/:requestId', authMiddleware, authorizeRoles('admin', 'moderator'), approveDriver);
router.post(
    '/admin/approve-driver',
    authMiddleware,
    authorizeRoles('admin', 'moderator'),
    approveDriver
);

router.post('/admin/reject-driver/:requestId', authMiddleware, authorizeRoles('admin', 'moderator'), validateMiddleware(rejectDriverSchema), rejectDriver);

router.get('/admin/rides', authMiddleware, authorizeRoles('admin', 'moderator'), getRides);

router.get('/admin/reviews', authMiddleware, authorizeRoles('admin', 'moderator'), getReviews);

router.post(
    '/admin/settings',
    authMiddleware,
    authorizeRoles('admin', 'moderator'),
    validateMiddleware(updateCostSchema),
    updateSettings
);

router.get('/admin/driver-requests/:requestId/document', authMiddleware, authorizeRoles('admin', 'moderator'), async (req, res) => {
    const { requestId } = req.params;
    try {
        const driverRequest = await DriverRequest.findByPk(requestId);
        if (!driverRequest) {
            return res.status(404).json({ message: 'Заявка водителя не найдена' });
        }

        const filePath = driverRequest.documentPath;
        res.download(filePath, (err) => {
            if (err) {
                logger.error('Ошибка при скачивании документа водителя', { error: err.message });
                res.status(500).json({ error: 'Ошибка при скачивании документа' });
            }
        });
    } catch (error) {
        logger.error('Ошибка при обработке запроса на скачивание документа', { error: error.message });
        res.status(500).json({ error: 'Ошибка при скачивании документа' });
    }
});

export default router;
