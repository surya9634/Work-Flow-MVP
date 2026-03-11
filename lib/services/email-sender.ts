/**
 * EMAIL SENDING UTILITY
 * 
 * For the MVP / Sandbox, this class mocks the sending of emails.
 * In a production environment, this would integrate with Resend, SendGrid, or AWS SES.
 */

export class EmailService {
    /**
     * Send an email.
     */
    static async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
        console.log(`\n======================================================`);
        console.log(`📧 MOCK EMAIL SENT`);
        console.log(`------------------------------------------------------`);
        console.log(`TO:      ${to}`);
        console.log(`SUBJECT: ${subject}`);
        console.log(`------------------------------------------------------`);
        console.log(body);
        console.log(`======================================================\n`);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        return true;
    }
}
