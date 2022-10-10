import { ref } from "vue";
import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";
import type { RequestStatusStable, ModelGenerationInputStable, GenerationStable, RequestError } from "@/types/stable_horde"
import { useOutputStore } from "./outputs";
import { useUIStore } from "./ui";

function getDefaultStore() {
    return <ModelGenerationInputStable>{
        steps: 30,
        n: 1,
        sampler_name: "k_lms",
        width: 512,  // make sure these are divisible by 64
        height: 512, // make sure these are divisible by 64
        cfg_scale: 7,
        seed: ""
    }
}

function sleep(ms: number) {
    return new Promise(res=>setTimeout(res, ms));
}

export type GenerationStableArray = GenerationStable & Array<GenerationStable>

export const useGeneratorStore = defineStore("generator", () => {
    const prompt = ref("");
    const params = ref<ModelGenerationInputStable>(getDefaultStore());
    const nsfw   = ref<"Enabled" | "Disabled" | "Censored">("Enabled")
    const apiKey = ref(useLocalStorage("apikey", ""));

    const id       = ref("");
    const progress = ref(0);
    const waitMsg  = ref('');
    const images   = ref<GenerationStable[]>([]);

    /**
     * Resets the generator store to its default state
     * */ 
    function resetStore()  {
        params.value = getDefaultStore();
        return true;
    }

    /**
     * Generates images on the Horde; returns a list of image(s)
     * */ 
    async function generateImage() {
        if (prompt.value === "") return [];

        const store = useOutputStore();
        const censorNSFW = nsfw.value == "Censored";
        const nsfwEnabled = nsfw.value == "Enabled";

        const response: Response = await fetch("https://stablehorde.net/api/v2/generate/async", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'apikey': apiKey.value,
            }, 
            body: JSON.stringify({
                prompt: prompt.value,
                params: params.value,
                nsfw: nsfwEnabled,
                censor_nsfw: censorNSFW,
            })
        })
        const resJSON = await response.json();
        if (!validateResponse(response, resJSON, 202, "Failed to generate image")) return [];
        // Cache parameters so the user can't mutate the output data while it's generating
        const paramsCached = JSON.parse(JSON.stringify({
            prompt: prompt.value,
            steps: params.value.steps as number,
            sampler_name: params.value.sampler_name as string,
            width: params.value.width as number,
            height: params.value.height as number,
            cfg_scale: params.value.cfg_scale as number,
            starred: false,
        }))
        images.value = [];
        let seconds = 0;
        id.value = resJSON.id;
        for (;;) {
            const status = await checkImage();
            if (!status) return [];
            const percentage = 100 * (1 - status.wait_time / (status.wait_time + seconds));
            progress.value   = Math.round(percentage * 100) / 100;
            waitMsg.value    = `EST: ${status.wait_time}s`;
            console.log(`${progress.value.toFixed(2)}%`);
            if (status.done) {
                const finalImages = await getImageStatus();
                if (!finalImages) return [];
                images.value = finalImages;
                finalImages.forEach((image: GenerationStable) => {
                    store.pushOutput({
                        id: store.getNewImageID(),
                        image: `data:image/webp;base64,${image.img}`,
                        seed: image.seed as string,
                        ...paramsCached
                    });
                });
                progress.value = 0;
                return finalImages;
            }
            await sleep(500)
            seconds++;
        }
    }

    /**
     * Gets information about the generating image(s). Returns false if an error occurs.
     * */ 
    async function checkImage() {
        const response = await fetch("https://stablehorde.net/api/v2/generate/check/"+id.value);
        const resJSON: RequestStatusStable = await response.json();
        if (!validateResponse(response, resJSON, 200, "Failed to check image status")) return false;
        return resJSON;
    }

    /**
     * Gets the final status of the generated image(s). Returns false if response is invalid.
     * */ 
    async function getImageStatus() {
        const response = await fetch("https://stablehorde.net/api/v2/generate/status/"+id.value);
        const resJSON = await response.json();
        if (!validateResponse(response, resJSON, 200, "Failed to check image status")) return false;
        const generations: GenerationStable[] = resJSON.generations;
        return generations;
    }

    /**
     * Returns true if response is valid. Raises an error and returns false if not.
     * */ 
    function validateResponse(response: Response, json: object | Array<any>, goodStatus: number, msg: string) {
        const store = useUIStore();
        // If JSON is undefined or if the response status is bad and JSON doesn't have a message parameter
        if (json === undefined || (!Object.values(json).includes("message") && response.status != goodStatus)) {
            store.raiseError(`${msg}: Got response code ${response.status}`);
            return false;
        }
        // If response is bad and JSON has a message parameter
        if (response.status != goodStatus) {
            store.raiseError(`${msg}: ${(json as RequestError).message}`);
            return false;
        }
        return true;
    }

    /**
     * Generates a prompt (either creates a random one or extends the current prompt)
     * */
    function getPrompt()  {
        return false;
    }

    /**
     * Make your API key anonymous (0000000000) 
     * */
    function useAnon() {
        apiKey.value = "0000000000";
    }

    return { prompt, params, progress, images, waitMsg, nsfw, apiKey, generateImage, getPrompt, useAnon, checkImage, getImageStatus, resetStore, validateResponse };
});
