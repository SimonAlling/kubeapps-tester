function hashIs(r: RegExp): (w: Window) => boolean {
    return w => r.test(w.location.hash);
}

export const isOnCatalogPage = hashIs(/^#\/catalog$/);
export const isOnChartPage = hashIs(/^#\/charts\/[^\/]+\/[^\/]+/);
