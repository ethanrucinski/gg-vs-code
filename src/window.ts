import * as vscode from "vscode";
import * as ss from "./steelseries";

export function registerWindow(context: vscode.ExtensionContext) {
    /*
    Register with current window
    */
    displayActiveFile();
    vscode.window.onDidChangeActiveTextEditor(displayActiveFile);
}

function displayActiveFile() {
    const window = vscode.window;
    const completePath = window.activeTextEditor?.document.uri.path;
    if (completePath) {
        const pathParts = completePath.split("/");
        // Report if this is saved
        let dirty = "Saved"
        if (window.activeTextEditor?.document.isDirty) {
            dirty = "Unsaved changes"
        }
        ss.setDisplayLines(pathParts[pathParts.length - 1], dirty);
    }
}
