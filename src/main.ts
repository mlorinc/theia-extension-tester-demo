import { PathUtils } from "theia-extension-tester";
import * as readline from "readline";
import * as path from "path";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (line) => {
    const [a, b] = line.split(/\s+/);

    if (a === undefined || b === undefined) {
        return;
    }

    const aSegments = PathUtils.convertToTreePath(a);
    const bSegments = PathUtils.convertToTreePath(b);

    const aIsFile = path.extname(a).length > 0;
    const bIsFile = path.extname(b).length > 0;

    console.log(`PathUtils.comparePaths(${aSegments}, ${bSegments}) = ${PathUtils.comparePaths(aSegments, bSegments, aIsFile, bIsFile)}`);
});

rl.on("close", function() {
    console.log("\nBYE BYE !!!");
    process.exit(0);
});

function experiment(timeout: number = 15000) {
    console.log(timeout);
}
experiment(0);
