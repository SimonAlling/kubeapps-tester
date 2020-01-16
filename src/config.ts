// This file cannot contain Webpack-resolved imports (e.g. "~src/foo").

import U from "./userscript";

export const OPERATIONS_INTERVAL = 200; // ms
export const OPERATIONS_EXTRA_TRIES = 30;

export const LOG_KEY_KEY = U.id + "-log-key";

export const releaseReadyTimeoutInSeconds = 60;
export const clickDelay = 500; // ms; to emulate a human user

const c = (s: string) => U.id + "-" + s;

export const CLASS = {
    batchTestButton: c("batch-test-button"),
    click: c("click"),
} as const;

export function newLocalStorageLoggingKey(date: Date): string {
    return U.id + "-log-" + date.toISOString();
}
