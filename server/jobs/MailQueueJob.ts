import * as MailService from "../services/mailService"

export default {
    name: 'MailQueueJob',
    description: 'Send pending emails (up to 5 attempts in case of failures).',

    run: MailService.sendPendingMails,
}
