import { computed, h, ref } from "vue";
import { defineStore } from "pinia";
import type { ModelGenerationInputStable, GenerationStable, RequestAsync, GenerationInput, ActiveModel, RequestStatusCheck } from "@/types/stable_horde"
import { useOutputStore, type ImageData } from "./outputs";
import { useUIStore } from "./ui";
import { useOptionsStore } from "./options";
import router from "@/router";
import { fabric } from "fabric";
import { useCanvasStore } from "./canvas";
import { useDashboardStore } from "./dashboard";
import { useLocalStorage } from "@vueuse/core";
import { MODELS_DB_URL, POLL_MODELS_INTERVAL, DEBUG_MODE, POLL_STYLES_INTERVAL } from "@/constants";
import { convertToBase64 } from "@/utils/base64";
import { validateResponse } from "@/utils/validate";
import { ElNotification } from "element-plus";

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
        tiling: false,
    }
}

function sleep(ms: number) {
    return new Promise(res=>setTimeout(res, ms));
}

export type GenerationStableArray = GenerationStable & Array<GenerationStable>
export interface IModelData {
    name?: string;
    count?: number;
    performance?: number;
    description?: string;
    trigger?: string[];
    showcases?: string[];
    style?: string;
    nsfw?: boolean;
    type?: string;
    eta?: number;
    queued?: number;
}

export interface IStyleData {
    prompt: string;
    model: string;
    sampler_name?: string;
    width?: number;
    height?: number;
}

export type ICurrentGeneration = GenerationInput & {
    jobId: string;
    waitData?: RequestStatusCheck;
}

interface ITypeParams {
    sourceProcessing?: "inpainting" | "img2img" | "outpainting";
    sourceImage?: string;
    maskImage?: string;
}

interface IPromptHistory {
    starred: boolean;
    prompt: string;
    timestamp: number;
}

