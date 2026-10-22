const Team = require('../models/teamModel');
const Request = require('../models/requestModel');
const User = require('../models/userModel');
const TeamMessage = require('../models/teamMessageModel');
const { sendTeamInviteEmail, sendTeamJoinRequestEmail, sendTeamJoinedConfirmationEmail } = require('../config/nodemailer');
const { createNotification } = require('../utils/notificationService');

const createTeam = async (req, res) => {
  try {
    const { title, tech, description, githubUrl, openRoles, candidateId } = req.body;
    const techArray = Array.isArray(tech)
      ? tech
      : (tech ? tech.split(',').map((t) => t.trim()).filter(Boolean) : []);
    const rolesArray = Array.isArray(openRoles)
      ? openRoles
      : (openRoles ? openRoles.split(',').map((r) => r.trim()).filter(Boolean) : []);

    const initialMembers = [req.user._id];
    if (candidateId && candidateId.toString() !== req.user._id.toString()) {
      initialMembers.push(candidateId);
    }

    const team = await Team.create({
      title: title.trim(),
      lead: req.user._id,
      members: initialMembers,
      tech: techArray,
      openRoles: rolesArray,
      description: description ? description.trim() : '',
      githubUrl: githubUrl ? githubUrl.trim() : '',
    });

    if (candidateId && candidateId.toString() !== req.user._id.toString()) {
      await Request.updateMany(
        {
          $or: [
            { sender: req.user._id, recipient: candidateId },
            { sender: candidateId, recipient: req.user._id },
          ],
        },
        { $set: { team: team._id, status: 'accepted' } }
      );

      // Dispatch In-App Notification & Email to Candidate
      createNotification({
        recipient: candidateId,
        sender: req.user._id,
        type: 'TEAM_ACCEPTED',
        title: 'Congratulations!',
        message: `Congratulations! You have been accepted into Team "${team.title}"`,
        link: '/teams',
      });

      User.findById(candidateId).then((candidateUser) => {
        if (candidateUser && candidateUser.email) {
          sendTeamJoinedConfirmationEmail({
            toEmail: candidateUser.email,
            memberName: candidateUser.name || 'Student Member',
            teamTitle: team.title,
            teamLeadName: req.user.name || 'Team Lead',
            teamLeadEmail: req.user.email || '',
          }).catch((err) => console.error('Failed to send team joined email:', err));
        }
      }).catch((err) => console.error('Error fetching candidate user:', err));
    }

    const populatedTeam = await Team.findById(team._id).populate('lead members', 'name email department skills ranking rankingPoints');
    return res.status(201).json({ success: true, message: 'Team created successfully!', team: populatedTeam });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getUserTeams = async (req, res) => {
  try {
    const currentUserId = req.user ? req.user._id.toString() : null;
    const { scope } = req.query;

    const filter = scope === 'my' && currentUserId ? { members: req.user._id } : {};

    const teams = await Team.find(filter)
      .populate('lead members tasks.assignedTo tasks.createdBy', 'name email department skills ranking rankingPoints')
      .sort({ createdAt: -1 });

    // Find pending join requests initiated by this user
    let pendingJoinTeamIds = new Set();
    if (currentUserId) {
      const pendingReqs = await Request.find({
        sender: req.user._id,
        requestType: 'team_join_request',
        status: 'pending',
      });
      pendingReqs.forEach((r) => {
        if (r.team) pendingJoinTeamIds.add(r.team.toString());
      });
    }

    const enhancedTeams = teams.map((team) => {
      const isLead = team.lead?._id
        ? team.lead._id.toString() === currentUserId
        : team.lead?.toString() === currentUserId;

      const isMember = (team.members || []).some((m) => {
        const mId = m?._id ? m._id.toString() : m?.toString();
        return mId === currentUserId;
      });

      const hasRequested = pendingJoinTeamIds.has(team._id.toString());

      return {
        _id: team._id,
        id: team._id,
        title: team.title,
        description: team.description,
        tech: team.tech,
        openRoles: team.openRoles || [],
        githubUrl: team.githubUrl,
        status: team.status,
        lead: team.lead,
        members: team.members,
        tasks: team.tasks || [],
        createdAt: team.createdAt,
        isLead,
        isMember,
        hasRequested,
      };
    });

    return res.json({ success: true, teams: enhancedTeams });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const inviteToTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { recipientId, message, role } = req.body;

    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'Recipient candidate is required.' });
    }

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    const isMember = team.members.some((m) => m.toString() === req.user._id.toString());
    const isLead = team.lead.toString() === req.user._id.toString();
    if (!isMember && !isLead) {
      return res.status(403).json({ success: false, message: 'Only team members or the team lead can invite peers.' });
    }

    if (team.members.some((m) => m.toString() === recipientId.toString())) {
      return res.status(400).json({ success: false, message: 'This peer is already a member of this team.' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Selected peer not found.' });
    }

    const existingPending = await Request.findOne({
      team: team._id,
      recipient: recipientId,
      status: 'pending',
    });

    let request;
    const isResend = Boolean(existingPending);
    const assignedRole = role?.trim() || 'Team Member';
    const customMsg = message?.trim() || `Hi ${recipient.name}, I would like to invite you to join our project team "${team.title}" as ${assignedRole}!`;

    if (existingPending) {
      existingPending.message = customMsg;
      existingPending.role = assignedRole;
      await existingPending.save();
      request = existingPending;
    } else {
      request = await Request.create({
        sender: req.user._id,
        recipient: recipientId,
        team: team._id,
        role: assignedRole,
        requestType: 'team_invite',
        message: customMsg,
      });
    }

    // Dispatch invitation email via Nodemailer
    if (recipient && recipient.email) {
      sendTeamInviteEmail({
        toEmail: recipient.email,
        recipientName: recipient.name,
        senderName: req.user.name || 'Team Lead',
        senderEmail: req.user.email || '',
        teamTitle: team.title,
        teamTech: team.tech || [],
        teamDescription: team.description || '',
        message: customMsg,
      }).catch((err) => console.error('Failed to send team invite email:', err));
    }

    return res.status(201).json({
      success: true,
      message: isResend
        ? `Invitation re-sent and email notification delivered to ${recipient.name} for team "${team.title}"!`
        : `Invitation successfully sent to ${recipient.name} to join team "${team.title}" as ${assignedRole}!`,
      request,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const cancelTeamInvite = async (req, res) => {
  try {
    const { id, recipientId } = req.params;
    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    const isMember = team.members.some((m) => m.toString() === req.user._id.toString());
    const isLead = team.lead.toString() === req.user._id.toString();
    if (!isMember && !isLead) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this invite.' });
    }

    const deleted = await Request.findOneAndDelete({
      team: team._id,
      recipient: recipientId,
      status: 'pending',
    });

    return res.json({
      success: true,
      message: deleted
        ? 'Pending team invitation cancelled and removed from database.'
        : 'No pending invitation found to cancel.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const requestToJoinTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, role } = req.body;

    const team = await Team.findById(id).populate('lead', 'name email');
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    const isMember = team.members.some((m) => m.toString() === req.user._id.toString());
    if (isMember) {
      return res.status(400).json({ success: false, message: 'You are already a member of this team.' });
    }

    // Check if pending request already exists
    const existingPending = await Request.findOne({
      sender: req.user._id,
      team: team._id,
      status: 'pending',
    });

    const appliedRole = role?.trim() || 'Contributor';
    const customMsg = message?.trim() || `Hi ${team.lead?.name || 'Team Lead'}, I would like to join your team "${team.title}" as ${appliedRole}!`;

    let request;
    const isResend = Boolean(existingPending);

    if (existingPending) {
      existingPending.message = customMsg;
      existingPending.role = appliedRole;
      await existingPending.save();
      request = existingPending;
    } else {
      request = await Request.create({
        sender: req.user._id,
        recipient: team.lead._id || team.lead,
        team: team._id,
        role: appliedRole,
        requestType: 'team_join_request',
        message: customMsg,
      });
    }

    // Dispatch email to team lead via Nodemailer
    if (team.lead && team.lead.email) {
      sendTeamJoinRequestEmail({
        toEmail: team.lead.email,
        leadName: team.lead.name || 'Team Lead',
        applicantName: req.user.name || 'Student Applicant',
        applicantEmail: req.user.email || '',
        applicantDept: req.user.department || 'Student',
        teamTitle: team.title,
        message: customMsg,
      }).catch((err) => console.error('Failed to send team join request email:', err));
    }

    return res.status(201).json({
      success: true,
      message: isResend
        ? `Join request re-sent to ${team.lead?.name || 'the team lead'} for team "${team.title}"! An email notification has been dispatched.`
        : `Request sent to ${team.lead?.name || 'the team lead'} to join team "${team.title}"! An email notification has been sent.`,
      request,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const removeTeamMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    if (team.lead.toString() !== req.user._id.toString() && memberId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the team lead can remove members, or members can leave.' });
    }

    if (team.lead.toString() === memberId && team.members.length > 1) {
      return res.status(400).json({ success: false, message: 'Team lead cannot leave while other members exist. Transfer lead first or delete team.' });
    }

    team.members = team.members.filter((m) => m.toString() !== memberId);
    await team.save();

    return res.json({ success: true, message: 'Member removed from team successfully.', team });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const cancelJoinRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Request.findOneAndDelete({
      sender: req.user._id,
      team: id,
      requestType: 'team_join_request',
      status: 'pending',
    });

    return res.json({
      success: true,
      message: deleted
        ? 'Join request successfully withdrawn and deleted from database.'
        : 'No pending join request found to cancel.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addTaskToTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, assignedTo, dueDate } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Task title is required.' });
    }

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    // Verify user is member or lead
    const isMember = (team.members || []).some((m) => m.toString() === req.user._id.toString()) || 
                     (team.lead && team.lead.toString() === req.user._id.toString());
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only team members can create tasks.' });
    }

    const newTask = {
      title: title.trim(),
      description: description ? description.trim() : '',
      priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
      assignedTo: assignedTo || null,
      dueDate: dueDate ? dueDate.trim() : '',
      createdBy: req.user._id,
      status: 'todo',
      createdAt: new Date(),
    };

    team.tasks.push(newTask);
    await team.save();

    const updatedTeam = await Team.findById(id)
      .populate('lead members tasks.assignedTo tasks.createdBy', 'name email department skills ranking rankingPoints');

    return res.status(201).json({
      success: true,
      message: 'Task created successfully!',
      tasks: updatedTeam.tasks,
      team: updatedTeam,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateTeamTask = async (req, res) => {
  try {
    const { id, taskId } = req.params;
    const { status, title, description, priority, assignedTo, dueDate } = req.body;

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    const isMember = (team.members || []).some((m) => m.toString() === req.user._id.toString()) || 
                     (team.lead && team.lead.toString() === req.user._id.toString());
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only team members can modify tasks.' });
    }

    const task = team.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found in this team.' });
    }

    if (status && ['todo', 'in_progress', 'review', 'done'].includes(status)) {
      task.status = status;
    }
    if (title !== undefined && title.trim()) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (priority && ['low', 'medium', 'high'].includes(priority)) task.priority = priority;
    if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
    if (dueDate !== undefined) task.dueDate = dueDate;

    await team.save();

    const updatedTeam = await Team.findById(id)
      .populate('lead members tasks.assignedTo tasks.createdBy', 'name email department skills ranking rankingPoints');

    return res.json({
      success: true,
      message: 'Task updated successfully!',
      tasks: updatedTeam.tasks,
      team: updatedTeam,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTeamTask = async (req, res) => {
  try {
    const { id, taskId } = req.params;

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    const isMember = (team.members || []).some((m) => m.toString() === req.user._id.toString()) || 
                     (team.lead && team.lead.toString() === req.user._id.toString());
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only team members can delete tasks.' });
    }

    team.tasks.pull({ _id: taskId });
    await team.save();

    const updatedTeam = await Team.findById(id)
      .populate('lead members tasks.assignedTo tasks.createdBy', 'name email department skills ranking rankingPoints');

    return res.json({
      success: true,
      message: 'Task removed successfully.',
      tasks: updatedTeam.tasks,
      team: updatedTeam,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getTeamMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    const currentUserId = req.user._id.toString();
    const isMember = (team.members || []).some((m) => m.toString() === currentUserId) || 
                     (team.lead && team.lead.toString() === currentUserId);
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: You are not a member of this team.' });
    }

    const messages = await TeamMessage.find({ team: id })
      .populate('sender', 'name email department skills role')
      .sort({ createdAt: 1 })
      .limit(300);

    return res.json({ success: true, count: messages.length, messages });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const uploadTeamChatFile = async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    const currentUserId = req.user._id.toString();
    const isMember = (team.members || []).some((m) => m.toString() === currentUserId) || 
                     (team.lead && team.lead.toString() === currentUserId);
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only team members can upload files to this channel.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const isImg = req.file.mimetype.startsWith('image/');
    const isPdf = req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf');
    const sizeStr = req.file.size > 1024 * 1024
      ? `${(req.file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(req.file.size / 1024)} KB`;

    const fileUrl = `/uploads/chat/${req.file.filename}`;

    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully!',
      attachment: {
        url: fileUrl,
        name: req.file.originalname,
        fileType: isImg ? 'image' : (isPdf ? 'pdf' : 'document'),
        size: sizeStr,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const sendTeamMessage = async (req, res) => {
  try {
    const { id } = req.params;
    let { text, codeSnippet, attachment } = req.body;

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    const currentUserId = req.user._id.toString();
    const isMember = (team.members || []).some((m) => m.toString() === currentUserId) || 
                     (team.lead && team.lead.toString() === currentUserId);
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only team members can chat in this channel.' });
    }

    // Parse codeSnippet if sent via multipart string
    if (typeof codeSnippet === 'string') {
      try {
        codeSnippet = JSON.parse(codeSnippet);
      } catch {
        codeSnippet = { code: codeSnippet, language: 'javascript' };
      }
    }

    // Parse attachment if sent via multipart string
    if (typeof attachment === 'string') {
      try {
        attachment = JSON.parse(attachment);
      } catch {
        attachment = undefined;
      }
    }

    // Handle file uploaded via multer in this same request
    if (req.file) {
      const isImg = req.file.mimetype.startsWith('image/');
      const isPdf = req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf');
      const sizeStr = req.file.size > 1024 * 1024
        ? `${(req.file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(req.file.size / 1024)} KB`;

      attachment = {
        url: `/uploads/chat/${req.file.filename}`,
        name: req.file.originalname,
        fileType: isImg ? 'image' : (isPdf ? 'pdf' : 'document'),
        size: sizeStr,
      };
    }

    const hasText = text && text.trim().length > 0;
    const hasCode = codeSnippet && codeSnippet.code && codeSnippet.code.trim().length > 0;
    const hasAttachment = attachment && attachment.url && attachment.url.trim().length > 0;

    if (!hasText && !hasCode && !hasAttachment) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }

    const newMessage = await TeamMessage.create({
      team: id,
      sender: req.user._id,
      text: text ? text.trim() : '',
      codeSnippet: hasCode
        ? {
            code: codeSnippet.code,
            language: codeSnippet.language || 'javascript',
          }
        : undefined,
      attachment: hasAttachment
        ? {
            url: attachment.url.trim(),
            name: attachment.name ? attachment.name.trim() : 'Attachment',
            fileType: attachment.fileType || 'other',
            size: attachment.size || '',
          }
        : undefined,
    });

    const populated = await TeamMessage.findById(newMessage._id).populate(
      'sender',
      'name email department skills role'
    );

    return res.status(201).json({ success: true, message: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
};
