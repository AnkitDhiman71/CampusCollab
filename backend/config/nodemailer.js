require('dotenv').config();
const nodemailer = require('nodemailer');

const getBaseAppUrl = () => {
  if (process.env.CLIENT_URL) return process.env.CLIENT_URL.replace(/\/+$/, '');
  if (process.env.RENDER_EXTERNAL_URL) return process.env.RENDER_EXTERNAL_URL.replace(/\/+$/, '');
  return 'https://campuscollab.onrender.com';
};

// Helper to send via Resend API (HTTPS Port 443 - 100% immune to cloud SMTP blocks)
const sendViaResend = async ({ to, subject, html, text, fromName = 'CampusCollab' }) => {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  if (!apiKey) return null;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <onboarding@resend.dev>`,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
      }),
    });
    const data = await res.json();
    if (res.ok && data?.id) {
      console.log(`[Resend HTTP API] Successfully delivered to ${to}, ID: ${data.id}`);
      return { success: true, messageId: data.id };
    }
    console.error(`[Resend HTTP Error]:`, data);
  } catch (err) {
    console.error(`[Resend HTTP Fetch Error]:`, err.message);
  }
  return null;
};

const isAdminEmail = (email) => {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();
  const configuredAdmin = (process.env.ADMIN_EMAIL || 'admin@campuscollab.edu').toLowerCase().trim();
  return cleanEmail === configuredAdmin;
};

let cachedTransporter = null;

const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '').trim();

  if (process.env.EMAIL_HOST) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: { user, pass },
      pool: true,
      maxConnections: 5,
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 5000,
    });
    return cachedTransporter;
  }

  // Fast direct SSL connection on port 465 with 4s timeout so cloud firewalls don't hang requests
  cachedTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    auth: { user, pass },
    connectionTimeout: 4000,
    greetingTimeout: 4000,
    socketTimeout: 5000,
  });

  return cachedTransporter;
};

const sendOtpEmail = async (email, otp) => {
  if (isAdminEmail(email)) {
    return { success: true, skipped: true, isAdmin: true, message: 'Admin email detected.' };
  }

  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '').trim();

  // Try Resend HTTPS API first if configured (100% immune to cloud SMTP blocks)
  if (process.env.RESEND_API_KEY) {
    const resendRes = await sendViaResend({
      to: email,
      subject: `Your Verification Code: ${otp} - CampusCollab`,
      text: `Your CampusCollab Student Registration OTP is: ${otp}. Valid for 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #4f46e5;">CampusCollab Registration</h2>
          <p style="color: #475569; font-size: 15px;">Use the OTP below to verify your student email address.</p>
          <div style="background-color: #f1f5f9; padding: 18px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1e293b;">${otp}</span>
          </div>
          <p style="color: #64748b; font-size: 13px;">This OTP is valid for <strong>5 minutes</strong>.</p>
        </div>
      `,
    });
    if (resendRes?.success) return resendRes;
  }

  if (!user || !pass) {
    console.log(`[Email Service] Warning: EMAIL_USER or EMAIL_PASS not configured. Dev OTP: ${otp}`);
    return { success: true, devMode: true, otp };
  }

  const transporter = getTransporter();

  const mailOptions = {
    from: `"CampusCollab" <${user}>`,
    to: email,
    subject: `Your Verification Code: ${otp} - CampusCollab`,
    text: `Your CampusCollab Student Registration OTP is: ${otp}. Valid for 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #4f46e5;">CampusCollab Registration</h2>
        <p style="color: #475569; font-size: 15px;">Use the OTP below to verify your student email address.</p>
        <div style="background-color: #f1f5f9; padding: 18px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1e293b;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 13px;">This OTP is valid for <strong>5 minutes</strong>.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] OTP successfully delivered to ${email}, MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service Error] Failed to send OTP to ${email}:`, error.message);
    return { success: true, devMode: true, warning: error.message, otp };
  }
};

const sendVideoCallEmail = async ({
  toEmail,
  recipientName,
  senderName,
  senderEmail,
  message,
  meetingLink,
  scheduledDate,
  scheduledTime,
  duration = 30,
  timezone = 'IST',
  calendarLink,
  fileUrl,
  fileName,
}) => {
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '').trim();

  if (!user || !pass) {
    return { success: true, devMode: true, meetingLink, message: 'Dev mode: email credentials not set' };
  }

  const transporter = getTransporter();

  const shouldCcSender = senderEmail && senderEmail.toLowerCase().trim() !== toEmail.toLowerCase().trim();
  const formattedSchedule = scheduledDate && scheduledTime ? `${scheduledDate} at ${scheduledTime} (${timezone}, ${duration} mins)` : 'Immediate / Flexible';

  const mailOptions = {
    from: `"${senderName} (CampusCollab)" <${user}>`,
    to: toEmail,
    cc: shouldCcSender ? senderEmail.trim() : undefined,
    replyTo: senderEmail ? `"${senderName}" <${senderEmail.trim()}>` : user,
    subject: `🎥 Scheduled Video Sync (${formattedSchedule}) from ${senderName} - CampusCollab`,
    text: `Hello ${recipientName},\n\n${senderName} (${senderEmail}) has scheduled a video sync interaction on CampusCollab.\n\nDate & Time: ${formattedSchedule}\nProject / Discussion Note: "${message || 'Collaboration interaction'}"\n\nVideo Call Meeting Room:\n${meetingLink}\n${calendarLink ? `Add to Google Calendar: ${calendarLink}\n` : ''}${fileUrl ? `\nAttached Project File: ${fileUrl}\n` : ''}\nBest regards,\nCampusCollab Team`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #0b1120; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; color: #e2e8f0;">
        <div style="background: linear-gradient(135deg, #ea580c 0%, #f97316 100%); padding: 24px 28px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">CampusCollab</h1>
          <p style="color: #ffedd5; margin: 4px 0 0 0; font-size: 13px;">Peer Collaboration & Mentorship Network</p>
        </div>

        <div style="padding: 28px;">
          <div style="display: inline-block; background-color: rgba(249, 115, 22, 0.15); border: 1px solid rgba(249, 115, 22, 0.4); border-radius: 8px; padding: 6px 12px; margin-bottom: 16px;">
            <span style="color: #fb923c; font-size: 12px; font-weight: 700;">🎥 Scheduled Video Sync Interaction</span>
          </div>

          <h2 style="color: #ffffff; font-size: 18px; margin: 0 0 10px 0;">Hello ${recipientName},</h2>
          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
            <strong style="color: #f8fafc;">${senderName}</strong> (<a href="mailto:${senderEmail}" style="color: #fb923c; text-decoration: none;">${senderEmail}</a>) has scheduled a video sync to review goals, discuss skills, and align expectations before formal team invitation or acceptance!
          </p>

          <div style="background-color: #030712; border: 1px solid #334155; border-radius: 12px; padding: 18px; margin: 18px 0;">
            <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Scheduled Time</div>
            <div style="color: #fb923c; font-size: 16px; font-weight: 800; margin-top: 4px;">📅 ${formattedSchedule}</div>
          </div>

          ${message ? `
          <div style="background-color: #1e293b; border-left: 4px solid #f97316; padding: 12px 16px; border-radius: 6px; margin: 18px 0;">
            <p style="margin: 0; color: #cbd5e1; font-size: 13px; font-style: italic;">
              "${message}"
            </p>
          </div>` : ''}

          ${fileUrl ? `
          <div style="background-color: #030712; border: 1px dashed #f97316; border-radius: 10px; padding: 14px 18px; margin: 20px 0;">
            <p style="margin: 0 0 6px 0; color: #fb923c; font-size: 12px; font-weight: 700;">📎 Attached Project File / Document:</p>
            <a href="${fileUrl}" target="_blank" style="color: #38bdf8; font-size: 13px; font-weight: 700; text-decoration: underline;">
              ${fileName || 'View Shared Project File / Document'} &rarr;
            </a>
          </div>` : ''}

          <div style="background-color: #030712; border: 1px solid #334155; border-radius: 12px; padding: 22px; text-align: center; margin: 24px 0;">
            <p style="margin: 0 0 14px 0; color: #94a3b8; font-size: 13px; font-weight: 600;">Meeting Room Details:</p>
            <a href="${meetingLink}" target="_blank" style="display: inline-block; background-color: #f97316; color: #030712; font-weight: 800; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.35);">
              Join Video Call Room
            </a>
            ${calendarLink ? `
            <div style="margin-top: 12px;">
              <a href="${calendarLink}" target="_blank" style="color: #38bdf8; font-size: 12px; font-weight: 700; text-decoration: underline;">
                + Add Event to Google Calendar
              </a>
            </div>` : ''}
            <p style="margin: 14px 0 0 0; color: #64748b; font-size: 11px; word-break: break-all;">
              Direct Meeting Link: <a href="${meetingLink}" style="color: #94a3b8;">${meetingLink}</a>
            </p>
          </div>

          <p style="color: #64748b; font-size: 12px; margin: 24px 0 0 0; border-top: 1px solid #1e293b; padding-top: 14px; line-height: 1.5;">
            Sent automatically by CampusCollab on behalf of <strong>${senderName}</strong>.
          </p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Video Call invite email delivered to ${toEmail}${shouldCcSender ? ` (CC: ${senderEmail})` : ''}, MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service Error] Failed to send Video Call invite to ${toEmail}:`, error.message);
    return { success: true, devMode: true, warning: error.message };
  }
};

