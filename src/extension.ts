import { debug } from 'console';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os'
import * as http from 'http'

var steelSeriesAddress: string;

function webRequest(path: string, body: any) {
	const parameters = {
		hostname: steelSeriesAddress,
		path: path,
		method: 'post',
	}
	console.log(parameters)
	
	return new Promise((resolve, reject) => {
		const request = http.request(parameters, res => {
			let chunks: any[] = [];
			res.on('data', data => chunks.push(data));
			res.on('end', () => {
				const response = Buffer.concat(chunks);
				resolve(response)
			})
			res.on('error', (err) => {
				reject(err)
			})
		})
		request.write(JSON.stringify(body));
	})
}

//runs once when extension is activated
export function activate(context: vscode.ExtensionContext) {
	registerAppWithSteelSeries();

	vscode.window.showInformationMessage('Hello World from gg-vs-code!');
	setDisplayLines("Hello world from gg-vs-code!","on SteelSeries");

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('gg-vs-code.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		console.log("yeetly yeetly yeet")

	});
	context.subscriptions.push(disposable);

	const workspace = vscode.workspace;
	if (!workspace.workspaceFolders) {
		console.error("No workspace found to analyze in gg-vs-code");
	} else {
		//path = workspace.workspaceFolders[0];
		const watcher = workspace.createFileSystemWatcher(new vscode.RelativePattern(workspace.workspaceFolders[0], "*"));
		watcher.onDidChange(uri => {
			console.log(`File ${uri} changed`);
		});
				
	}

	
}

// this method is called when your extension is deactivated
export function deactivate() {
	console.log("Bye bye")
}

function setDisplayLines(line1: string, line2: string) {
	const eventData = {
		"value": 1,
		"frame": {
			"line-one": line1,
			"line-two": line2
		}
	};
	sendGameEvent("SHOWMESSAGE", eventData);
	console.log("setting display lines");
}

async function sendGameEvent(eventName: string, eventData: Object) {
	const gameEventData = {
		"game": "GGCODE",
		"event": eventName,
		"data": eventData
	};
	var gameEventResp = await webRequest('/game_event', gameEventData);
	console.log("Sent game event to SteelSeries GG", gameEventResp);
}

function registerAppWithSteelSeries() {
	//get the correct steelseries config file based on operating system
	var configFilePath: string = "";
	if(os.platform() == "win32") {
		configFilePath = process.env.ProgramData + "/SteelSeries/SteelSeries Engine 3/coreProps.json";
	} else if (os.platform() == "darwin") {
		configFilePath = "/Library/Application Support/SteelSeries Engine 3/coreProps.json";
	} else {
		console.error("Sorry, ggVSCode is only available on Windows and macOS")
	}

	//read the config file and store the server address
	if(configFilePath) {
		fs.readFile(configFilePath, 'utf8' , async (err, data) => {
			if (err) {
				console.error(err)
				return
			}
			var configJSON = JSON.parse(data);
			steelSeriesAddress = configJSON.address;
			console.log("Got SteelSeries server address: " + steelSeriesAddress);

			//register app details to SteelSeries GG
			const metaData = {
				"game": "GGVSCODE",
				"game_display_name": "ggVSCode",
				"developer": "Ethan Rucinski and Tyler Swett",
				"deinitialize_timer_length_ms": 30000
			};

			var metaDataResp = await webRequest('game_metadata', metaData);
			console.log("Registered app with SteelSeries GG", metaDataResp)
			
			//register game event with SteelSeries GG
			const gameEventRegistration = {
				"game": "GGCODE",
				"event": "SHOWMESSAGE",
				"value_optional": true,
				"handlers": [
					{
						"device-type": "screened",
						"mode": "screen",
						"zone": "one",
						"datas": [
							{
								"lines": [
									{
										"has-text": true,
										"context-frame-key": "line-one"
									},
									{
										"has-text": true,
										"context-frame-key": "line-two"
									}
								]
							}
						]
					}
			  ]
			};
			var bindGameEventResp = await webRequest('bind_game_event', gameEventRegistration);
			console.log("Binded event to SteelSeries GG", bindGameEventResp);

			console.log('Congratulations, your extension "gg-vs-code" is now active!');
		})
	}
}