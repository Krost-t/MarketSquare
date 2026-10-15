export default {
    testEnvironment: "node",
    roots: ["<rootDir>/tests"],
    extensionsToTreatAsEsm: [".ts"],
    transform: {
        "^.+\\.ts$": [
            "@swc/jest",
            {
                jsc: { parser: { syntax: "typescript" }, target: "es2022" },
                module: { type: "es6" },
            },
        ],
    },
    globalSetup: "<rootDir>/tests/global-setup.js",
    setupFiles: ["<rootDir>/tests/setup-env.js"],
    testTimeout: 30000,
};
