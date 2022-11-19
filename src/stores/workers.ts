import type { TeamDetailsStable, WorkerDetailsStable } from "@/types/stable_horde";
import { defineStore } from "pinia";
import { ref } from "vue";
import { useGeneratorStore } from "./generator";

export const useWorkerStore = defineStore("workers", () => {
    const workers = ref<WorkerDetailsStable[]>([]);
    const teams = ref<TeamDetailsStable[]>([]);

    function updateStore() {
        updateWorkers();
        updateTeams();
    }

    /**
     * Updates the current list of workers
     * */ 
    async function updateWorkers() {
        const store = useGeneratorStore();
        const response = await fetch("https://stablehorde.net/api/v2/workers");
        const resJSON: WorkerDetailsStable[] = await response.json();
        if (!store.validateResponse(response, resJSON, 200, "Failed to update workers")) return;
        workers.value = resJSON;
    }

    async function updateTeams() {
        const store = useGeneratorStore();
        const response = await fetch("https://stablehorde.net/api/v2/teams");
        const resJSON: TeamDetailsStable[] = await response.json();
        if (!store.validateResponse(response, resJSON, 200, "Failed to update teams")) return;
        teams.value = resJSON;
    }

    updateStore()
    setInterval(updateStore, 1000 * 60)

    return {
        // Variables
        workers,
        teams,
        // Actions
        updateWorkers
    };
});
