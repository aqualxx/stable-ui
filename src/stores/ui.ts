import type { RequestStatusCheck } from "@/types/stable_horde";
import { db } from "@/utils/db";
import { ElMessage } from "element-plus";
import { defineStore } from "pinia";
import { ref } from "vue";
import { useOptionsStore } from "./options";
import { useOutputStore } from "./outputs";

export const useUIStore = defineStore("ui", () => {
    const multiSelect = ref(false);
    const selected = ref<number[]>([]);
    const progress  = ref(0);
    const activeCollapse = ref(["1"]);
    const activeModal = ref(-1);
    const showGeneratorBadge = ref(false);
    const showGeneratedImages = ref(false);

    /**
     * Raises an error in the console and in the UI
     */
    function raiseError(err: string, indefinite: boolean) {
        console.error(err);
        ElMessage({
            type: 'error',
            message: err,
            duration: indefinite ? 0 : undefined,
            showClose: indefinite
        })
    }

    /**
     * Raises a warning in the console and in the UI
     */
    function raiseWarning(err: string, indefinite: boolean) {
        console.warn(err);
        ElMessage({
            type: 'warning',
            message: err,
            duration: indefinite ? 0 : undefined,
            showClose: indefinite
        })
    }

    /**
     * Toggles multi select for images
     */
    function toggleMultiSelect() {
        multiSelect.value = !multiSelect.value;
        if (multiSelect.value) return;
        selected.value = [];
    }

    /**
     * Toggles selected image
     */
    function toggleSelection(id: number) {
        if (selected.value.includes(id)) {
            const index = selected.value.indexOf(id);
            selected.value.splice(index, 1);
            if (selected.value.length === 0) multiSelect.value = false;
            return;
        }
        selected.value.push(id);
    }

    /**
     * Updates the wait time progress bar
     */
    function updateProgress(checkData: RequestStatusCheck, secondsElapsed: number) {
        const { wait_time } = checkData;
        const percentage = 100 * (1 - (wait_time as number) / ((wait_time as number) + secondsElapsed));
        progress.value   = Math.round(percentage * 100) / 100;
        console.log(`${progress.value.toFixed(2)}%`);
    }

    async function openModalToRight() {
        const outputStore = useOutputStore();
        const optionStore = useOptionsStore();

        const currentIndex = outputStore.currentOutputs.findIndex(el => el.id === activeModal.value);
        const outputRight = outputStore.currentOutputs[currentIndex + 1];

        if (outputRight) {
            activeModal.value = outputRight.id;
            return;
        }
        if (outputStore.currentPage <= Math.floor(outputStore.outputsLength / optionStore.pageSize)) {
            const next = outputStore.sortBy === "Newest" ? 
                await db.outputs
                    .where(":id")
                    .below(activeModal.value)
                    .last() :
                await db.outputs
                    .where(":id")
                    .above(activeModal.value)
                    .first();

            outputStore.currentPage++;
            activeModal.value = next?.id || activeModal.value;
            return;
        }
    }

    async function openModalToLeft() {
        const outputStore = useOutputStore();

        const currentIndex = outputStore.currentOutputs.findIndex(el => el.id === activeModal.value);
        const outputLeft = outputStore.currentOutputs[currentIndex - 1];

        if (outputStore.currentPage > 1 && !outputLeft) {
            const next = outputStore.sortBy === "Oldest" ? 
                await db.outputs
                    .where(":id")
                    .below(activeModal.value)
                    .last() :
                await db.outputs
                    .where(":id")
                    .above(activeModal.value)
                    .first();

            outputStore.currentPage--;
            activeModal.value = next?.id || activeModal.value;
            return;
        }
        if (outputLeft) {
            activeModal.value = outputLeft.id;
            return;
        }
    }

    return {
        // Variables
        multiSelect,
        selected,
        progress,
        activeCollapse,
        activeModal,
        showGeneratorBadge,
        showGeneratedImages,
        // Actions
        raiseError,
        raiseWarning,
        toggleMultiSelect,
        toggleSelection,
        updateProgress,
        openModalToRight,
        openModalToLeft
    };
});
