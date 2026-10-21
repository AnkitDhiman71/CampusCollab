const express = require('express');
const { getAllUsers, getAdminStats, deleteUser, getAllRequestsAdmin, deleteRequestAdmin, getAllInquiriesAdmin, deleteInquiryAdmin, getAllTeamsAdmin, deleteTeamAdmin, getUserLogsAdmin, getSecurityLogsAdmin, simulateTestAttackAdmin, clearSecurityLogsAdmin } = require('../controllers/adminController');
const { getAllQuestions, getQuestionById, createQuestion, updateQuestion, deleteQuestion } = require('../controllers/questionController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect, adminOnly);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.get('/user-logs', getUserLogsAdmin);
router.get('/security-logs', getSecurityLogsAdmin);
router.post('/security-logs/simulate', simulateTestAttackAdmin);
router.delete('/security-logs/clear', clearSecurityLogsAdmin);
router.delete('/users/:id', deleteUser);
router.get('/requests', getAllRequestsAdmin);
router.delete('/requests/:id', deleteRequestAdmin);
router.get('/inquiries', getAllInquiriesAdmin);
router.delete('/inquiries/:id', deleteInquiryAdmin);
router.get('/teams', getAllTeamsAdmin);
router.delete('/teams/:id', deleteTeamAdmin);

// Assessment Question Bank Management
router.get('/questions', getAllQuestions);
router.get('/questions/:id', getQuestionById);
router.post('/questions', createQuestion);
router.put('/questions/:id', updateQuestion);
router.delete('/questions/:id', deleteQuestion);

module.exports = router;

