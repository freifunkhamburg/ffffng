import _ from "lodash";

import CONSTRAINTS from "../validation/constraints";
import ErrorTypes from "../utils/errorTypes";
import * as Resources from "../utils/resources";
import {getTasks, Task} from "../jobs/scheduler";
import {normalizeString} from "../utils/strings";
import {forConstraint} from "../validation/validator";
import {Request, Response} from "express";

const isValidId = forConstraint(CONSTRAINTS.id, false);

interface ExternalTask {
    id: number,
    name: string,
    description: string,
    schedule: string,
    runningSince: number | null,
    lastRunStarted: number | null,
    lastRunDuration: number | null,
    state: string,
    enabled: boolean,
}

function toExternalTask(task: Task): ExternalTask {
    return {
        id: task.id,
        name: task.name,
        description: task.description,
        schedule: task.schedule,
        runningSince: task.runningSince && task.runningSince.unix(),
        lastRunStarted: task.lastRunStarted && task.lastRunStarted.unix(),
        lastRunDuration: task.lastRunDuration || null,
        state: task.state,
        enabled: task.enabled
    };
}

async function withValidTaskId(req: Request): Promise<string> {
    const id = normalizeString(Resources.getData(req).id);

    if (!isValidId(id)) {
        throw {data: 'Invalid task id.', type: ErrorTypes.badRequest};
    }

    return id;
}

async function getTask(id: string): Promise<Task> {
    const tasks = getTasks();
    const task = tasks[id];

    if (!task) {
        throw {data: 'Task not found.', type: ErrorTypes.notFound};
    }

    return task;
}

async function withTask(req: Request): Promise<Task> {
    const id = await withValidTaskId(req);
    return await getTask(id);
}

function setTaskEnabled(req: Request, res: Response, enable: boolean) {
    withTask(req)
        .then(task => {
            task.enabled = enable;
            Resources.success(res, toExternalTask(task))
        })
        .catch(err => Resources.error(res, err))
}

export function getAll (req: Request, res: Response): void {
    Resources.getValidRestParams('list', null, req, function (err, restParams) {
        if (err) {
            return Resources.error(res, err);
        }

        if (!restParams) {
            return Resources.error(
                res,
                {
                    data: "Unexpected state: restParams is not set.",
                    type: ErrorTypes.internalError
                }
            );
        }

        const tasks = Resources.sort(
            _.values(getTasks()),
            ['id', 'name', 'schedule', 'state', 'runningSince', 'lastRunStarted'],
            restParams
        );
        const filteredTasks = Resources.filter(
            tasks,
            ['id', 'name', 'schedule', 'state'],
            restParams
        );
        const total = filteredTasks.length;

        const pageTasks = Resources.getPageEntities(filteredTasks, restParams);

        res.set('X-Total-Count', total.toString(10));
        return Resources.success(res, _.map(pageTasks, toExternalTask));
    });
}

export function run (req: Request, res: Response): void {
    withTask(req)
        .then(task => {
            if (task.runningSince) {
                return Resources.error(res, {data: 'Task already running.', type: ErrorTypes.conflict});
            }

            task.run();

            Resources.success(res, toExternalTask(task));
        })
        .catch(err => Resources.error(res, err));
}

export function enable (req: Request, res: Response): void {
    setTaskEnabled(req, res, true);
}

export function disable (req: Request, res: Response): void {
    setTaskEnabled(req, res, false);
}
