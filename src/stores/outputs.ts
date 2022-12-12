import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { useUIStore } from "./ui";
import localforage from "localforage";
import { useOptionsStore } from "./options";

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
     * Appends an output to outputs
     * */ 
    function pushOutput(output: ImageData) {
        outputs.value.push(output);
        correctOutputIDs();
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
        pushOutput,
        correctOutputIDs,
        useImagesDB
    };
});
