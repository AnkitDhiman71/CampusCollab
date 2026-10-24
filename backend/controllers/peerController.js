const User = require('../models/userModel');
const Request = require('../models/requestModel');
const Team = require('../models/teamModel');
const { sendVideoCallEmail, sendTeamJoinedConfirmationEmail, sendPeerCollaborationRequestEmail, sendTechnicalTestAssignedEmail } = require('../config/nodemailer');
const { fetchGitHubData } = require('../utils/githubService');
const { explainCodeSnippet, evaluateAssessmentCode } = require('../utils/geminiService');
const { executeCode } = require('../utils/codeExecutionService');
const { createNotification } = require('../utils/notificationService');
const getAllPeers = async (req, res) => {
  try {
    const currentUserId = req.user ? req.user._id.toString() : null;

    let teammateIds = new Set();
    let acceptedIds = new Set();
    let requestedIds = new Set();

    if (currentUserId) {
      // Find user's teams
      const userTeams = await Team.find({ 
        $or: [{ lead: req.user._id }, { members: req.user._id }] 
      });
      userTeams.forEach((t) => {
        if (t.lead && t.lead.toString() !== currentUserId) teammateIds.add(t.lead.toString());
        (t.members || []).forEach((m) => {
          if (m && m.toString() !== currentUserId) teammateIds.add(m.toString());
        });
      });

      // Find accepted collaboration requests
      const acceptedRequests = await Request.find({
        $or: [
          { sender: req.user._id, status: 'accepted' },
          { recipient: req.user._id, status: 'accepted' },
        ],
      });
      acceptedRequests.forEach((r) => {
        if (r.sender && r.sender.toString() !== currentUserId) acceptedIds.add(r.sender.toString());
        if (r.recipient && r.recipient.toString() !== currentUserId) acceptedIds.add(r.recipient.toString());
      });

      // Find sent requests
      const sentRequests = await Request.find({ sender: req.user._id });
      sentRequests.forEach((r) => {
        if (['pending', 'accepted'].includes(r.status) && r.recipient) {
          requestedIds.add(r.recipient.toString());
        }
      });
    }

    const { department, skill } = req.query;

    // Fetch all student peers (exclude self if logged in as student; if admin, show all students)
    const query = { 
      role: { $ne: 'admin' },
    };
    if (currentUserId && req.user.role !== 'admin') {
      query._id = { $ne: req.user._id };
    }
    if (department && department !== 'All') {
      query.department = department;
    }
    if (skill && skill !== 'All') {
      const sanitizedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.skills = { $regex: new RegExp(sanitizedSkill, 'i') };
    }

    const peers = await User.find(query).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: peers.length,
      peers: peers.map((p) => {
        const skillsList = p.skills ? p.skills.split(',').map((s) => s.trim()).filter(Boolean) : ['General Skills'];
        return {
          id: p._id,
          _id: p._id,
          name: p.name || 'Student Candidate',
          email: p.email || '',
          department: p.department || 'General',
          semester: 'Active Student',
          skills: skillsList,
          available: p.openToWork !== false ? 'Available for Projects' : 'In a Project',
          role: p.role,
          bio: p.bio || '',
          githubUrl: p.githubUrl || '',
          ranking: p.ranking || 'Active Student',
          rankingPoints: p.rankingPoints || 500,
          projects: p.projects || [],
          repositories: p.repositories || [],
          githubStats: p.githubStats || null,
          hasRequested: requestedIds.has(p._id.toString()),
          isTeammate: teammateIds.has(p._id.toString()),
          isAccepted: acceptedIds.has(p._id.toString()),
          createdAt: p.createdAt,
        };
      }),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const sendRequest = async (req, res) => {
  try {
    const { recipientId, message, fileUrl, fileName, role } = req.body;
    if (req.user._id.toString() === recipientId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot send a collaboration request to yourself.' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ success: false, message: 'Peer candidate not found.' });

    if (recipient.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Collaboration requests can only be sent to student peers.' });
    }

    const existingReq = await Request.findOne({
      sender: req.user._id,
      recipient: recipientId,
      status: { $in: ['pending', 'accepted'] },
    });
    if (existingReq) {
      return res.status(400).json({ success: false, message: 'A request has already been sent to this peer.' });
    }

    const request = await Request.create({
      sender: req.user._id,
      recipient: recipientId,
      message: message.trim(),
      fileUrl: fileUrl ? fileUrl.trim() : '',
      fileName: fileName ? fileName.trim() : '',
      role: role ? role.trim() : '',
      requestType: 'peer',
    });

    // Send email notification to the recipient peer's email address
    let emailStatus = '';
    try {
      const mailResult = await sendPeerCollaborationRequestEmail({
        toEmail: recipient.email,
        recipientName: recipient.name,
        senderName: req.user.name,
        senderEmail: req.user.email,
        senderDepartment: req.user.department || 'Student',
        senderSkills: req.user.skills || '',
        message: message.trim(),
        role: role ? role.trim() : '',
        fileUrl: fileUrl ? fileUrl.trim() : '',
        fileName: fileName ? fileName.trim() : '',
      });
      if (mailResult && mailResult.success) {
        emailStatus = ` An email notification was sent to ${recipient.email}.`;
      }
    } catch (mailErr) {
      console.error('[Email Notification Error] Could not dispatch peer collaboration email:', mailErr.message);
    }

    // Dispatch In-App Notification to recipient
    createNotification({
      recipient: recipientId,
      sender: req.user._id,
      type: 'PEER_REQUEST',
      title: 'New Peer Request',
      message: `New peer request received from ${req.user.name}${role ? ` for "${role}"` : ''}`,
      link: '/requests',
    });

    return res.status(201).json({
      success: true,
      message: `Collaboration request sent successfully!${emailStatus}`,
      request,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getMyRequests = async (req, res) => {
  try {
    const incoming = await Request.find({ recipient: req.user._id })
      .populate('sender', 'name email department skills bio githubUrl ranking rankingPoints projects repositories githubStats openToWork')
      .populate('team', 'title tech description')
      .sort({ createdAt: -1 });

    const sent = await Request.find({ sender: req.user._id })
      .populate('recipient', 'name email department skills bio githubUrl ranking rankingPoints projects repositories githubStats openToWork')
      .populate('team', 'title tech description')
      .sort({ createdAt: -1 });

    const mapRequestUser = (user) => {
      if (!user) {
        return {
          id: null,
          _id: null,
          name: 'Unknown Candidate',
          email: '',
          department: 'General',
          skills: ['General Skills'],
          bio: '',
          githubUrl: 'https://github.com',
          ranking: 'Peer Contributor',
          rankingPoints: 750,
          projects: [],
          repositories: [],
          githubStats: null,
          openToWork: true,
        };
      }
      const skillsList = user.skills ? user.skills.split(',').map((s) => s.trim()).filter(Boolean) : ['General Skills'];
      return {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        department: user.department || 'General',
        skills: skillsList,
        bio: user.bio || '',
        githubUrl: user.githubUrl || '',
        ranking: user.ranking || 'Active Student',
        rankingPoints: user.rankingPoints || 500,
        projects: user.projects || [],
        repositories: user.repositories || [],
        githubStats: user.githubStats || null,
        openToWork: user.openToWork !== false,
      };
    };

    return res.json({
      success: true,
      incoming: incoming.map((r) => {
        const peerProfile = mapRequestUser(r.sender);
        return {
          id: r._id,
          _id: r._id,
          peerId: peerProfile.id,
          name: peerProfile.name,
          email: peerProfile.email,
          department: peerProfile.department,
          semester: 'Project Partner',
          skills: peerProfile.skills,
          bio: peerProfile.bio,
          githubUrl: peerProfile.githubUrl,
          ranking: peerProfile.ranking,
          rankingPoints: peerProfile.rankingPoints,
          projects: peerProfile.projects,
          repositories: peerProfile.repositories,
          githubStats: peerProfile.githubStats,
          profile: peerProfile,
          team: r.team || null,
          requestType: r.requestType || 'peer',
          role: r.role || '',
          message: r.message,
          status: r.status,
          interactionRequested: r.interactionRequested || false,
          interactionRequestedAt: r.interactionRequestedAt,
          interactionCompleted: r.interactionCompleted || false,
          interactionCompletedAt: r.interactionCompletedAt,
          leadAllowedJoin: r.leadAllowedJoin || false,
          leadAllowedJoinAt: r.leadAllowedJoinAt || null,
          scheduledDate: r.scheduledDate || '',
          scheduledTime: r.scheduledTime || '',
          duration: r.duration || 30,
          timezone: r.timezone || 'IST',
          meetingLink: r.meetingLink || '',
          calendarLink: r.calendarLink || '',
          fileUrl: r.fileUrl || '',
          fileName: r.fileName || '',
          testDetails: r.testDetails || null,
          time: new Date(r.createdAt).toLocaleDateString(),
        };
      }),
      sent: sent.map((r) => {
        const peerProfile = mapRequestUser(r.recipient);
        return {
          id: r._id,
          _id: r._id,
          recipientId: peerProfile.id,
          peerId: peerProfile.id,
          name: peerProfile.name,
          email: peerProfile.email,
          department: peerProfile.department,
          skills: peerProfile.skills,
          bio: peerProfile.bio,
          githubUrl: peerProfile.githubUrl,
          ranking: peerProfile.ranking,
          rankingPoints: peerProfile.rankingPoints,
          projects: peerProfile.projects,
          repositories: peerProfile.repositories,
          githubStats: peerProfile.githubStats,
          profile: peerProfile,
          team: r.team || null,
          requestType: r.requestType || 'peer',
          role: r.role || '',
          message: r.message,
          status: r.status,
          interactionRequested: r.interactionRequested || false,
          interactionRequestedAt: r.interactionRequestedAt,
          interactionCompleted: r.interactionCompleted || false,
          interactionCompletedAt: r.interactionCompletedAt,
          leadAllowedJoin: r.leadAllowedJoin || false,
          leadAllowedJoinAt: r.leadAllowedJoinAt || null,
          scheduledDate: r.scheduledDate || '',
          scheduledTime: r.scheduledTime || '',
          duration: r.duration || 30,
          timezone: r.timezone || 'IST',
          meetingLink: r.meetingLink || '',
          calendarLink: r.calendarLink || '',
          fileUrl: r.fileUrl || '',
          fileName: r.fileName || '',
          testDetails: r.testDetails || null,
          time: new Date(r.createdAt).toLocaleDateString(),
        };
      }),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    // Allow either the recipient or the sender (evaluator reviewing test) to update request
    const request = await Request.findOne({
      _id: req.params.id,
      $or: [{ recipient: req.user._id }, { sender: req.user._id }],
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    if (status === 'accepted') {
      const isSender = request.sender.toString() === req.user._id.toString();
      const isRecipient = request.recipient.toString() === req.user._id.toString();

      // Flow 1: For peer requests or team invitations, candidate recipient cannot accept until the sender/lead explicitly allows them.
      // Flow 2: For team join requests, the recipient IS the Team Lead who has full authority to evaluate and accept the applicant.
      if (isRecipient && !isSender && request.requestType !== 'team_join_request') {
        if (!request.leadAllowedJoin) {
          return res.status(403).json({
            success: false,
            message: 'Cannot accept offer: The request sender / Team Lead has not yet approved or allowed you to join. Please wait for them to allow you or click Accept Offer.',
          });
        }
      }

      // 1. Technical Test verification check
      if (request.testDetails?.isAssigned && request.testDetails?.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Cannot accept request: The assigned technical assessment has not been completed yet.',
        });
      }

      // 2. Video Sync verification check
      if (request.interactionRequested && !request.interactionCompleted) {
        return res.status(400).json({
          success: false,
          message: 'Cannot accept request: The scheduled video sync interaction must be held and verified before acceptance.',
        });
      }

      // If the Team Lead is directly accepting, mark leadAllowedJoin as true as well
      if (isSender || request.requestType === 'team_join_request') {
        request.leadAllowedJoin = true;
        request.leadAllowedJoinAt = request.leadAllowedJoinAt || new Date();
      }
    }

    request.status = status;
    await request.save();

    if (status === 'accepted') {
      // Determine candidate to be added to the team
      const candidateId = request.testDetails?.candidate || 
        (request.requestType === 'team_join_request' ? request.sender : request.recipient);

      let targetTeam = null;

      // 1. If request is linked to a team, use that team
      if (request.team) {
        targetTeam = await Team.findById(request.team).populate('lead', 'name email');
      }

      // 2. If no team attached yet, find the team where the evaluator/team lead is lead
      if (!targetTeam) {
        const evaluatorId = request.testDetails?.assignedBy || 
          (request.requestType === 'team_join_request' ? request.recipient : request.sender);

        targetTeam = await Team.findOne({ lead: evaluatorId }).sort({ createdAt: -1 }).populate('lead', 'name email');
        if (!targetTeam) {
          targetTeam = await Team.findOne({ members: evaluatorId }).sort({ createdAt: -1 }).populate('lead', 'name email');
        }
      }

      // 3. If no team exists, return noTeam flag so user can be redirected to Create Team page
      if (!targetTeam) {
        const candidateUser = candidateId ? await User.findById(candidateId).select('name email') : null;
        return res.json({
          success: true,
          noTeam: true,
          candidateId,
          candidateName: candidateUser?.name || 'Candidate',
          message: 'Candidate approved! No team exists yet. Redirecting to Create Team page to add them...',
          request,
        });
      }

      // 4. Ensure candidate is added to targetTeam members
      if (targetTeam && candidateId) {
        const candidateStr = candidateId.toString();
        if (!targetTeam.members.some((m) => m.toString() === candidateStr)) {
          targetTeam.members.push(candidateId);
          await targetTeam.save();
        }

        // Link request to the team if not already
        if (!request.team) {
          request.team = targetTeam._id;
          await request.save();
        }

        // Send confirmation email via Nodemailer
        const memberUser = await User.findById(candidateId);
        if (memberUser && memberUser.email) {
          sendTeamJoinedConfirmationEmail({
            toEmail: memberUser.email,
            memberName: memberUser.name || 'Student Member',
            teamTitle: targetTeam.title,
            teamLeadName: targetTeam.lead?.name || 'Team Lead',
            teamLeadEmail: targetTeam.lead?.email || '',
          }).catch((err) => console.error('Failed to send team joined email:', err));
        }

        // Dispatch In-App Notification to candidate
        createNotification({
          recipient: candidateId,
          sender: req.user._id,
          type: 'TEAM_ACCEPTED',
          title: 'Congratulations!',
          message: `Congratulations! You have been accepted into Team "${targetTeam.title}"`,
          link: '/teams',
        });
      }
    }

    return res.json({ 
      success: true, 
      message: status === 'accepted' 
        ? 'Accepted successfully! Candidate has been added to the project team.' 
        : `Request ${status} successfully.`,
      request,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getPeerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Peer candidate not found.' });
    }

    const skillsList = user.skills ? user.skills.split(',').map((s) => s.trim()).filter(Boolean) : ['General Skills'];
    const profile = {
      id: user._id,
      _id: user._id,
      name: user.name,
      email: user.email,
      department: user.department || 'General',
      skills: skillsList,
      bio: user.bio || '',
      githubUrl: user.githubUrl || '',
      ranking: user.ranking || 'Active Student',
      rankingPoints: user.rankingPoints || 500,
      projects: user.projects || [],
      repositories: user.repositories || [],
      githubStats: user.githubStats || null,
      openToWork: user.openToWork !== false,
      createdAt: user.createdAt,
    };

    return res.json({ success: true, profile });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getGitHubProfile = async (req, res) => {
  try {
    const { username } = req.params;
    if (!username || !username.trim()) {
      return res.status(400).json({ success: false, message: 'GitHub username is required.' });
    }

    const data = await fetchGitHubData(username);
    return res.json({ success: true, ...data });
  } catch (error) {
    const statusCode = error.statusCode || 400;
    if (statusCode === 404) {
      return res.status(404).json({ success: false, notFound: true, message: error.message });
    }
    return res.status(statusCode).json({ success: false, message: error.message || 'Failed to fetch GitHub statistics' });
  }
};

const requestInteraction = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customNote,
      meetingUrl,
      fileUrl,
      fileName,
      scheduledDate,
      scheduledTime,
      duration = 30,
      timezone = 'IST',
    } = req.body || {};

    const request = await Request.findById(id)
      .populate('sender', 'name email department')
      .populate('recipient', 'name email department');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    if (request.status === 'rejected') {
      return res.status(400).json({ success: false, message: 'Cannot schedule video call for rejected requests.' });
    }

    const currentUserId = req.user._id.toString();
    const isSender = request.sender?._id?.toString() === currentUserId;
    const isRecipient = request.recipient?._id?.toString() === currentUserId;

    if (!isSender && !isRecipient) {
      return res.status(403).json({ success: false, message: 'You are not authorized to interact on this request.' });
    }

    // Target to receive the email is the other party
    const targetMember = isSender ? request.recipient : request.sender;
    const initiatingUser = isSender ? request.sender : request.recipient;

    if (!targetMember || !targetMember.email) {
      return res.status(400).json({ success: false, message: 'Target member email not found.' });
    }

    // Generate video call room link (or use provided custom link)
    const roomId = `CampusCollab-${request._id.toString().slice(-8)}-${Date.now().toString(36)}`;
    const finalMeetingLink = meetingUrl?.trim() || `https://meet.jit.si/${roomId}`;

    // Update attached file info if provided
    if (fileUrl) {
      request.fileUrl = fileUrl.trim();
      request.fileName = fileName?.trim() || 'Shared Project File';
    }

    let calendarLink = '';
    if (scheduledDate && scheduledTime) {
      try {
        const startDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
        if (!isNaN(startDateTime.getTime())) {
          const endDateTime = new Date(startDateTime.getTime() + (Number(duration) || 30) * 60000);
          const formatISO = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
          const title = encodeURIComponent(`CampusCollab Project Sync: ${initiatingUser.name} & ${targetMember.name}`);
          const details = encodeURIComponent(`${customNote || request.message}\n\nVideo Room: ${finalMeetingLink}`);
          calendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatISO(startDateTime)}/${formatISO(endDateTime)}&details=${details}&location=${encodeURIComponent(finalMeetingLink)}`;
        }
      } catch (e) {
        console.error('Failed to construct calendar link:', e);
      }
    }

    request.interactionRequested = true;
    request.interactionRequestedAt = new Date();
    request.meetingLink = finalMeetingLink;
    request.scheduledDate = scheduledDate || '';
    request.scheduledTime = scheduledTime || '';
    request.duration = Number(duration) || 30;
    request.timezone = timezone || 'IST';
    request.calendarLink = calendarLink;
    await request.save();

    // Send video call invite email with CC to sender
    const mailResult = await sendVideoCallEmail({
      toEmail: targetMember.email,
      recipientName: targetMember.name,
      senderName: initiatingUser.name,
      senderEmail: initiatingUser.email,
      message: customNote?.trim() || request.message,
      meetingLink: finalMeetingLink,
      scheduledDate: request.scheduledDate,
      scheduledTime: request.scheduledTime,
      duration: request.duration,
      timezone: request.timezone,
      calendarLink: request.calendarLink,
      fileUrl: request.fileUrl,
      fileName: request.fileName,
    });

    const isDelivered = mailResult && mailResult.success;
    return res.json({
      success: true,
      message: isDelivered
        ? `Video sync invite delivered to ${targetMember.name} (${targetMember.email}) and a copy sent to ${initiatingUser.email}!`
        : `Video sync scheduled! (Email notice: ${mailResult?.warning || 'Sent in dev mode'})`,
      meetingLink: finalMeetingLink,
      scheduledDate: request.scheduledDate,
      scheduledTime: request.scheduledTime,
      duration: request.duration,
      timezone: request.timezone,
      calendarLink: request.calendarLink,
      targetEmail: targetMember.email,
    });
  } catch (error) {
    console.error('Error requesting interaction:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await Request.findById(id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const isSender = request.sender.toString() === req.user._id.toString();
    const isRecipient = request.recipient.toString() === req.user._id.toString();

    if (!isSender && !isRecipient) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this request.' });
    }

    await Request.findByIdAndDelete(id);

    return res.json({ success: true, message: 'Request deleted from database successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const assignTechnicalTest = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      language = 'javascript',
      timeLimitMinutes = 30,
      starterCode = '',
      testCases = [],
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Assessment title is required.' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Assessment problem description is required.' });
    }

    const formattedTestCases = Array.isArray(testCases)
      ? testCases
          .filter((tc) => tc && (tc.input !== undefined || tc.expectedOutput !== undefined))
          .map((tc) => ({
            input: String(tc.input || '').trim(),
            expectedOutput: String(tc.expectedOutput || '').trim(),
            explanation: String(tc.explanation || '').trim(),
          }))
      : [];

    const request = await Request.findById(id)
      .populate('sender', 'name email')
      .populate('recipient', 'name email')
      .populate('team', 'title');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const currentUserId = req.user._id.toString();
    const isRecipient = request.recipient?._id?.toString() === currentUserId;
    const isSender = request.sender?._id?.toString() === currentUserId;

    if (!isRecipient && !isSender) {
      return res.status(403).json({ success: false, message: 'You are not authorized on this request.' });
    }

    let evaluatorUser;
    let candidateUser;

    if (request.requestType === 'team_join_request') {
      if (!isRecipient) {
        return res.status(403).json({ success: false, message: 'Only the team lead can assign technical assessments to applicants.' });
      }
      evaluatorUser = request.recipient;
      candidateUser = request.sender;
    } else if (request.requestType === 'team_invite') {
      if (!isSender) {
        return res.status(403).json({ success: false, message: 'Only the team lead who sent the invitation can assign technical assessments.' });
      }
      evaluatorUser = request.sender;
      candidateUser = request.recipient;
    } else {
      // Direct peer collaboration request: the initiator/sender is the assigner
      if (!isSender) {
        return res.status(403).json({ success: false, message: 'Only the peer who initiated the collaboration request can assign technical assessments.' });
      }
      evaluatorUser = request.sender;
      candidateUser = request.recipient;
    }

    request.testDetails = {
      isAssigned: true,
      assignedBy: evaluatorUser._id,
      candidate: candidateUser._id,
      title: title.trim(),
      description: description.trim(),
      language: language.toLowerCase().trim() || 'javascript',
      timeLimitMinutes: Number(timeLimitMinutes) || 30,
      starterCode: starterCode || '',
      testCases: formattedTestCases,
      assignedAt: new Date(),
      status: 'pending',
      submittedCode: '',
      submittedAt: null,
      timeSpentSeconds: 0,
      violationsCount: 0,
      violationLogs: [],
      outputLog: '',
      score: '',
      feedback: '',
    };

    await request.save();

    const clientUrl = process.env.CLIENT_URL || process.env.RENDER_EXTERNAL_URL || 'https://campuscollab.onrender.com';
    const testUrl = `${clientUrl.replace(/\/+$/, '')}/test/${request._id}`;

    if (candidateUser?.email) {
      sendTechnicalTestAssignedEmail({
        toEmail: candidateUser.email,
        candidateName: candidateUser.name || 'Candidate',
        teamLeadName: evaluatorUser?.name || 'Team Lead',
        teamTitle: request.team?.title || 'Collaboration Project',
        testTitle: title.trim(),
        timeLimitMinutes: Number(timeLimitMinutes) || 30,
        testUrl,
      }).catch((err) => console.error('Failed to send technical test email:', err));
    }

    // Dispatch In-App Notification to candidate
    createNotification({
      recipient: candidateUser._id,
      sender: evaluatorUser._id,
      type: 'TEST_ASSIGNED',
      title: 'Technical Test Assigned',
      message: `Technical test assigned: "${title.trim()}" due in 48 hours`,
      link: `/test/${request._id}`,
    });

    return res.json({
      success: true,
      message: `Technical assessment "${title}" successfully assigned to ${candidateUser?.name || 'candidate'}! Notification email sent.`,
      testDetails: request.testDetails,
    });
  } catch (error) {
    console.error('Error assigning technical test:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getTechnicalTest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await Request.findById(id)
      .populate('sender', 'name email department')
      .populate('recipient', 'name email department')
      .populate('team', 'title tech');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const currentUserId = req.user._id.toString();
    const isSender = request.sender?._id?.toString() === currentUserId;
    const isRecipient = request.recipient?._id?.toString() === currentUserId;

    if (!isSender && !isRecipient) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (!request.testDetails || !request.testDetails.isAssigned) {
      return res.status(400).json({ success: false, message: 'No technical assessment has been assigned for this request.' });
    }

    const candidateId = request.testDetails?.candidate?.toString() || 
      (request.requestType === 'team_join_request' ? request.sender?._id?.toString() : request.recipient?._id?.toString());
    const isApplicant = currentUserId === candidateId;

    const candidateDoc = candidateId === request.sender?._id?.toString() ? request.sender : request.recipient;
    const teamLeadDoc = candidateId === request.sender?._id?.toString() ? request.recipient : request.sender;

    return res.json({
      success: true,
      test: request.testDetails,
      team: request.team,
      isApplicant,
      candidate: candidateDoc,
      teamLead: teamLeadDoc,
      role: request.role,
      requestStatus: request.status,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const startTechnicalTest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await Request.findById(id);

    if (!request || !request.testDetails?.isAssigned) {
      return res.status(404).json({ success: false, message: 'Assessment not found.' });
    }

    const currentUserId = req.user._id.toString();
    const isSender = request.sender?.toString() === currentUserId;
    const isRecipient = request.recipient?.toString() === currentUserId;

    if (!isSender && !isRecipient) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const candidateId = request.testDetails?.candidate?.toString() || 
      (request.requestType === 'team_join_request' ? request.sender?.toString() : request.recipient?.toString());
    if (currentUserId !== candidateId) {
      return res.status(403).json({ success: false, message: 'Only the candidate assigned to this assessment can take it.' });
    }

    if (request.testDetails.status === 'pending') {
      request.testDetails.status = 'in_progress';
      request.testDetails.startedAt = new Date();
      await request.save();
    }

    return res.json({
      success: true,
      message: 'Assessment started.',
      testDetails: request.testDetails,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const submitTechnicalTest = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      submittedCode = '',
      timeSpentSeconds = 0,
      violationsCount = 0,
      violationLogs = [],
      outputLog = '',
      autoTerminated = false,
    } = req.body;

    const request = await Request.findById(id);
    if (!request || !request.testDetails?.isAssigned) {
      return res.status(404).json({ success: false, message: 'Assessment not found.' });
    }

    const currentUserId = req.user._id.toString();
    const isSender = request.sender?.toString() === currentUserId;
    const isRecipient = request.recipient?.toString() === currentUserId;

    if (!isSender && !isRecipient) {
      return res.status(403).json({ success: false, message: 'Unauthorized submission.' });
    }

    const candidateId = request.testDetails?.candidate?.toString() || 
      (request.requestType === 'team_join_request' ? request.sender?.toString() : request.recipient?.toString());
    if (currentUserId !== candidateId) {
      return res.status(403).json({ success: false, message: 'Only the candidate assigned to this assessment can submit it.' });
    }

    request.testDetails.submittedCode = submittedCode;
    request.testDetails.timeSpentSeconds = Number(timeSpentSeconds) || 0;
    request.testDetails.violationsCount = Number(violationsCount) || 0;
    request.testDetails.violationLogs = Array.isArray(violationLogs) ? violationLogs : [];
    request.testDetails.outputLog = outputLog;
    request.testDetails.submittedAt = new Date();

    if (autoTerminated || Number(violationsCount) >= 3) {
      request.testDetails.status = 'terminated_violations';
    } else {
      request.testDetails.status = 'completed';
    }

    await request.save();

    // Respond immediately to candidate for instant sub-second submission
    res.json({
      success: true,
      message: request.testDetails.status === 'terminated_violations'
        ? 'Assessment auto-submitted due to security policy violations.'
        : 'Assessment submitted successfully! The Team Lead has been notified to review your code.',
      testDetails: request.testDetails,
    });

    // Run AI evaluation in the background without blocking the candidate
    setImmediate(async () => {
      try {
        const aiRes = await evaluateAssessmentCode({
          title: request.testDetails.title || 'Technical Challenge',
          description: request.testDetails.description || '',
          language: request.testDetails.language || 'javascript',
          submittedCode,
          outputLog,
          violationsCount: Number(violationsCount) || 0,
        });
        if (aiRes?.success && aiRes.data) {
          await Request.findByIdAndUpdate(id, {
            $set: {
              'testDetails.aiEvaluation': {
                ...aiRes.data,
                evaluatedAt: new Date(),
              },
            },
          });
        }
      } catch (aiErr) {
        console.warn('AI evaluation background error:', aiErr.message);
      }
    });
    return;
  } catch (error) {
    console.error('Error submitting technical test:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const reviewTechnicalTest = async (req, res) => {
  try {
    const { id } = req.params;
    const { score, feedback } = req.body;

    const request = await Request.findById(id);
    if (!request || !request.testDetails?.isAssigned) {
      return res.status(404).json({ success: false, message: 'Assessment not found.' });
    }

    const currentUserId = req.user._id.toString();
    const isSender = request.sender?.toString() === currentUserId;
    const isRecipient = request.recipient?.toString() === currentUserId;

    if (!isSender && !isRecipient) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const assignedById = request.testDetails?.assignedBy?.toString() || 
      (request.requestType === 'team_join_request' ? request.recipient?.toString() : request.sender?.toString());
    if (currentUserId !== assignedById) {
      return res.status(403).json({ success: false, message: 'Only the reviewer who assigned this assessment can review it.' });
    }

    if (score !== undefined) request.testDetails.score = score;
    if (feedback !== undefined) request.testDetails.feedback = feedback;

    await request.save();

    return res.json({
      success: true,
      message: 'Assessment review updated.',
      testDetails: request.testDetails,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const aiExplainCode = async (req, res) => {
  try {
    const { code, language = 'javascript', context = '' } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide code to explain.' });
    }
    const result = await explainCodeSnippet(code, language, context);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const aiEvaluateAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await Request.findById(id);
    if (!request || !request.testDetails?.isAssigned) {
      return res.status(404).json({ success: false, message: 'Assessment not found.' });
    }

    const test = request.testDetails;
    const aiResult = await evaluateAssessmentCode({
      title: test.title || 'Technical Challenge',
      description: test.description || '',
      language: test.language || 'javascript',
      submittedCode: test.submittedCode || '',
      outputLog: test.outputLog || '',
      violationsCount: test.violationsCount || 0,
    });

    if (aiResult?.success && aiResult.data) {
      request.testDetails.aiEvaluation = {
        ...aiResult.data,
        evaluatedAt: new Date(),
      };
      await request.save();
    }

    return res.json({
      success: true,
      aiEvaluation: request.testDetails.aiEvaluation,
      provider: aiResult.provider,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const runCodeSnippet = async (req, res) => {
  try {
    const { code, language = 'javascript', stdin = '' } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, message: 'Source code is required.' });
    }

    const result = await executeCode({ code, language, stdin });
    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error in runCodeSnippet:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const markInteractionCompleted = async (req, res) => {
  try {
    const request = await Request.findOne({
      _id: req.params.id,
      $or: [{ recipient: req.user._id }, { sender: req.user._id }],
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    request.interactionCompleted = true;
    request.interactionCompletedAt = new Date();
    await request.save();

    return res.json({
      success: true,
      message: 'Video sync interaction marked as verified and completed.',
      interactionCompleted: true,
      interactionCompletedAt: request.interactionCompletedAt,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const allowCandidateToJoin = async (req, res) => {
  try {
    const { allow = true } = req.body;
    const request = await Request.findOne({
      _id: req.params.id,
      $or: [{ recipient: req.user._id }, { sender: req.user._id }],
    }).populate('team', 'title');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const isSender = request.sender.toString() === req.user._id.toString();
    const isRecipient = request.recipient.toString() === req.user._id.toString();

    // The sender who sent the invite or the lead who received a join request can allow
    const canAllow = isSender || (request.requestType === 'team_join_request' && isRecipient);

    if (!canAllow) {
      return res.status(403).json({ success: false, message: 'Only the request sender or Team Lead can allow a candidate to join.' });
    }

    request.leadAllowedJoin = Boolean(allow);
    request.leadAllowedJoinAt = allow ? new Date() : null;
    await request.save();

    const candidateId = request.requestType === 'team_join_request' ? request.sender : request.recipient;

    if (allow && candidateId) {
      const teamTitle = request.team?.title || 'the collaboration project';
      createNotification({
        recipient: candidateId,
        sender: req.user._id,
        type: 'TEAM_ACCEPTED',
        title: 'Offer Approved by Sender!',
        message: `${req.user.name || 'The Team Lead'} has approved you! You can now accept the offer on your Requests page.`,
        link: '/requests',
      });
    }

    return res.json({
      success: true,
      message: allow
        ? 'Candidate has been approved and allowed to join! They can now accept the offer.'
        : 'Candidate permission to join has been revoked.',
      leadAllowedJoin: request.leadAllowedJoin,
      leadAllowedJoinAt: request.leadAllowedJoinAt,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { 
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
  runCodeSnippet,
  markInteractionCompleted,
  allowCandidateToJoin,
};

