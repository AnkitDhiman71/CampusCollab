const express = require('express');
const { 
  getAllPeers, 
  sendRequest, 
  getMyRequests, 
  updateRequestStatus, 
  getPeerProfile, 
  getGitHubProfile,
  requestInteraction,
  deleteRequest,
  assignTechnicalTest,
  getTechnicalTest,
  startTechnicalTest,
  submitTechnicalTest,
  reviewTechnicalTest,
  aiExplainCode,
  aiEvaluateAssessment,
  aiGenerateTestCases,
  runCodeSnippet,
  markInteractionCompleted,
  allowCandidateToJoin,
} = require('../controllers/peerController');
const { getAllQuestions, getQuestionById } = require('../controllers/questionController');
const { protect } = require('../middlewares/authMiddleware');
const { validate, sendRequestSchema, updateRequestSchema } = require('../validations');

const router = express.Router();

router.get('/', protect, getAllPeers);
router.get('/github/:username', protect, getGitHubProfile);
router.post('/request', protect, validate(sendRequestSchema), sendRequest);
router.get('/requests', protect, getMyRequests);
router.get('/profile/:id', protect, getPeerProfile);
router.put('/requests/:id', protect, validate(updateRequestSchema), updateRequestStatus);
router.delete('/requests/:id', protect, deleteRequest);
router.post('/requests/:id/interaction', protect, requestInteraction);
router.patch('/requests/:id/interaction/complete', protect, markInteractionCompleted);
router.patch('/requests/:id/allow-join', protect, allowCandidateToJoin);

// Assessment Question presets from DB
router.get('/questions', protect, getAllQuestions);
router.get('/questions/:id', protect, getQuestionById);

// Multi-Language Code Execution (C, C++, Python, JavaScript)
router.post('/execute-code', protect, runCodeSnippet);

// AI Assistance & Code Intelligence
router.post('/ai/explain-code', protect, aiExplainCode);
router.post('/ai/generate-test-cases', protect, aiGenerateTestCases);
router.post('/requests/:id/test/ai-evaluate', protect, aiEvaluateAssessment);

// Technical Coding Assessment routes
router.post('/requests/:id/test/assign', protect, assignTechnicalTest);
router.get('/requests/:id/test', protect, getTechnicalTest);
router.post('/requests/:id/test/start', protect, startTechnicalTest);
router.post('/requests/:id/test/submit', protect, submitTechnicalTest);
router.post('/requests/:id/test/review', protect, reviewTechnicalTest);



module.exports = router;
