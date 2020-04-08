import cron from "node-cron";
import moment from "moment";

import {config} from "../config";
import Logger from "../logger";

import MailQueueJob from "./MailQueueJob";
import FixNodeFilenamesJob from "./FixNodeFilenamesJob";
import NodeInformationRetrievalJob from "./NodeInformationRetrievalJob";
import MonitoringMailsSendingJob from "./MonitoringMailsSendingJob";
import OfflineNodesDeletionJob from "./OfflineNodesDeletionJob";

export interface Job {
    name: string,
    description: string,

    run(): Promise<void>,
}

export enum TaskState {
    IDLE = "idle",
    RUNNING = "running",
    FAILED = "failed",
}

export class Task {
    constructor(
        public id: number,
        public name: string,
        public description: string,
        public schedule: string,
        public job: Job,
        public runningSince: moment.Moment | null,
        public lastRunStarted: moment.Moment | null,
        public lastRunDuration: number | null,
        public state: TaskState,
        public enabled: true,
    ) {}

    run(): void {
        if (this.runningSince || !this.enabled) {
            // job is still running, skip execution
            return;
        }

        this.runningSince = moment();
        this.lastRunStarted = this.runningSince;
        this.state = TaskState.RUNNING;

        const done = (state: TaskState):void => {
            const now = moment();
            const duration = now.diff(this.runningSince || now);
            Logger.tag('jobs').profile('[%sms]\t%s', duration, this.name);

            this.runningSince = null;
            this.lastRunDuration = duration;
            this.state = state;
        };

        this.job.run().then(() => {
            done(TaskState.IDLE);
        }).catch((err: any) => {
            Logger.tag('jobs').error("Job %s failed: %s", this.name, err);
            done(TaskState.FAILED);
        });
    }
}

type Tasks = {[key: string]: Task};

const tasks: Tasks = {};

let taskId = 1;
function nextTaskId(): number {
    const id = taskId;
    taskId += 1;
    return id;
}

function schedule(expr: string, job: Job): void {
    Logger.tag('jobs').info('Scheduling job: %s  %s', expr, job.name);

    const id = nextTaskId();

    const task = new Task(
        id,
        job.name,
        job.description,
        expr,
        job,
        null,
        null,
        null,
        TaskState.IDLE,
        true
    );

    cron.schedule(expr, task.run);

    tasks['' + id] = task;
}

export function init() {
    Logger.tag('jobs').info('Scheduling background jobs...');

    try {
        schedule('0 */1 * * * *', MailQueueJob);
        schedule('15 */1 * * * *', FixNodeFilenamesJob);

        if (config.client.monitoring.enabled) {
            schedule('30 */15 * * * *', NodeInformationRetrievalJob);
            schedule('45 */5 * * * *', MonitoringMailsSendingJob);
            schedule('0 0 3 * * *', OfflineNodesDeletionJob); // every night at 3:00
        }
    }
    catch (error) {
        Logger.tag('jobs').error('Error during scheduling of background jobs:', error);
        throw error;
    }

    Logger.tag('jobs').info('Scheduling of background jobs done.');
}

export function getTasks(): Tasks {
    return tasks;
}
