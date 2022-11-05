<script setup lang="ts">
import {
    ElFormItem,
    ElRadioGroup,
    ElRadioButton
} from 'element-plus';
import FormLabel from './FormLabel.vue';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
    label: string;
    modelValue: any;
    prop: string;
    options: any[];
    disabled?: boolean;
    info?: string;
    change?: Function;
}>();

const emit = defineEmits(["update:modelValue"]);

function onChanged(value: string | number | boolean) {
    emit("update:modelValue", value);
    if (props.change) props.change(value);
}
</script>

<template>
    <el-form-item :prop="prop">
        <template #label><FormLabel :label="label" :info="info" /></template>
        <el-radio-group :disabled="disabled" :model-value="modelValue" @change="onChanged">
            <el-radio-button 
                v-for="option in options"
                :key="option"
                :label="option"
            />
        </el-radio-group>
    </el-form-item>
</template>