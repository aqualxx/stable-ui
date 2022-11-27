import type { TeamDetailsStable, WorkerDetailsStable } from "@/types/stable_horde";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useGeneratorStore, type IModelData } from "./generator";

type SortOptions = "Default" | "Name" | "Info" | "Uptime" | "MPS" | "Speed" | "Requests" | "Model Count" | "Worker Count" | "Queued" | "Clear Time"

export const useWorkerStore = defineStore("workers", () => {
    const workers = ref<WorkerDetailsStable[]>([]);
    const teams = ref<TeamDetailsStable[]>([]);
    const sortBy = ref<SortOptions>("Default");
    const searchFilter = ref("");
    const sortDirection = ref<"Ascending" | "Descending">("Descending");
    const activeTab = ref<"workers" | "teams" | "models">('workers');
    const sortedWorkers = computed(() => {
        const sorted = sortWorkersBy(sortBy.value, sortDirection.value === "Descending", workers.value);
        return sorted.filter(el => (el.name || "").toLowerCase().includes(searchFilter.value.toLowerCase()));
    })
    const sortedTeams = computed(() => {
        const sorted = sortTeamsBy(sortBy.value, sortDirection.value === "Descending", teams.value);
        return sorted.filter(el => (el.name || "").toLowerCase().includes(searchFilter.value.toLowerCase()));
    })
    const sortedModels = computed(() => {
        const sorted = sortModelsBy(sortBy.value, sortDirection.value === "Descending", useGeneratorStore().modelsData.filter(el => el.type === "ckpt"));
        return sorted.filter(el => (el.name || "").toLowerCase().includes(searchFilter.value.toLowerCase()));
    })
    const sortOptions = computed<SortOptions[]>(() => {
        let options: SortOptions[] = ["Default", "Name", "Info", "Uptime", "MPS", "Speed", "Requests"];
        if (activeTab.value === "teams") options = [...options, "Worker Count", "Model Count"];
        if (activeTab.value === "models") options = [...options, "Queued", "Clear Time", "Worker Count"];
        if (!options.includes(sortBy.value)) sortBy.value = "Info";
        return options;
    });
    
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

    function sortWorkersBy(sortType: SortOptions, descending = true, data: WorkerDetailsStable[]) {
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

    function sortTeamsBy(sortType: SortOptions, descending = true, data: TeamDetailsStable[]) {
        // Spread into new array to prevent mutations
        let value: typeof data = [...data];

        if (sortType == "Name") value = sortArray("name", descending, data);
        if (sortType == "Info") value = sortArray("info", descending, data);
        if (sortType == "Uptime") value = sortArray("uptime", descending, data);
        if (sortType == "MPS") value = sortArray("contributions", descending, data);
        if (sortType == "Speed") value = sortArray("performance", descending, data);
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
    setInterval(updateStore, 1000 * 60)

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
