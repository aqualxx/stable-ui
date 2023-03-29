<script setup lang="ts">
import {
    ElFormItem,
    ElSwitch,
    ElTooltip
} from 'element-plus';
import { watchPostEffect } from 'vue';
import FormLabel from './FormLabel.vue';

const props = defineProps<{
    label?: string;
    modelValue?: boolean;
    prop: string;
    disabled?: boolean;
    disabledText?: string;
    defaultValue?: boolean;
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

watchPostEffect(() => {
    if (props.disabled && props.defaultValue !== undefined) {
        emit("update:modelValue", props.defaultValue)
    }
})
</script>

<template>
    <el-form-item :prop="prop">
        <template #label>
            <FormLabel :info="info" :label-style="labelStyle">
                <slot name="label">{{label}}</slot>
            </FormLabel>
        </template>
        <el-tooltip :content="disabledText" placement="top" :enterable="false" :hide-after="100" v-if="disabledText && disabled">
            <el-switch :disabled="disabled" :model-value="modelValue" @change="onChanged" />
        </el-tooltip>
        <el-switch :disabled="disabled" :model-value="modelValue" @change="onChanged" v-else />
        <slot name="inline" />
    </el-form-item>
</template>