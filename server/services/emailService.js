const nodemailer = require('nodemailer');

// Create transporter lazily (only when sending)
// because dotenv.config() runs AFTER module imports in server.js
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
};

/**
 * Send an email to notify a user that their account has been approved.
 */
const sendApprovalEmail = async (userEmail, userName) => {
  const mailOptions = {
    from: `"SIYENA Platform" <${process.env.EMAIL_FROM}>`,
    to: userEmail,
    subject: '✅ Votre compte a été approuvé — SIYENA',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ff8d0a, #c22525); padding: 40px 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 12px 0 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Compte Approuvé !</h1>
        </div>
        
        <!-- Body -->
        <div style="padding: 40px 32px;">

          
          <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
            Bonjour <strong style="color: #111827;">${userName}</strong>,
          </p>
          <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
            Nous avons le plaisir de vous informer que votre compte sur la plateforme <strong>SIYENA</strong> a été approuvé par l'administrateur. Vous pouvez désormais vous connecter et accéder à toutes les fonctionnalités.
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="http://localhost:4200/login" 
               style="display: inline-block; background: linear-gradient(135deg, #ff8d0a, #e07b00); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 12px; font-size: 15px; font-weight: 700; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(255,141,10,0.3);">
              Se connecter maintenant
            </a>
          </div>
          
          <div style="background: #f9fafb; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb; margin-top: 24px;">
            <p style="color: #6b7280; font-size: 13px; margin: 0; line-height: 1.6;">
              <strong style="color: #374151;">📧 Votre email :</strong> ${userEmail}<br>
              Utilisez vos identifiants créés lors de l'inscription pour vous connecter.
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} SIYENA. Tous droits réservés.
          </p>
        </div>
      </div>
    `,
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);
    console.log('✅ Approval email sent to:', userEmail, '| MessageId:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending approval email:', error.message);
    // Don't throw — email failure shouldn't block the approval
  }
};

module.exports = { sendApprovalEmail };
