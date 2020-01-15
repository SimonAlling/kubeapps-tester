import * as CONFIG from "~src/config";

export function click(element: HTMLElement) {
    setTimeout(() => {
        pretendToClick(element);
        setTimeout(() => element.click(), CONFIG.clickDelay);
    }, CONFIG.clickDelay);
}

export function pretendToClick(element: HTMLElement) {
    element.classList.add(CONFIG.CLASS.click);
}