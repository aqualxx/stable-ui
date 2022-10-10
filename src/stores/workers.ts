import type { WorkerDetails } from "@/types/stable_horde";
import { defineStore } from "pinia";
import { ref } from "vue";
import { useGeneratorStore } from "./generator";

export const useWorkerStore = defineStore("workers", () => {
    const workers = ref<WorkerDetails[]>([]);

    /**
     * Updates the workers list on an interval
     * */ 
    async function initWorkers() {
        updateWorkers()
        setInterval(updateWorkers, 1000 * 60)
    }

    /**
     * Updates the current list of workers
     * */ 
    async function updateWorkers() {
        const store = useGeneratorStore();
        const response = await fetch("https://stablehorde.net/api/v2/workers");
        const resJSON: WorkerDetails[] = await response.json();
        if (!store.validateResponse(response, resJSON, 200, "Failed to update workers")) return;
        workers.value = resJSON;
    }

    return { workers, initWorkers, updateWorkers };
});
