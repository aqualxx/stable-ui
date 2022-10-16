import type { UserDetails, CustomWorkerDetails } from "@/types/stable_horde";
import { defineStore } from "pinia";
import { ref } from 'vue';
import { useGeneratorStore } from "./generator";
import { useOptionsStore } from "./options";
import { useWorkerStore } from "./workers";

const REFRESH_INTERVAL = 30; // seconds

export const useUserStore = defineStore("user", () => {
    const user = ref<UserDetails>({});
    const userWorkers = ref<CustomWorkerDetails[]>([]);
    
    /**
     * Finds the user based on API key
     * */ 
    async function updateUser() {
        const store = useGeneratorStore();
        const optionsStore = useOptionsStore();

        if (optionsStore.apiKey === '0000000000' || optionsStore.apiKey === '') return;

        const response = await fetch("https://stablehorde.net/api/v2/find_user", {
            headers: {
                apikey: optionsStore.apiKey
            }
        });
        const resJSON: UserDetails = await response.json();
        if (!store.validateResponse(response, resJSON, 200, "Failed to find user by API key")) return false;
        user.value = resJSON;
        getAllUserWorkers();
    }

    /**
     * Finds the user's stale workers
     * */ 
    async function getStaleWorker(workerID: string) {
        const store = useGeneratorStore();
        const response = await fetch("https://stablehorde.net/api/v2/workers/"+workerID);
        const resJSON = await response.json();
        if (!store.validateResponse(response, resJSON, 200, "Failed to find user by API key")) return false;
        return resJSON;
    }

    /**
     * Finds all of the user's workers
     * */ 
    async function getAllUserWorkers() {
        const workerStore = useWorkerStore();
        if (user.value.worker_ids == undefined) return [];
        const workers: CustomWorkerDetails[] = [];
        for (let i = 0; i < user.value.worker_ids?.length; i++) {
            const workerID = user.value.worker_ids[i];
            const worker = workerStore.workers.find(worker => worker.id === workerID);
            if (worker == undefined)  workers.push({...await getStaleWorker(workerID), stale: true});
            if (worker !== undefined) workers.push({...worker, stale: false});
        }
        console.log(workers)
        userWorkers.value = workers;
    }

    updateUser();
    setInterval(updateUser, REFRESH_INTERVAL * 1000)

    return { user, updateUser, userWorkers, getAllUserWorkers };
});
