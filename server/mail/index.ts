import {createTransport, Transporter} from "nodemailer";
import {config} from "../config";
import * as MailTemplateService from "../services/mailTemplateService";
import Mail from "nodemailer/lib/mailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

let transporterSingleton: Transporter | null = null;

function transporter() {
    if (!transporterSingleton) {
        const options = {
            ...config.server.email.smtp,
            pool: true,
        };
        transporterSingleton = createTransport(new SMTPTransport(options));

        MailTemplateService.configureTransporter(transporterSingleton);
    }

    return transporterSingleton;
}

export function init(): void {
    transporter();
}

export async function send(options: Mail.Options): Promise<void> {
    await transporter().sendMail(options);
}
