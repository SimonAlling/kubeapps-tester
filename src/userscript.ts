export default {
    id: "kubeapps-tester",
    name: "Kubeapps Tester",
    version: "1.0.0",
    description: "Test certain aspects of Kubeapps.",
    author: "Simon Alling",
    hostname: "localhost",
    port: 8080,
    sitename: "Kubeapps",
    namespace: "simonalling.se",
    runAt: "document-start",
} as const;
