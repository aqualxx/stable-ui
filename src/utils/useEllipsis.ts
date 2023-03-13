import { ref, onUnmounted } from "vue";

export function useEllipsis() {
    const ellipsis = ref("...");

    const interval = setInterval(() => {
        ellipsis.value = ellipsis.value.length >= 3 ? "" : ".".repeat(ellipsis.value.length + 1);
    }, 1000);

    onUnmounted(() => {
        clearInterval(interval);
    });

    return { ellipsis };
}