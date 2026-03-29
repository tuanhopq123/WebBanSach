const Image = require('../models/Image.model');

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    const { bookId, isPrimary } = req.body;

    if (!bookId) {
      return res.status(400).json({ success: false, message: 'Book ID is required' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    const newImage = await Image.create({
      url: imageUrl,
      book: bookId,
      isPrimary: isPrimary === 'true' || isPrimary === true
    });

    res.status(201).json({ success: true, data: newImage, message: 'Image uploaded successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getImagesByBook = async (req, res) => {
  try {
    const images = await Image.find({ book: req.params.bookId });
    res.status(200).json({ success: true, data: images });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteImage = async (req, res) => {
  try {
    const image = await Image.findByIdAndDelete(req.params.id);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }
    // File hệ thống cũng có thể được xóa ở đây bằng fs.unlinkSync(path)
    res.status(200).json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  uploadImage,
  getImagesByBook,
  deleteImage
};
