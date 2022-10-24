import type { UserDetails, CustomWorkerDetails, HordePerformanceStable } from "@/types/stable_horde";
import { defineStore } from "pinia";
import { ref } from 'vue';
import { useGeneratorStore } from "./generator";
import { useOptionsStore } from "./options";
import { useWorkerStore } from "./workers";
import sanitizeHtml from 'sanitize-html';
import { marked } from 'marked';

const REFRESH_INTERVAL = 30; // seconds
const REFRESH_INTERVAL_LEADERBOARD = 180; // seconds

export const useDashboardStore = defineStore("dashboard", () => {
    const user = ref<UserDetails>({});
    const userWorkers = ref<CustomWorkerDetails[]>([]);
    const performance = ref<HordePerformanceStable>({});
    const users = ref<UserDetails[]>([]);
    const leaderboard = ref<{id: number; name: string; kudos: number; mps: number; suspicious: number;}[]>([]);
    const leaderboardOrderProp = ref("kudos");
    const leaderboardOrder = ref("descending");
    const news = ref<string[]>([]);
    
    /**
     * Finds the user based on API key
     * */ 
    async function updateDashboard() {
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
        getHordePerformance();
        getNews();
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

    async function updateUsers() {
        const store = useGeneratorStore();
        const response = await fetch("https://stablehorde.net/api/v2/users");
        const resJSON = await response.json();
        if (!store.validateResponse(response, resJSON, 200, "Failed to update leaderboard")) return false;
        users.value = resJSON;
        updateLeaderboard();
    }

    async function getHordePerformance() {
        const store = useGeneratorStore();
        const response = await fetch("https://stablehorde.net/api/v2/status/performance");
        const resJSON = await response.json();
        if (!store.validateResponse(response, resJSON, 200, "Failed to get server performance")) return false;
        performance.value = resJSON;
    }

    async function getNews() {
        const store = useGeneratorStore();
        const response = await fetch("https://stablehorde.net/api/v2/status/news");
        const resJSON = await response.json();
        if (!store.validateResponse(response, resJSON, 200, "Failed to get news")) return false;
        news.value = resJSON.map((el: any) => sanitizeHtml(marked.parse(el.newspiece)));
    }

    async function updateLeaderboard() {
        const sortedUsers: UserDetails[] = [...users.value].sort((a: UserDetails, b: UserDetails) => {
            let cmpA = 0;
            let cmpB = 0;
            if (leaderboardOrderProp.value === "kudos") {
                cmpA = Object.values(a.kudos_details as any).reduce((a: any, b: any) => a + b) as number;
                cmpB = Object.values(b.kudos_details as any).reduce((a: any, b: any) => a + b) as number;
            }
            if (leaderboardOrderProp.value === "mps") {
                cmpA = a.contributions?.megapixelsteps as number;
                cmpB = b.contributions?.megapixelsteps as number;
            }
            if (leaderboardOrderProp.value === "suspicious") {
                cmpA = a.suspicious as number;
                cmpB = b.suspicious as number;
            }
            if (leaderboardOrder.value === "ascending") return cmpA - cmpB;
            return leaderboardOrder.value === "ascending" ? cmpA - cmpB : cmpB - cmpA;
        })
        for (let i = 0; i < 10; i++) {
            leaderboard.value[i] = {
                id: i + 1,
                name: sortedUsers[i].username as string,
                kudos: Math.floor(Object.values(sortedUsers[i].kudos_details as any).reduce((a: any, b: any) => a + b) as number),
                mps: Math.floor(sortedUsers[i].contributions?.megapixelsteps as number),
                suspicious: sortedUsers[i].suspicious as number
            }
        }
    }

    updateDashboard();
    updateUsers();
    setInterval(updateDashboard, REFRESH_INTERVAL * 1000);
    setInterval(updateUsers, REFRESH_INTERVAL_LEADERBOARD * 1000);

    return { user, userWorkers, performance, users, leaderboard, leaderboardOrderProp, leaderboardOrder, news, updateDashboard, getAllUserWorkers, updateLeaderboard, updateUsers, getHordePerformance };
});
