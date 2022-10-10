<script setup lang="ts">
import {
    ElFormItem,
    ElSlider,
    ElInputNumber
} from 'element-plus';
import type { Arrayable } from 'element-plus/es/utils/typescript';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';

const breakpoints = useBreakpoints(breakpointsTailwind);

const hideSlider = breakpoints.smallerOrEqual('md');

defineProps<{
    label: string;
    modelValue: number | undefined;
    prop: string;
    min?: number;
    max?: number;
    step?: number;
}>();

const emit = defineEmits(["update:modelValue"]);

function onSliderChanged(value: Arrayable<number>) {
    console.log(value)
    emit("update:modelValue", value);
}

function onInputChanged(prev: number | undefined) {
    emit("update:modelValue", prev);
}
</script>

<template>
    <el-form-item :label="label" :prop="prop">
        <el-slider v-if="!hideSlider" :model-value="modelValue" show-input :min="min" :max="max" :step="step" @input="onSliderChanged" />
        <el-input-number v-if="hideSlider" :model-value="modelValue"       :min="min" :max="max" :step="step" @change="onInputChanged" />
    </el-form-item>
</template>