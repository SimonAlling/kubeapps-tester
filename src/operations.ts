import { environment } from "userscripter";
import { Operation, operation } from "userscripter/lib/operations";

import {
    isOnCatalogPage,
    isOnChartPage,
} from "~src/environment";
import SELECTOR from "~src/selectors";

import batchTest from "./operations/batch-test";
import setupLogging from "./operations/setup-logging";
import testChart from "./operations/test-chart";

const OPERATIONS: ReadonlyArray<Operation<any>> = [
    operation({
        description: "set up logging",
        condition: environment.ALWAYS,
        action: setupLogging,
    }),
    operation({
        description: "insert test button",
        condition: isOnCatalogPage,
        dependencies: {
            headerDiv: ".PageHeader > div",
            _firstCard: SELECTOR.chartCard, // so the button is inserted when the cards have loaded
        },
        action: batchTest,
    }),
    operation({
        description: "test chart",
        condition: isOnChartPage,
        action: testChart,
    }),
];

export default OPERATIONS;
