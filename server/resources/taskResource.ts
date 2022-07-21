import _ from "lodash";

import CONSTRAINTS from "../validation/constraints";
import ErrorTypes from "../utils/errorTypes";
import * as Resources from "../utils/resources";
import {Entity, handleJSONWithData, RequestData} from "../utils/resources";
import {getTasks, Task, TaskState} from "../jobs/scheduler";
import {normalizeString} from "../utils/strings";
import {forConstraint} from "../validation/validator";
import {Request, Response} from "express";
import {isString, isTaskSortField} from "../types";

const isValidId = forConstraint(CONSTRAINTS.id, false);

interface TaskResponse {
    id: number,
    name: string,
    description: string,
    schedule: string,
    runningSince: number | null,
    lastRunStarted: number | null,
    lastRunDuration: number | null,
    state: string,
    result: string | null,
    message: string | null,
    enabled: boolean,
}

function toTaskResponse(task: Task): TaskResponse {
    return {
        id: task.id,
        name: task.name,
        description: task.description,
        schedule: task.schedule,
        runningSince: task.runningSince && task.runningSince.unix(),
        lastRunStarted: task.lastRunStarted && task.lastRunStarted.unix(),
        lastRunDuration: task.lastRunDuration || null,
        state: task.state,
        result: task.state !== TaskState.RUNNING && task.result ? task.result.state : null,
        message: task.state !== TaskState.RUNNING && task.result ? task.result.message || null : null,
        enabled: task.enabled
    };
}

async function withValidTaskId(data: RequestData): Promise<string> {
    if (!isString(data.id)) {
        throw {data: 'Missing task id.', type: ErrorTypes.badRequest};
    }
    const id = normalizeString(data.id);

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

async function withTask(data: RequestData): Promise<Task> {
    const id = await withValidTaskId(data);
    return await getTask(id);
}

async function setTaskEnabled(data: RequestData, enable: boolean): Promise<TaskResponse> {
    const task = await withTask(data);
    task.enabled = enable;
    return toTaskResponse(task);
}

async function doGetAll(req: Request): Promise<{ total: number, pageTasks: Entity[] }> {
    const restParams = await Resources.getValidRestParams('list', null, req);

    const tasks = Resources.sort(
        _.values(getTasks()),
        isTaskSortField,
        restParams
    );
    const filteredTasks = Resources.filter(
        tasks,
        ['id', 'name', 'schedule', 'state'],
        restParams
    );

    const total = filteredTasks.length;
    const pageTasks = Resources.getPageEntities(filteredTasks, restParams);

    return {
        total,
        pageTasks,
    };
}

export function getAll(req: Request, res: Response): void {
    doGetAll(req)
        .then(({total, pageTasks}) => {
            res.set('X-Total-Count', total.toString(10));
            Resources.success(res, _.map(pageTasks, toTaskResponse));
        })
        .catch(err => Resources.error(res, err));
}

export const run = handleJSONWithData(async data => {
    const task = await withTask(data);

    if (task.runningSince) {
        throw {data: 'Task already running.', type: ErrorTypes.conflict};
    }

    task.run();
    return toTaskResponse(task);
});

export const enable = handleJSONWithData(async data => {
    await setTaskEnabled(data, true);
});

export const disable = handleJSONWithData(async data => {
    await setTaskEnabled(data, false);
});
