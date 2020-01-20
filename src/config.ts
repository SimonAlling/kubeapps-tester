// This file cannot contain Webpack-resolved imports (e.g. "~src/foo").

import U from "./userscript";

export const OPERATIONS_INTERVAL = 500; // ms
export const OPERATIONS_EXTRA_TRIES = 60_000 / OPERATIONS_INTERVAL; // If it takes longer, Kubeapps is probably rekt.

export const LOG_KEY_KEY = U.id + "-log-key";

export const findDeployButtonTimeoutInSeconds = 60;
export const findSubmitButtonTimeoutInSeconds = 60;
export const releaseShowUpTimeoutInSeconds = 60;
export const releaseReadyTimeoutInSeconds = 60;
export const deleteButtonTimeoutInSeconds = 5;
export const confirmDeleteButtonTimeoutInSeconds = 10;
export const expectDeletedTimeoutInSeconds = 60;

export const clickDelay = 500; // ms; to emulate a human user

const c = (s: string) => U.id + "-" + s;

export const CLASS = {
    batchTestButton: c("batch-test-button"),
    batchTestLog: c("batch-test-log"),
    click: c("click"),
} as const;

export function newLocalStorageLoggingKey(date: Date): string {
    return U.id + "-log-" + date.toISOString();
}
