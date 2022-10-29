import type { UserDetailsStable, CustomWorkerDetails, HordePerformanceStable } from "@/types/stable_horde";
import { defineStore } from "pinia";
import { ref } from 'vue';
import { useGeneratorStore } from "./generator";
import { useOptionsStore } from "./options";
import { useWorkerStore } from "./workers";
import sanitizeHtml from 'sanitize-html';
import { marked } from 'marked';

const REFRESH_INTERVAL = 30; // seconds
const REFRESH_INTERVAL_LEADERBOARD = 180; // seconds

const formatter = Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2});

export const useDashboardStore = defineStore("dashboard", () => {
    const user = ref<UserDetailsStable>({});
    const userWorkers = ref<CustomWorkerDetails[]>([]);
    const performance = ref<HordePerformanceStable>({});
    const users = ref<UserDetailsStable[]>([]);
    const leaderboard = ref<{id: number; name: string; kudos: string; mps: number;}[]>([]);
    const leaderboardOrderProp = ref("kudos");
    const leaderboardOrder = ref("descending");
    const news = ref<{date_published: string; newspiece: string; importance: string;}[]>([]);
    
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
        const resJSON: UserDetailsStable = await response.json();
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
        resJSON.forEach((el: any) => el.newspiece = sanitizeHtml(marked.parse(el.newspiece)))
        news.value = resJSON;
    }

    async function updateLeaderboard() {
        const sortedUsers: UserDetailsStable[] = [...users.value].sort((a: UserDetailsStable, b: UserDetailsStable) => {
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
            if (leaderboardOrder.value === "ascending") return cmpA - cmpB;
            return leaderboardOrder.value === "ascending" ? cmpA - cmpB : cmpB - cmpA;
        })
        const yourRanking = sortedUsers.map(el => el.username).indexOf(user.value.username);
        for (let i = 0; i < 10; i++) {
            leaderboard.value[i] = {
                id: i + 1,
                name: sortedUsers[i].username as string,
                kudos: formatter.format(Math.floor(Object.values(sortedUsers[i].kudos_details as any).reduce((a: any, b: any) => a + b) as number)),
                mps: Math.floor(sortedUsers[i].contributions?.megapixelsteps as number)
            }
        }
        leaderboard.value[11] = {
            id: yourRanking + 1,
            name: sortedUsers[yourRanking].username as string,
            kudos: formatter.format(Math.floor(Object.values(sortedUsers[yourRanking].kudos_details as any).reduce((a: any, b: any) => a + b) as number)),
            mps: Math.floor(sortedUsers[yourRanking].contributions?.megapixelsteps as number)
        }
    }

    updateDashboard();
    updateUsers();
    setInterval(updateDashboard, REFRESH_INTERVAL * 1000);
    setInterval(updateUsers, REFRESH_INTERVAL_LEADERBOARD * 1000);

    return {
        // Variables
        user,
        userWorkers,
        performance,
        users,
        leaderboard,
        leaderboardOrderProp,
        leaderboardOrder,
        news, 
        // Actions
        updateDashboard,
        getAllUserWorkers,
        updateLeaderboard,
        updateUsers,
        getHordePerformance
    };
});
