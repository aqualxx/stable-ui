import { computed, ref } from "vue";
import { defineStore } from "pinia";
import type { RequestStatusStable, ModelGenerationInputStable, GenerationStable, RequestError, RequestAsync, GenerationInput } from "@/types/stable_horde"
import { useOutputStore, type ImageData } from "./outputs";
import { useUIStore } from "./ui";
import { useOptionsStore } from "./options";
import type { UploadUserFile } from "element-plus";
import router from "@/router";
import { fabric } from "fabric";
import { useCanvasStore } from "./canvas";
import { useDashboardStore } from "./dashboard";

function getDefaultStore() {
    return <ModelGenerationInputStable>{
        steps: 30,
        n: 1,
        sampler_name: "k_euler",
        width: 512,  // make sure these are divisible by 64
        height: 512, // make sure these are divisible by 64
        cfg_scale: 7,
        seed_variation: 1000,
        seed: "",
        denoising_strength: 0.75,
    }
}

function sleep(ms: number) {
    return new Promise(res=>setTimeout(res, ms));
}

export type GenerationStableArray = GenerationStable & Array<GenerationStable>
type Model = {name: string; count: number; performance: number}

export const useGeneratorStore = defineStore("generator", () => {
    const generatorType = ref<'Text2Img' | 'Img2Img' | 'Inpainting'>("Text2Img");

    const prompt = ref("");
    const negativePrompt = ref("");
    const params = ref<ModelGenerationInputStable>(getDefaultStore());
    const nsfw   = ref<"Enabled" | "Disabled" | "Censored">("Enabled");
    const trustedOnly = ref<"All Workers" | "Trusted Only">("All Workers");

    type Upscalers = "GFPGAN" | "Real ESRGAN" | "LDSR";
    const upscalers = ref<Upscalers[]>([]);
    const availableModels = ref<{ value: string; label: string; }[]>([]);
    const selectedModel = ref("stable_diffusion");
    const filteredAvailableModels = computed(() => {
        if (availableModels.value.length === 0) return [];
        const filtered = generatorType.value === "Inpainting" ? availableModels.value.filter(el => el.value.includes("inpainting")) : availableModels.value.filter(el => !el.value.includes("inpainting"));
        if (!filtered.map(el => el.value).includes(selectedModel.value)) {
            selectedModel.value = filtered[0].value;
        }
        return filtered;
    })

    interface ITypeParams {
        sourceImage: string;
        fileList: UploadUserFile[];
        maskImage: string;
    }

    const inpainting = ref<ITypeParams>({
        sourceImage: "",
        maskImage: "",
        fileList: []
    })

    const img2img = ref(<ITypeParams>{
        sourceImage: "",
        maskImage: "",
        fileList: []
    })

    const uploadDimensions = ref("");

    const id        = ref("");
    const generating = ref(false);
    const cancelled = ref(false);
    const images    = ref<GenerationStable[]>([]);

    const kudosCost = computed(() => {
        const result = Math.pow((params.value.height as number) * (params.value.width as number) - (64*64), 1.75) / Math.pow((1024*1024) - (64*64), 1.75);
        const kudos_cost = (0.1232 * (params.value.steps as number)) + result * (0.1232 * (params.value.steps as number) * 8.75);
        return kudos_cost * (params.value.n as number) * (/dpm_2|dpm_2_a|k_heun/.test(params.value.sampler_name as string) ? 2 : 1);
    })

    const canGenerate = computed(() => {
        const dashStore = useDashboardStore();
        const affordable = (dashStore.user.kudos as number) > kudosCost.value;
        const higherDimensions = (params.value.height as number) * (params.value.width as number) > 1024*1024;
        const higherSteps = (params.value.steps as number) * (/dpm_2|dpm_2_a|k_heun/.test(params.value.sampler_name as string) ? 2 : 1) > 100;
        return affordable || (!higherDimensions && !higherSteps);
    })

    /**
     * Resets the generator store to its default state
     * */ 
    function resetStore()  {
        params.value = getDefaultStore();
        inpainting.value.sourceImage = "";
        inpainting.value.maskImage = "";
        img2img.value.sourceImage = "";
        images.value = [];
        return true;
    }

    /**
     * Generates images on the Horde; returns a list of image(s)
     * */ 
    async function generateImage(type: "Img2Img" | "Text2Img" | "Inpainting") {
        if (prompt.value === "") return [];

        let sourceImage = undefined;
        let maskImage = undefined;
        if (type === "Img2Img") {
            sourceImage = img2img.value.sourceImage;
            if (img2img.value.maskImage !== "") maskImage = img2img.value.maskImage
        }
        if (type === "Inpainting") {
            sourceImage = inpainting.value.sourceImage;
            maskImage = inpainting.value.maskImage;
        }

        const uiStore = useUIStore();

        // Cache parameters so the user can't mutate the output data while it's generating
        const paramsCached = JSON.parse(JSON.stringify(<ModelGenerationInputStable>{
            ...params.value,
            prompt: getFullPrompt(),
            seed_variation: params.value.seed === "" ? 1000 : 1,
            use_upscaling: upscalers.value.length !== 0,
            use_gfpgan: upscalers.value.includes("GFPGAN"),
            use_real_esrgan: upscalers.value.includes("Real ESRGAN"),
        }))
        const realModels = availableModels.value.filter(el => el.value !== "Random!");
        let model;
        if (selectedModel.value === "Random!") {
            model = [realModels[Math.floor(Math.random() * realModels.length)].value];
        } else {
            model = [selectedModel.value];
        }
        generating.value = true;
        const resJSON = await fetchNewID(paramsCached, model, sourceImage, maskImage);
        if (!resJSON) {   
            generating.value = false;
            return [];
        }
        images.value = [];
        id.value = resJSON.id as string;
        let seconds = 0;
        for (;;) {
            const status = await checkImage(id.value);
            if (!status) {
                generating.value = false;
                return [];
            }
            uiStore.updateProgress(status.wait_time as number, seconds);
            if (status.done || cancelled.value) {
                const finalImages = cancelled.value ? await cancelImage(id.value) : await getImageStatus(id.value);
                if (!finalImages) {
                    generating.value = false;
                    return [];
                }
                const finalParams = [];
                for (let i = 0; i < finalImages.length; i++) {
                    finalParams.push({
                        ...paramsCached,
                        seed: finalImages[i].seed
                    })
                }
                return generationDone(finalImages, finalParams, model);
            }
            await sleep(500)
            seconds++;
        }
    }

    /**
     * Prepare an image for going through img2img on the Horde
     * */ 
    function generateImg2Img(sourceimg: string) {
        const uiStore = useUIStore();
        img2img.value.sourceImage = sourceimg.split(",")[1];
        generatorType.value = "Img2Img";
        const newImgUrl = URL.createObjectURL(convertBase64ToBlob(sourceimg));
        img2img.value.fileList = [
            {
                name: "Image", 
                url: newImgUrl
            }
        ]
        uiStore.activeCollapse = ["1", "2"];
        uiStore.activeIndex = "/";
        router.push("/");
        const img = new Image();
        img.onload = function() {
            uploadDimensions.value = `${(this as any).naturalWidth}x${(this as any).naturalHeight}`;
        }
        img.src = newImgUrl;
    }

    /**
     * Prepare an image for going through inpainting on the Horde
     * */ 
    function generateInpainting(sourceimg: string) {
        const uiStore = useUIStore();
        const canvasStore = useCanvasStore();
        inpainting.value.sourceImage = sourceimg.split(",")[1];
        generatorType.value = "Inpainting";
        const newImgUrl = URL.createObjectURL(convertBase64ToBlob(sourceimg));
        uiStore.activeIndex = "/";
        router.push("/");
        fabric.Image.fromURL(newImgUrl, canvasStore.newImage);
    }

    /**
     * Convert BASE64 to BLOB
     * @param base64Image Pass Base64 image data to convert into the BLOB
     */
    function convertBase64ToBlob(base64Image: string) {
        // Split into two parts
        const parts = base64Image.split(';base64,');
    
        // Hold the content type
        const imageType = parts[0].split(':')[1];
    
        // Decode Base64 string
        const decodedData = window.atob(parts[1]);
    
        // Create UNIT8ARRAY of size same as row data length
        const uInt8Array = new Uint8Array(decodedData.length);
    
        // Insert all character code into uInt8Array
        for (let i = 0; i < decodedData.length; ++i) {
            uInt8Array[i] = decodedData.charCodeAt(i);
        }
    
        // Return BLOB image after conversion
        return new Blob([uInt8Array], { type: imageType });
    }

    /**
     * Combines positive and negative prompt
     */
    function getFullPrompt() {
        if (negativePrompt.value === "") return prompt.value;
        return `${prompt.value} ### ${negativePrompt.value}`;
    }

    /**
     * Fetches a new ID
     */
    async function fetchNewID(parameters: ModelGenerationInputStable, model: string[], sourceimg?: string, maskimg?: string) {
        const optionsStore = useOptionsStore();
        const response: Response = await fetch("https://stablehorde.net/api/v2/generate/async", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'apikey': optionsStore.apiKey,
            },
            body: JSON.stringify(<GenerationInput>{
                prompt: getFullPrompt(),
                params: parameters,
                nsfw: nsfw.value == "Enabled",
                censor_nsfw: nsfw.value == "Censored",
                trusted_workers: trustedOnly.value === "Trusted Only",
                source_image: sourceimg,
                source_mask: maskimg,
                source_processing: sourceimg ? generatorType.value === "Inpainting" ? "inpainting" : "img2img" : undefined,
                models: model,
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
    function generationDone(finalImages: GenerationStable[], parameters: Arrayable<Omit<ImageData, "id" | "image" | "seed">>, model: string[]) {
        console.log({finalImages:finalImages, parameters:parameters})
        generating.value = false;
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
                prompt: getFullPrompt(),
                modelName: model[0],
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
     * Updates available models
     * */ 
    async function updateAvailableModels() {
        const store = useGeneratorStore();
        const response = await fetch("https://stablehorde.net/api/v2/status/models");
        const resJSON: Model[] = await response.json();
        if (!store.validateResponse(response, resJSON, 200, "Failed to get available models")) return;
        resJSON.sort((a, b) => b.count - a.count);
        availableModels.value = [
            ...resJSON.map(el => {
                return { value: el.name, label: `${el.name} (${el.count})` };
            }), { value: "Random!", label: "Random!" }
        ];
    }

    /**
     * Generates a prompt (either creates a random one or extends the current prompt)
     * */
    function getPrompt()  {
        return false;
    }

    function getBase64(file: File) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    updateAvailableModels()
    setInterval(updateAvailableModels, 30 * 1000)

    return {
        // Variables
        generatorType,
        prompt,
        params,
        images,
        nsfw,
        trustedOnly,
        inpainting,
        img2img,
        uploadDimensions,
        cancelled,
        upscalers,
        availableModels,
        selectedModel,
        negativePrompt,
        generating,
        // Computed
        filteredAvailableModels,
        kudosCost,
        canGenerate,
        // Actions
        generateImage,
        generateImg2Img,
        generateInpainting,
        getImageStatus,
        getPrompt,
        checkImage,
        cancelImage,
        validateResponse,
        resetStore,
        getBase64
    };
});
