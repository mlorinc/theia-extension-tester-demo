import { expect } from "chai";
import { CheBrowser } from "theia-extension-tester";
// @ts-ignore
import { By, InputBox, TextEditor, TitleBar, EditorView, Key, ContentAssist, SeleniumBrowser, SideBarView } from "extension-tester";
import * as path from "path";
import * as fs from "fs-extra";

const FOLDER_PATH = path.resolve(__dirname, '..', '..', 'test-folder');
console.log(FOLDER_PATH);

const expectedText =
    `// camel-k: language=java

import org.apache.camel.builder.RouteBuilder;

public class Simple extends RouteBuilder {
  @Override
  public void configure() throws Exception {

      // Write your routes here, for example:
      from("timer:java?period=1000")
        .routeId("java")
        .setBody()
          .simple("Hello Camel K from \${routeId}")
        .to("log:info");

  }
}
`;

const expectedFinalText =
    `// camel-k: language=java

import org.apache.camel.builder.RouteBuilder;

public class Simple extends RouteBuilder {
  @Override
  public void configure() throws Exception {

      // Write your routes here, for example:
      from("timer:java?period=60000")
        .routeId("java")
        .setBody()
          .simple("Hello Theia Extension tester from \${routeId}")
        .to("log:info");

  }
}
`;

/**
 * Task list:
 * 1. Create new Java integration with name Simple.java.
 * 2. Verify default text in Simple.java
 * 3. Modify timer interval period
 * 4. Change welcome message
 * 5. Verify reflected changes in Theia UI
 * 6. Toggle content assist
 */
describe('Simple', async function () {
    this.timeout(150000);

    describe('Generate Simple.java', async function () {
        let input: InputBox;
        let editor: TextEditor;

        before(async function () {
            this.timeout(100000);
            const oldLog = console.log;
            console.log = (message: any) => oldLog(`[${new Date().toLocaleTimeString('en-GB', { hour: "numeric", minute: "numeric", second: "numeric" })}] ${message}`);
            await SeleniumBrowser.instance.setImplicitTimeout(50000);

            if (SeleniumBrowser.instance.name === CheBrowser.BROWSER_NAME) {
                await new TitleBar().select('View', 'Find Command...');
            }
            else {
                console.log('open');
                await openFolder(this.timeout());
                await new TitleBar().select('View', 'Command Palette...');
            }
        });

        it('Type in command', async function () {
            input = new InputBox();
            await input.waitInteractive(this.timeout());
            await input.setText('>Create a new Apache Camel K Integration File');
            await input.confirm();
        });

        it('Select java file', async function () {
            input = new InputBox();
            await input.waitInteractive(this.timeout());
            await input.setText('java');
            await input.confirm();
        });

        it('Confirm project location', async function () {
            input = new InputBox();
            await input.waitInteractive(this.timeout());
            await input.confirm();
        });

        it('Set new name to Simple.java', async function () {
            input = new InputBox();
            await input.waitInteractive(this.timeout());
            await input.setText('Simple');
            await input.confirm();
        });

        it('Get editor', async function () {
            this.retries(3);
            const tab = await new EditorView().getTabByTitle('Simple.java', 0);
            await tab.select();
            editor = new TextEditor();
            const activeTab = await new EditorView().getActiveTab();
            expect(await activeTab?.getTitle(), `Active tab is not correct: ${await activeTab?.getTitle()}`).equals(await tab.getTitle());
        });

        it('Has expected text', async function () {
            const text = await editor.getText();
            expect(text).equals(expectedText);
        });

        it('Change period', async function () {
            const text = await editor.getText();
            const lines = text.split('\n');

            let lineNumber = 0;
            for (const line of lines) {
                lineNumber++;
                let phrase = 'period=';
                let index = line.indexOf(phrase)

                if (index > -1) {
                    const stringEnd = line.indexOf('"', index);
                    const start = index + phrase.length + 1;
                    await editor.typeText(lineNumber, start, Array<string>(stringEnd + 1 - start).fill(Key.DELETE).join('') + '60000');
                    break;
                }
            }

            expect(await editor.getTextAtLine(lineNumber)).includes('from("timer:java?period=60000")');
        });

        it('Change welcome message', async function () {
            const lines = (await editor.getText()).split('\n');

            let lineNumber = 0;
            for (const line of lines) {
                lineNumber++;
                let phrase = 'Hello Camel K from';
                let index = line.indexOf(phrase);

                if (index > -1) {
                    await editor.moveCursor(lineNumber, index + 1);
                    await editor.typeText(lineNumber, index + 1, Array<string>(phrase.length).fill(Key.DELETE).join('') + 'Hello Theia Extension tester from');
                    break;
                }
            }

            expect(await editor.getTextAtLine(lineNumber)).includes('.simple("Hello Theia Extension tester from \${routeId}")');
        });

        it('All changes are valid', async function () {
            const editor = new TextEditor();
            expect(await editor.getText()).equals(expectedFinalText);
        });

        it('Toggle content assist', async function () {
            const lines = (await editor.getText()).split('\n');

            let lineNumber = 0;
            for (const line of lines) {
                lineNumber++;
                let phrase = 'log:info';
                let index = line.indexOf(phrase);

                if (index > -1) {
                    const timeout = await SeleniumBrowser.instance.getImplicitTimeout();
                    await editor.moveCursor(lineNumber, index + 1);

                    try {
                        if (SeleniumBrowser.instance.name !== CheBrowser.BROWSER_NAME) {
                            await SeleniumBrowser.instance.setImplicitTimeout(0);
                        }

                        const assist = await editor.toggleContentAssist(true);
                        expect(assist).instanceOf(ContentAssist);
                    }
                    catch (e) {
                        throw e;
                    }
                    finally {
                        if (SeleniumBrowser.instance.name !== CheBrowser.BROWSER_NAME) {
                            await SeleniumBrowser.instance.setImplicitTimeout(timeout);
                        }
                    }
                    break;
                }
            }

            await new Promise(resolve => setTimeout(resolve, 5000));
        });
    });
});

async function openFolder(timeout: number): Promise<void> {
    fs.removeSync(FOLDER_PATH);
    fs.mkdirSync(FOLDER_PATH);

    const implicitTimeout = await SeleniumBrowser.instance.getImplicitTimeout();
    await SeleniumBrowser.instance.setImplicitTimeout(2500);

    console.log('open');
    const titleBar = new TitleBar();
    console.log('new titlebar');
    await titleBar.select('File', 'Open Folder...');
    console.log('titlebar');
    const input = await InputBox.create();
    await input.setText(FOLDER_PATH);
    await input.confirm();

    await SeleniumBrowser.instance.setImplicitTimeout(150);
    // Wait for folder open to complete
    await SeleniumBrowser.instance.driver.wait(async () => {
        try {
            console.log('loop');

            const sidebar = await new SideBarView().getContent().getSection(path.basename(FOLDER_PATH));
            const html = await sidebar.getDriver().findElement(By.css('html'));
            return sidebar && html;
        }
        catch (e) {
            return false;
        }
    }, timeout, 'Could not find section');
    await SeleniumBrowser.instance.setImplicitTimeout(implicitTimeout);
}
