<script setup lang="ts">
import {
    ElFormItem,
    ElSelect,
    ElOption
} from 'element-plus';
import InfoTooltip from './InfoTooltip.vue'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
    label: string;
    modelValue: any;
    prop: string;
    options: any[];
    multiple?: boolean;
    info?: string;
    change?: Function;
}>();

const emit = defineEmits(["update:modelValue"]);

function onChanged(value: any) {
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
        <el-select :model-value="modelValue" :multiple="multiple" @change="onChanged" placeholder="Select">
            <el-option
                v-for="item in options"
                :key="item"
                :label="item.label ? item.label : item"
                :value="item.value ? item.value : item"
            />
        </el-select>
    </el-form-item>
</template>