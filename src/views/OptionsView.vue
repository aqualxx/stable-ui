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
import FormSlider from '../components/FormSlider.vue';
import FormRadio from '../components/FormRadio.vue';
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
            label-width="160px"
            :model="store.options"
            style="max-width: 600px"
        >
            <form-slider label="Images Per Page" prop="pageSize" v-model="store.pageSize" :min="10" :max="50" :step="5" />
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
            <form-radio label="Larger Values" prop="allowLargerParams" v-model="store.allowLargerParams" :options="['Enabled', 'Disabled']" info="Allows use of larger step values and dimension sizes if you have the kudos on hand." :disabled="store.apiKey === '0000000000' || store.apiKey === ''" />
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