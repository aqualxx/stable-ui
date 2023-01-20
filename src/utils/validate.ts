import { DEBUG_MODE } from "@/constants";
import { useUIStore } from "@/stores/ui";

/**
 * Returns true if response is valid. Raises an error and returns false if not.
 * */ 
export function validateResponse(
    response: Response,
    json: any,
    goodStatus: number[] | number,
    msg: string, 
    onInvalidResponse = (msg: string) => useUIStore().raiseError(msg, false),
) {
    if (DEBUG_MODE) console.log("Validating response...", response, json)
    // If JSON exists and the response status is good
    if (response.status === goodStatus && json) return true;
    // If the bad JSON doesn't have a message parameter
    if (!json.message) return onInvalidResponse(`${msg}: Got response code ${response.status}`);
    // If the bad JSON doesn't have an errors parameter
    if (!json.errors) return onInvalidResponse(`${msg}: ${json.message}`);
    // If the bad JSON has both the message and errors parameter
    const formattedError = Object.entries(json.errors).map(el => `${el[0]} - ${el[1]}`).join(" | ");
    return onInvalidResponse(`${msg}: ${json.message} (${formattedError})`);
}
