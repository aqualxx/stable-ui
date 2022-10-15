import { ref } from "vue";
import { defineStore } from "pinia";
import type { RequestStatusStable, ModelGenerationInputStable, GenerationStable, RequestError, RequestAsync, GenerationInput } from "@/types/stable_horde"
import { useOutputStore, type ImageData } from "./outputs";
import { useUIStore } from "./ui";
import { useOptionsStore } from "./options";

function getDefaultStore() {
    return <ModelGenerationInputStable>{
        steps: 30,
        n: 1,
        sampler_name: "k_heun",
        width: 512,  // make sure these are divisible by 64
        height: 512, // make sure these are divisible by 64
        cfg_scale: 7,
        seed_variation: 1000,
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
    const nsfw   = ref<"Enabled" | "Disabled" | "Censored">("Enabled");
    const trustedOnly = ref<"All Workers" | "Trusted Only">("All Workers");

    const id        = ref("");
    const cancelled = ref(false);
    const images    = ref<GenerationStable[]>([]);

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

        const uiStore = useUIStore();

        // Cache parameters so the user can't mutate the output data while it's generating
        const paramsCached = JSON.parse(JSON.stringify(<ModelGenerationInputStable>{
            ...params.value,
            prompt: prompt.value,
            seed_variation: params.value.seed === "" ? 1000 : 1,
        }))
        const resJSON = await fetchNewID(paramsCached);
        if (!resJSON) return [];
        images.value = [];
        id.value = resJSON.id as string;
        let seconds = 0;
        for (;;) {
            const status = await checkImage(id.value);
            if (!status) return [];
            uiStore.updateProgress(status.wait_time, seconds);
            if (status.done || cancelled.value) {
                const finalImages = cancelled.value ? await cancelImage(id.value) : await getImageStatus(id.value);
                if (!finalImages) return [];
                const finalParams = [];
                for (let i = 0; i < finalImages.length; i++) {
                    finalParams.push({
                        ...paramsCached,
                        seed: finalImages[i].seed
                    })
                }
                return generationDone(finalImages, finalParams);
            }
            await sleep(500)
            seconds++;
        }
    }

    /**
     * Fetches a new ID
     */
    async function fetchNewID(parameters: ModelGenerationInputStable) {
        const optionsStore = useOptionsStore();
        const response: Response = await fetch("https://stablehorde.net/api/v2/generate/async", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'apikey': optionsStore.apiKey,
            },
            body: JSON.stringify(<GenerationInput>{
                prompt: prompt.value,
                params: parameters,
                nsfw: nsfw.value == "Enabled",
                censor_nsfw: nsfw.value == "Censored",
                trusted_workers: trustedOnly.value === "Trusted Only"
            })
        })
        const resJSON: RequestAsync = await response.json();
        if (!validateResponse(response, resJSON, 202, "Failed to fetch ID")) return false;
        return resJSON;
    }

    type Arrayable<T> = T[] | T;

    /**
     * Called when a generation is finished.
     * */ 
    function generationDone(finalImages: GenerationStable[], parameters: Arrayable<Omit<ImageData, "id" | "image" | "seed">>) {
        console.log({finalImages:finalImages, parameters:parameters})
        const store = useOutputStore();
        const uiStore = useUIStore();
        uiStore.progress = 0;
        cancelled.value = false;
        images.value = finalImages;
        for (let i = 0; i < finalImages.length; i++) {
            const imageParams = Array.isArray(parameters) ? parameters[i] : parameters;
            const image = finalImages[i];
            console.log({image: image, imageParams: imageParams})
            store.pushOutput({
                id: store.getNewImageID(),
                image: `data:image/webp;base64,${image.img}`,
                seed: image.seed as string,
                steps: imageParams.steps,
                sampler_name: imageParams.sampler_name,
                width: imageParams.width,
                height: imageParams.height,
                cfg_scale: imageParams.cfg_scale,
                prompt: imageParams.prompt,
                starred: false
            });
        }
        return finalImages;
    }

    /**
     * Gets information about the generating image(s). Returns false if an error occurs.
     * */ 
    async function checkImage(imageID: string) {
        const response = await fetch("https://stablehorde.net/api/v2/generate/check/"+imageID);
        const resJSON: RequestStatusStable = await response.json();
        if (cancelled.value) return { wait_time: 0, done: false };
        if (!validateResponse(response, resJSON, 200, "Failed to check image status")) return false;
        return resJSON;
    }

    /**
     * Cancels the generating image(s) and returns their state. Returns false if an error occurs.
     * */ 
    async function cancelImage(imageID: string) {
        const response = await fetch("https://stablehorde.net/api/v2/generate/status/"+imageID, {
            method: 'DELETE',
        });
        const resJSON = await response.json();
        if (!validateResponse(response, resJSON, 200, "Failed to cancel image")) return false;
        const generations: GenerationStable[] = resJSON.generations;
        return generations;
    }

    /**
     * Gets the final status of the generated image(s). Returns false if response is invalid.
     * */ 
    async function getImageStatus(imageID: string) {
        const response = await fetch("https://stablehorde.net/api/v2/generate/status/"+imageID);
        const resJSON = await response.json();
        if (!validateResponse(response, resJSON, 200, "Failed to check image status")) return false;
        const generations: GenerationStable[] = resJSON.generations;
        return generations;
    }

    /**
     * Returns true if response is valid. Raises an error and returns false if not.
     * */ 
    function validateResponse(response: Response, json: object | Array<any>, goodStatus: Arrayable<number>, msg: string) {
        const uiStore = useUIStore();
        let isGood = true;
        // If JSON is undefined or if the response status is bad and JSON doesn't have a message parameter
        if (json === undefined || (!Object.keys(json).includes("message") && response.status != goodStatus)) {
            uiStore.raiseError(`${msg}: Got response code ${response.status}`);
            isGood = false;
        }
        // If response is bad and JSON has a message parameter
        if (response.status != goodStatus) {
            uiStore.raiseError(`${msg}: ${(json as RequestError).message}`);
            isGood = false;
        }
        if (!isGood) {
            uiStore.progress = 0;
            cancelled.value = false;
            images.value = [];
        }
        return isGood;
    }

    /**
     * Generates a prompt (either creates a random one or extends the current prompt)
     * */
    function getPrompt()  {
        return false;
    }

    return { prompt, params, images, nsfw, trustedOnly, generateImage, getPrompt, checkImage, getImageStatus, resetStore, validateResponse, cancelled, cancelImage };
});
