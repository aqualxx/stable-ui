<script setup lang="ts">
import {
    ElButton,
    ElIcon
} from 'element-plus';
import type { Component } from 'vue';

const props = defineProps<{
    options: { value: any, icon: Component<any> }[],
    modelValue: any,
    dimensions: number
}>();

const emit = defineEmits(["update:modelValue"]);

function cycleButton() {
    const currentIndex = props.options.map(el => el.value).indexOf(props.modelValue);
    if (currentIndex === -1) return;
    const indexCount = props.options.length - 1;
    if (currentIndex < indexCount) return emit("update:modelValue", props.options[currentIndex + 1].value);
    return emit("update:modelValue", props.options[0].value);
}
</script>

<template>
    <ElButton class="cycle-button" @click="cycleButton"><el-icon :size="dimensions * 0.5"><component :is="(options.find(el => el.value === modelValue) || options[0]).icon" /></el-icon></ElButton>
</template>

<style setup>
.cycle-button {
    width: calc(v-bind(dimensions) * 1px);
    height: calc(v-bind(dimensions) * 1px);
}
</style>