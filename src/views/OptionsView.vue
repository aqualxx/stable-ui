<script setup lang="ts">
import {
    ElSelect,
    ElOption,
    ElForm,
    ElFormItem
} from 'element-plus';
import { useOptionsStore } from '@/stores/options';
import type { BasicColorSchema } from '@vueuse/core';
const store = useOptionsStore();
interface ColorModeOption {
    value: BasicColorSchema;
    label: string;
}

const options: ColorModeOption[] = [
    {
        value: 'dark',
        label: 'Dark',
    }, {
        value: 'light',
        label: 'Light',
    }, {
        value: 'auto',
        label: 'Auto',
    }
]
</script>

<template>
    <div>
        <h1>Options</h1>
        <el-form
            label-position="left"
            label-width="100px"
            :model="store.options"
            style="max-width: 460px"
        >
            <el-form-item label="Color Scheme">
                <el-select v-model="store.options.colorMode" placeholder="Select">
                    <el-option
                        v-for="item in options"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                </el-select>
            </el-form-item>
        </el-form>
    </div>
</template>  

<style>
html.cafe {
  filter: sepia(0.9) hue-rotate(315deg) brightness(0.9);
}
html.contrast {
  filter: contrast(2);
}
</style>