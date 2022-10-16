import { defineStore } from "pinia";
import { useColorMode, useLocalStorage, type BasicColorSchema } from '@vueuse/core'
import { ref } from 'vue';

export const useOptionsStore = defineStore("options", () => {
    const options = useLocalStorage("options", {
        colorMode: ref(useColorMode({
            emitAuto: true,
        }))
    });

    // A janky way to fix using color modes
    options.value.colorMode = useColorMode<BasicColorSchema>({
        emitAuto: true,
        initialValue: options.value.colorMode.value
    })

    const apiKey = ref(useLocalStorage("apikey", "0000000000"));

    /**
     * Make your API key anonymous (0000000000) 
     * */
    function useAnon() {
        apiKey.value = "0000000000";
    }

    return { options, apiKey, useAnon };
});
