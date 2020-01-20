import { log } from "userscripter";

import * as CONFIG from "~src/config";
import { click, pretendToClick } from "~src/general/click";
import * as SITE from "~src/site";

export default function() {
    function timeout(message: string): () => void {
        return () => {
            log.error(message);
            closeWindow();
        };
    }
    const deployButtonTimeout = timeout(`Deploy button did not show up within ${CONFIG.findDeployButtonTimeoutInSeconds} seconds.`);
    const submitButtonTimeout = timeout(`Submit button did not show up within ${CONFIG.findSubmitButtonTimeoutInSeconds} seconds.`);
    const releaseReadyTimeout = timeout(`Release did not become ready within ${CONFIG.releaseReadyTimeoutInSeconds} seconds.`);
    const confirmDeleteButtonTimeout = timeout(`Tried to delete release, but could not find confirm button and/or purge checkbox within ${CONFIG.confirmDeleteButtonTimeoutInSeconds}.`);
    let findDeployButtonTimer = setTimeout(deployButtonTimeout, CONFIG.findDeployButtonTimeoutInSeconds * 1000);
    let findSubmitButtonTimer: number;
    let findReadyStatusTimer: number;
    let confirmDeleteButtonTimer: number;
    log.log("******** Chart test initiated! ********");
    log.log("Looking for deploy button ...");
    const enum State { init, deploying, submitted, deleteClicked, deleteConfirmed }
    let state = State.init;
    const observer = new MutationObserver((_mutations, _observer) => {
        abortIfKubeappsError();
        switch (state) {
            case State.init:
                const heading = document.querySelector(".ChartView__heading h1");
                const deployButton = document.querySelector(".ChartDeployButton button");
                if (heading instanceof HTMLElement && deployButton instanceof HTMLElement) {
                    clearTimeout(findDeployButtonTimer);
                    log.log(`Testing chart '${heading.textContent}' ...`);
                    findSubmitButtonTimer = setTimeout(submitButtonTimeout, CONFIG.findSubmitButtonTimeoutInSeconds * 1000);
                    state = State.deploying;
                    click(deployButton);
                }
                break;
            case State.deploying:
                log.log("Looking for submit button ...");
                const submitButton = document.querySelector("button[type=submit]");
                if (submitButton instanceof HTMLButtonElement) {
                    clearTimeout(findSubmitButtonTimer);
                    log.log("Submitting ...");
                    findReadyStatusTimer = setTimeout(releaseReadyTimeout, CONFIG.releaseReadyTimeoutInSeconds * 1000);
                    state = State.submitted;
                    click(submitButton);
                    log.log("Waiting for release to become ready ...");
                }
                break;
            case State.submitted:
                // Look for "READY" status.
                const statusElement = document.querySelector(".ApplicationStatus");
                if (statusElement instanceof HTMLElement && statusElement.classList.contains(SITE.CLASS.releaseReady)) {
                    clearTimeout(findReadyStatusTimer);
                    log.log("Release is ready!");
                    log.log("Looking for delete button ...");
                    const deleteButton = document.querySelector(".AppControls button.button-danger");
                    if (deleteButton instanceof HTMLElement) {
                        log.log("Deleting release ...");
                        confirmDeleteButtonTimer = setTimeout(confirmDeleteButtonTimeout, CONFIG.confirmDeleteButtonTimeoutInSeconds * 1000);
                        state = State.deleteClicked;
                        click(deleteButton);
                    } else {
                        log.error("Could not find delete button.");
                    }
                }
                break;
            case State.deleteClicked:
                const confirmDeleteButton = document.querySelector(".ReactModal__Content button[type=submit]");
                const purgeCheckbox = document.querySelector(".ReactModal__Content input[type=checkbox]");
                if (confirmDeleteButton instanceof HTMLElement && purgeCheckbox instanceof HTMLInputElement) {
                    clearTimeout(confirmDeleteButtonTimer);
                    log.log("Confirming delete ...");
                    state = State.deleteConfirmed;
                    pretendToClick(purgeCheckbox);
                    purgeCheckbox.checked = true;
                    click(confirmDeleteButton);
                }
                break;
            case State.deleteConfirmed:
                _observer.disconnect();
                closeWindow();
                break;
            default:
                const _: never = state; void _; // enforces switch exhaustiveness
        }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
}

function closeWindow() {
    log.log("Closing window ...");
    window.close();
}

function abortIfKubeappsError() {
    const errorText = document.querySelector(".alert-error .error__text");
    if (errorText instanceof HTMLElement) {
        log.error("Internal Kubeapps error: " + (errorText.textContent || "(could not extract Kubeapps error message)"));
        closeWindow();
    }
}