import { defineStore } from "pinia";
import { useColorMode, useLocalStorage } from '@vueuse/core'
import { ref } from 'vue';

export const useOptionsStore = defineStore("options", () => {
    const options = useLocalStorage("options", ref({
        colorMode: useColorMode({
            emitAuto: true,
        })
    }));

    return { options };
});
