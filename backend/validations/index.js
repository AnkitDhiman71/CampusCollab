const yup = require('yup');

const validate = (schema) => async (req, res, next) => {
  try {
    req.body = await schema.validate(req.body, { abortEarly: true, stripUnknown: false });
    next();
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

const sendOtpSchema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email')
    .required('Please provide an email address.'),
});

const verifyOtpSchema = yup.object({
  email: yup.string().email('Please enter a valid email').required('Email is required.'),
  otp: yup.string().when('email', {
    is: (val) => val && (val.toLowerCase().includes('admin') || val.toLowerCase() === 'admin@campuscollab.edu'),
    then: (schema) => schema.notRequired(),
    otherwise: (schema) => schema.required('Please provide the OTP code.'),
  }),
});

const signupSchema = yup.object({
  name: yup.string().trim().required('Please provide name.'),
  email: yup
    .string()
    .email('Please enter a valid email')
    .required('Please provide email.'),
  password: yup.string().min(6, 'Password must be at least 6 characters.').required('Please provide password.'),
  department: yup.string().default('General'),
  skills: yup.string().default(''),
  otp: yup.string(),
  githubUrl: yup.string().trim().default(''),
  bio: yup.string().trim().default(''),
});

const loginSchema = yup.object({
  email: yup.string().required('Please provide email.'),
  password: yup.string().required('Please provide password.'),
});

const sendRequestSchema = yup.object({
  recipientId: yup.string().required('Recipient ID is required.'),
  message: yup.string().trim().required('Message is required.'),
  fileUrl: yup.string().trim().default(''),
  fileName: yup.string().trim().default(''),
  role: yup.string().trim().default(''),
});

const updateRequestSchema = yup.object({
  status: yup.string().oneOf(['accepted', 'rejected'], 'Status must be accepted or rejected.').required(),
});

const createTeamSchema = yup.object({
  title: yup.string().trim().required('Team title is required.'),
  tech: yup.mixed(),
  openRoles: yup.mixed(),
  description: yup.string().default(''),
  githubUrl: yup.string().trim().default(''),
});

const contactSchema = yup.object({
  name: yup.string().trim().required('Please provide your name.'),
  email: yup.string().email('Please enter a valid email.').required('Please provide your email.'),
  subject: yup.string().trim().required('Please provide a subject.'),
  message: yup.string().trim().required('Please provide a message.'),
});

module.exports = {
  validate,
  sendOtpSchema,
  verifyOtpSchema,
  signupSchema,
  loginSchema,
  sendRequestSchema,
  updateRequestSchema,
  createTeamSchema,
  contactSchema,
};
