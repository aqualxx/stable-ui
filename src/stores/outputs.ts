import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { useUIStore } from "./ui";
import localforage from "localforage";

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
    prompt: string;
    sampler_name: string;
    seed: string;
    steps: number;
    cfg_scale: number;
    height: number;
    width: number;
    starred: boolean;
}

export const useOutputStore = defineStore("outputs", () => {
    const outputs = ref<ImageData[]>([]);

    localforage.getItem("outputs").then((value: any) => {
        if (value) {
            outputs.value = JSON.parse(value);
        } else {
            if (localStorage.getItem("outputs")) {
                console.log("Migrating data...")
                localforage.setItem("outputs", localStorage.getItem("outputs")).then(val => console.log(val));
                outputs.value = JSON.parse(localStorage.getItem("outputs") as string);
            } else {
                localforage.setItem("outputs", JSON.stringify(outputs.value));
            }
        }    
    }).catch((err: string) => {
        const uiStore = useUIStore();
        uiStore.raiseError(err);
    });

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
    function sortOutputsBy(type: "stars" | "id", data: ImageData[]) {
        // Spread into new array to prevent mutations
        let value: ImageData[] = [...data];
        if (type == "id") {
            value = value.sort((a, b) => a.id - b.id);
        }
        if (type == "stars") {
            value = value.sort((a, b) => Number(b.starred) - Number(a.starred));
        }
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
        store.raiseError(`Couldn't find output of ID ${id}`);
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

    return { outputs, deleteOutput, deleteMultipleOutputs, toggleStarred, getNewImageID, sortOutputsBy, findOutputByID, pushOutput };
});
