<script setup lang="ts">
import InfoTooltip from '@/components/InfoTooltip.vue';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
    label?: string;
    info: any;
}>();
</script>

<template>
    <slot>{{label}}</slot>
    <div v-if="info" style="display: flex; align-items: center; height: 100%; margin-left: 5px">
        <info-tooltip :info="info" :size="15" />
    </div>
</template>