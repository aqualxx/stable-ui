<script setup lang="ts">
import {
    ElFormItem,
    ElRadioGroup,
    ElRadioButton
} from 'element-plus';
import { computed } from 'vue';
import FormLabel from './FormLabel.vue';

const props = defineProps<{
    label?: string;
    modelValue: any;
    prop: string;
    useBoolean?: boolean;
    options: any[];
    disabled?: boolean;
    info?: string;
    labelStyle?: string;
    change?: Function;
}>();

const emit = defineEmits(["update:modelValue"]);

function onChanged(value: string | number | boolean) {
    if (props.useBoolean && value === "Enabled") {
        emit("update:modelValue", true);
    } else if (props.useBoolean && value === "Disabled") {
        emit("update:modelValue", false);
    } else {
        emit("update:modelValue", value);
    }
    if (props.change) return;
    if (props.useBoolean && value === "Enabled") return props.change(true);
    if (props.useBoolean && value === "Disabled") return props.change(false);
    return props.change(value);
}

const currentEnabled = computed(() => {
    if (!props.useBoolean) return props.modelValue;
    if (props.modelValue === true) return "Enabled";
    if (props.modelValue === false) return "Disabled";
    return props.modelValue;
})
</script>

<template>
    <el-form-item :prop="prop">
        <template #label>
            <FormLabel :info="info" :label-style="labelStyle">
                <slot name="label">{{label}}</slot>
            </FormLabel>
        </template>
        <el-radio-group :disabled="disabled" :model-value="currentEnabled" @change="onChanged">
            <el-radio-button 
                v-for="option in options"
                :key="option"
                :label="option"
            />
        </el-radio-group>
        <slot name="inline" />
    </el-form-item>
</template>