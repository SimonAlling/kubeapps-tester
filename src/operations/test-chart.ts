import { log, operations } from "userscripter";

import * as CONFIG from "~src/config";
import SELECTOR from "~src/selectors";
import { click, pretendToClick } from "~src/general/click";
import { environment } from "userscripter";

const TICKER_INTERVAL = 500; // ms

export default function() {
    log.log("Looking for deploy button ...");
    runOperation(CLICK_DEPLOY);
}

function closeWindow() {
    log.log("Closing window ...");
    window.close();
}

type ChainedOperation<K extends string> = Readonly<{
    operation: operations.Operation<K>
    delay: number
    timeout: number
    onSuccess?: ChainedOperation<any>
    onFailure?: ChainedOperation<any>
}>;


// Order reversed because they reference each other:

const CLOSE_WINDOW = {
    operation: operations.operation({
        description: "",
        condition: environment.ALWAYS,
        action: closeWindow,
    }),
    delay: CONFIG.clickDelay,
    timeout: 5_000,
} as const;

const EXPECT_DELETED = {
    operation: operations.operation({
        description: `Release may not have been deleted successfully within ${CONFIG.expectDeletedTimeoutInSeconds} seconds.`,
        condition: environment.ALWAYS,
        action: _ => {
            log.log("Release successfully deleted!");
        },
        dependencies: {
            appList: "section.AppList",
        },
    }),
    delay: CONFIG.clickDelay,
    timeout: CONFIG.expectDeletedTimeoutInSeconds * 1000,
    onSuccess: CLOSE_WINDOW,
    onFailure: CLOSE_WINDOW,
} as const;

const CONFIRM_DELETE = {
    operation: operations.operation({
        description: `Tried to uninstall release, but could not find confirm button and/or purge checkbox within ${CONFIG.confirmDeleteButtonTimeoutInSeconds}.`,
        condition: environment.ALWAYS,
        action: e => {
            const purgeCheckbox = e.purgeCheckbox as HTMLInputElement;
            pretendToClick(purgeCheckbox);
            purgeCheckbox.checked = true;
            click(e.confirmDeleteButton);
        },
        dependencies: {
            purgeCheckbox: ".ReactModal__Content input[type=checkbox]",
            confirmDeleteButton: ".ReactModal__Content button.button-danger",
        },
    }),
    delay: CONFIG.clickDelay,
    timeout: CONFIG.confirmDeleteButtonTimeoutInSeconds * 1000,
    onSuccess: EXPECT_DELETED,
    onFailure: CLOSE_WINDOW,
} as const;

const CLICK_DELETE = {
    operation: operations.operation({
        description: `Tried to uninstall release, but could not find delete button within ${CONFIG.deleteButtonTimeoutInSeconds}.`,
        condition: environment.ALWAYS,
        action: e => {
            click(e.deleteButton);
        },
        dependencies: {
            deleteButton: ".AppControls button.button-danger",
        },
    }),
    delay: CONFIG.clickDelay,
    timeout: CONFIG.deleteButtonTimeoutInSeconds * 1000,
    onSuccess: CONFIRM_DELETE,
    onFailure: CLOSE_WINDOW,
} as const;

const OBSERVE_READY = {
    operation: operations.operation({
        description: `Release did not become ready within ${CONFIG.releaseReadyTimeoutInSeconds} seconds.`,
        condition: environment.ALWAYS,
        action: _ => {
            log.log("Release is ready! Uninstalling it ...");
        },
        dependencies: {
            readyIndicator: ".ApplicationStatus.ApplicationStatus--success",
        },
    }),
    delay: 0,
    timeout: CONFIG.releaseReadyTimeoutInSeconds * 1000,
    onSuccess: CLICK_DELETE,
    onFailure: CLICK_DELETE, // so as not to leave installed releases
} as const;

const DETECT_RELEASE = {
    operation: operations.operation({
        description: `Release did not show up within ${CONFIG.releaseShowUpTimeoutInSeconds} seconds.`,
        condition: environment.ALWAYS,
        action: _ => {
            log.log("Waiting for release to become ready ...");
        },
        dependencies: {
            appView: ".AppView",
        },
    }),
    delay: 0,
    timeout: CONFIG.releaseShowUpTimeoutInSeconds * 1000,
    onSuccess: OBSERVE_READY,
    onFailure: CLOSE_WINDOW,
} as const;

const CLICK_SUBMIT = {
    operation: operations.operation({
        description: `Could not find submit button within ${CONFIG.findSubmitButtonTimeoutInSeconds} seconds.`,
        condition: environment.ALWAYS,
        action: e => {
            click(e.submitButton);
            log.log("Waiting for release to show up ...");
        },
        dependencies: {
            submitButton: "button[type=submit]",
        },
    }),
    delay: CONFIG.clickDelay,
    timeout: 60_000,
    onSuccess: DETECT_RELEASE,
    onFailure: CLOSE_WINDOW,
} as const;

const CLICK_DEPLOY = {
    operation: operations.operation({
        description: `Could not find deploy button within ${CONFIG.findDeployButtonTimeoutInSeconds} seconds.`,
        condition: environment.ALWAYS,
        action: e => {
            log.log(`Testing chart '${e.heading.textContent}' ...`);
            click(e.deployButton);
            log.log("Looking for submit button ...");
        },
        dependencies: {
            deployButton: ".ChartDeployButton button",
            heading: ".ChartView__heading h1",
        },
    }),
    delay: CONFIG.clickDelay,
    timeout: 60_000,
    onSuccess: CLICK_SUBMIT,
    onFailure: CLOSE_WINDOW,
} as const;

function runOperation<K extends string>(operation: ChainedOperation<K>): void {
    const o = operation.operation;
    const timeoutTimer = setTimeout(() => {
        log.error(o.description);
        if (operation.onFailure) runOperation(operation.onFailure);
    }, operation.timeout);
    const ticker = setInterval(() => {
        const kubeappsErrorMessage = document.querySelector(SELECTOR.kubeappsErrorMessage);
        if (kubeappsErrorMessage instanceof HTMLElement) {
            clearInterval(ticker);
            clearTimeout(timeoutTimer);
            log.error("Internal Kubeapps error: " + (kubeappsErrorMessage.textContent || "(could not extract Kubeapps error message)"));
            setTimeout(closeWindow, CONFIG.clickDelay);
        }
        const dependencies = o.dependencies === undefined ? {} as { [k in K]: string } : o.dependencies;
        const queryResults = Object.entries<string>(dependencies).map(([key, selector]) => ({
            key, selector, element: document.querySelector<HTMLElement>(selector),
        }));
        const missingDependencies = queryResults.filter(x => x.element === null);
        if (missingDependencies.length === 0) {
            clearInterval(ticker);
            clearTimeout(timeoutTimer);
            const e = queryResults.reduce(
                (acc, x) => Object.defineProperty(acc, x.key, { value: x.element }),
                {} as { [k in K]: HTMLElement },
            );
            setTimeout(() => {
                o.action(e);
                if (operation.onSuccess) runOperation(operation.onSuccess);
            }, operation.delay);
        }
    }, TICKER_INTERVAL);
}
