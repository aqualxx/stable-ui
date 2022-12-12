interface IFormatSecondsConfig {
    days?: boolean;
    hours?: boolean;
    minutes?: boolean;
    seconds?: boolean;
}

/**
 * Converts seconds into days, hours, minutes, and seconds.
 * @param seconds The number to format.
 * @param short Whether to trunacte the time units.
 * @returns Returns an object with the formatted time.
 */
export function formatSeconds(seconds?: number, short?: boolean, config?: IFormatSecondsConfig) {
    if (seconds == undefined) return "?";
    const d = Math.floor(seconds / 86400)
    const h = Math.floor(seconds % 86400 / 3600);
    const m = Math.floor(seconds % 86400 % 3600 / 60);
    const s = Math.floor(seconds % 86400 % 3600 % 60);

    const daysDisplay    = d > 0 ? d + (short ? 'd' : 'days') : "";
    const hoursDisplay   = h > 0 ? h + (short ? "h" : 'hours') : "";
    const minutesDisplay = m > 0 ? m + (short ? "m" : 'minutes') : "";
    const secondsDisplay = s > 0 ? s + (short ? "s" : 'seconds') : "";
    
    const formatted: string[] = [];
    if (config?.days)    formatted.push(daysDisplay);
    if (config?.hours)   formatted.push(hoursDisplay);
    if (config?.minutes) formatted.push(minutesDisplay);
    if (config?.seconds) formatted.push(secondsDisplay);
    return formatted.join(" ");
}
