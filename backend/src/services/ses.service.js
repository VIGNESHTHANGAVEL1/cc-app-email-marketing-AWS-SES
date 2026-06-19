const {
  SESClient,
  SendEmailCommand,
  SendRawEmailCommand,
} = require('@aws-sdk/client-ses');
const config = require('../config');

class SESService {
  constructor() {
    this.client = new SESClient({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
    });
    this.fromEmail = config.aws.fromEmail;
    this.fromName = config.aws.fromName;
  }

  getFromAddress() {
    return `${this.fromName} <${this.fromEmail}>`;
  }

  async sendEmail({ to, subject, htmlBody, textBody, replyTo }) {
    const command = new SendEmailCommand({
      Source: this.getFromAddress(),
      Destination: { ToAddresses: Array.isArray(to) ? to : [to] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: {
          Html: htmlBody ? { Data: htmlBody, Charset: 'UTF-8' } : undefined,
          Text: textBody ? { Data: textBody, Charset: 'UTF-8' } : undefined,
        },
      },
      ReplyToAddresses: replyTo ? [replyTo] : undefined,
    });

    const response = await this.client.send(command);
    return { messageId: response.MessageId, success: true };
  }

  async sendRawEmail({ to, subject, htmlBody, textBody, attachments = [] }) {
    const boundary = `----=_Part_${Date.now()}`;
    const from = this.getFromAddress();

    let rawMessage = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: multipart/alternative; boundary="alt_boundary"',
      '',
      '--alt_boundary',
      'Content-Type: text/plain; charset=UTF-8',
      '',
      textBody || '',
      '',
      '--alt_boundary',
      'Content-Type: text/html; charset=UTF-8',
      '',
      htmlBody || '',
      '',
      '--alt_boundary--',
    ];

    for (const attachment of attachments) {
      rawMessage.push(
        `--${boundary}`,
        `Content-Type: ${attachment.contentType || 'application/octet-stream'}`,
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: attachment; filename="${attachment.filename}"`,
        '',
        attachment.content,
        ''
      );
    }

    rawMessage.push(`--${boundary}--`);

    const command = new SendRawEmailCommand({
      Source: from,
      Destinations: [to],
      RawMessage: { Data: Buffer.from(rawMessage.join('\r\n')) },
    });

    const response = await this.client.send(command);
    return { messageId: response.MessageId, success: true };
  }

  async sendWithRetry(emailData, maxRetries = config.emailEngine.maxRetries) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const hasAttachments = emailData.attachments && emailData.attachments.length > 0;
        const result = hasAttachments
          ? await this.sendRawEmail(emailData)
          : await this.sendEmail(emailData);

        return { ...result, attempts: attempt };
      } catch (error) {
        lastError = error;
        const isRetryable = this.isRetryableError(error);

        if (!isRetryable || attempt === maxRetries) {
          throw error;
        }

        const delay = config.emailEngine.retryDelayMs * attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  isRetryableError(error) {
    const retryableCodes = [
      'Throttling',
      'ServiceUnavailable',
      'InternalFailure',
      'RequestTimeout',
      'TooManyRequestsException',
    ];

    return retryableCodes.some(
      (code) => error.name === code || error.code === code || error.message?.includes(code)
    );
  }
}

module.exports = new SESService();
