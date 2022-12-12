<script setup lang="ts">
import InfoTooltip from '@/components/InfoTooltip.vue';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
    label?: string;
    info?: any;
    labelStyle?: string;
}>();
</script>

<template>
    <span class="align-vertical" :style="labelStyle || 'height: 100%;'">
        <slot>{{label}}</slot>
        <div v-if="info" class="align-vertical" style="margin-left: 5px">
            <info-tooltip :info="info" :size="15" />
        </div>
    </span>
</template>

<style scoped>
.align-vertical {
    display: flex;
    align-items: center;
    height: 100%;
}
</style>