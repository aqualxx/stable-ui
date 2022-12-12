<script setup lang="ts">
import {
    ElFormItem,
    ElSlider,
    ElInputNumber
} from 'element-plus';
import type { Arrayable } from 'element-plus/es/utils/typescript';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import FormLabel from './FormLabel.vue';

const breakpoints = useBreakpoints(breakpointsTailwind);

const hideSlider = breakpoints.smallerOrEqual('md');

const props = defineProps<{
    label?: string;
    modelValue: number | undefined;
    prop: string;
    min?: number;
    max?: number;
    step?: number;
    info?: string;
    disabled?: boolean;
    change?: Function;
}>();

const emit = defineEmits(["update:modelValue"]);

// Input returns null when empty
function onChanged(value: Arrayable<number> | undefined) {
    if (value == undefined) value = props.min;
    emit("update:modelValue", value);
    if (props.change) props.change(value);
}
</script>

<template>
    <el-form-item :prop="prop">
        <template #label>
            <FormLabel :info="info">
                <slot name="label">{{label}}</slot>
            </FormLabel>
        </template>
        <el-slider v-if="!hideSlider" :model-value="modelValue" show-input :min="min" :max="max" :step="step" @input="onChanged"  :disabled="disabled" />
        <el-input-number v-if="hideSlider" :model-value="modelValue"       :min="min" :max="max" :step="step" @change="onChanged" :disabled="disabled" />
        <slot name="inline" />
    </el-form-item>
</template>