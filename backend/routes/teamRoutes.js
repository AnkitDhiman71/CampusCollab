const express = require('express');
const {
  createTeam,
  getUserTeams,
  inviteToTeam,
  cancelTeamInvite,
  requestToJoinTeam,
  cancelJoinRequest,
  removeTeamMember,
  addTaskToTeam,
  updateTeamTask,
  deleteTeamTask,
  getTeamMessages,
  sendTeamMessage,
  uploadTeamChatFile,
} = require('../controllers/teamController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { validate, createTeamSchema } = require('../validations');

const { aiExplainCode } = require('../controllers/peerController');

const router = express.Router();

router.post('/ai/explain-code', protect, aiExplainCode);
router.post('/', protect, validate(createTeamSchema), createTeam);
router.get('/', protect, getUserTeams);
router.post('/:id/invite', protect, inviteToTeam);
router.delete('/:id/invite/:recipientId', protect, cancelTeamInvite);
router.post('/:id/join', protect, requestToJoinTeam);
router.delete('/:id/join', protect, cancelJoinRequest);
router.post('/:id/apply', protect, requestToJoinTeam);
router.delete('/:id/members/:memberId', protect, removeTeamMember);

// Team Kanban Task Board Routes
router.post('/:id/tasks', protect, addTaskToTeam);
router.put('/:id/tasks/:taskId', protect, updateTeamTask);
router.delete('/:id/tasks/:taskId', protect, deleteTeamTask);

// Team Live Private Chat Routes
router.get('/:id/messages', protect, getTeamMessages);
router.post('/:id/messages', protect, upload.single('file'), sendTeamMessage);
router.post('/:id/upload', protect, upload.single('file'), uploadTeamChatFile);

module.exports = router;