export const useGeneratorStore = defineStore("generator", () => {
    const generatorType = ref<'Text2Img' | 'Img2Img' | 'Inpainting' | 'Rating'>("Text2Img");

    const prompt = ref("");
    const promptHistory = useLocalStorage<IPromptHistory[]>("promptHistory", []);
    const negativePrompt = ref("");
    const negativePromptLibrary = useLocalStorage<string[]>("negativeLibrary", []);
    const params = ref<ModelGenerationInputStable>(getDefaultStore());
    const nsfw   = ref<"Enabled" | "Disabled" | "Censored">("Enabled");
    const trustedOnly = ref<"All Workers" | "Trusted Only">("All Workers");

    const availablePostProcessors: ("GFPGAN" | "RealESRGAN_x4plus" | "CodeFormers")[] = ["GFPGAN", "RealESRGAN_x4plus", "CodeFormers"];
    const postProcessors = ref<typeof availablePostProcessors>([]);

    const availableModels = ref<{ value: string; label: string; }[]>([]);
    const modelsData = ref<IModelData[]>([]);
    const modelDescription = computed(() => {
        if (selectedModel.value === "Random!") {
            return "Generate using a random model.";
        }
        return selectedModelData.value?.description || "Not Found!";
    })
    const selectedModel = ref("stable_diffusion");
    const selectedModelData = computed<IModelData>(() => modelsData.value.find(el => el.name === selectedModel.value) || {});
    const filteredAvailableModels = computed(() => {
        if (availableModels.value.length === 0) return [];
        const filtered = availableModels.value.filter(el => {
            if (generatorType.value === "Inpainting") {
                return el.value.includes("inpainting");
            }
            if (generatorType.value === "Img2Img") {
                return el.value !== "stable_diffusion_2.0" && !el.value.includes("inpainting");
            }
            return !el.value.includes("inpainting");
        });
        if (filtered.findIndex(el => el.value === selectedModel.value) === -1) {
            selectedModel.value = filtered[0].value;
        }
        return filtered;
    })

    const styles = useLocalStorage<{[key: string]: IStyleData}>("styles", {});

    const getDefaultImageProps = (): ITypeParams => ({
        sourceProcessing: undefined,
        sourceImage: undefined,
        maskImage: undefined,
    })

    const inpainting = ref<ITypeParams>({
        ...getDefaultImageProps(),
        sourceProcessing: "inpainting",
    })

    const img2img = ref(<ITypeParams>{
        ...getDefaultImageProps(),
        sourceProcessing: "img2img",
    })

    const getImageProps = (type: typeof generatorType.value): ITypeParams => {
        if (type === "Inpainting") {
            return inpainting.value;
        }
        if (type === "Img2Img") {
            return img2img.value;
        }
        return getDefaultImageProps();
    }

    const currentImageProps = computed(() => getImageProps(generatorType.value));

    const uploadDimensions = ref("");

    const generating = ref(false);
    const cancelled = ref(false);
    const images    = ref<ImageData[]>([]);
    const remainingToQueue = ref(0);
    const gatheredImages = ref(0);
    const queue = ref<ICurrentGeneration[]>([]);
    const queueStatus = computed<RequestStatusCheck>(() => {
        const mergedWaitData: RequestStatusCheck = mergeObjects(queue.value.map(el => el.waitData || {}));
        mergedWaitData.queue_position = Math.round((mergedWaitData?.queue_position || 0) / queue.value.length);
        mergedWaitData.faulted = !queue.value.every(el => !el.waitData?.faulted)
        mergedWaitData.wait_time = Math.round((mergedWaitData?.wait_time || 0) / queue.value.length);
        return mergedWaitData;
    });

    const minDimensions = ref(64);
    const maxDimensions = computed(() => useOptionsStore().allowLargerParams === "Enabled" ? 3072 : 1024);
    const minImages = ref(1);
    const maxImages = ref(20);
    const minSteps = ref(1);
    const maxSteps = computed(() => useOptionsStore().allowLargerParams === "Enabled" ? 500 : 50);
    const minCfgScale = ref(1);
    const maxCfgScale = ref(24);
    const minDenoise = ref(0.1);
    const maxDenoise = ref(1);

    const kudosCost = computed(() => {
        const result = Math.pow((params.value.height as number) * (params.value.width as number) - (64*64), 1.75) / Math.pow((1024*1024) - (64*64), 1.75);
        const kudos_cost_with_steps = (0.1232 * (params.value.steps as number)) + result * (0.1232 * (params.value.steps as number) * 8.75);
        const kudos_cost_with_processing_options = kudos_cost_with_steps * (params.value.n as number) * (/dpm_2|dpm_2_a|k_heun/.test(params.value.sampler_name as string) ? 2 : 1) * (1 + (postProcessors.value.includes("RealESRGAN_x4plus") ? (0.2 * (1) + 0.3) : 0));
        return kudos_cost_with_processing_options + (useOptionsStore().shareWithLaion === "Enabled" ? 1 : 3);
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
        inpainting.value = getDefaultImageProps();
        img2img.value = getDefaultImageProps();
        images.value = [];
        return true;
    }

    /**
     * Generates images on the Horde; returns a list of image(s)
     * */ 
    async function generateImage(type: "Img2Img" | "Text2Img" | "Inpainting" | "Rating") {
        if (prompt.value === "" || type === "Rating") return [];
        const canvasStore = useCanvasStore();
        const optionsStore = useOptionsStore();
        const uiStore = useUIStore();

        canvasStore.saveImages();
        const { sourceImage, maskImage, sourceProcessing } = getImageProps(type);
        
        let model: string[];
        if (selectedModel.value === "Random!") {
            const realModels = availableModels.value.filter(el => el.value !== "Random!");
            model = [realModels[Math.floor(Math.random() * realModels.length)].value];
        } else {
            model = [selectedModel.value];
        }

        pushToPromptHistory(prompt.value);

        const getCachedParams = (prompt = getFullPrompt(), n = params.value?.n) => ({
            prompt,
            params: {
                ...params.value,
                seed_variation: params.value.seed === "" ? 1000 : 1,
                post_processing: postProcessors.value,
                n,
            },
            nsfw: nsfw.value === "Enabled",
            censor_nsfw: nsfw.value === "Censored",
            trusted_workers: trustedOnly.value === "Trusted Only",
            source_image: sourceImage?.split(",")[1],
            source_mask: maskImage,
            source_processing: sourceProcessing,
            workers: optionsStore.useWorker === "None" ? undefined : [optionsStore.useWorker],
            models: model,
            r2: true,
            shared: useOptionsStore().shareWithLaion === "Enabled"
        })

        // Cache parameters so the user can't mutate the output data while it's generating
        const paramsCached: GenerationInput[] = [];

        // Get all prompt matrices (example: {vase|pot}) and try to spread the batch size evenly
        const newPrompts = promptMatrix();
        const promptCount = newPrompts.length;
        const batchSize = getCachedParams().params?.n || 1;
        for (let i = 0; i < promptCount; i++) {
            let hi = Math.floor(batchSize / promptCount);
            if (i === promptCount - 1) hi += batchSize % promptCount;
            paramsCached.push(getCachedParams(newPrompts[i], hi));
        }

        if (DEBUG_MODE) console.log("Using generation parameters:", paramsCached)

        // Set generating to true
        generating.value = true;

        // Loop through each item in the parameters array and push to queue
        const queueAmount = paramsCached.length;
        remainingToQueue.value = queueAmount;
        for (let i = 0; i < queueAmount; i++) {
            const resJSON = await fetchNewID(paramsCached[i]);
            if (!resJSON) return generationFailed();
            remainingToQueue.value--;
            queue.value.push({
                ...paramsCached[i],
                jobId: resJSON.id as string
            })
            if (cancelled.value) return generationFailed();
        }

        // Reset variables
        images.value = [];
        gatheredImages.value = 0;

        // Loop until queue is done or generation is cancelled
        let secondsElapsed = 0;
        while (!queueStatus.value.done && !cancelled.value) {
            for (const queuedImage of queue.value) {
                if (queuedImage.waitData?.done) continue;
                const status = await checkImage(queuedImage.jobId);
                if (!status) return generationFailed();
                if (status.faulted) return generationFailed("Failed to generate: Generation faulted.");
                if (!status.is_possible) return generationFailed("Failed to generate: Generation not possible.");
                queuedImage.waitData = status;
            }
            if (DEBUG_MODE) console.log("Checked all images:", queueStatus.value)
            uiStore.updateProgress(queueStatus.value, secondsElapsed);
            await sleep(500);
            secondsElapsed++;
        }

        if (DEBUG_MODE) console.log("Images done/cancelled");

        // Retrieve final images either by canceling or getting status
        let allImages: (GenerationStable & ICurrentGeneration)[] = [];
        for (const queuedImage of queue.value) {
            const finalImages = cancelled.value ? await cancelImage(queuedImage.jobId) : await getImageStatus(queuedImage.jobId);
            if (!finalImages) return generationFailed();
            allImages = [...allImages, ...finalImages.map(el => ({...el, ...queuedImage}))];
        }

        if (DEBUG_MODE) console.log("Got final images", allImages);
        return await generationDone(allImages);
    }

    function mergeObjects(data: any[]) {
        return data.reduce((prev, curr) => {
            for (const [key, value] of Object.entries(curr)) {
                if (typeof value === "boolean") {
                    if (prev[key] === undefined) prev[key] = value;
                    prev[key] = prev[key] && value;
                    continue;
                }
                if (!prev[key]) prev[key] = 0;
                prev[key] += value;
            }
            return prev;
        }, {});
    }

    /**
     * Called when an image has failed.
     * @returns []
     */
    async function generationFailed(error?: string) {
        const store = useUIStore();
        if (error) store.raiseError(error, false);
        generating.value = false;
        cancelled.value = false;
        store.progress = 0;
        for (const { jobId } of queue.value) {
            await cancelImage(jobId);
        }
        queue.value = [];
        return [];
    }

    function validateParam(paramName: string, param: number, max: number, defaultValue: number) {
        if (param <= max) return param;
        useUIStore().raiseWarning(`This image was generated using the 'Larger Values' option. Setting '${paramName}' to its default value instead of ${param}.`, true)
        return defaultValue;
    }

    /**
     * Prepare an image for going through text2img on the Horde
     * */ 
    function generateText2Img(data: ImageData, correctDimensions = true) {
        const uiStore = useUIStore();
        const defaults = getDefaultStore();
        generatorType.value = "Text2Img";
        uiStore.activeCollapse = ["2"];
        router.push("/");
        if (correctDimensions) {
            const calculateNewDimensions = (value: number) => data.post_processing?.includes("RealESRGAN_x4plus") ? value / 4 : value;
            data.width = calculateNewDimensions(data.width || defaults.width as number);
            data.height = calculateNewDimensions(data.height || defaults.height as number);
        }
        if (data.prompt) {
            const splitPrompt = data.prompt.split(" ### ");
            prompt.value = splitPrompt[0];
            negativePrompt.value = splitPrompt[1] || "";
        }
        if (data.sampler_name)    params.value.sampler_name = data.sampler_name;
        if (data.steps)           params.value.steps = validateParam("steps", data.steps, maxSteps.value, defaults.steps as number);
        if (data.cfg_scale)       params.value.cfg_scale = data.cfg_scale;
        if (data.width)           params.value.width = validateParam("width", data.width, maxDimensions.value, defaults.width as number);
        if (data.height)          params.value.height = validateParam("height", data.height, maxDimensions.value, defaults.height as number);
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
        const canvasStore = useCanvasStore();
        generatorType.value = "Img2Img";
        img2img.value.sourceImage = sourceimg;
        canvasStore.drawing = false;
        uiStore.activeCollapse = ["1", "2"];
        images.value = [];
        router.push("/");
        fabric.Image.fromURL(sourceimg, canvasStore.newImage);
        // Note: unused code
        // const img = new Image();
        // img.onload = function() {
        //     uploadDimensions.value = `${(this as any).naturalWidth}x${(this as any).naturalHeight}`;
        // }
        // img.src = newImgUrl;
    }

    /**
     * Prepare an image for going through inpainting on the Horde
     * */ 
    function generateInpainting(sourceimg: string) {
        const canvasStore = useCanvasStore();
        images.value = [];
        inpainting.value.sourceImage = sourceimg;
        generatorType.value = "Inpainting";
        router.push("/");
        fabric.Image.fromURL(sourceimg, canvasStore.newImage);
    }

    /**
     * Combines positive and negative prompt
     */
    function getFullPrompt() {
        if (negativePrompt.value === "") return prompt.value;
        return `${prompt.value} ### ${negativePrompt.value}`;
    }

    /**
     * Returns all prompt matrix combinations
     */
    function promptMatrix() {
        const prompt = getFullPrompt();
        const matrixMatches = prompt.match(/\{(.*?)\}/g) || [];
        if (matrixMatches.length === 0) return [prompt];
        let prompts: string[] = [];
        matrixMatches.forEach(matrix => {
            const newPrompts: string[] = [];
            const options = matrix.replace("{", "").replace("}", "").split("|");
            if (prompts.length === 0) {
                options.forEach(option => {
                    const newPrompt = prompt.replace(matrix, option);
                    newPrompts.push(newPrompt);
                });
            } else {
                prompts.forEach(previousPrompt => {
                    options.forEach(option => {
                        const newPrompt = previousPrompt.replace(matrix, option);
                        newPrompts.push(newPrompt);
                    });
                });
            }
            prompts = [...newPrompts];
        });
        return prompts;
    }

    function addDreamboothTrigger(trigger?: string) {
        if (!selectedModelData.value?.trigger) return;
        prompt.value += trigger || selectedModelData.value.trigger[0];
    }

    /**
     * Fetches a new ID
     */
    async function fetchNewID(parameters: GenerationInput) {
        const optionsStore = useOptionsStore();
        const response: Response = await fetch(`${optionsStore.baseURL}/api/v2/generate/async`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'apikey': optionsStore.apiKey,
            },
            body: JSON.stringify(parameters)
        })
        const resJSON: RequestAsync = await response.json();
        if (!validateResponse(response, resJSON, 202, "Failed to fetch ID", onInvalidResponse)) return false;
        return resJSON;
    }

    /**
     * Called when a generation is finished.
     * */ 
    async function generationDone(finalImages: (GenerationStable & ICurrentGeneration)[]) {
        const store = useOutputStore();
        const uiStore = useUIStore();
        const optionsStore = useOptionsStore();

        console.log(finalImages)
        const finalParams: ImageData[] = await Promise.all(
            finalImages.map(async (image) => {
                let { img } = image;
                if (image.r2) {
                    const res = await fetch(`${img}`);
                    const blob = await res.blob();
                    const base64 = await convertToBase64(blob) as string;
                    img = base64.split(",")[1];
                    gatheredImages.value++;
                }
                const { params } = image;
                return {
                    // The database automatically increments IDs for us
                    id: -1,
                    jobId: image.jobId,
                    image: `data:image/webp;base64,${img}`,
                    hordeImageId: image.id,
                    sharedExternally: optionsStore.shareWithLaion === "Enabled" || optionsStore.apiKey === '0000000000',
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
                    tiling: params?.tiling,
                    starred: false,
                    rated: false,
                }
            })
        )
        generating.value = false;
        cancelled.value = false;
        uiStore.progress = 0;
        queue.value = [];
        images.value = await store.pushOutputs(finalParams) as ImageData[];

        const onGeneratorPage = router.currentRoute.value.fullPath === "/";
        if ((onGeneratorPage && generatorType.value === "Rating") || !onGeneratorPage) {
            uiStore.showGeneratorBadge = true;
            const notification = ElNotification({
                title: 'Images Finished',
                message: h("div", [
                    'View your new images ',
                    h("span", {
                        style: {
                            color: "var(--el-menu-active-color)",
                            cursor: "pointer",
                        },
                        onClick: () => {
                            if (generatorType.value === "Rating") generatorType.value = "Text2Img";
                            uiStore.showGeneratorBadge = false;
                            router.push("/");
                            notification.close();
                        },
                    }, "here!"),
                ]),
                icon: h("img", {
                    src: images.value[0].image,
                    style: { maxHeight: "54px", maxWidth: "54px" },
                }),
                customClass: "image-notification",
            });
        }

        return finalParams;
    }

    /**
     * Gets information about the generating image(s). Returns false if an error occurs.
     * */ 
    async function checkImage(imageID: string) {
        const optionsStore = useOptionsStore();
        const response = await fetch(`${optionsStore.baseURL}/api/v2/generate/check/`+imageID);
        const resJSON: RequestStatusCheck = await response.json();
        if (cancelled.value) return { wait_time: 0, done: false };
        if (!validateResponse(response, resJSON, 200, "Failed to check image status", onInvalidResponse)) return false;
        return resJSON;
    }

    /**
     * Cancels the generating image(s) and returns their state. Returns false if an error occurs.
     * */ 
    async function cancelImage(imageID: string) {
        const optionsStore = useOptionsStore();
        const response = await fetch(`${optionsStore.baseURL}/api/v2/generate/status/`+imageID, {
            method: 'DELETE',
        });
        const resJSON = await response.json();
        if (!validateResponse(response, resJSON, 200, "Failed to cancel image", onInvalidResponse)) return false;
        const generations: GenerationStable[] = resJSON.generations;
        return generations;
    }

    /**
     * Gets the final status of the generated image(s). Returns false if response is invalid.
     * */ 
    async function getImageStatus(imageID: string) {
        const optionsStore = useOptionsStore();
        const response = await fetch(`${optionsStore.baseURL}/api/v2/generate/status/`+imageID);
        const resJSON = await response.json();
        if (!validateResponse(response, resJSON, 200, "Failed to check image status", onInvalidResponse)) return false;
        const generations: GenerationStable[] = resJSON.generations;
        return generations;
    }

    function onInvalidResponse(msg: string) {
        const uiStore = useUIStore();
        uiStore.raiseError(msg, false);
        uiStore.progress = 0;
        cancelled.value = false;
        images.value = [];
        return false;
    }

    /**
     * Updates available models
     * */ 
    async function updateAvailableModels() {
        const store = useGeneratorStore();
        const optionsStore = useOptionsStore();
        const response = await fetch(`${optionsStore.baseURL}/api/v2/status/models`);
        const resJSON: ActiveModel[] = await response.json();
        if (!store.validateResponse(response, resJSON, 200, "Failed to get available models")) return;
        resJSON.sort((a, b) => (b.count as number) - (a.count as number));
        availableModels.value = [
            ...resJSON.map(el => ({ value: el.name as string, label: `${el.name} (${el.count})` })),
            { value: "Random!", label: "Random!" }
        ];
        const dbResponse = await fetch(MODELS_DB_URL);
        const dbJSON = await dbResponse.json();
        const nameList = Object.keys(dbJSON);

        // Format model data
        const newStuff: IModelData[] = nameList.map(name => {
            const { description, style, nsfw, type, trigger, showcases } = dbJSON[name];
            const {
                queued = 0,
                eta = Infinity,
                count = 0,
                performance = 0
            } = resJSON.find(el => el.name === name) || {};
          
            return {
                name,
                description,
                style,
                nsfw,
                type,
                trigger,
                showcases,
                queued,
                eta,
                count,
                performance,
            };
        });
        modelsData.value = newStuff;
    }

    async function updateStyles() {
        const response = await fetch(`https://raw.githubusercontent.com/db0/Stable-Horde-Styles/main/styles.json`);
        styles.value = await response.json();
    }

    function pushToNegativeLibrary(prompt: string) {
        if (negativePromptLibrary.value.indexOf(prompt) !== -1) return;
        negativePromptLibrary.value = [...negativePromptLibrary.value, prompt];
    }

    function removeFromNegativeLibrary(prompt: string) {
        negativePromptLibrary.value = negativePromptLibrary.value.filter(el => el != prompt);
    }

    function pushToPromptHistory(prompt: string) {
        if (promptHistory.value.findIndex(el => el.prompt === prompt) !== -1) return;
        if (promptHistory.value.length >= 10 + promptHistory.value.filter(el => el.starred).length) {
            const unstarredHistory = promptHistory.value.filter(el => !el.starred);
            const lastUnstarredIndex = promptHistory.value.findIndex(el => el === unstarredHistory[unstarredHistory.length - 1]);
            promptHistory.value.splice(lastUnstarredIndex, 1);
        }
        promptHistory.value = [
            ...promptHistory.value,
            {
                starred: false,
                timestamp: Date.now(),
                prompt,
            }
        ];
    }

    function removeFromPromptHistory(prompt: string) {
        //@ts-ignore
        promptHistory.value = promptHistory.value.filter(el => el.prompt != prompt && el != prompt);
    }

    /**
     * Generates a prompt (either creates a random one or extends the current prompt)
     * */
    function getPrompt()  {
        return false;
    }

    updateAvailableModels()
    updateStyles()
    setInterval(updateAvailableModels, POLL_MODELS_INTERVAL * 1000)
    setInterval(updateStyles, POLL_STYLES_INTERVAL * 1000)

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
        modelsData,
        negativePromptLibrary,
        minDimensions,
        maxDimensions,
        minImages,
        maxImages,
        minSteps,
        maxSteps,
        minCfgScale,
        maxCfgScale,
        minDenoise,
        maxDenoise,
        remainingToQueue,
        queue,
        gatheredImages,
        promptHistory,
        styles,
        // Computed
        filteredAvailableModels,
        kudosCost,
        canGenerate,
        modelDescription,
        queueStatus,
        selectedModelData,
        currentImageProps,
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
        pushToNegativeLibrary,
        removeFromNegativeLibrary,
        pushToPromptHistory,
        removeFromPromptHistory,
    };
});
