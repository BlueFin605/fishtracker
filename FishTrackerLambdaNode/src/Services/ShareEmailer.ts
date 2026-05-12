import { injectable } from 'tsyringe';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { Logger } from '@aws-lambda-powertools/logger';

export interface IShareEmailContext {
    shareId: string;
    ownerDisplayName: string;
    recipientEmail: string;
    tripCount: number;
    catchCount: number;
    message?: string;
    thumbnailUrl?: string;
    viewUrl: string;
    /** ISO-8601 string; only the yyyy-MM-dd prefix is forwarded to the template. */
    expiresAt?: string;
}

/**
 * Ported from .NET SesShareEmailer.
 *
 * Sends the share-invite email via SESv2 using the configured template.
 * Template name comes from SHARE_TEMPLATE_NAME; sender from SHARE_SENDER.
 */
@injectable()
export class ShareEmailer {
    private readonly sender: string;
    private readonly templateName: string;
    private readonly client: SESv2Client;

    constructor(private logger: Logger) {
        const sender = process.env.SHARE_SENDER;
        if (!sender) {
            throw new Error('SHARE_SENDER environment variable is not set');
        }
        const templateName = process.env.SHARE_TEMPLATE_NAME;
        if (!templateName) {
            throw new Error('SHARE_TEMPLATE_NAME environment variable is not set');
        }
        this.sender = sender;
        this.templateName = templateName;
        this.client = new SESv2Client({});
    }

    public async send(ctx: IShareEmailContext): Promise<void> {
        const templateData = JSON.stringify({
            ownerDisplayName: ctx.ownerDisplayName,
            tripCount: ctx.tripCount,
            catchCount: ctx.catchCount,
            message: ctx.message,
            thumbnailUrl: ctx.thumbnailUrl,
            viewUrl: ctx.viewUrl,
            ...(ctx.expiresAt ? { expiresAt: ctx.expiresAt.slice(0, 10) } : {}),
        });

        await this.client.send(
            new SendEmailCommand({
                FromEmailAddress: this.sender,
                Destination: { ToAddresses: [ctx.recipientEmail] },
                Content: {
                    Template: {
                        TemplateName: this.templateName,
                        TemplateData: templateData,
                    },
                },
            })
        );

        this.logger.info('Share invite emailed', {
            shareId: ctx.shareId,
            template: this.templateName,
        });
    }
}
