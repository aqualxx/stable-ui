import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { useUIStore } from "./ui";
import localforage from "localforage";
import { useOptionsStore } from "./options";
import { loadAsync, type JSZipObject } from 'jszip';
import { ElMessage, type UploadFile } from 'element-plus';

localforage.config({
    driver      : localforage.INDEXEDDB,
    name        : 'stableui',
    version     : 1.0,
    storeName   : 'outputs',
    description : 'Stores outputs'
});

export interface ImageData {
    id: number;
    image: string;
    prompt?: string;
    sampler_name?:
        | "k_lms"
        | "k_heun"
        | "k_euler"
        | "k_euler_a"
        | "k_dpm_2"
        | "k_dpm_2_a"
        | "k_dpm_fast"
        | "k_dpm_adaptive"
        | "k_dpmpp_2s_a"
        | "k_dpmpp_2m"
        | "dpmsolver";
    seed?: string;
    steps?: number;
    cfg_scale?: number;
    height?: number;
    width?: number;
    modelName?: string;
    starred?: boolean;
    workerName?: string;
    workerID?: string;
    post_processing?: string[];
    karras?: boolean;
}

export const useOutputStore = defineStore("outputs", () => {
    const outputs = ref<ImageData[]>([]);
    const sortBy = ref<"Newest" | "Oldest">("Oldest");
    const sortedOutputs = computed(() => {
        let outputsSorted = [...outputs.value];
        outputsSorted = sortOutputsBy('id', sortBy.value === "Newest", outputsSorted);
        outputsSorted = sortOutputsBy('stars', true, outputsSorted);
        return outputsSorted;
    });
    const currentPage = ref(1);
    const currentOutputs = computed(() => {
        const store = useOptionsStore();
        return sortedOutputs.value.slice((currentPage.value - 1) * store.pageSize, currentPage.value * store.pageSize);
    })

    async function useImagesDB() {
        try {
            const value = await localforage.getItem("outputs");
            if (value) outputs.value = JSON.parse(value as any);
        } catch (err) {
            const uiStore = useUIStore();
            uiStore.raiseError(err as any, true);
        }
    }

    watch(
        outputs,
        (outputsVal: ImageData[]) => {
            localforage.setItem("outputs", JSON.stringify(outputsVal))
        },
        { deep: true }
    )

    correctOutputIDs();

    /**
     * Appends outputs
     * */ 
    function pushOutputs(newOutputs: ImageData[]) {
        outputs.value = [...outputs.value, ...newOutputs];
        correctOutputIDs();
    }

    /**
     * Import images from a ZIP file
     */
    async function importFromZip(uploadFile: UploadFile) {
        const uiStore = useUIStore();
    
        if (!uploadFile.raw) return;
        if (!uploadFile.raw.type.includes("x-zip-compressed")) {
            uiStore.raiseError("Uploaded file needs to be a ZIP!", false);
            return;
        }
        const { files } = await loadAsync(uploadFile.raw);
        let outputsAppended = 0;
        let outputsFailed = 0;
        ElMessage({
            message: `Loading images...`,
            type: 'info',
        })
        const pushing = [];
        for (const [name, file] of Object.entries(files)) {
            const splitName = name.split(".");
            const fileType = splitName.slice(-1).join(".");
            const fileName = splitName.slice(0, -1).join(".");
            if (fileType === "webp") {
                // Async to speed up
                pushing.push(
                    new Promise(resolve => {
                        file.async("base64").then(async (webp) => {
                            if (!files[fileName+".json"]) {
                                outputsFailed++;
                                return resolve(null);
                            }
                            const json = JSON.parse(await files[fileName+".json"].async("text"));
                            outputsAppended++;
                            resolve({
                                id: -1,
                                image: `data:image/webp;base64,${webp}`,
                                ...json,
                            })
                        }).catch(err => {
                            uiStore.raiseError(`Error while importing image: ${err}`, false);
                            outputsFailed++;
                            return resolve(null);
                        });
                    })
                );
            }
        }
        const newImages = await Promise.all(pushing);
        newImages.filter(image => image !== null).forEach(image => {
            pushOutputs([{...image as ImageData, id: getNewImageID()}])
        })
        ElMessage({
            message: `Successfully imported ${outputsAppended}/${outputsAppended + outputsFailed} images!`,
            type: 'success',
        })
    }

    /**
     * Toggles whether or not an output corresponding to an ID is starred
     * */ 
    function toggleStarred(id: number) {
        const output = findOutputByID(id);
        if (!output) return;
        output.starred = !output.starred;
    }
    /**
     * Deletes an output corresponding to an ID
     * */ 
    function deleteOutput(id: number) {
        const output = findOutputByID(id);
        if (!output) return;
        const index = outputs.value.indexOf(output);
        outputs.value.splice(index, 1);
        correctOutputIDs();
    }

    /**
     * Deletes multiples outputs corresponding to their IDs
     * */ 
    function deleteMultipleOutputs(ids: number[]) {
        const uiStore = useUIStore();
        ids.forEach(id => {
            const output = findOutputByID(id);
            if (!output) return;
            const index = outputs.value.indexOf(output);
            outputs.value.splice(index, 1);
        })
        uiStore.selected = [];
        correctOutputIDs();
    }

    /**
     * Creates a new image ID
     * */ 
    function getNewImageID() {
        // Probably don't need this function
        return outputs.value.length;
    }

    /**
     * Sorts outputs by a specified parameter. Returns sorted output. (note: doesn't modify output state) 
     * */ 
    function sortOutputsBy(type: "stars" | "id", descending = true, data: ImageData[]) {
        // Spread into new array to prevent mutations
        let value: ImageData[] = [...data];
        value = value.sort((a, b) => {
            let cmpA = 0;
            let cmpB = 0;
            if (type == "id") {
                cmpA = a.id;
                cmpB = b.id;
            }
            if (type == "stars") {
                cmpA = Number(a.starred);
                cmpB = Number(b.starred);
            }
            if (descending) return cmpB - cmpA;
            return cmpA - cmpB;
        })

        return value;
    }

    /**
     * Finds an output corresponding to an ID
     * */ 
    function findOutputByID(id: number) {
        const store = useUIStore();
        const output = outputs.value.find(el => el.id == id);
        if (output !== undefined) {
            return output;
        }
        store.raiseError(`Couldn't find output of ID ${id}`, false);
        return false;
    }

    /**
     * Corrects the IDs of outputs
     * */ 
    function correctOutputIDs() {
        outputs.value.forEach((o, i) => {
            if (o.id !== i + 1) {
                o.id = i + 1;
            }
        });
    }

    return {
        // Variables
        outputs,
        sortBy,
        sortedOutputs,
        currentPage,
        currentOutputs,
        // Actions
        deleteOutput,
        deleteMultipleOutputs,
        toggleStarred,
        getNewImageID,
        sortOutputsBy,
        findOutputByID,
        pushOutputs,
        importFromZip,
        correctOutputIDs,
        useImagesDB
    };
});
