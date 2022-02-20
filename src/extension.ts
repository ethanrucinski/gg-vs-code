import * as vscode from "vscode";
import * as window from "./window";
import * as ss from "./steelseries";

//runs once when extension is activated
export function activate(context: vscode.ExtensionContext) {
    // Register with Steel Series
    ss.registerApp(
        "GGVSCODE",
        "ggVSCode",
        "Ethan Rucinski and Tyler Swe tt"
    )
        .then(() => {
            vscode.window.showInformationMessage(
                "Hello World from gg-vs-code!"
            );
            ss.setDisplayLines("Hello world!", "on SteelSeries"); 
            window.registerWindow(context);
        })
        .catch((err) => {
            console.error("Error connecting to steel series", err);
        });

    // Say hello to our users
    const disposable = vscode.commands.registerCommand(
        "gg-vs-code.helloWorld",
        () => {
            console.log("Hello world from GG VS Code! Happy coding!");
        }
    );
    context.subscriptions.push(disposable);
}

// Deactivate our extension
export function deactivate() {
    console.log("Bye bye. I hope you enjoyed GG VS Code!");

	ss.deregisterApp("GGVSCODE");
}
