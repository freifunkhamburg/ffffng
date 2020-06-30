import * as MailService from "../services/mailService"
import {jobResultOkay} from "./scheduler";

export default {
    name: 'MailQueueJob',
    description: 'Send pending emails (up to 5 attempts in case of failures).',

    async run() {
        await MailService.sendPendingMails();
        return jobResultOkay();
    },
};
