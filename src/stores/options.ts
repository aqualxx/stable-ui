import { defineStore } from "pinia";
import { useColorMode, useLocalStorage, type BasicColorSchema } from '@vueuse/core'
import { ref, computed } from 'vue';
import { BASE_URL_STABLE } from "@/constants";

type IToggle = "Enabled" | "Disabled";

export const useOptionsStore = defineStore("options", () => {
    const options = useLocalStorage("options", ref({
        colorMode: useColorMode({
            emitAuto: true,
        })
    }));
    const pageSize = useLocalStorage("pageSize", 25);
    const allowLargerParams = useLocalStorage<IToggle>("allowLargerParams", "Disabled");
    const shareWithLaion = useLocalStorage<IToggle>("shareWithLaion", "Disabled");
    const autoCarousel = useLocalStorage<IToggle>("autoCarousel", "Enabled");
    //const useCloudflare = useLocalStorage<IToggle>("useCloudflare", "Disabled");
    const useBeta = useLocalStorage<IToggle>("useBeta", "Disabled");
    //const baseURL = computed(() => useBeta.value === "Enabled" ? BASE_URL_DEV : BASE_URL_STABLE);
    const baseURL = computed(() => BASE_URL_STABLE);
    const useWorker = ref("None");

    // A janky way to fix using color modes
    options.value.colorMode = useColorMode<BasicColorSchema>({
        emitAuto: true,
        initialValue: options.value.colorMode
    }) as any

    const apiKey = useLocalStorage("apikey", "0000000000");

    /**
     * Make your API key anonymous (0000000000)
     * */
    function useAnon() {
        apiKey.value = "0000000000";
    }

    return {
        // Variables
        options,
        pageSize,
        apiKey,
        allowLargerParams,
        autoCarousel,
        useBeta,
        useWorker,
        shareWithLaion,
        // Computed
        baseURL,
        // Actions
        useAnon
    };
});
