import { log } from "userscripter";

import * as CONFIG from "~src/config";
import { click } from "~src/general/click";
import * as SITE from "~src/site";
import { pretendToClick } from "../general/click";

export default function(e: {
    [K in "deployButton" | "heading"]: HTMLElement
}) {
    const name = e.heading.textContent;
    log.log(`Testing chart '${name}' ...`);
    function timeout() {
        log.error(`${name} did not become ready within ${CONFIG.releaseReadyTimeoutInSeconds} seconds.`);
        closeWindow();
    }
    function closeWindow() {
        log.log("Closing window ...");
        window.close();
    }
    const deployButtonTimeout = setTimeout(() => {
        log.error(`Deploy button did not show up within ${CONFIG.findDeployButtonTimeoutInSeconds} seconds.`);
        closeWindow();
    }, CONFIG.findDeployButtonTimeoutInSeconds * 1000);
    const enum State { init, submitted, deleteClicked, deleteConfirmed }
    let state = State.init;
    const observer = new MutationObserver((_mutations, _observer) => {
        switch (state) {
            case State.init:
                // Look for submit button.
                log.log("Looking for submit button ...");
                const submitButton = document.querySelector("button[type=submit]");
                if (submitButton instanceof HTMLButtonElement) {
                    clearTimeout(deployButtonTimeout);
                    log.log("Submitting ...");
                    setTimeout(timeout, CONFIG.releaseReadyTimeoutInSeconds * 1000);
                    state = State.submitted;
                    click(submitButton);
                }
                break;
            case State.submitted:
                // Look for "READY" status.
                const statusElement = document.querySelector(".ApplicationStatus");
                if (statusElement instanceof HTMLElement && statusElement.classList.contains(SITE.CLASS.releaseReady)) {
                    log.log("Release is ready!");
                    log.log("Looking for delete button ...");
                    const deleteButton = document.querySelector(".AppControls button.button-danger");
                    if (deleteButton instanceof HTMLElement) {
                        log.log("Deleting release ...");
                        state = State.deleteClicked;
                        click(deleteButton);
                    } else {
                        log.error("Could not find delete button.");
                    }
                } else {
                    const errorText = document.querySelector(".alert-error .error__text");
                    if (errorText instanceof HTMLElement) {
                        log.error(errorText.textContent || "An error seems to have occurred, but could not find the message.");
                    }
                }
                break;
            case State.deleteClicked:
                setTimeout(() => {
                    const confirmDeleteButton = document.querySelector(".ReactModal__Content button[type=submit]");
                    const purgeCheckbox = document.querySelector(".ReactModal__Content input[type=checkbox]");
                    if (confirmDeleteButton instanceof HTMLElement && purgeCheckbox instanceof HTMLInputElement) {
                        log.log("Confirming delete ...");
                        state = State.deleteConfirmed;
                        pretendToClick(purgeCheckbox);
                        purgeCheckbox.checked = true;
                        click(confirmDeleteButton);
                    } else {
                        log.error("Tried to delete release, but could not find confirm button and/or purge checkbox.");
                    }
                }, CONFIG.clickDelay);
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
    click(e.deployButton);
}