import type { TeamDetails, WorkerDetails } from "@/types/stable_horde";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useGeneratorStore, type IModelData } from "./generator";
import { POLL_WORKERS_INTERVAL, DEBUG_MODE } from "@/constants";
import { useOptionsStore } from "./options";
import { validateResponse } from "@/utils/validate";

type SortOptions = "Default" | "Name" | "Info" | "Uptime" | "MPS" | "Speed" | "Requests" | "Model Count" | "Worker Count" | "Queued" | "Clear Time"

export const useWorkerStore = defineStore("workers", () => {
    const workers = ref<WorkerDetails[]>([]);
    const teams = ref<TeamDetails[]>([]);
    const sortBy = ref<SortOptions>("Default");
    const searchFilter = ref("");
    const sortDirection = ref<"Ascending" | "Descending">("Descending");
    const activeTab = ref<"workers" | "teams" | "models">('workers');

    function filterBySearch<T extends { name?: string }>(data: T[]) {
        return data.filter(el => (el?.name || "").toLowerCase().includes(searchFilter.value.toLowerCase()));
    }

    const descending = computed(() => sortDirection.value === "Descending");
    const sortedWorkers = computed(() => filterBySearch(sortWorkersBy(sortBy.value, descending.value, workers.value)))
    const sortedTeams = computed(() => filterBySearch(sortTeamsBy(sortBy.value, descending.value, teams.value)))
    const sortedModels = computed(() => filterBySearch(sortModelsBy(sortBy.value, descending.value, useGeneratorStore().modelsData.filter(el => el.type === "ckpt"))));
    const sortOptions = computed<SortOptions[]>(() => {
        let options: SortOptions[] = ["Default", "Name", "Info", "Uptime","Speed", "Requests"];
        if (activeTab.value === "workers") options = [...options, "MPS"];
        if (activeTab.value === "teams") options = [...options, "MPS", "Worker Count", "Model Count"];
        if (activeTab.value === "models") options = [...options, "Queued", "Clear Time", "Worker Count"];
        if (!options.includes(sortBy.value)) sortBy.value = "Info";
        return options;
    });
    
    function updateStore() {
        if (DEBUG_MODE) console.log("Attempting to update worker store...")
        updateWorkers();
        updateTeams();
    }

    /**
     * Updates the current list of workers
     * */ 
    async function updateWorkers() {
        const optionsStore = useOptionsStore();
        const response = await fetch(`${optionsStore.baseURL}/api/v2/workers`);
        const resJSON: WorkerDetails[] = await response.json();
        if (!validateResponse(response, resJSON, 200, "Failed to update workers")) return;
        if (DEBUG_MODE) console.log("Updated workers!", resJSON)
        workers.value = resJSON;
    }

    async function updateTeams() {
        const optionsStore = useOptionsStore();
        const response = await fetch(`${optionsStore.baseURL}/api/v2/teams`);
        const resJSON: TeamDetails[] = await response.json();
        if (!validateResponse(response, resJSON, 200, "Failed to update teams")) return;
        if (DEBUG_MODE) console.log("Updated teams!", resJSON)
        teams.value = resJSON;
    }

    function sortArray<T, K extends keyof T>(sortType: K, descending = true, data: T[]) {
        // Spread into new array to prevent mutations
        return [...data].sort((a, b) => {
            let cmpA: number | T[K] = a[sortType] || 0;
            let cmpB: number | T[K] = b[sortType] || 0;
            if (typeof cmpA === "string") cmpA = cmpA?.length || 0;
            if (typeof cmpB === "string") cmpB = cmpB?.length || 0;
            if (typeof cmpA !== "number") return 0;
            if (typeof cmpB !== "number") return 0;
            if (descending) return cmpB - cmpA;
            return cmpA - cmpB;
        })
    }

    function sortWorkersBy(sortType: SortOptions, descending = true, data: WorkerDetails[]) {
        // Spread into new array to prevent mutations
        let value: typeof data = [...data];

        if (sortType == "Name") value = sortArray("name", descending, data);
        if (sortType == "Info" || sortType == "Default") value = sortArray("info", descending, data);
        if (sortType == "Uptime") value = sortArray("uptime", descending, data);
        if (sortType == "MPS") value = sortArray("megapixelsteps_generated", descending, data);
        if (sortType == "Speed") {
            value = value.sort((a, b) => {
                const cmpA = Number(a.performance?.split(" ")[0]) || 0;
                const cmpB = Number(b.performance?.split(" ")[0]) || 0;
                if (descending) return cmpB - cmpA;
                return cmpA - cmpB;
            })
        }
        if (sortType == "Requests") value = sortArray("requests_fulfilled", descending, data);
        if (sortType == "Model Count") value = sortArray("models", descending, data);

        return value;
    }

    function sortTeamsBy(sortType: SortOptions, descending = true, data: TeamDetails[]) {
        // Spread into new array to prevent mutations
        let value: typeof data = [...data];

        if (sortType == "Name") value = sortArray("name", descending, data);
        if (sortType == "Info") value = sortArray("info", descending, data);
        if (sortType == "Uptime") value = sortArray("uptime", descending, data);
        if (sortType == "Requests") value = sortArray("requests_fulfilled", descending, data);
        if (sortType == "Model Count") value = sortArray("models", descending, data);
        if (sortType == "Worker Count") value = sortArray("worker_count", descending, data);

        return value;
    }

    function sortModelsBy(sortType: SortOptions, descending = true, data: IModelData[]) {
        // Spread into new array to prevent mutations
        let value: typeof data = [...data];
        if (sortType == "Default") {
            value = sortArray("count", descending, data);
            value = sortArray("queued", descending, value);
        }
        if (sortType == "Name") value = sortArray("name", descending, data);
        if (sortType == "Info") value = sortArray("description", descending, data);
        if (sortType == "Queued") value = sortArray("queued", descending, data);
        if (sortType == "Speed") value = sortArray("performance", descending, data);
        if (sortType == "Worker Count") value = sortArray("count", descending, data);
        if (sortType == "Clear Time") value = sortArray("eta", descending, data);

        return value;
    }

    updateStore()
    setInterval(updateStore, POLL_WORKERS_INTERVAL * 1000)

    return {
        // Variables
        workers,
        teams,
        sortBy,
        sortDirection,
        searchFilter,
        activeTab,
        // Computed
        sortedWorkers,
        sortedTeams,
        sortedModels,
        sortOptions,
        // Actions
        updateWorkers
    };
});
