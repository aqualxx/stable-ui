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
    options: any[];
    disabled: boolean;
    info?: string;
}>();

const emit = defineEmits(["update:modelValue"]);

function onChanged(value: string | number | boolean) {
    emit("update:modelValue", value);
}
</script>

<template>
    <el-form-item :prop="prop">
        <template #label>
            <div>{{label}}</div>
            <div v-if="info" style="display: flex; align-items: center; height: 100%; margin-left: 5px">
                <info-tooltip :info="info" :size="15"/>
            </div>
        </template>
        <el-radio-group :disabled="disabled" :model-value="modelValue" @change="onChanged">
            <el-radio-button 
                v-for="option in options"
                :key="option"
                :label="option"
            />
        </el-radio-group>
    </el-form-item>
</template>