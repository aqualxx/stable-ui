<script setup lang="ts">
import {
    ElFormItem,
    ElSelect,
    ElOption
} from 'element-plus';
import FormLabel from './FormLabel.vue';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
    label?: string;
    modelValue: any;
    prop: string;
    options: any[];
    multiple?: boolean;
    info?: string;
    filterable?: boolean;
    labelStyle?: string;
    placement?: string;
}>();

const emit = defineEmits(["update:modelValue", "change"]);

function onChanged(value: any) {
    emit("update:modelValue", value);
    emit("change", value);
}
</script>

<template>
    <el-form-item :prop="prop">
        <template #label>
            <FormLabel :info="info" :label-style="labelStyle">
                <slot name="label">{{label}}</slot>
            </FormLabel>
        </template>
        <el-select :model-value="modelValue" :filterable="filterable" :multiple="multiple" :placement="placement" @change="onChanged" placeholder="Select">
            <el-option
                v-for="item in options"
                :key="item"
                :label="item.label !== undefined ? item.label : item"
                :value="item.value !== undefined ? item.value : item"
            />
        </el-select>
        <slot name="inline" />
    </el-form-item>
</template>