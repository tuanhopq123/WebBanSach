const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const { validate, userRegisterSchema } = require('../middlewares/validateMiddleware');

router.post('/register', validate(userRegisterSchema), userController.register);
router.post('/login', userController.login);

// Yêu cầu đăng nhập cho tất cả route bên dưới
router.use(verifyToken);
router.get('/profile', userController.getProfile);

// Yêu cầu quyền Admin cho tất cả route bên dưới
router.use(checkRole('Admin'));

router.route('/')
  .get(userController.getAll);

router.route('/:id')
  .get(userController.getById)
  .put(userController.update)
  .delete(userController.remove);

module.exports = router;
