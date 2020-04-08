import Logger from "../logger"
import MailService from "../services/mailService"

export default {
    name: 'MailQueueJob',
    description: 'Send pending emails (up to 5 attempts in case of failures).',

    run: (): Promise<void> => {
        return new Promise<void>(
            (resolve, reject) => {
                MailService.sendPendingMails((err: any): void => {
                    if (err) {
                        Logger.tag('mail', 'queue').error('Error sending pending mails:', err);
                        return reject(err);
                    }

                    resolve();
                });
            }
        )
    }
}
