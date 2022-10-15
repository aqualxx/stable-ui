import type { UserDetails } from "@/types/stable_horde";
import { defineStore } from "pinia";
import { ref } from 'vue';
import { useGeneratorStore } from "./generator";
import { useOptionsStore } from "./options";

export const useDashboardStore = defineStore("dashboard", () => {
    const user = ref<UserDetails>({});
    
    /**
     * Finds the user based on API key
     * */ 
    async function findUser() {
        const store = useGeneratorStore();
        const optionsStore = useOptionsStore();

        if (optionsStore.apiKey === '0000000000' || optionsStore.apiKey === '') return;

        const response = await fetch("https://stablehorde.net/api/v2/users", {
            headers: {
                apikey: optionsStore.apiKey
            }
        });
        const resJSON: UserDetails = await response.json();
        if (!store.validateResponse(response, resJSON, 200, "Failed to find user by API key")) return false;
        user.value = resJSON;
    }

    findUser();
    setInterval(findUser, 30 * 1000)

    return { user, findUser };
});
