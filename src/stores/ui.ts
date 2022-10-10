import { ElMessage } from "element-plus";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useUIStore = defineStore("ui", () => {
    const multiSelect = ref(false);
    const selected = ref<number[]>([]);

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
    

    return { multiSelect, selected, raiseError, toggleMultiSelect, toggleSelection };
});
