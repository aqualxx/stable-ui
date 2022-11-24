import { computed, ref } from "vue";
import { defineStore } from "pinia";
import type { RequestStatusStable, ModelGenerationInputStable, GenerationStable, RequestError, RequestAsync, GenerationInput, ActiveModel } from "@/types/stable_horde"
import { useOutputStore, type ImageData } from "./outputs";
import { useUIStore } from "./ui";
import { useOptionsStore } from "./options";
import type { UploadUserFile } from "element-plus";
import router from "@/router";
import { fabric } from "fabric";
import { useCanvasStore } from "./canvas";
import { useDashboardStore } from "./dashboard";
import { useLocalStorage } from "@vueuse/core";

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
        karras: true,
        denoising_strength: 0.75,
    }
}

function sleep(ms: number) {
    return new Promise(res=>setTimeout(res, ms));
}

export type GenerationStableArray = GenerationStable & Array<GenerationStable>
export interface IModelData {
    name: string;
    count: number;
    performance: number;
    description: string;
    style: string;
    nsfw: boolean;
    type: string;
    eta: number;
    queued: number;
}

export const useGeneratorStore = defineStore("generator", () => {
    const generatorType = ref<'Text2Img' | 'Img2Img' | 'Inpainting'>("Text2Img");

    const prompt = ref("");
    const negativePrompt = ref("");
    const negativePromptLibrary = useLocalStorage<string[]>("negativeLibrary", []);
    const params = ref<ModelGenerationInputStable>(getDefaultStore());
    const nsfw   = ref<"Enabled" | "Disabled" | "Censored">("Enabled");
    const trustedOnly = ref<"All Workers" | "Trusted Only">("All Workers");

    const availablePostProcessors: ("GFPGAN" | "RealESRGAN_x4plus")[] = ["GFPGAN", "RealESRGAN_x4plus"];
    const postProcessors = ref<typeof availablePostProcessors>([]);
    const availableModels = ref<{ value: string; label: string; }[]>([]);
    const modelsJSON = ref<any>({});
    const modelsData = ref<IModelData[]>([]);
    const modelDescription = computed(() => {
        if (selectedModel.value === "Random!") {
            return "Generate using a random model.";
        }
        if (selectedModel.value in modelsJSON.value) {
            return modelsJSON.value[selectedModel.value].description;
        }
        return "Not Found!";
    })
    const selectedModel = ref("stable_diffusion");
    const filteredAvailableModels = computed(() => {
        if (availableModels.value.length === 0) return [];
        let filtered: { value: string; label: string; }[] = [];
        if (generatorType.value === "Inpainting") {
            filtered = availableModels.value.filter(el => el.value.includes("inpainting"))
        } else if (generatorType.value === "Img2Img") {
            filtered = availableModels.value.filter(el => el.value !== "stable_diffusion_2.0")
        } else {
            filtered = availableModels.value.filter(el => !el.value.includes("inpainting"))
        }
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
    const images    = ref<ImageData[]>([]);

    const kudosCost = computed(() => {
        const result = Math.pow((params.value.height as number) * (params.value.width as number) - (64*64), 1.75) / Math.pow((1024*1024) - (64*64), 1.75);
        const kudos_cost = (0.1232 * (params.value.steps as number)) + result * (0.1232 * (params.value.steps as number) * 8.75);
        return kudos_cost * (params.value.n as number) * (/dpm_2|dpm_2_a|k_heun/.test(params.value.sampler_name as string) ? 2 : 1) * (1 + (postProcessors.value.includes("RealESRGAN_x4plus") ? (0.2 * (1) + 0.3) : 0));
    })

    const canGenerate = computed(() => {
        const dashStore = useDashboardStore();
        const affordable = (dashStore.user.kudos as number) > kudosCost.value;
        const higherDimensions = (params.value.height as number) * (params.value.width as number) > 1024*1024;
        const higherSteps = (params.value.steps as number) * (/dpm_2|dpm_2_a|k_heun/.test(params.value.sampler_name as string) ? 2 : 1) > 50;
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
        const canvasStore = useCanvasStore();
        const optionsStore = useOptionsStore();
        const uiStore = useUIStore();

        let sourceImage = undefined;
        let maskImage = undefined;
        let sourceProcessing: "inpainting" | "img2img" | "outpainting" | undefined = undefined;
        if (type === "Img2Img") {
            sourceProcessing = "img2img";
            canvasStore.saveImages();
            sourceImage = img2img.value.sourceImage;
            if (img2img.value.maskImage !== "") maskImage = img2img.value.maskImage;
        }

        if (type === "Inpainting") {
            sourceProcessing = "inpainting";
            canvasStore.saveImages();
            sourceImage = inpainting.value.sourceImage;
            maskImage = inpainting.value.maskImage;
        }
        
        let model;
        if (selectedModel.value === "Random!") {
            const realModels = availableModels.value.filter(el => el.value !== "Random!");
            model = [realModels[Math.floor(Math.random() * realModels.length)].value];
        } else {
            model = [selectedModel.value];
        }

        // Cache parameters so the user can't mutate the output data while it's generating
        const paramsCached: GenerationInput = {
            prompt: getFullPrompt(),
            params: {
                ...params.value,
                seed_variation: params.value.seed === "" ? 1000 : 1,
                post_processing: postProcessors.value,
            },
            nsfw: nsfw.value === "Enabled",
            censor_nsfw: nsfw.value === "Censored",
            trusted_workers: trustedOnly.value === "Trusted Only",
            source_image: sourceImage,
            source_mask: maskImage,
            source_processing: sourceProcessing,
            workers: optionsStore.useWorker === "None" ? undefined : [optionsStore.useWorker],
            models: model,
        }

        generating.value = true;
        const resJSON = await fetchNewID(paramsCached);
        if (!resJSON) return generationFailed();
        images.value = [];
        id.value = resJSON.id as string;
        let seconds = 0;
        for (;;) {
            const status = await checkImage(id.value);
            if (!status) return generationFailed();
            uiStore.updateProgress(status, seconds);
            if (status.done || cancelled.value) {
                const finalImages = cancelled.value ? await cancelImage(id.value) : await getImageStatus(id.value);
                if (!finalImages) return generationFailed();
                return generationDone(finalImages.map(el => ({...el, ...paramsCached})));
            }
            await sleep(500);
            seconds++;
        }
    }

    /**
     * Called when an image has failed.
     * @returns []
     */
    function generationFailed() {
        generating.value = false;
        return [];
    }

    /**
     * Prepare an image for going through text2img on the Horde
     * */ 
    function generateText2Img(data: ImageData) {
        const uiStore = useUIStore();
        generatorType.value = "Text2Img";
        uiStore.activeCollapse = ["2"];
        uiStore.activeIndex = "/";
        router.push("/");
        if (data.prompt) {
            const splitPrompt = data.prompt.split(" ### ");
            prompt.value = splitPrompt[0];
            negativePrompt.value = splitPrompt[1] || "";
        }
        if (data.sampler_name)    params.value.sampler_name = data.sampler_name;
        if (data.steps)           params.value.steps = data.steps;
        if (data.cfg_scale)       params.value.cfg_scale = data.cfg_scale;
        if (data.width)           params.value.width = data.width;
        if (data.height)          params.value.height = data.height;
        if (data.seed)            params.value.seed = data.seed;
        if (data.karras)          params.value.karras = data.karras;
        if (data.post_processing) postProcessors.value = data.post_processing as typeof availablePostProcessors;
        if (data.modelName)       selectedModel.value = data.modelName;
    }

    /**
     * Prepare an image for going through img2img on the Horde
     * */ 
    function generateImg2Img(sourceimg: string) {
        const uiStore = useUIStore();
        images.value = [];
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
        images.value = [];
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

    function addDreamboothTrigger(trigger?: string) {
        if (!(selectedModel.value in modelsJSON.value)) return;
        if (!modelsJSON.value[selectedModel.value].trigger) return;
        prompt.value += trigger || modelsJSON.value[selectedModel.value].trigger[0];
    }

    /**
     * Fetches a new ID
     */
    async function fetchNewID(parameters: GenerationInput) {
        const optionsStore = useOptionsStore();
        const response: Response = await fetch("https://stablehorde.net/api/v2/generate/async", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'apikey': optionsStore.apiKey,
            },
            body: JSON.stringify(parameters)
        })
        const resJSON: RequestAsync = await response.json();
        if (!validateResponse(response, resJSON, 202, "Failed to fetch ID")) return false;
        return resJSON;
    }

    type Arrayable<T> = T[] | T;

    /**
     * Called when a generation is finished.
     * */ 
    function generationDone(finalImages: (GenerationStable & GenerationInput)[]) {
        const store = useOutputStore();
        const uiStore = useUIStore();
        console.log(finalImages)
        generating.value = false;
        uiStore.progress = 0;
        cancelled.value = false;
        const finalParams: ImageData[] = finalImages.map(image => {
            const { params } = image;
            return {
                id: store.getNewImageID(),
                image: `data:image/webp;base64,${image.img}`,
                prompt: image.prompt,
                modelName: image.model,
                workerID: image.worker_id,
                workerName: image.worker_name,
                seed: image.seed,
                steps: params?.steps,
                sampler_name: params?.sampler_name,
                width: (params?.width as number) * ((params?.post_processing || []).includes("RealESRGAN_x4plus") ? 4 : 1),
                height: (params?.height as number) * ((params?.post_processing || []).includes("RealESRGAN_x4plus") ? 4 : 1),
                cfg_scale: params?.cfg_scale,
                karras: params?.karras,
                post_processing: params?.post_processing,
                starred: false,
            }
        })
        images.value = finalParams;
        store.outputs = [...store.outputs, ...finalParams];
        store.correctOutputIDs();
        return finalParams;
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
        const resJSON: ActiveModel[] = await response.json();
        if (!store.validateResponse(response, resJSON, 200, "Failed to get available models")) return;
        resJSON.sort((a, b) => (b.count as number) - (a.count as number));
        availableModels.value = [
            ...resJSON.map(el => ({ value: el.name as string, label: `${el.name} (${el.count})` })),
            { value: "Random!", label: "Random!" }
        ];
        const dbResponse = await fetch("https://raw.githubusercontent.com/Sygil-Dev/nataili-model-reference/main/db.json");
        const dbJSON = await dbResponse.json();
        modelsJSON.value = dbJSON;

        const newStuff: IModelData[] = [];
        const nameList = Object.keys(dbJSON);
        for (let i = 0; i < nameList.length; i++) {
            const { name, description, style, nsfw, type } = dbJSON[nameList[i]];
            if (resJSON.map(el => el.name).includes(name)) {
                const { count, performance, eta, queued } = resJSON[resJSON.map(el => el.name).indexOf(name)];
                newStuff.push({name, description, style, nsfw, type, queued: queued as number, eta: eta as number, count: count as number, performance: performance as number});
            } else {
                newStuff.push({name, description, style, nsfw, type, queued: 0, eta: Infinity, count: 0, performance: 0});
            }
        }
        modelsData.value = newStuff;
    }

    function pushToNegativeLibrary(prompt: string) {
        if (negativePromptLibrary.value.indexOf(prompt) !== -1) return;
        negativePromptLibrary.value = [...negativePromptLibrary.value, prompt];
    }

    function removeFromNegativeLibrary(prompt: string) {
        negativePromptLibrary.value = negativePromptLibrary.value.filter(el => el != prompt);
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
        // Constants
        availablePostProcessors,
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
        postProcessors,
        availableModels,
        selectedModel,
        negativePrompt,
        generating,
        modelsJSON,
        modelsData,
        negativePromptLibrary,
        // Computed
        filteredAvailableModels,
        kudosCost,
        canGenerate,
        modelDescription,
        // Actions
        generateImage,
        generateText2Img,
        generateImg2Img,
        generateInpainting,
        getImageStatus,
        getPrompt,
        addDreamboothTrigger,
        checkImage,
        cancelImage,
        validateResponse,
        resetStore,
        getBase64,
        pushToNegativeLibrary,
        removeFromNegativeLibrary
    };
});
