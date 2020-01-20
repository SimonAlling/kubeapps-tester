import * as Storage from "ts-storage";
import { log } from "userscripter";

import * as CONFIG from "~src/config";
import SELECTOR from "~src/selectors";
import { pretendToClick } from "~src/general/click";

export default function(e: {
    [k in "headerDiv" | "_firstCard"]: HTMLElement
}) {
    const button = document.createElement("input");
    button.type = "button";
    button.value = "Batch test";
    button.classList.add(CONFIG.CLASS.batchTestButton);
    button.addEventListener("click", () => {
        const input = prompt("Maximum number of releases to test:");
        if (input === null) return;
        const n = Number.parseInt(input);
        if (Number.isNaN(n)) {
            alert("Please enter a number.");
            return;
        }
        const cards = Array.from(document.querySelectorAll(SELECTOR.chartCard)).slice(0, n) as HTMLElement[];
        if (cards.length > 0) {
            // Start a new localStorage log:
            const localStorageKey = CONFIG.newLocalStorageLoggingKey(new Date());
            Storage.set_session(CONFIG.LOG_KEY_KEY, localStorageKey);
            Storage.set(localStorageKey, []);
            batchTest(cards, localStorageKey, e.headerDiv);
        } else {
            log.error("No charts found.");
        }
    });
    e.headerDiv.appendChild(button);
}

// Assumes cards to be non-empty.
function batchTest(cards: readonly HTMLElement[], localStorageKey: string, headerDiv: HTMLElement) {
    const logTextarea = document.createElement("textarea");
    logTextarea.classList.add(CONFIG.CLASS.batchTestLog);
    headerDiv.insertAdjacentElement("afterend", logTextarea);
    function testChart(index: number) {
        const card = cards[index];
        if (card === undefined) { // no more charts to test
            log.log("Batch test finished!");
            updateLog(logTextarea, localStorageKey);
            sessionStorage.clear();
            return;
        }
        const link = card.querySelector<HTMLAnchorElement>(SELECTOR.chartCardLink);
        if (link === null) {
            log.error("Could not find chart link.");
            return;
        }
        pretendToClick(card);
        setTimeout(() => {
            const chartWindow = window.open(link.href);
            const pollTimer = setInterval(() => {
                updateLog(logTextarea, localStorageKey);
                if (chartWindow?.closed) {
                    clearInterval(pollTimer);
                    testChart(index + 1);
                }
            }, CONFIG.clickDelay);
        }, CONFIG.clickDelay);
    }
    testChart(0);
}

function updateLog(textarea: HTMLTextAreaElement, localStorageKey: string) {
    const response = Storage.get<string[]>(localStorageKey, []);
    switch (response.status) {
        case Storage.Status.OK:
            const stringifiedLog = response.value.join("\n");
            textarea.value = stringifiedLog;
            textarea.scrollTo({ top: Number.MAX_SAFE_INTEGER }); // to bottom
            break;
        default:
            textarea.value = `Could not read log from localStorage.`;
    }
}