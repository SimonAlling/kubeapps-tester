import { Stylesheets, stylesheet } from "userscripter/lib/stylesheets";
import { environment } from "userscripter";

import batchTestButton from "./stylesheets/batch-test-button.scss";
import click from "./stylesheets/click.scss";

const STYLESHEETS = {
    batchTestButton: stylesheet({
        condition: environment.ALWAYS,
        css: batchTestButton,
    }),
    click: stylesheet({
        condition: environment.ALWAYS,
        css: click,
    }),
} as const;

// This trick uncovers type errors in STYLESHEETS while retaining the static knowledge of its properties (so we can still write e.g. STYLESHEETS.foo):
const _: Stylesheets = STYLESHEETS; void _;

export default STYLESHEETS;
