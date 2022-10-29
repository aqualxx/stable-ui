import type { CustomWorkerDetails } from "@/types/stable_horde";
import { defineStore } from "pinia";
import { ref } from "vue";
import { useGeneratorStore } from "./generator";

export const useWorkerStore = defineStore("workers", () => {
    const workers = ref<CustomWorkerDetails[]>([]);

    /**
     * Updates the current list of workers
     * */ 
    async function updateWorkers() {
        const store = useGeneratorStore();
        const response = await fetch("https://stablehorde.net/api/v2/workers");
        const resJSON: CustomWorkerDetails[] = await response.json();
        if (!store.validateResponse(response, resJSON, 200, "Failed to update workers")) return;
        resJSON.forEach(el => el.stale = false);
        workers.value = resJSON;
    }

    updateWorkers()
    setInterval(updateWorkers, 1000 * 60)

    return {
        // Variables
        workers,
        // Actions
        updateWorkers
    };
});
