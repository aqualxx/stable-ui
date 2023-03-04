<script setup lang="ts">
import {
    ElFormItem,
    ElSwitch
} from 'element-plus';
import FormLabel from './FormLabel.vue';

const props = defineProps<{
    label?: string;
    modelValue?: boolean;
    prop: string;
    disabled?: boolean;
    info?: string;
    labelStyle?: string;
    change?: Function;
}>();

const emit = defineEmits(["update:modelValue"]);

function onChanged(value: string | number | boolean) {
    const newBoolean = !!value;
    emit("update:modelValue", newBoolean);
    if (!props.change) return;
    props.change(newBoolean);
}
</script>

<template>
    <el-form-item :prop="prop">
        <template #label>
            <FormLabel :info="info" :label-style="labelStyle">
                <slot name="label">{{label}}</slot>
            </FormLabel>
        </template>
        <el-switch :disabled="disabled" :model-value="modelValue" @change="onChanged" />
        <slot name="inline" />
    </el-form-item>
</template>