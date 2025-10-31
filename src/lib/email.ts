import nodemailer from 'nodemailer';

// Email service configuration
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Create Gmail SMTP transporter
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use TLS
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // Send OTP email for signup
  async sendSignupOTP(email: string, otp: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"Bagami" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Your Bagami Verification Code',
        html: this.generateSignupEmailTemplate(otp),
        text: `Your Bagami verification code is: ${otp}. This code will expire in 10 minutes.`
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Signup OTP email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send signup OTP email:', error);
      return false;
    }
  }

  // Send OTP email for password reset
  async sendPasswordResetOTP(email: string, otp: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"Bagami" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Bagami - Password Reset Code',
        html: this.generatePasswordResetEmailTemplate(otp),
        text: `Your Bagami password reset code is: ${otp}. This code will expire in 10 minutes.`
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Password reset OTP email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send password reset OTP email:', error);
      return false;
    }
  }

  // Generate HTML email template for signup
  private generateSignupEmailTemplate(otp: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bagami - Verification Code</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Bagami</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Welcome to your business journey!</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 20px;">
              <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Verify Your Email Address</h2>
              
              <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0;">
                Welcome to Bagami! Please use the verification code below to complete your account setup:
              </p>
              
              <!-- OTP Code -->
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
                <div style="color: #ff6b35; font-size: 36px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${otp}
                </div>
                <p style="color: #666; margin: 15px 0 0 0; font-size: 14px;">
                  This code will expire in 10 minutes
                </p>
              </div>
              
              <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
                If you didn't request this verification code, please ignore this email.
              </p>
              
              <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  This email was sent by Bagami. If you have questions, please contact our support team.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // Generate HTML email template for password reset
  private generatePasswordResetEmailTemplate(otp: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bagami - Password Reset Code</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Bagami</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Password Reset Request</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 20px;">
              <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Reset Your Password</h2>
              
              <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0;">
                We received a request to reset your Bagami account password. Please use the verification code below:
              </p>
              
              <!-- OTP Code -->
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
                <div style="color: #ff6b35; font-size: 36px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${otp}
                </div>
                <p style="color: #666; margin: 15px 0 0 0; font-size: 14px;">
                  This code will expire in 10 minutes
                </p>
              </div>
              
              <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <p style="color: #856404; margin: 0; font-size: 14px;">
                  <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email and consider securing your account.
                </p>
              </div>
              
              <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  This email was sent by Bagami. If you have questions, please contact our support team.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // Test email configuration
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();