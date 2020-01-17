import * as Storage from "ts-storage";
import { log } from "userscripter";

import * as CONFIG from "~src/config";

const ERROR_LOCALSTORAGE = "Encountered an error when trying to log to localStorage.";

export default function() {
    const localStorageLogger: log.Logger = {
        log: logToLocalStorageWithLabel("LOG"),
        info: logToLocalStorageWithLabel("INFO"),
        warn: logToLocalStorageWithLabel("WARNING"),
        error: logToLocalStorageWithLabel("ERROR"),
    };
    log.setLogger(multiLogger(console, localStorageLogger));
}

function logToLocalStorageWithLabel(label: string) {
    return (...xs: any[]) => {
        const response_key = Storage.get_session(CONFIG.LOG_KEY_KEY, "");
        switch (response_key.status) {
            case Storage.Status.OK:
                const localStorageKey = response_key.value;
                const msg = `[${new Date().toISOString()}] ${label}: ${xs.join(" ").trim()}`;
                const response_log = Storage.get<string[]>(localStorageKey, []);
                switch (response_log.status) {
                    case Storage.Status.OK:
                        Storage.set(localStorageKey, response_log.value.concat(msg));
                        break;
                    default:
                        // Using log.error here would be circular:
                        console.error(ERROR_LOCALSTORAGE);
                }
                return;
            case Storage.Status.ABSENT:
                // Not supposed to be logging to localStorage.
                return;
            default:
                // Using log.error here would be circular:
                console.error(ERROR_LOCALSTORAGE);
                return;
        }
    };
}

function multiLogger(...loggers: log.Logger[]): log.Logger {
    // This solution will give a type error if a method is added to log.Logger.
    function onAll(method: keyof log.Logger) {
        return (...items: any[]) => {
            for (const logger of loggers) {
                logger[method](...items);
            }
        };
    }
    return {
        log: onAll("log"),
        info: onAll("info"),
        warn: onAll("warn"),
        error: onAll("error"),
    };
}
