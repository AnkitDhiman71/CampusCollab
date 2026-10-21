const Contact = require('../models/contactModel');

const submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const query = await Contact.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      subject: subject.trim(),
      message: message.trim(),
    });

    return res.status(201).json({
      success: true,
      message: 'Your inquiry has been submitted to the administration.',
      query,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { submitContact };
