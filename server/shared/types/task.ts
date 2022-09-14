/**
 * Contains types and type guards all around tasks.
 */
import { toIsEnum } from "./enums";
import { isNullable } from "./helpers";
import { isPlainObject } from "./objects";
import { isBoolean, isNumber, isString } from "./primitives";
import { type SortFieldFor, toIsSortField } from "./sortfields";
import {
    type DurationSeconds,
    isDurationSeconds,
    isUnixTimestampSeconds,
    type UnixTimestampSeconds,
} from "./time";

// FIXME: Naming Task vs. Job

/**
 * The state a task can be in.
 */
export enum TaskState {
    /**
     * The task is not currently running.
     */
    IDLE = "idle",

    /**
     * The task is running.
     */
    RUNNING = "running",

    /**
     * The task is idle but has had a failure on its last run.
     */
    FAILED = "failed",
}

/**
 * Type guard for {@link TaskState}.
 *
 * @param arg - Value to check.
 */
export const isTaskState = toIsEnum(TaskState);

/**
 * State the last run of the task resulted in.
 */
export enum JobResultState {
    /**
     * The run did finish as expected.
     */
    OKAY = "okay",

    /**
     * The run resulted in one or more warnings.
     */
    WARNING = "warning",
}

/**
 * Type guard for {@link JobResultState}.
 *
 * @param arg - Value to check.
 */
export const isJobResultState = toIsEnum(JobResultState);

/**
 * Task as returned by the REST API.
 */
// TODO: Introduce newtypes.
export type TaskResponse = {
    /**
     * ID of the task.
     */
    id: number;

    /**
     * Task name as displayed in the admin panel.
     */
    name: string;

    /**
     * A short description of what the task does.
     */
    description: string;

    /**
     * The schedule of the task in classical cronjob notation.
     */
    schedule: string;

    /**
     * Time the current run of this task started. `null` if the task is not running.
     */
    runningSince: UnixTimestampSeconds | null;

    /**
     * Time the last run of this task started. `null` if the task has not run before.
     */
    lastRunStarted: UnixTimestampSeconds | null;

    /**
     * Duration of the last run in seconds. `null` if the task has not run before.
     */
    lastRunDuration: DurationSeconds | null;

    /**
     * The state the task is in.
     */
    state: TaskState;

    /**
     * State the last run of the task resulted in.
     */
    result: JobResultState | null;

    /**
     * Message of the last run, e.g. a warning.
     */
    message: string | null;

    /**
     * Whether the task is enabled and therefor may run.
     *
     * Note: A task may be running even if it is disabled if the run started befor disabling it.
     */
    enabled: boolean;
};

/**
 * Type guard for {@link TaskResponse}.
 *
 * @param arg - Value to check.
 */
export function isTaskResponse(arg: unknown): arg is TaskResponse {
    if (!isPlainObject(arg)) {
        return false;
    }

    const task = arg as TaskResponse;
    return (
        isNumber(task.id) &&
        isString(task.name) &&
        isString(task.description) &&
        isString(task.schedule) &&
        isNullable(task.runningSince, isUnixTimestampSeconds) &&
        isNullable(task.lastRunStarted, isUnixTimestampSeconds) &&
        isNullable(task.lastRunDuration, isDurationSeconds) &&
        isTaskState(task.state) &&
        isNullable(task.result, isJobResultState) &&
        isNullable(task.message, isString) &&
        isBoolean(task.enabled)
    );
}

/**
 * Enum specifying the allowed sort fields when retrieving the list of tasks via the REST API.
 */
export enum TaskSortFieldEnum {
    // noinspection JSUnusedGlobalSymbols
    /**
     * See {@link TaskResponse.id}.
     */
    ID = "id",

    /**
     * See {@link TaskResponse.name}.
     */
    NAME = "name",

    /**
     * See {@link TaskResponse.schedule}.
     */
    SCHEDULE = "schedule",

    /**
     * See {@link TaskResponse.state}.
     */
    STATE = "state",

    /**
     * See {@link TaskResponse.runningSince}.
     */
    RUNNING_SINCE = "runningSince",

    /**
     * See {@link TaskResponse.lastRunStarted}.
     */
    LAST_RUN_STARTED = "lastRunStarted",
}

/**
 * Allowed sort fields when retrieving the list of tasks via the REST API.
 */
export type TaskSortField = SortFieldFor<TaskResponse, TaskSortFieldEnum>;

/**
 * Type guard for {@link TaskSortField}.
 *
 * @param arg - Value to check.
 */
export const isTaskSortField = toIsSortField<
    TaskResponse,
    TaskSortFieldEnum,
    typeof TaskSortFieldEnum,
    TaskSortField
>(TaskSortFieldEnum);
