import { convertBase64ToUint8Array } from '@/utils/base64';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { DEBUG_MODE } from '@/constants';

interface FFmpegProgress {
    ratio: number;
    duration?: number;
    time?: number;
}

type FFmpegProgressExtended = FFmpegProgress & { timeElapsed: number; est: number };

interface FFmpegResult {
    type: "result" | "error" | "progress";
    blob?: Blob;
    error?: any;
    progress?: FFmpegProgress;
}

interface VideoResult {
    type: "result" | "error" | "cancelled";
    result?: string;
    error?: any;
}

export const useVideoStore = defineStore("video", () => {
    const initFramerate = ref(1);
    const maxInitFramerate = ref(10);
    const minInitFramerate = ref(1);
    const initFramerateStep = ref(1);

    const finalFramerate = ref(60);
    const maxFinalFramerate = ref(120);
    const minFinalFramerate = ref(15);
    const finalFramerateStep = ref(15);

    const initGenerationData = () => ({
        ratio: 0,
        timeElapsed: 0,
        est: Infinity,
    });

    const generationData = ref<FFmpegProgressExtended>(initGenerationData());
    const generatingVideo = ref(false);
    const worker = ref<Worker>();

    function cancelGeneration() {
        generatingVideo.value = false;
        worker.value?.terminate();
        generationData.value = initGenerationData();
    }

    // https://blog.programster.org/ffmpeg-create-smooth-videos-with-frame-interpolation
    async function processImages(imgs: string[]): Promise<VideoResult> {
        if (!window.Worker) {
            return {
                type: "error",
                error: "Your browser doesn't support web workers! Try updating or using a different browser.",
            }
        }

        if (!imgs.length) {
            return {
                type: "error",
                error: "No images were submitted!",
            }
        }

        const imageArray = await Promise.all(imgs.map(img => convertBase64ToUint8Array(img, "image/jpeg")));
        worker.value = new Worker(new URL('../utils/imagesToVideo.worker.js', import.meta.url));
        worker.value.postMessage({
            imageArray,
            initFramerate: initFramerate.value,
            finalFramerate: finalFramerate.value,
            DEBUG_MODE,
        });

        let prevTime = performance.now();

        return new Promise((resolve: (obj: VideoResult) => void, reject) => {
            if (!worker.value) {
                cancelGeneration();
                return reject({ type: "error", error: "Worker not found!" });
            }

            generatingVideo.value = true;

            function checkCancelled() {
                if (!generatingVideo.value) {
                    resolve({ type: "cancelled" });
                    return;
                }
                setTimeout(checkCancelled, 1000);
            }

            setTimeout(checkCancelled, 1000)

            worker.value.onmessage = (e) => {
                const response: FFmpegResult = e.data;
                if (response.progress) {
                    const { progress } = response;
    
                    const currTime = performance.now();
                    generationData.value.timeElapsed += Math.round((currTime - prevTime) / 1000);
                    prevTime = currTime;
    
                    if (progress.duration) generationData.value.duration = progress.duration;
                    if (progress.time)     generationData.value.time     = progress.time;
                    generationData.value.ratio = (generationData.value.time ?? 0) / (generationData.value.duration ?? 0);
    
                    // Calculate estimated time remaining (EST)
                    const remainingTime = (generationData.value.duration ?? 0) / (generationData.value.time ?? 0);
                    generationData.value.est = Math.round(remainingTime / generationData.value.ratio);
    
                    if (DEBUG_MODE) console.log("Video progress:", generationData.value);
                }

                if (response.error) {
                    cancelGeneration();
                    reject({ type: "error", error: response.error });
                }

                if (response.blob) {
                    cancelGeneration();
                    const videoUrl = URL.createObjectURL(response.blob);
                    if (DEBUG_MODE) console.log("Video URL:", videoUrl);
                    resolve({ type: "result", result: videoUrl });
                    // URL.revokeObjectURL(videoUrl);
                }
            }
        });
    }

    return {
        // Variables
        initFramerate,
        maxInitFramerate,
        minInitFramerate,
        initFramerateStep,
        finalFramerate,
        maxFinalFramerate,
        minFinalFramerate,
        finalFramerateStep,
        generationData,
        // Actions
        processImages,
        cancelGeneration,
    }
})