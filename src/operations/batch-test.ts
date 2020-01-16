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
        const input = prompt("Number of releases to test (blank for all):");
        if (input === null) return;
        let n = Infinity;
        const parsed = Number.parseInt(input);
        if (input !== "" && Number.isNaN(parsed)) {
            alert("Please enter a number or leave the input field blank.");
            return;
        } else {
            n = parsed;
        }
        const cards = Array.from(document.querySelectorAll(SELECTOR.chartCard)).slice(0, n) as HTMLElement[];
        if (cards.length > 0) {
            // Start a new localStorage log:
            const localStorageKey = CONFIG.newLocalStorageLoggingKey(new Date());
            Storage.set_session(CONFIG.LOG_KEY_KEY, localStorageKey);
            Storage.set(localStorageKey, []);
            batchTest(cards);
        } else {
            log.error("No charts found.");
        }
    });
    e.headerDiv.appendChild(button);
}

// Assumes cards to be non-empty.
function batchTest(cards: readonly HTMLElement[]) {
    function testChart(index: number) {
        const card = cards[index];
        if (card === undefined) { // no more charts to test
            log.log("Batch test finished!");
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
                if (chartWindow?.closed) {
                    clearInterval(pollTimer);
                    testChart(index + 1);
                }
            }, CONFIG.clickDelay);
        }, CONFIG.clickDelay);
    }
    testChart(0);
}
