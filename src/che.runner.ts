import { CheBrowser, OpenShiftAuthenticator, WorkspaceTestRunner } from "theia-extension-tester";

async function main() {
    const browser = new CheBrowser({
        // Test browser
        browserName: "chrome",
        // Eclipse Che URL
        location: "https://che-eclipse-che.apps-crc.testing/",
        // User credentials - used by Authenticator object
        credentials: {
            login: "developer",
            password: "developer"
        },
        // Authenticator object logs in user into Eclipse Che
        authenticator: new OpenShiftAuthenticator(),
        // Selenium implicit timeouts
        timeouts: {
            implicit: 600000,
            pageLoad: -1
        }
    });

    const runner = new WorkspaceTestRunner(browser, {
        // Eclipse Che workspace name - does not need to be exact
        workspaceName: 'Apache Camel K',
        // Use running workspace instead - changes workspace name to 'apache-camel-k'
        useExistingWorkspace: true,
        // Mocha test options
        mochaOptions: {
            bail: true
        }
    });
    
    // Remove first element - program path
    const [, ...args] = process.argv;
    process.exitCode = await runner.runTests(args);
}

main();