const sendTeamInviteEmail = async ({ toEmail, recipientName, senderName, senderEmail, teamTitle, teamTech = [], teamDescription = '', message }) => {
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '').trim();

  if (!user || !pass) {
    console.log(`[Dev Mode] Team Invite email to ${toEmail} for team "${teamTitle}" (Email credentials not configured)`);
    return { success: true, devMode: true };
  }

  const transporter = getTransporter();
  const shouldCcSender = senderEmail && senderEmail.toLowerCase().trim() !== toEmail.toLowerCase().trim();
  const techPills = (Array.isArray(teamTech) ? teamTech : (teamTech || '').split(','))
    .map((t) => typeof t === 'string' ? t.trim() : t)
    .filter(Boolean)
    .map((t) => `<span style="display:inline-block; background-color: #1e293b; border: 1px solid #334155; color: #f1f5f9; padding: 3px 8px; border-radius: 6px; font-size: 11px; margin-right: 4px; margin-bottom: 4px;">${t}</span>`)
    .join('');

  const mailOptions = {
    from: `"${senderName} via CampusCollab" <${user}>`,
    to: toEmail,
    cc: shouldCcSender ? senderEmail.trim() : undefined,
    replyTo: senderEmail ? `"${senderName}" <${senderEmail.trim()}>` : user,
    subject: `👥 Team Invitation: Join "${teamTitle}" - CampusCollab`,
    text: `Hello ${recipientName},\n\n${senderName} (${senderEmail}) has invited you to join their project team "${teamTitle}" on CampusCollab.\n\nDescription: ${teamDescription || 'Collaborative team project'}\nTech: ${(teamTech || []).join(', ')}\n\nMessage: "${message || 'Join our team!'}"\n\nLog in to CampusCollab to accept and join the team: ${getBaseAppUrl()}/requests\n\nBest regards,\nCampusCollab Team`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #0b1120; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; color: #e2e8f0;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); padding: 24px 28px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">CampusCollab</h1>
          <p style="color: #fef3c7; margin: 4px 0 0 0; font-size: 13px;">Team Collaboration & Hackathon Network</p>
        </div>

        <div style="padding: 28px;">
          <div style="display: inline-block; background-color: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 8px; padding: 6px 12px; margin-bottom: 16px;">
            <span style="color: #fbbf24; font-size: 12px; font-weight: 700;">👥 Team Member Invitation</span>
          </div>

          <h2 style="color: #ffffff; font-size: 18px; margin: 0 0 10px 0;">Hello ${recipientName},</h2>
          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
            <strong style="color: #f8fafc;">${senderName}</strong> (<a href="mailto:${senderEmail}" style="color: #fbbf24; text-decoration: none;">${senderEmail}</a>) has invited you to join their project team:
          </p>

          <div style="background-color: #030712; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 18px 0;">
            <h3 style="color: #fbbf24; margin: 0 0 8px 0; font-size: 16px; font-weight: 800;">${teamTitle}</h3>
            ${teamDescription ? `<p style="color: #cbd5e1; font-size: 13px; line-height: 1.5; margin: 0 0 12px 0;">${teamDescription}</p>` : ''}
            ${techPills ? `<div style="margin-top: 10px;">${techPills}</div>` : ''}
          </div>

          ${message ? `
          <div style="background-color: #1e293b; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin: 18px 0;">
            <p style="margin: 0; color: #cbd5e1; font-size: 13px; font-style: italic;">
              "${message}"
            </p>
          </div>` : ''}

          <div style="text-align: center; margin: 28px 0 16px 0;">
            <a href="${getBaseAppUrl()}/requests" target="_blank" style="display: inline-block; background-color: #f59e0b; color: #030712; font-weight: 800; font-size: 14px; text-decoration: none; padding: 12px 30px; border-radius: 10px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35);">
              View & Accept Invitation
            </a>
            <p style="margin: 12px 0 0 0; color: #64748b; font-size: 11px;">
              You can review the team details and accept the invite directly from your CampusCollab Requests dashboard.
            </p>
          </div>

          <p style="color: #64748b; font-size: 12px; margin: 24px 0 0 0; border-top: 1px solid #1e293b; padding-top: 14px; line-height: 1.5;">
            Sent automatically by CampusCollab on behalf of team lead <strong>${senderName}</strong>.
          </p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Team Invite email delivered to ${toEmail}, MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service Error] Failed to send Team Invite email to ${toEmail}:`, error.message);
    return { success: true, devMode: true, warning: error.message };
  }
};

const sendTeamJoinRequestEmail = async ({ toEmail, leadName, applicantName, applicantEmail, applicantDept = 'Student', teamTitle, message }) => {
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '').trim();

  if (!user || !pass) {
    console.log(`[Dev Mode] Team Join Request email to ${toEmail} from ${applicantName} (Email credentials not configured)`);
    return { success: true, devMode: true };
  }

  const transporter = getTransporter();
  const shouldCcApplicant = applicantEmail && applicantEmail.toLowerCase().trim() !== toEmail.toLowerCase().trim();

  const mailOptions = {
    from: `"${applicantName} via CampusCollab" <${user}>`,
    to: toEmail,
    cc: shouldCcApplicant ? applicantEmail.trim() : undefined,
    replyTo: applicantEmail ? `"${applicantName}" <${applicantEmail.trim()}>` : user,
    subject: `🙋 New Member Join Request for "${teamTitle}" - ${applicantName}`,
    text: `Hello ${leadName},\n\n${applicantName} (${applicantEmail}, ${applicantDept}) has requested to join your project team "${teamTitle}" on CampusCollab.\n\nApplicant Note: "${message || 'I would like to join your team!'}"\n\nLog in to CampusCollab to review and accept: ${getBaseAppUrl()}/requests\n\nBest regards,\nCampusCollab Team`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #0b1120; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; color: #e2e8f0;">
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); padding: 24px 28px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">CampusCollab</h1>
          <p style="color: #e0f2fe; margin: 4px 0 0 0; font-size: 13px;">Team Collaboration & Hackathon Network</p>
        </div>

        <div style="padding: 28px;">
          <div style="display: inline-block; background-color: rgba(14, 165, 233, 0.15); border: 1px solid rgba(14, 165, 233, 0.4); border-radius: 8px; padding: 6px 12px; margin-bottom: 16px;">
            <span style="color: #38bdf8; font-size: 12px; font-weight: 700;">🙋 Team Join Request</span>
          </div>

          <h2 style="color: #ffffff; font-size: 18px; margin: 0 0 10px 0;">Hello ${leadName},</h2>
          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
            <strong style="color: #f8fafc;">${applicantName}</strong> (<a href="mailto:${applicantEmail}" style="color: #38bdf8; text-decoration: none;">${applicantEmail}</a> &bull; ${applicantDept}) is interested in contributing and has requested to join your team:
          </p>

          <div style="background-color: #030712; border: 1px solid #334155; border-radius: 12px; padding: 18px; margin: 18px 0;">
            <span style="color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: 700;">Target Team</span>
            <h3 style="color: #38bdf8; margin: 4px 0 0 0; font-size: 16px; font-weight: 800;">${teamTitle}</h3>
          </div>

          ${message ? `
          <div style="background-color: #1e293b; border-left: 4px solid #0ea5e9; padding: 12px 16px; border-radius: 6px; margin: 18px 0;">
            <p style="margin: 0; color: #cbd5e1; font-size: 13px; font-style: italic;">
              "${message}"
            </p>
          </div>` : ''}

          <div style="text-align: center; margin: 28px 0 16px 0;">
            <a href="${getBaseAppUrl()}/requests" target="_blank" style="display: inline-block; background-color: #0ea5e9; color: #030712; font-weight: 800; font-size: 14px; text-decoration: none; padding: 12px 30px; border-radius: 10px; box-shadow: 0 4px 14px rgba(14, 165, 233, 0.35);">
              Review Request in Dashboard
            </a>
            <p style="margin: 12px 0 0 0; color: #64748b; font-size: 11px;">
              You can view their GitHub profile, repos, or start a video conference before accepting.
            </p>
          </div>

          <p style="color: #64748b; font-size: 12px; margin: 24px 0 0 0; border-top: 1px solid #1e293b; padding-top: 14px; line-height: 1.5;">
            Sent automatically by CampusCollab on behalf of student applicant <strong>${applicantName}</strong>.
          </p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Team Join Request email delivered to ${toEmail}, MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service Error] Failed to send Team Join Request email to ${toEmail}:`, error.message);
    return { success: true, devMode: true, warning: error.message };
  }
};

