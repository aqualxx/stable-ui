import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useUIStore } from "./ui";
import { useOptionsStore } from "./options";
import { loadAsync } from 'jszip';
import { ElMessage, type UploadFile } from 'element-plus';
import { useLocalStorage } from "@vueuse/core";
import { db } from "@/utils/db";
import { liveQuery, type IndexableType } from "dexie";
import { from } from 'rxjs';
import { useObservable } from "@vueuse/rxjs";

export interface ImageData {
    id: number;
    jobId?: string;
    image: string;
    hordeImageId?: string;
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
    tiling?: boolean;
    rated?: boolean;
    sharedExternally?: boolean;
}

export const useOutputStore = defineStore("outputs", () => {
    const outputs = useObservable<ImageData[], ImageData[]>(
        from(
            liveQuery(() => db.outputs.toArray())
        ),
        {
            initialValue: [],
        },
    );
    const sortBy = useLocalStorage<"Newest" | "Oldest">("sortOutputsBy", "Oldest");
    const sortedOutputs = computed(() => {
        let outputsSorted = [...outputs.value];
        outputsSorted = sortOutputsBy('id', sortBy.value === "Newest", outputsSorted);
        outputsSorted = sortOutputsBy('starred', true, outputsSorted);
        return outputsSorted;
    });
    const currentPage = ref(1);
    const currentOutputs = computed(() => {
        const store = useOptionsStore();
        return store.pageless === "Enabled" ? sortedOutputs.value : sortedOutputs.value.slice((currentPage.value - 1) * store.pageSize, currentPage.value * store.pageSize);
    })

    /**
     * Prevents user images from being cleared automatically by the browser
     */
    async function persistStorage() {
        if (navigator.storage && navigator.storage.persist) {
            const isPersisted = await navigator.storage.persist();
            console.log(`Persisted storage granted: ${isPersisted}`);
        }
    }

    async function recoverLocalStorageOutputs() {
        const outputsLocalStorage = localStorage.getItem("outputs");
        if (!outputsLocalStorage) return;
        pushOutputs(JSON.parse(outputsLocalStorage));
        localStorage.removeItem("outputs");
    }

    persistStorage();
    recoverLocalStorageOutputs();

    /**
     * Appends outputs
     * */ 
    async function pushOutputs(newOutputs: ImageData[]) {
        // The database auto increments the ID for us
        const newOutputsWithoutID = newOutputs.map(el => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, ...rest } = el;
            return rest;
        })
        const cleanOutputs = JSON.parse(JSON.stringify(newOutputsWithoutID));
        console.log("Inserting outputs into database", cleanOutputs)
        const resultingIDs = await db.outputs.bulkAdd(cleanOutputs, undefined, { allKeys: true }) as IndexableType[];
        return db.outputs.bulkGet(resultingIDs);
    }

    /**
     * Import images from a ZIP file
     */
    async function importFromZip(uploadFile: UploadFile) {
        const uiStore = useUIStore();
    
        if (!uploadFile.raw) return;
        if (!uploadFile.raw.type.includes("zip")) {
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
            pushOutputs([{...image as ImageData}])
        })
        ElMessage({
            message: `Successfully imported ${outputsAppended}/${outputsAppended + outputsFailed} images!`,
            type: 'success',
        })
    }

    /**
     * Toggles whether or not an output corresponding to an ID is starred
     * */ 
    async function toggleStarred(id: number) {
        const output = await db.outputs.get(id);
        return db.outputs.update(id, {
            starred: !output?.starred,
        });
    }

    /**
     * Deletes an output corresponding to an ID
     * */ 
    function deleteOutput(id: number) {
        return db.outputs.delete(id);
    }

    /**
     * Deletes multiples outputs corresponding to their IDs
     * */ 
    function deleteMultipleOutputs(ids: number[]) {
        const uiStore = useUIStore();
        uiStore.selected = [];
        uiStore.multiSelect = false;
        return db.outputs.bulkDelete(ids);
    }

    /**
     * Sorts outputs by a specified parameter.
     * */ 
    function sortOutputsBy(type: "starred" | "id", descending = true, data: ImageData[]) {
        return data.sort((a, b) => (descending ? Number(b[type] || 0) - Number(a[type] || 0) : Number(a[type] || 0) - Number(b[type] || 0)));

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
        pushOutputs,
        importFromZip,
    };
});
