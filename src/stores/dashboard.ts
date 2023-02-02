import type { UserDetailsStable, HordePerformanceStable, WorkerDetailsStable } from "@/types/stable_horde";
import { defineStore } from "pinia";
import { ref } from 'vue';
import { useGeneratorStore } from "./generator";
import { useOptionsStore } from "./options";
import { useWorkerStore } from "./workers";
import sanitizeHtml from 'sanitize-html';
import { marked } from 'marked';
import { POLL_DASHBOARD_INTERVAL, POLL_USERS_INTERVAL, DEBUG_MODE } from "@/constants";
import { validateResponse } from "@/utils/validate";

const formatter = Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2});

export const useDashboardStore = defineStore("dashboard", () => {
    const user = ref<UserDetailsStable>({});
    const userWorkers = ref<WorkerDetailsStable[]>([]);
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
        const optionsStore = useOptionsStore();

        const response = await fetch(`${optionsStore.baseURL}/api/v2/find_user`, {
            headers: {
                apikey: optionsStore.apiKey
            }
        });
        const resJSON: UserDetailsStable = await response.json();
        if (!validateResponse(response, resJSON, 200, "Failed to find user by API key")) return false;
        user.value = resJSON;
        getHordePerformance();
        getNews();
        
        if (optionsStore.apiKey === '0000000000' || optionsStore.apiKey === '') return;
        getAllUserWorkers();
    }

    /**
     * Finds the user's stale workers
     * */ 
    async function getStaleWorker(workerID: string) {
        const optionsStore = useOptionsStore();
        const response = await fetch(`${optionsStore.baseURL}/api/v2/workers/${workerID}`);
        const resJSON = await response.json();
        if (!validateResponse(response, resJSON, 200, "Failed to find user by API key")) return false;
        return resJSON;
    }

    /**
     * Finds all of the user's workers
     * */ 
    async function getAllUserWorkers() {
        if (DEBUG_MODE) console.log("Attempting to get all user workers...")
        const workerStore = useWorkerStore();
        if (user.value.worker_ids == undefined) return [];
        const workers: WorkerDetailsStable[] = [];
        for (let i = 0; i < user.value.worker_ids?.length; i++) {
            const workerID = user.value.worker_ids[i];
            const worker = workerStore.workers.find(worker => worker.id === workerID);
            const workerData = worker || await getStaleWorker(workerID);
            workers.push(workerData);
            if (DEBUG_MODE) console.log(worker ? "Got online user worker..." : "Got stale user worker...", workerData)
        }
        if (DEBUG_MODE) console.log("Got workers!", workers)
        userWorkers.value = workers;
    }

    async function updateUsers() {
        const optionsStore = useOptionsStore();
        const response = await fetch(`${optionsStore.baseURL}/api/v2/users`);
        const resJSON = await response.json();
        if (!validateResponse(response, resJSON, 200, "Failed to update leaderboard")) return false;
        users.value = resJSON;
        updateLeaderboard();
    }

    async function getHordePerformance() {
        const optionsStore = useOptionsStore();
        const response = await fetch(`${optionsStore.baseURL}/api/v2/status/performance`);
        const resJSON = await response.json();
        if (!validateResponse(response, resJSON, 200, "Failed to get server performance")) return false;
        performance.value = resJSON;
    }

    async function getNews() {
        const optionsStore = useOptionsStore();
        const response = await fetch(`${optionsStore.baseURL}/api/v2/status/news`);
        const resJSON = await response.json();
        if (!validateResponse(response, resJSON, 200, "Failed to get news")) return false;
        resJSON.forEach((el: any) => el.newspiece = sanitizeHtml(marked.parse(el.newspiece)))
        news.value = resJSON;
    }

    async function updateLeaderboard() {
        function formatUserForLeaderboard(index: number, user: UserDetailsStable) {
            return {
                id: index + 1,
                name: user.username as string,
                kudos: formatter.format(Math.floor(Object.values(user.kudos_details as any).reduce((a: any, b: any) => a + b) as number)),
                mps: Math.floor(user.contributions?.megapixelsteps as number)
            }
        }

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

        for (let i = 0; i < Math.min(10, sortedUsers.length); i++) {
            leaderboard.value[i] = formatUserForLeaderboard(i, sortedUsers[i]);
        }

        if (sortedUsers[yourRanking]) {
            leaderboard.value[11] = formatUserForLeaderboard(yourRanking, sortedUsers[yourRanking]);
        }
    }

    updateDashboard();
    updateUsers();
    setInterval(updateDashboard, POLL_DASHBOARD_INTERVAL * 1000);
    setInterval(updateUsers, POLL_USERS_INTERVAL * 1000);

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