const sendTeamJoinedConfirmationEmail = async ({ toEmail, memberName, teamTitle, teamLeadName, teamLeadEmail }) => {
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '').trim();

  if (!user || !pass) {
    console.log(`[Dev Mode] Team Joined Confirmation email to ${toEmail} for team "${teamTitle}"`);
    return { success: true, devMode: true };
  }

  const transporter = getTransporter();

  const mailOptions = {
    from: `"CampusCollab" <${user}>`,
    to: toEmail,
    subject: `🎉 You Joined Team "${teamTitle}"! - CampusCollab`,
    text: `Congratulations ${memberName}!\n\nYou are now officially a member of team "${teamTitle}" led by ${teamLeadName} (${teamLeadEmail}).\n\nCheck out your new team workspace on CampusCollab: https://campuscollab.edu/teams\n\nHappy collaborating!`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #0b1120; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; color: #e2e8f0;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); padding: 24px 28px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">CampusCollab</h1>
          <p style="color: #d1fae5; margin: 4px 0 0 0; font-size: 13px;">Team Collaboration & Hackathon Network</p>
        </div>

        <div style="padding: 28px;">
          <div style="display: inline-block; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 8px; padding: 6px 12px; margin-bottom: 16px;">
            <span style="color: #34d399; font-size: 12px; font-weight: 700;">🎉 Team Member Added</span>
          </div>

          <h2 style="color: #ffffff; font-size: 18px; margin: 0 0 10px 0;">Congratulations ${memberName}!</h2>
          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
            You are now officially a member of the project team <strong style="color: #34d399;">"${teamTitle}"</strong> on CampusCollab!
          </p>

          <div style="background-color: #030712; border: 1px solid #334155; border-radius: 12px; padding: 18px; margin: 18px 0;">
            <p style="margin: 0; color: #e2e8f0; font-size: 13px;">
              <strong>Team Lead:</strong> ${teamLeadName} ${teamLeadEmail ? `(<a href="mailto:${teamLeadEmail}" style="color: #34d399;">${teamLeadEmail}</a>)` : ''}
            </p>
          </div>

          <div style="text-align: center; margin: 28px 0 16px 0;">
            <a href="${getBaseAppUrl()}/teams" target="_blank" style="display: inline-block; background-color: #10b981; color: #030712; font-weight: 800; font-size: 14px; text-decoration: none; padding: 12px 30px; border-radius: 10px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);">
              Open Team Workspace
            </a>
          </div>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Team Joined confirmation email delivered to ${toEmail}, MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service Error] Failed to send Team Joined confirmation to ${toEmail}:`, error.message);
    return { success: true, devMode: true, warning: error.message };
  }
};

const sendPeerCollaborationRequestEmail = async ({
  toEmail,
  recipientName,
  senderName,
  senderEmail,
  senderDepartment = 'Student',
  senderSkills = '',
  message,
  role,
  fileUrl,
  fileName,
}) => {
  if (isAdminEmail(toEmail)) {
    return { success: true, skipped: true, isAdmin: true };
  }

  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '').trim();

  if (!user || !pass) {
    console.log(`[Dev Mode] Peer Collaboration Request email to ${toEmail} from ${senderName} (Email credentials not configured)`);
    return { success: true, devMode: true };
  }

  const transporter = getTransporter();
  const shouldCcSender = senderEmail && senderEmail.toLowerCase().trim() !== toEmail.toLowerCase().trim();

  const skillsList = Array.isArray(senderSkills)
    ? senderSkills
    : (typeof senderSkills === 'string' ? senderSkills.split(',') : [])
        .map((s) => s.trim())
        .filter(Boolean);

  const skillsPills = skillsList
    .map(
      (s) =>
        `<span style="display:inline-block; background-color: #1e293b; border: 1px solid #334155; color: #f1f5f9; padding: 3px 8px; border-radius: 6px; font-size: 11px; margin-right: 4px; margin-bottom: 4px;">${s}</span>`
    )
    .join('');

  const mailOptions = {
    from: `"${senderName} via CampusCollab" <${user}>`,
    to: toEmail,
    cc: shouldCcSender ? senderEmail.trim() : undefined,
    replyTo: senderEmail ? `"${senderName}" <${senderEmail.trim()}>` : user,
    subject: `🤝 Someone wants to connect with you! Collaboration request from ${senderName} - CampusCollab`,
    text: `Hello ${recipientName},\n\n${senderName} (${senderEmail}, ${senderDepartment}) wants to collaborate with you on CampusCollab!\n\n${role ? `Topic / Proposed Role: ${role}\n` : ''}Message: "${message || 'I would like to collaborate with you on a project!'}"\n${fileUrl ? `Attached Project File: ${fileName || fileUrl} (${fileUrl})\n` : ''}\nLog in to CampusCollab to review and respond: http://localhost:5173/requests\n\nBest regards,\nCampusCollab Team`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #0b1120; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; color: #e2e8f0;">
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 50%, #f43f5e 100%); padding: 24px 28px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">CampusCollab</h1>
          <p style="color: #fae8ff; margin: 4px 0 0 0; font-size: 13px;">Peer Collaboration & Skill Partner Network</p>
        </div>

        <div style="padding: 28px;">
          <div style="display: inline-block; background-color: rgba(217, 70, 239, 0.15); border: 1px solid rgba(217, 70, 239, 0.4); border-radius: 8px; padding: 6px 12px; margin-bottom: 16px;">
            <span style="color: #f0abfc; font-size: 12px; font-weight: 700;">🤝 New Collaboration Inquiry</span>
          </div>

          <h2 style="color: #ffffff; font-size: 18px; margin: 0 0 10px 0;">Hello ${recipientName},</h2>
          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
            <strong style="color: #f8fafc;">${senderName}</strong> (<a href="mailto:${senderEmail}" style="color: #f0abfc; text-decoration: none;">${senderEmail}</a> &bull; ${senderDepartment}) discovered your candidate profile on CampusCollab and wants to collaborate with you!
          </p>

          <div style="background-color: #030712; border: 1px solid #334155; border-radius: 12px; padding: 18px; margin: 18px 0;">
            ${role ? `
            <div style="margin-bottom: 12px;">
              <span style="color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 3px;">Topic / Proposed Role</span>
              <p style="margin: 0; color: #f0abfc; font-size: 14px; font-weight: 800;">${role}</p>
            </div>` : ''}

            ${skillsPills ? `
            <div>
              <span style="color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 6px;">${senderName}'s Skills</span>
              <div>${skillsPills}</div>
            </div>` : ''}
          </div>

          ${message ? `
          <div style="background-color: #1e293b; border-left: 4px solid #d946ef; padding: 14px 16px; border-radius: 6px; margin: 18px 0;">
            <p style="margin: 0; color: #f1f5f9; font-size: 13px; font-style: italic; line-height: 1.5;">
              "${message}"
            </p>
          </div>` : ''}

          ${fileUrl ? `
          <div style="background-color: #030712; border: 1px solid #334155; border-radius: 10px; padding: 12px 16px; margin: 16px 0;">
            <span style="color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 4px;">Shared Project Document / Reference</span>
            <a href="${fileUrl}" target="_blank" style="color: #f0abfc; font-size: 13px; font-weight: 600; text-decoration: underline;">
              📎 ${fileName || 'View Shared File / Link'} &rarr;
            </a>
          </div>` : ''}

          <div style="text-align: center; margin: 28px 0 16px 0;">
            <a href="${getBaseAppUrl()}/requests" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: #ffffff; font-weight: 800; font-size: 14px; text-decoration: none; padding: 12px 30px; border-radius: 10px; box-shadow: 0 4px 14px rgba(217, 70, 239, 0.35);">
              Respond to Collaboration Request
            </a>
            <p style="margin: 12px 0 0 0; color: #64748b; font-size: 11px;">
              You can view their GitHub repositories, accept the collaboration, or schedule a video sync directly from your Requests dashboard.
            </p>
          </div>

          <p style="color: #64748b; font-size: 12px; margin: 24px 0 0 0; border-top: 1px solid #1e293b; padding-top: 14px; line-height: 1.5;">
            Sent automatically by CampusCollab on behalf of student <strong>${senderName}</strong>.
          </p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Peer Collaboration email delivered to ${toEmail}, MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service Error] Failed to send Peer Collaboration email to ${toEmail}:`, error.message);
    return { success: true, devMode: true, warning: error.message };
  }
};

const sendTechnicalTestAssignedEmail = async ({
  toEmail,
  candidateName,
  teamLeadName,
  teamTitle,
  testTitle,
  timeLimitMinutes,
  testUrl,
}) => {
  if (isAdminEmail(toEmail)) {
    return { success: true, skipped: true, isAdmin: true, message: 'Admin email detected.' };
  }

  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '').trim();

  if (!user || !pass) {
    return { success: true, devMode: true };
  }

  const transporter = getTransporter();

  const mailOptions = {
    from: `"CampusCollab Assessments" <${user}>`,
    to: toEmail,
    subject: `Technical Coding Assessment Assigned for Team "${teamTitle}" - CampusCollab`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b0f19; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); color: #f8fafc;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">CampusCollab Proctored Assessment</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0 0; font-size: 13px; font-weight: 600;">Technical Screening for Team "${teamTitle}"</p>
        </div>
        <div style="padding: 28px;">
          <p style="font-size: 15px; color: #cbd5e1; margin-top: 0;">
            Hello <strong>${candidateName}</strong>,
          </p>
          <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
            Team Lead <strong>${teamLeadName}</strong> has assigned you a live coding assessment for your application to join <strong>"${teamTitle}"</strong>.
          </p>
          <div style="background-color: #111827; border: 1px solid #374151; border-radius: 12px; padding: 18px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; color: #f97316; font-size: 14px; font-weight: bold;">📝 Assessment Details</p>
            <p style="margin: 4px 0; font-size: 13px; color: #e2e8f0;"><strong>Challenge:</strong> ${testTitle}</p>
            <p style="margin: 4px 0; font-size: 13px; color: #e2e8f0;"><strong>Time Allowed:</strong> ${timeLimitMinutes} Minutes</p>
            <p style="margin: 4px 0; font-size: 13px; color: #e2e8f0;"><strong>Environment:</strong> In-Browser VS Code Monaco Editor (Secure Mode)</p>
          </div>
          <div style="background-color: #1e1b4b; border: 1px solid #4338ca; border-radius: 12px; padding: 14px; margin: 16px 0;">
            <p style="margin: 0; color: #c7d2fe; font-size: 12px; line-height: 1.5;">
              🛡️ <strong>Anti-Cheat Notice:</strong> This assessment enforces Fullscreen Mode. Tab switching or navigating outside to other windows is monitored in real-time. Make sure to complete the test in one sitting.
            </p>
          </div>
          <div style="text-align: center; margin: 28px 0 16px 0;">
            <a href="${testUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); color: #ffffff; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 34px; border-radius: 12px; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.4);">
              Launch Secure Coding Test
            </a>
          </div>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Technical test email delivered to ${toEmail}, MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service Error] Failed to send technical test email to ${toEmail}:`, error.message);
    return { success: true, devMode: true, warning: error.message };
  }
};

module.exports = {
  isAdminEmail,
  sendOtpEmail,
  sendVideoCallEmail,
  sendTeamInviteEmail,
  sendTeamJoinRequestEmail,
  sendTeamJoinedConfirmationEmail,
  sendPeerCollaborationRequestEmail,
  sendTechnicalTestAssignedEmail,
};
