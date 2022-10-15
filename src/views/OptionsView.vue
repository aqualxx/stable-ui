<script setup lang="ts">
import {
    ElSelect,
    ElOption,
    ElForm,
    ElFormItem,
    ElInput,
    ElButton
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
            label-width="130px"
            :model="store.options"
            style="max-width: 500px"
        >
            <el-form-item label="API Key" prop="apiKey">
                <el-input
                    v-model="store.apiKey"
                    type="password"
                    placeholder="Enter API Key Here"
                    autocomplete="off"
                    class="apikey"
                    show-password
                />
                <el-button class="anon" @click="store.useAnon()">Anon?</el-button>
            </el-form-item>
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
.anon {
    width: 80px
}

.apikey {
    width: calc(100% - 80px)
}

@media only screen and (max-width: 1000px) {
    .anon {
        width: 80px
    }

    .apikey {
        width: 100%
    }
}
</style>