<script setup lang="ts">
import {
    ElFormItem,
    ElInput
} from 'element-plus';
import InfoTooltip from './InfoTooltip.vue'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
    label: string;
    modelValue: any;
    prop: string;
    type?: string;
    resize?: "none" | "both" | "horizontal" | "vertical";
    placeholder?: string;
    autosize?: boolean | object;
    info?: string;
    change?: Function;
}>();

const emit = defineEmits(["update:modelValue"]);

function onChanged(value: string) {
    emit("update:modelValue", value);
    if (props.change) props.change(value);
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
        <el-input
            :model-value="modelValue"
            :autosize="autosize"
            :resize="resize"
            @input="onChanged"
            :type="type"
            :placeholder="placeholder" 
        />
    </el-form-item>
</template>