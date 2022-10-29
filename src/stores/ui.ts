import { ElMessage } from "element-plus";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useUIStore = defineStore("ui", () => {
    const multiSelect = ref(false);
    const selected = ref<number[]>([]);
    const progress  = ref(0);
    const waitMsg   = ref('');
    const activeIndex = ref('/');
    const activeCollapse = ref(["2"]);

    /**
     * Raises an error in the console and in the UI
     */
    function raiseError(err: string) {
        console.error(err);
        ElMessage({
            type: 'error',
            message: err,
        })
    }

    /**
     * Toggles multi select for images
     */
    function toggleMultiSelect() {
        if (multiSelect.value) {
            multiSelect.value = !multiSelect.value;
            selected.value = [];
            return;
        }
        multiSelect.value = !multiSelect.value;
    }

    /**
     * Toggles selected image
     */
    function toggleSelection(id: number) {
        if (selected.value.includes(id)) {
            const index = selected.value.indexOf(id);
            selected.value.splice(index, 1);
            return;
        }
        selected.value.push(id);
    }

    /**
     * Updates the wait time progress bar
     */
    function updateProgress(waitTime: number, secondsElapsed: number) {
        const percentage = 100 * (1 - waitTime / (waitTime + secondsElapsed));
        progress.value   = Math.round(percentage * 100) / 100;
        waitMsg.value    = `EST: ${Math.round(waitTime)}s`;
        console.log(`${progress.value.toFixed(2)}%`);
    }

    return {
        // Variables
        multiSelect,
        selected,
        progress,
        waitMsg,
        activeIndex,
        activeCollapse,
        // Actions
        raiseError,
        toggleMultiSelect,
        toggleSelection,
        updateProgress
    };
});
