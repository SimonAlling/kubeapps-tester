import { Operation, operation } from "userscripter/lib/operations";

import {
    isOnCatalogPage,
    isOnChartPage,
} from "~src/environment";
import SELECTOR from "~src/selectors";

import batchTest from "./operations/batch-test";
import testChart from "./operations/test-chart";

const OPERATIONS: ReadonlyArray<Operation<any>> = [
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
        dependencies: {
            deployButton: ".ChartDeployButton button",
            heading: ".ChartView__heading h1",
        },
        action: testChart,
    }),
];

export default OPERATIONS;
