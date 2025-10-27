const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Send login notification email
const sendLoginNotification = async (userEmail, loginDetails) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: 'New Login Detected - Aegis Digital ID System',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h2 style="margin: 0;">New Login Alert</h2>
                    </div>
                    
                    <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                        <p>Hello,</p>
                        
                        <p>A new login was detected on your Aegis Digital ID account.</p>
                        
                        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                            <p style="margin: 5px 0;"><strong>IP Address:</strong> ${loginDetails.ipAddress}</p>
                            <p style="margin: 5px 0;"><strong>Device:</strong> ${loginDetails.userAgent}</p>
                        </div>
                        
                        <p>If this was you, no action is needed. If you don't recognize this login, please:</p>
                        
                        <ol style="color: #374151;">
                            <li>Change your password immediately</li>
                            <li>Enable two-factor authentication</li>
                            <li>Contact support if you need assistance</li>
                        </ol>
                        
                        <p style="color: #6b7280; font-size: 0.875rem; margin-top: 30px;">
                            This is an automated message, please do not reply.
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('✉️ Login notification email sent successfully');
    } catch (error) {
        console.error('📧 Error sending login notification:', error.message);
        // Don't throw error - we don't want to block login if email fails
    }
};

// Send welcome email
const sendWelcomeEmail = async (userEmail) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: 'Welcome to Aegis Digital ID System! 🎉',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #4F46E5, #3B82F6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0; font-size: 24px;">Welcome to Aegis! 🎉</h1>
                    </div>
                    
                    <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                        <p style="font-size: 16px; color: #374151;">Hello,</p>
                        
                        <p style="font-size: 16px; color: #374151;">Welcome to Aegis Digital ID System! We're excited to have you on board. Your account has been successfully created and verified.</p>
                        
                        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
                            <h3 style="margin: 0 0 15px 0; color: #1F2937;">What's Next? 🚀</h3>
                            <ul style="color: #374151; margin: 0; padding-left: 20px;">
                                <li style="margin-bottom: 10px;">Explore your digital identity dashboard</li>
                                <li style="margin-bottom: 10px;">Upload and manage your documents securely</li>
                                <li style="margin-bottom: 10px;">Track your identity verification status</li>
                                <li style="margin-bottom: 10px;">Monitor access logs and security alerts</li>
                            </ul>
                        </div>
                        
                        <div style="background: #EEF2FF; padding: 20px; border-radius: 8px; margin: 25px 0;">
                            <h3 style="margin: 0 0 15px 0; color: #1F2937;">Security Tips 🔒</h3>
                            <ul style="color: #374151; margin: 0; padding-left: 20px;">
                                <li style="margin-bottom: 10px;">Keep your login credentials secure</li>
                                <li style="margin-bottom: 10px;">Enable email notifications for login alerts</li>
                                <li style="margin-bottom: 10px;">Regularly monitor your access logs</li>
                                <li style="margin-bottom: 10px;">Contact support if you notice any suspicious activity</li>
                            </ul>
                        </div>
                        
                        <p style="font-size: 16px; color: #374151;">Thank you for choosing Aegis for your digital identity management. We're committed to keeping your digital identity secure.</p>
                        
                        <p style="font-size: 16px; color: #374151;">Best regards,<br>The Aegis Team</p>
                        
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                            <p style="color: #6B7280; font-size: 14px; margin: 0;">
                                This is an automated message, please do not reply. If you need assistance, please contact our support team.
                            </p>
                        </div>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('✉️ Welcome email sent successfully');
    } catch (error) {
        console.error('📧 Error sending welcome email:', error.message);
    }
};

module.exports = {
    sendLoginNotification,
    sendWelcomeEmail
};
