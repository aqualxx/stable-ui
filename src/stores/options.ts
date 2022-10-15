import { defineStore } from "pinia";
import { useColorMode, useLocalStorage } from '@vueuse/core'
import { ref } from 'vue';

export const useOptionsStore = defineStore("options", () => {
    const options = useLocalStorage("options", ref({
        colorMode: useColorMode({
            emitAuto: true,
        })
    }));
    const apiKey = ref(useLocalStorage("apikey", "0000000000"));

    /**
     * Make your API key anonymous (0000000000) 
     * */
    function useAnon() {
        apiKey.value = "0000000000";
    }

    return { options, apiKey, useAnon };
});
