import * as http from "http";
import * as os from "os";
import * as fs from "fs";

/*
Global SteelSeries Connection Details
*/
let steelSeriesHostName: string;
let steelSeriesPort: string;

export function registerAppWithSteelSeries(allCapsAppIdentifier: string, appDisplayName: string, appDeveloper: string) {
    return new Promise((resolve, reject) => {
        //Retrieve SteelSeries configuration file
        let configFilePath: string = "";
        if (os.platform() === "win32") {
            configFilePath =
                process.env.ProgramData +
                "/SteelSeries/SteelSeries Engine 3/coreProps.json";
        } else if (os.platform() === "darwin") {
            configFilePath =
                "/Library/Application Support/SteelSeries Engine 3/coreProps.json";
        } else {
            console.error(
                "Sorry, ggVSCode is only available on Windows and macOS"
            );
        }

        //read the config file and store the server address
        if (configFilePath) {
            fs.readFile(configFilePath, "utf8", async (err, data) => {
                if (err) {
                    console.error(err);
                    return;
                }

                // Parse config
                const configJSON = JSON.parse(data);
                const steelSeriesAddress = configJSON.address.split(":");
                steelSeriesHostName = steelSeriesAddress[0];
                steelSeriesPort = steelSeriesAddress[1];
                console.log(
                    "Got SteelSeries server address: " +
                        steelSeriesHostName +
                        "!! Port: " +
                        steelSeriesPort
                );

                //register app details to SteelSeries GG
                const metaData = {
                    game: allCapsAppIdentifier,
                    game_display_name: appDisplayName,
                    developer: appDeveloper,
                    deinitialize_timer_length_ms: 30000,
                };

                const metaDataResp = await webRequest(
                    "/game_metadata",
                    metaData
                );
                console.log("Registered app with SteelSeries GG", metaDataResp);

                //register game event with SteelSeries GG
                const gameEventRegistration = {
                    game: "GGCODE",
                    event: "SHOWMESSAGE",
                    value_optional: true,
                    handlers: [
                        {
                            "device-type": "screened",
                            mode: "screen",
                            zone: "one",
                            datas: [
                                {
                                    lines: [
                                        {
                                            "has-text": true,
                                            "context-frame-key": "line-one",
                                        },
                                        {
                                            "has-text": true,
                                            "context-frame-key": "line-two",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                };
                var bindGameEventResp = await webRequest(
                    "/bind_game_event",
                    gameEventRegistration
                );
                console.log(
                    "Binded event to SteelSeries GG",
                    bindGameEventResp
                );

                console.log(
                    'Congratulations, your extension "gg-vs-code" is now active!'
                );
                resolve(true);
            });
        }
    });
}


export function setDisplayLines(line1: string, line2: string) {
    const eventData = {
        value: 1,
        frame: {
            "line-one": line1,
            "line-two": line2,
        },
    };
    sendGameEvent("SHOWMESSAGE", eventData);
    console.log("setting display lines");
}

export async function sendGameEvent(eventName: string, eventData: Object) {
    const gameEventData = {
        game: "GGCODE",
        event: eventName,
        data: eventData,
    };
    var gameEventResp = await webRequest("/game_event", gameEventData);
    console.log("Sent game event to SteelSeries GG", gameEventResp);
}


/*
Http native wrapper
*/
export function webRequest(path: string, body: any) {
    /*
            Request details
        */
    const requestData = JSON.stringify(body);
    const parameters = {
        hostname: steelSeriesHostName,
        port: steelSeriesPort,
        path: path,
        method: "post",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": requestData.length,
        },
    };

    /*
            Perform web request
            */
    return new Promise((resolve, reject) => {
        let responseData: any[] = [];
        const request = http.request(parameters, (res) => {
            console.log(`Status code: ${res.statusCode}`);
            res.on("data", (d) => {
                responseData.push(d);
            });
            res.on("end", () => {
                resolve(String(Buffer.concat(responseData)));
            });
        });
        request.write(requestData);
        request.on("error", (error) => {
            console.error(error);
            reject(error);
        });
        request.end();
    });
}
