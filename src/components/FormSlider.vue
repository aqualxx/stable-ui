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

const props = defineProps<{
    label: string;
    modelValue: number | undefined;
    prop: string;
    min?: number;
    max?: number;
    step?: number;
}>();

const emit = defineEmits(["update:modelValue"]);

// Input returns null when empty
function onChanged(value: Arrayable<number> | undefined) {
    if (value == undefined) value = props.min;
    emit("update:modelValue", value);
}
</script>

<template>
    <el-form-item :label="label" :prop="prop">
        <el-slider v-if="!hideSlider" :model-value="modelValue" show-input :min="min" :max="max" :step="step" @input="onChanged"  />
        <el-input-number v-if="hideSlider" :model-value="modelValue"       :min="min" :max="max" :step="step" @change="onChanged" />
    </el-form-item>
</template>