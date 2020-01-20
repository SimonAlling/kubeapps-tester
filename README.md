# Kubeapps Tester

A fairly crude userscript to test [Kubeapps](https://github.com/kubeapps/kubeapps).
Written for internal use, so don't expect too much.


## Usage

1. Clone and build:
   ```
   git clone https://github.com/SimonAlling/kubeapps-tester
   cd kubeapps-tester
   npm install
   npm run build
   ```

1. Make sure Kubeapps is running at `localhost:8080` (or edit `src/userscript.ts` as appropriate and rebuild Kubeapps Tester).

1. Install a userscript extension, e.g. [Violentmonkey](https://google.com/search?q=Violentmonkey).

1. Install Kubeapps Tester by dragging the file `dist/kubeapps-tester.user.js` to a browser window.

1. Go to [Kubeapps' *Catalog* page](http://localhost:8080/#/catalog) and **reload the page**.
   (Kubeapps is an [SPA](https://en.wikipedia.org/wiki/Single-page_application), so merely clicking on *Catalog* is not enough.)

1. Click the *Batch test* button that should have appeared near the top of the page.

1. Enter the number of charts you want to test and hit OK.
   ("Testing" a chart means installing and uninstalling it.)

The log should be shown in a textbox below the *Batch test* button, and also saved in `localStorage`.
