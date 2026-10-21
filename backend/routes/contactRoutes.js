const express = require('express');
const { submitContact } = require('../controllers/contactController');
const { validate, contactSchema } = require('../validations');

const router = express.Router();
router.post('/', validate(contactSchema), submitContact);

module.exports = router;
