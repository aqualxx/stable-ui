<script setup lang="ts">
import {
    ElFormItem,
    ElRadioGroup,
    ElRadioButton
} from 'element-plus';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
    label: string;
    modelValue: any;
    prop: string;
    options: string[] | number[] | boolean[];
}>();

const emit = defineEmits(["update:modelValue"]);

function onChanged(value: string | number | boolean) {
    emit("update:modelValue", value);
}
</script>

<template>
    <el-form-item :label="label" :prop="prop">
        <el-radio-group :model-value="modelValue" @change="onChanged">
            <el-radio-button 
                v-for="option in options"
                :key="option"
                :label="option"
            />
        </el-radio-group>
    </el-form-item>
</template>