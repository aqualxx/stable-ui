import { defineStore } from "pinia";
import { useColorMode, useLocalStorage, type BasicColorSchema } from '@vueuse/core'
import { ref } from 'vue';

export const useOptionsStore = defineStore("options", () => {
    const options = useLocalStorage("options", ref({
        colorMode: useColorMode({
            emitAuto: true,
        })
    }));
    const pageSize = useLocalStorage("pageSize", 25);

    // A janky way to fix using color modes
    options.value.colorMode = useColorMode<BasicColorSchema>({
        emitAuto: true,
        initialValue: options.value.colorMode
    }) as any

    const apiKey = ref(useLocalStorage("apikey", "0000000000"));

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
        // Actions
        useAnon
    };
});
