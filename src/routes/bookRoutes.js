const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const { validate, bookSchema, bookUpdateSchema } = require('../middlewares/validateMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.route('/')
  .get(bookController.getAllBooks)
  .post(verifyToken, checkRole('Admin', 'Staff'), validate(bookSchema), bookController.createBook);

router.route('/:id')
  .get(bookController.getBookById)
  .put(verifyToken, checkRole('Admin', 'Staff'), validate(bookUpdateSchema), bookController.updateBook)
  .delete(verifyToken, checkRole('Admin', 'Staff'), bookController.deleteBook);

router.post('/:id/upload', verifyToken, checkRole('Admin', 'Staff'), upload.single('image'), bookController.uploadImage);

module.exports = router;
