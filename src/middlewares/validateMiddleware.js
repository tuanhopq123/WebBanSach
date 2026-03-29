const Joi = require('joi');

const userRegisterSchema = Joi.object({
  username: Joi.string().min(3).required().messages({
    'string.empty': 'Username không được để trống',
    'string.min': 'Username phải có ít nhất 3 ký tự',
    'any.required': 'Trường username là bắt buộc'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email không hợp lệ',
    'string.empty': 'Email không được để trống',
    'any.required': 'Trường email là bắt buộc'
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password không được để trống',
    'string.min': 'Password phải có ít nhất 6 ký tự',
    'any.required': 'Trường password là bắt buộc'
  })
});

const bookSchema = Joi.object({
  title: Joi.string().required().messages({
    'string.empty': 'Tên sách không được để trống',
    'any.required': 'Trường tên sách là bắt buộc'
  }),
  price: Joi.number().greater(0).required().messages({
    'number.base': 'Giá sách phải là số',
    'number.greater': 'Giá sách phải lớn hơn 0',
    'any.required': 'Trường giá sách là bắt buộc'
  }),
  stockQuantity: Joi.number().min(0).optional(),
  description: Joi.string().optional().allow(''),
  author: Joi.string().required().messages({
    'string.empty': 'Tên tác giả không được để trống',
    'any.required': 'Trường tên tác giả là bắt buộc'
  }),
  category: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'Category ID không hợp lệ (phải là MongoDB ObjectId)',
    'any.required': 'Category là bắt buộc'
  })
});

// Schema cho Update Book (cho phép các trường optional)
const bookUpdateSchema = Joi.object({
  title: Joi.string().messages({
    'string.empty': 'Tên sách không được để trống'
  }),
  price: Joi.number().greater(0).messages({
    'number.base': 'Giá sách phải là số',
    'number.greater': 'Giá sách phải lớn hơn 0'
  }),
  stockQuantity: Joi.number().min(0),
  description: Joi.string().allow(''),
  author: Joi.string().messages({
    'string.empty': 'Tên tác giả không được để trống'
  }),
  category: Joi.string().regex(/^[0-9a-fA-F]{24}$/).messages({
    'string.pattern.base': 'Category ID không hợp lệ (phải là MongoDB ObjectId)'
  })
}).min(1).messages({
  'object.min': 'Phải có ít nhất 1 trường dữ liệu để cập nhật'
});

const validate = (schema) => {
  return (req, res, next) => {
    // validate object received in body
    const { error } = schema.validate(req.body, { abortEarly: false }); // abortEarly: false trả về TẤT CẢ các lỗi chứ không dừng ở lỗi đầu tiên
    
    if (error) {
      // Format lại error để output tường minh, dễ parse ở phía Client
      const errors = error.details.map((detail) => ({
        field: detail.path[0],
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    // Nếu pass thì chạy tiếp vào Controller
    next();
  };
};

module.exports = {
  validate,
  userRegisterSchema,
  bookSchema,
  bookUpdateSchema
};
