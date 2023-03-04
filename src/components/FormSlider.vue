<script setup lang="ts">
import {
    ElFormItem,
    ElSlider,
    ElInputNumber,
    ElButton,
} from 'element-plus';
import {
    Plus,
    Minus,
} from '@element-plus/icons-vue';
import type { Arrayable } from 'element-plus/es/utils/typescript';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import FormLabel from './FormLabel.vue';
import { computed } from 'vue';

const breakpoints = useBreakpoints(breakpointsTailwind);

const hideSlider = breakpoints.smallerOrEqual('md');

const props = defineProps<{
    label?: string;
    modelValue: number | number[] | undefined;
    prop: string;
    min: number;
    max: number;
    step?: number;
    info?: string;
    disabled?: boolean;
    labelStyle?: string;
    multiple?: boolean;
}>();

const emit = defineEmits(["update:modelValue", "change", "onAdd", "onRemove"]);

// Input returns null when empty
function onChanged(value: Arrayable<number> | undefined, index?: number) {
    if (props.multiple && Array.isArray(props.modelValue) && index) {
        const valueUnarray = (Array.isArray(value) ? value[0] : value) ?? props.min;

        let newValue = props.modelValue;
        newValue[index] = valueUnarray;

        emit("update:modelValue", newValue);
        emit("change", newValue);
        return;
    }
    const newValue = value ?? props.min;
    emit("update:modelValue", newValue);
    emit("change", newValue);
}

function onAdd() {
    if (!props.multiple || !Array.isArray(props.modelValue)) return;
    const newValue = props.min;
    emit("update:modelValue", [...props.modelValue, newValue]);
    emit("onAdd", newValue);
}

function onRemove() {
    if (!props.multiple || !Array.isArray(props.modelValue)) return;
    const newValues = props.modelValue;
    const popped = newValues.pop();
    emit("update:modelValue", newValues);
    emit("onRemove", popped);
}

const indices = computed(() => props.multiple && Array.isArray(props.modelValue) ? Array.from(Array(props.modelValue.length).keys()) : []);
const unarray = computed(() => Array.isArray(props.modelValue) ? props.modelValue[0] : props.modelValue);
</script>

<template>
    <el-form-item :prop="prop">
        <template #label>
            <FormLabel :info="info" :label-style="labelStyle">
                <slot name="label">{{label}}</slot>
            </FormLabel>
        </template>
        <div v-if="!multiple || !Array.isArray(modelValue)" style="width: 100%">
            <el-slider       v-if="!hideSlider" :model-value="unarray" :min="min" :max="max" :step="step" @input="onChanged"  :disabled="disabled" show-input />
            <el-input-number v-if="hideSlider"  :model-value="unarray" :min="min" :max="max" :step="step" @change="onChanged" :disabled="disabled" />
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px; width: 100%" v-else>
            <div v-for="index in indices" :key="index">
                <el-slider       v-if="!hideSlider" :model-value="modelValue[index]" :min="min" :max="max" :step="step" @input="(newValue) => onChanged(newValue, index)"  :disabled="disabled" show-input />
                <el-input-number v-if="hideSlider"  :model-value="modelValue[index]" :min="min" :max="max" :step="step" @change="(newValue) => onChanged(newValue, index)" :disabled="disabled" />
            </div>
            <div>
                <el-button :icon="Plus" @click="() => onAdd()" />
                <el-button :icon="Minus" @click="() => onRemove()" :disabled="indices.length <= 1" />
            </div>
        </div>
        <slot name="inline" />
    </el-form-item>
</template>