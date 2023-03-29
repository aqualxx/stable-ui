import { computed, h, ref } from "vue";
import { defineStore } from "pinia";
import type { ModelGenerationInputStable, GenerationStable, RequestAsync, GenerationInputStable, ActiveModel, RequestStatusCheck } from "@/types/stable_horde"
import { useOutputStore, type ImageData } from "./outputs";
import { useUIStore } from "./ui";
import { useOptionsStore } from "./options";
import router from "@/router";
import { fabric } from "fabric";
import { useCanvasStore } from "./canvas";
import { useDashboardStore } from "./dashboard";
import { useLocalStorage } from "@vueuse/core";
import { MODELS_DB_URL, POLL_MODELS_INTERVAL, DEBUG_MODE, POLL_STYLES_INTERVAL, MAX_PARALLEL_REQUESTS } from "@/constants";
import { convertToBase64 } from "@/utils/base64";
import { validateResponse } from "@/utils/validate";
import { ElNotification } from "element-plus";
import { useVideoStore } from "./video";

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
        hires_fix: false,
        clip_skip: 1,
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

export type ICurrentGeneration = GenerationInputStable & {
    jobId: string;
    gathered: boolean;
    failed: boolean;
    index: number;
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

type IMultiSelectItem<T> = {
    name: string;
    enabled: boolean;
    noneMessage: string;
    selected: T[];
    mapToParam: (data: ImageData) => any;
}

type ControlTypes = "canny" | "hed" | "depth" | "normal" | "openpose" | "seg" | "scribble" | "fakescribbles" | "hough" | "none";

interface IMultiSelect {
    model: IMultiSelectItem<string>;
    sampler: IMultiSelectItem<string>;
    steps: IMultiSelectItem<number>;
    guidance: IMultiSelectItem<number>;
    clipSkip: IMultiSelectItem<number>;
    hiResFix: IMultiSelectItem<boolean>;
    karras: IMultiSelectItem<boolean>;
    controlType: IMultiSelectItem<ControlTypes>;
}

interface CarouselOutput {
    type: "image" | "video";
    index: number;
    output: ImageData;
}

export const useGeneratorStore = defineStore("generator", () => {
    const validGeneratorTypes = ['Text2Img', 'Img2Img', 'Inpainting'];
    const sourceGeneratorTypes = ['Img2Img', 'Inpainting'];
    const generatorType = ref<'Text2Img' | 'Img2Img' | 'Inpainting' | 'Rating' | 'Interrogation'>("Text2Img");

    const prompt = ref("");
    const promptHistory = useLocalStorage<IPromptHistory[]>("promptHistory", []);
    const negativePrompt = ref("");
    const negativePromptLibrary = useLocalStorage<string[]>("negativeLibrary", []);
    const params = ref<ModelGenerationInputStable>(getDefaultStore());
    const nsfw   = ref(true);
    const trustedOnly = ref(false);
    const xyPlot = ref(false);
    const createVideo = ref(false);
    const multiSelect = ref<IMultiSelect>({
        sampler: {
            name: "Sampler",
            enabled: false,
            selected: ["k_euler"],
            noneMessage: "Failed to generate: No sampler selected.",
            mapToParam: el => el.sampler_name,
        },
        model: {
            name: "Model",
            enabled: false,
            selected: ["stable_diffusion"],
            noneMessage: "Failed to generate: No model selected.",
            mapToParam: el => el.modelName,
        },
        steps: {
            name: "Steps",
            enabled: false,
            selected: [30],
            noneMessage: "Failed to generate: No steps selected.",
            mapToParam: el => el.steps,
        },
        guidance: {
            name: "CFG Scale",
            enabled: false,
            selected: [7],
            noneMessage: "Failed to generate: No guidance selected.",
            mapToParam: el => el.cfg_scale,
        },
        clipSkip: {
            name: "Clip Skip",
            enabled: false,
            selected: [1],
            noneMessage: "Failed to generate: No CLIP Skip selected.",
            mapToParam: el => el.clip_skip,
        },
        hiResFix: {
            name: "Hi-res fix",
            enabled: false,
            selected: [true, false],
            noneMessage: "Failed to generate: Hi-res fix not selected.",
            mapToParam: el => el.hires_fix,
        },
        karras: {
            name: "Karras",
            enabled: false,
            selected: [true, false],
            noneMessage: "Failed to generate: Karras not selected.",
            mapToParam: el => el.karras,
        },
        controlType: {
            name: "Control Type",
            enabled: false,
            selected: [],
            noneMessage: "Failed to generate: Control type not selected.",
            mapToParam: el => el.control_type,
        }
    });

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
        let filtered = availableModels.value.filter(el => {
            if (generatorType.value === "Inpainting") {
                return el.value.includes("inpainting") && el.value !== "Stable Diffusion 2 Depth";
            }
            if (generatorType.value === "Img2Img") {
                return el.value !== "stable_diffusion_2.0" && !el.value.includes("inpainting");
            }
            return !el.value.includes("inpainting") && el.value !== "pix2pix" && el.value !== "Stable Diffusion 2 Depth";
        });
        if (!filtered.find(el => el.value === selectedModel.value)) {
            selectedModel.value = filtered[0].value;
        }
        if (multiSelect.value.model.enabled) {
            filtered = filtered.filter(el => el.value !== "Random!" && el.value !== "All Models!");
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
    const generatingVideo = ref(false);
    const cancelled  = ref(false);
    const outputs    = ref<CarouselOutput[]>([]);
    const gatheredImages = ref(0);
    const queue = ref<ICurrentGeneration[]>([]);

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

    function getQueueStatus() {
        const mergedWaitData: RequestStatusCheck = mergeObjects(queue.value.map(el => el.waitData || {}));
        mergedWaitData.queue_position = Math.round((mergedWaitData?.queue_position || 0) / queue.value.length);
        mergedWaitData.faulted = !queue.value.every(el => !el.waitData?.faulted)
        mergedWaitData.wait_time = (mergedWaitData?.wait_time || 0) / queue.value.length;
        return mergedWaitData;
    }
    const queueStatus = ref<RequestStatusCheck>(getQueueStatus());

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
    const minClipSkip = ref(1);
    const maxClipSkip = ref(10);

    const arrayRange = (start: number, end: number, step: number) => Array.from({length: (end - start + 1) / step}, (_, i) => (i + start) * step);
    const clipSkipList = ref(arrayRange(minClipSkip.value, maxClipSkip.value, 1));
    const cfgList =      ref(arrayRange(minCfgScale.value, maxCfgScale.value, 0.5));

    type ControlTypes = "canny" | "hed" | "depth" | "normal" | "openpose" | "seg" | "scribble" | "fakescribbles" | "hough" | "none";
    const availableControlTypes: ControlTypes[] = ["none", "canny", "hed", "depth", "normal", "openpose", "seg", "scribble", "fakescribbles", "hough"];
    const availablePostProcessors: ("GFPGAN" | "CodeFormers" | "RealESRGAN_x4plus" | "RealESRGAN_x4plus_anime_6B" | "NMKD_Siax" | "4x_AnimeSharp" | "strip_background")[] = ["GFPGAN", "CodeFormers", "RealESRGAN_x4plus", "RealESRGAN_x4plus_anime_6B", "NMKD_Siax", "4x_AnimeSharp", "strip_background"];
    const postProcessors = ref<typeof availablePostProcessors>([]);
    const controlType = ref<ControlTypes>("none");

    const totalImageCount = computed(() => {
        const multiCalc = (before: number, multiParam: IMultiSelectItem<any>, defaultMultiplier = 1) => before * (multiParam.enabled ? multiParam.selected.length : defaultMultiplier);
        const imageCount = params.value.n || 1;
        const promptMatrixCount  = imageCount * promptMatrix().length;
        const multiModelCount    = multiCalc(promptMatrixCount,  multiSelect.value.model, selectedModel.value === "All Models!" ? filteredAvailableModels.value.filter(el => el.value !== "Random!" && el.value !== "All Models!").length : 1);
        const multiSamplerCount  = multiCalc(multiModelCount,    multiSelect.value.sampler);
        const multiStepsCount    = multiCalc(multiSamplerCount,  multiSelect.value.steps);
        const multiGuidanceCount = multiCalc(multiStepsCount,    multiSelect.value.guidance);
        const multiClipSkipCount = multiCalc(multiGuidanceCount, multiSelect.value.clipSkip);
        const multiKarrasCount   = multiCalc(multiClipSkipCount, multiSelect.value.karras);
        const multiHiResFixCount = multiCalc(multiKarrasCount,   multiSelect.value.hiResFix);
        const multiControlCount  = multiCalc(multiHiResFixCount, multiSelect.value.controlType);
        return multiControlCount;
    })

    function countWeights(value: string) {
        let open = false;
        let count = 0;
        for (const char of value) {
            if (char == "(") open = true;
            if (char == ")" && open) {
                open = false;
                count++;
            }
        }
        return count;
    }

    const accurateSteps = computed(() => {
        const samplerAccurateSteps = (sampler: string, currSteps: number) => {
            if (['k_dpm_adaptive'].includes(sampler)) return 50;
            if (['k_heun', "k_dpm_2", "k_dpm_2_a", "k_dpmpp_2s_a"].includes(sampler)) return currSteps * 2;
            return currSteps;
        }

        let steps = 0;
        steps = multiSelect.value.steps.enabled ?
            multiSelect.value.steps.selected.reduce((prev, curr) => prev + curr, 0) / multiSelect.value.steps.selected.length :
            params.value.steps || 0;

        steps = multiSelect.value.sampler.enabled ?
            multiSelect.value.sampler.selected.reduce((tempSteps, sampler) => tempSteps + samplerAccurateSteps(sampler, steps), 0) / multiSelect.value.sampler.selected.length :
            samplerAccurateSteps(params.value.sampler_name || "k_euler", steps);

        if (generatorType.value === "Img2Img") steps *= params.value.denoising_strength || 0.8;

        return steps;
    })

    const KNOWN_POST_PROCESSORS = {
        "GFPGAN": 1.0, 
        "RealESRGAN_x4plus": 1.3, 
        "RealESRGAN_x4plus_anime_6B": 1.3,
        "NMKD_Siax": 1.1,
        "4x_AnimeSharp": 1.1, 
        "CodeFormers": 1.3, 
        "strip_background": 1.2,
    }

    const kudosCost = computed(() => {
        const hasSource = generatorType.value === "Img2Img" || generatorType.value === "Inpainting";
        const result = Math.pow((params.value.height as number) * (params.value.width as number) - (64*64), 1.75) / Math.pow((1024*1024) - (64*64), 1.75);
        let kudos_cost = (0.1232 * accurateSteps.value) + result * (0.1232 * accurateSteps.value * 8.75);
        for (let i = 0; i < postProcessors.value.length; i++) kudos_cost *= KNOWN_POST_PROCESSORS[postProcessors.value[i]];
        kudos_cost *= controlType.value !== "none" && hasSource ? 3 : 1;
        kudos_cost += countWeights(prompt.value);
        kudos_cost *= hasSource ? 1.5 : 1;
        kudos_cost += useOptionsStore().shareWithLaion === "Enabled" ? 1 : 3;
        kudos_cost *= totalImageCount.value;
        return kudos_cost;
    });

    const canGenerate = computed(() => {
        const dashStore = useDashboardStore();
        const affordable = (dashStore.user.kudos as number) > kudosCost.value;
        const higherDimensions = (params.value.height as number) * (params.value.width as number) > 1024*1024;
        const higherSteps = accurateSteps.value > 50;
        return affordable || (!higherDimensions && !higherSteps);
    })

    /**
     * Resets the generator store to its default state
     * */ 
    function resetStore()  {
        params.value = getDefaultStore();
        inpainting.value = getDefaultImageProps();
        img2img.value = getDefaultImageProps();
        outputs.value = [];
        useUIStore().showGeneratedImages = false;
        return true;
    }

    /**
     * Generates images on the Horde; returns a list of image(s)
     * */ 
    async function generateImage(type: typeof generatorType["value"]) {
        if (!validGeneratorTypes.includes(type)) return [];

        if (prompt.value === "") return generationFailed("Failed to generate: No prompt submitted.");
        for (const multi of Object.values(multiSelect.value)) {
            if (multi.enabled && multi.selected.length === 0) return generationFailed(multi.noneMessage);
        }

        const canvasStore = useCanvasStore();
        const optionsStore = useOptionsStore();
        const uiStore = useUIStore();

        canvasStore.saveImages();
        const { sourceImage, maskImage, sourceProcessing } = getImageProps(type);
        
        let model = [selectedModel.value];
        const realModels = filteredAvailableModels.value.filter(el => el.value !== "Random!" && el.value !== "All Models!");
        if (selectedModel.value === "Random!") {
            model = [realModels[Math.floor(Math.random() * realModels.length)].value];
        } 
        if (selectedModel.value === "All Models!") {
            model = realModels.map(el => el.value);
        }

        pushToPromptHistory(prompt.value);

        // Cache parameters so the user can't mutate the output data while it's generating
        const paramsCached: GenerationInputStable[] = [];
        const multiSelectEnabled = Object.values(multiSelect.value).filter(el => el.enabled);

        const getMultiSelect = <T>(item: IMultiSelectItem<T>, defaultValue: any): T[] => item.enabled ? item.selected : defaultValue;
        const prompts      = promptMatrix();
        const models       = getMultiSelect(multiSelect.value.model,       model);
        const guidances    = getMultiSelect(multiSelect.value.guidance,    [params.value.cfg_scale]);
        const steps        = getMultiSelect(multiSelect.value.steps,       [params.value.steps]);
        const clipSkips    = getMultiSelect(multiSelect.value.clipSkip,    [params.value.clip_skip]);
        const samplers     = getMultiSelect(multiSelect.value.sampler,     [params.value.sampler_name]);
        const hiResFix     = getMultiSelect(multiSelect.value.hiResFix,    [params.value.hires_fix]);
        const karras       = getMultiSelect(multiSelect.value.karras,      [params.value.karras]);
        const controlTypes = getMultiSelect(multiSelect.value.controlType, [params.value.control_type]);
        for (let i = 0; i < (params.value.n || 1); i++) {
            for (const currentControlType of controlTypes) {
                for (const currentHiResFix of hiResFix) {
                    for (const currentKarras of karras) {
                        for (const currentModel of models) {
                            for (const currentGuidance of guidances) {
                                for (const currentSteps of steps) {
                                    for (const currentClipSkip of clipSkips) {
                                        for (const currentPrompt of prompts) {
                                            for (const currentSampler of (
                                                currentModel.includes("stable_diffusion_2.0") ?
                                                    ["dpmsolver"] :
                                                    samplers
                                            ) as ModelGenerationInputStable["sampler_name"][]) {
                                                paramsCached.push({
                                                    prompt: currentPrompt,
                                                    params: {
                                                        ...params.value,
                                                        seed_variation: params.value.seed === "" ? 1000 : 1,
                                                        post_processing: postProcessors.value,
                                                        sampler_name: currentSampler,
                                                        control_type: sourceGeneratorTypes.includes(type) && currentControlType !== "none" ? currentControlType : undefined,
                                                        cfg_scale: currentGuidance,
                                                        steps: currentSteps,
                                                        clip_skip: currentClipSkip,
                                                        karras: currentKarras,
                                                        hires_fix: currentHiResFix,
                                                        n: 1
                                                    },
                                                    nsfw: nsfw.value,
                                                    censor_nsfw: !nsfw.value,
                                                    trusted_workers: trustedOnly.value,
                                                    source_image: sourceImage?.split(",")[1],
                                                    source_mask: maskImage,
                                                    source_processing: sourceProcessing,
                                                    workers: optionsStore.useWorker === "None" ? undefined : [optionsStore.useWorker],
                                                    models: [currentModel],
                                                    shared: useOptionsStore().shareWithLaion === "Enabled",
                                                    r2: true,
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        if (DEBUG_MODE) console.log("Using generation parameters:", paramsCached)

        generating.value = true;
        uiStore.showGeneratedImages = false;

        // Push each item in the parameters array to the queue
        for (let i = 0; i < paramsCached.length; i++) {
            queue.value.push({
                ...paramsCached[i],
                jobId: "",
                index: i,
                gathered: false,
                failed: false,
            })
        }

        // Reset variables
        outputs.value = [];
        gatheredImages.value = 0;

        function getMaxRequests(arr: GenerationInputStable[]) {
            return Math.min(arr.length, MAX_PARALLEL_REQUESTS);
        }

        // Loop until queue is done or generation is cancelled
        let secondsElapsed = 0;
        while (!queue.value.every(el => el.gathered || el.failed) && !cancelled.value) {
            if (queueStatus.value.done) await sleep(200);

            const availableQueue = queue.value.filter(el => !el.gathered && !el.failed);
            const t0 = performance.now() / 1000;
            await Promise.all(availableQueue.slice(0, getMaxRequests(availableQueue)).map(async (queuedImage, i) => {
                await sleep(i * 100);
                if (cancelled.value) return;
                if (queuedImage.waitData?.done) return;

                if (!queuedImage.jobId) {
                    const resJSON = await fetchNewID(queuedImage);
                    if (!resJSON) {
                        generationFailed(undefined, queuedImage);
                        queuedImage.failed = true;
                        return;
                    }
                    queuedImage.jobId = resJSON.id as string;
                }
    
                const status = await checkImage(queuedImage.jobId);
                if (!status) {
                    generationFailed(undefined, queuedImage);
                    queuedImage.failed = true;
                    return;
                }

                if (status.faulted) {
                    generationFailed("Failed to generate: Generation faulted.", queuedImage);
                    queuedImage.failed = true;
                    return;
                }

                if (status.is_possible === false) {
                    generationFailed("Failed to generate: Generation not possible.", queuedImage);
                    queuedImage.failed = true;
                    return;
                }
                queuedImage.waitData = status;
    
                if (status.done) {
                    const finalImages = await getImageStatus(queuedImage.jobId);
                    if (!finalImages) {
                        generationFailed(undefined, queuedImage);
                        queuedImage.failed = true;
                        return;
                    }
                    processImages(finalImages.map(image => ({...image, ...queuedImage})))
                        .then(() => queuedImage.gathered = true);
                }
            }))
            await sleep(500);
            const t1 = performance.now() / 1000;
            secondsElapsed += t1 - t0;

            queueStatus.value = getQueueStatus();
            uiStore.updateProgress(queueStatus.value, secondsElapsed);
            if (DEBUG_MODE) console.log("Checked all images:", queueStatus.value);
        }

        if (DEBUG_MODE) console.log("Images done/cancelled");

        if (cancelled.value) {
            // Retrieve final images that were cancelled
            for (const queuedImage of queue.value) {
                if (queuedImage.gathered || queuedImage.jobId === "") continue;
                const finalImages = cancelled.value ? await cancelImage(queuedImage.jobId) : await getImageStatus(queuedImage.jobId);
                if (!finalImages) {
                    generationFailed(undefined, queuedImage);
                    queuedImage.failed = true;
                    continue;
                }
                if (finalImages.length === 0) continue;
                await processImages(finalImages.map(image => ({...image, ...queuedImage})));
            }
            if (DEBUG_MODE) console.log("Got cancelled images");
        }

        return generationDone(multiSelectEnabled);
    }

    /**
     * Called when a generation is finished.
     * */ 
    async function processImages(finalImages: (GenerationStable & ICurrentGeneration)[]) {
        const store = useOutputStore();
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
                    hires_fix: params?.hires_fix,
                    clip_skip: params?.clip_skip,
                    control_type: params?.control_type,
                    starred: 0,
                    rated: 0,
                }
            })
        )

        const newOutputs = await store.pushOutputs(finalParams) as ImageData[];

        // The index should the same for each of these outputs
        const index = finalImages[0].index;
        
        outputs.value = [
            ...newOutputs.map(el => ({
                type: "image",
                index,
                output: el,
            } as CarouselOutput)),
            ...outputs.value,
        ].sort((a,b) => a.index - b.index);

        return finalParams;
    }

    /**
     * Called when a generation is finished.
     * */ 
    async function generationDone(multiSelects: IMultiSelectItem<any>[]) {
        const uiStore = useUIStore();

        uiStore.progress = 0;

        const onGeneratorPage = router.currentRoute.value.fullPath === "/";

        // TODO: video notification
        if ((onGeneratorPage && !validGeneratorTypes.includes(generatorType.value)) || !onGeneratorPage) {
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
                            if (!validGeneratorTypes.includes(generatorType.value)) generatorType.value = "Text2Img";
                            router.push("/");
                            notification.close();
                        },
                    }, "here!"),
                ]),
                icon: h("img", {
                    src: outputs.value[0].output,
                    style: { maxHeight: "54px", maxWidth: "54px" },
                }),
                customClass: "image-notification",
                onClose: () => uiStore.showGeneratorBadge = false,
            });
        }

        if (createVideo.value && totalImageCount.value > 2) {
            generatingVideo.value = true;
            const videoResult = await useVideoStore().processImages(outputs.value.map(({ output }) => output.image));
            generatingVideo.value = false;
            if (videoResult.type === 'error') {
                uiStore.raiseError(`Failed to generate video: ${videoResult.error}`, false);
            }
            if (videoResult.type === 'result') {
                outputs.value = [
                    {
                        type: "video",
                        index: -2,
                        output: {
                            id: -1,
                            image: videoResult.result,
                        },
                    } as CarouselOutput,
                    ...outputs.value
                ].sort((a,b) => a.index - b.index);
            }
        }

        uiStore.showGeneratedImages = true;
        generating.value = false;
        cancelled.value = false;
        queue.value = [];

        if (xyPlot.value && multiSelects.length === 2) {
            const XYdata: XYPlotData = {
                valOneName: multiSelects[0].name,
                valTwoName: multiSelects[1].name,
                data: outputs.value.filter(el => el.type === 'image').map(({ output }) => ({
                    valOne: multiSelects[0].mapToParam(output),
                    valTwo: multiSelects[1].mapToParam(output),
                    image: output.image,
                })),
            }
    
            const webpDataUrl = await createXYPlot(XYdata);
            outputs.value = [
                {
                    type: "image",
                    index: -1,
                    output: { id: -1, image: webpDataUrl },
                } as CarouselOutput,
                ...outputs.value
            ].sort((a,b) => a.index - b.index);
        }

        return outputs.value;
    }

    type XYDataTypes = number | string | boolean | undefined;

    interface XYData {
        valOne: XYDataTypes;
        valTwo: XYDataTypes;
    }

    type XYDataInit = XYData & { image: string };
    type XYDataFabric = XYData & { image: fabric.Image };

    interface XYPlotData {
        valOneName: string;
        valTwoName: string;
        data: XYDataInit[];
    }

    async function createXYPlot({ valOneName, valTwoName, data }: XYPlotData) {
        const filteredData = data.filter(el => el.valOne !== undefined && el.valTwo !== undefined);

        const sortFn = (a: XYDataTypes, b: XYDataTypes) => typeof b === "string" || typeof a === "string" ? 0 : Number(a) - Number(b);
        const colVals = [...new Set(filteredData.map(el => el.valOne ?? 0))].sort(sortFn);
        const rowVals = [...new Set(filteredData.map(el => el.valTwo ?? 0))].sort(sortFn);
        const numCols = colVals.length + 1;
        const numRows = rowVals.length + 1;

        const loadedData = await Promise.all(filteredData.map(item => new Promise(resolve => {
            fabric.Image.fromURL(
                item.image,
                image => resolve({ ...item, image }),
                { crossOrigin: 'anonymous' }
            );
        }))) as XYDataFabric[];
        //? Could use the largest image size (for when multi-res is implemented)
        const imgWidth    = loadedData[0].image.width  || 512;
        const imgHeight   = loadedData[0].image.height || 512;
        const labelWidth  = 320;
        const labelHeight = 100;
        const scaleFactor = 1;
        
        const canvas = new fabric.Canvas(null, {
            width: (numCols - 1) * imgWidth + labelWidth,
            height: (numRows - 1) * imgHeight + labelHeight,
            backgroundColor: 'white',
        });

        const labelProps: fabric.TextOptions = {
            fontSize: 32,
            fill: 'black',
            textAlign: 'center',
            originY: 'center',
            originX: 'center',
            fontFamily: 'Helvetica',
        };

        const colValues = [];
        const rowValues = [];

        // Top labels
        for (let i = 0; i < numCols - 1; i++) {
            const col = i % numCols;

            colValues.push({
                valOne: colVals[i],
                col,
            });

            const label = new fabric.Text(`${valOneName}: ${colVals[i]}`, {
                ...labelProps,
                left: col * imgWidth + imgWidth / 2 + labelWidth,
                top: labelHeight * scaleFactor / 2,
            });

            canvas.add(label);
        }

        // Left labels
        for (let i = 0; i < numRows - 1; i++) {
            const row = i % numRows;

            rowValues.push({
                valTwo: rowVals[i],
                row,
            });

            const label = new fabric.Text(`${valTwoName}: ${rowVals[i]}`, {
                ...labelProps,
                top: row * imgHeight + imgHeight / 2 + labelHeight,
                left: labelWidth * scaleFactor / 2,
            });

            canvas.add(label);
        }

        const combinations: (XYData & {
            col: number;
            row: number;
        })[] = [];
        for (let i = 0; i < colValues.length; i++) {
            for (let j = 0; j < rowValues.length; j++) {
                combinations.push({ ...colValues[i], ...rowValues[j] });
            }
        }

        if (DEBUG_MODE) console.log("Got X/Y plot combinations:", combinations);

        loadedData.forEach(({ valOne, valTwo, image }, index) => {
            const comboFound = combinations.find(el => el.valOne === valOne && el.valTwo === valTwo);
            const col = comboFound?.col ?? index % (numCols - 1);
            const row = comboFound?.row ?? Math.floor(index / (numRows - 1));
            const imgHeight = image.height || 512;
            const imgWidth = image.width || 512;
            
            image.set({
                width: imgWidth,
                height: imgHeight,
                left: col * imgWidth + labelWidth,
                top: row * imgHeight + labelHeight,
            });
            
            canvas.add(image);
        });
        
        const webpDataUrl = canvas.toDataURL({
            format: 'webp',
            quality: 0.8,
        });

        return webpDataUrl;
    }
    /**
     * Called when an image has failed.
     * @returns []
     */
    async function generationFailed(error?: string, queuedImage?: ICurrentGeneration) {
        const store = useUIStore();
        if (error) store.raiseError(error, false);
        if (!queuedImage) return [];
        //const finalImages = await cancelImage(queuedImage.jobId);
        // if (finalImages) {
        //     processImages(finalImages.map(image => ({...image, ...queuedImage})))
        //         .then(() => queuedImage.gathered = true);
        // }
        await cancelImage(queuedImage.jobId);
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
        const defaults = getDefaultStore();
        generatorType.value = "Text2Img";
        multiSelect.value.guidance.enabled = false;
        multiSelect.value.clipSkip.enabled = false;
        multiSelect.value.model.enabled    = false;
        multiSelect.value.sampler.enabled  = false;
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
        if (data.tiling)          params.value.tiling = data.tiling;
        if (data.hires_fix)       params.value.hires_fix = data.hires_fix;
        if (data.clip_skip)       params.value.clip_skip = validateParam("clip_skip", data.clip_skip, maxClipSkip.value, defaults.clip_skip as number);
        if (data.post_processing) postProcessors.value = data.post_processing as typeof availablePostProcessors;
        if (data.modelName)       selectedModel.value = data.modelName;
    }

    /**
     * Prepare an image for going through img2img on the Horde
     * */ 
    function generateImg2Img(sourceimg: string) {
        const canvasStore = useCanvasStore();
        generatorType.value = "Img2Img";
        img2img.value.sourceImage = sourceimg;
        canvasStore.drawing = false;
        outputs.value = [];
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
        outputs.value = [];
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
        prompt.value += ", " + trigger || selectedModelData.value.trigger[0];
    }

    /**
     * Fetches a new ID
     */
    async function fetchNewID(parameters: GenerationInputStable) {
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
        outputs.value = [];
        return false;
    }

    /**
     * Updates available models
     * */ 
    async function updateAvailableModels() {
        const optionsStore = useOptionsStore();
        const response = await fetch(`${optionsStore.baseURL}/api/v2/status/models`);
        const resJSON: ActiveModel[] = await response.json();
        if (!validateResponse(response, resJSON, 200, "Failed to get available models")) return;
        resJSON.sort((a, b) => (b.count as number) - (a.count as number));
        availableModels.value = [
            ...resJSON.map(el => ({ value: el.name as string, label: `${el.name} (${el.count})` })),
            { value: "Random!", label: "Random!" },
            { value: "All Models!", label: "All Models!" },
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
        // Variables
        generatorType,
        prompt,
        params,
        outputs,
        nsfw,
        trustedOnly,
        inpainting,
        img2img,
        uploadDimensions,
        cancelled,
        postProcessors,
        availableModels,
        selectedModel,
        multiSelect,
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
        minClipSkip,
        maxClipSkip,
        clipSkipList,
        cfgList,
        queue,
        gatheredImages,
        promptHistory,
        styles,
        controlType,
        xyPlot,
        createVideo,
        generatingVideo,
        // Constants
        availablePostProcessors,
        availableControlTypes,
        validGeneratorTypes,
        sourceGeneratorTypes,
        // Computed
        filteredAvailableModels,
        kudosCost,
        canGenerate,
        modelDescription,
        queueStatus,
        selectedModelData,
        currentImageProps,
        totalImageCount,
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
        resetStore,
        pushToNegativeLibrary,
        removeFromNegativeLibrary,
        pushToPromptHistory,
        removeFromPromptHistory,
    };
});
