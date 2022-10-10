<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useGeneratorStore } from '@/stores/generator';
import {
    type FormRules,
    ElCollapse,
    ElCollapseItem,
    ElInput,
    ElForm,
    ElFormItem,
    ElSelect,
    ElOption,
    ElRadioGroup,
    ElRadioButton,
    ElButton,
    ElCard
} from 'element-plus';
import ImageProgress from '../components/ImageProgress.vue';
import FormSlider from '../components/FormSlider.vue';
import GeneratedCarousel from '../components/GeneratedCarousel.vue'

let activeName = ref("1");
let store = useGeneratorStore();
let samplerList = ["k_lms", "k_heun", "k_euler", "k_euler_a", "k_dpm_2", "k_dpm_2_a", "DDIM", "PLMS"];
const minDimensions = 64;
const maxDimensions = 2048;
const minImages = 1;
const maxImages = 20;
const minSteps = 1;
const maxSteps = 100;
const minCfgScale = 1;
const maxCfgScale = 24;

const rules = reactive<FormRules>({
    prompt: [{
        required: true,
        message: 'Please input prompt',
        trigger: 'change'
    }],
    apiKey: [{
        required: true,
        message: 'Please input API Key',
        trigger: 'change'
    }]
})
</script>

<template>
    <el-form
        label-position="left"
        label-width="100px"
        :model="store"
        class="container"
        :rules="rules"
    >
        <div class="sidebar">
            <el-collapse v-model="activeName">
                <el-collapse-item title="Generation Options" name="1">
                    <el-form-item label="Prompt" prop="prompt">
                        <el-input
                            v-model="store.prompt"
                            autosize
                            clearable
                            resize="none"
                            type="textarea"
                            placeholder="Enter prompt here" 
                        />
                    </el-form-item>
                    <el-form-item label="Seed" prop="seed">
                        <el-input v-model="store.params.seed" placeholder="Enter seed here" />
                    </el-form-item>
                    <el-form-item label="Sampler" prop="sampler">
                        <el-select v-model="store.params.sampler_name" placeholder="Select">
                            <el-option
                                v-for="item in samplerList"
                                :key="item"
                                :label="item"
                                :value="item"
                            />
                        </el-select>
                    </el-form-item>
                    <form-slider label="Batch Size"   prop="batchSize" v-model="store.params.n"         :min="minImages"     :max="maxImages" />
                    <form-slider label="Steps"        prop="steps"     v-model="store.params.steps"     :min="minSteps"      :max="maxSteps" />
                    <form-slider label="Width"        prop="width"     v-model="store.params.width"     :min="minDimensions" :max="maxDimensions" :step="64" />
                    <form-slider label="Height"       prop="height"    v-model="store.params.height"    :min="minDimensions" :max="maxDimensions" :step="64" />
                    <form-slider label="Config Scale" prop="cfgScale"  v-model="store.params.cfg_scale" :min="minCfgScale"   :max="maxCfgScale" />
                    <el-form-item label="NSFW" prop="nsfw">
                        <el-radio-group v-model="store.nsfw">
                            <el-radio-button label="Enabled" />
                            <el-radio-button label="Disabled" />
                            <el-radio-button label="Censored" />
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item label="Worker Type" prop="trusted">
                        <el-radio-group v-model="store.trustedOnly">
                            <el-radio-button label="Trusted Only" />
                            <el-radio-button label="All Workers" />
                        </el-radio-group>
                    </el-form-item>
                </el-collapse-item>
                <el-collapse-item title="API Key" name="2">
                    <el-form-item label="Key" prop="apiKey">
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
                </el-collapse-item>
            </el-collapse>
        </div>
        <div class="main">
            <el-button @click="store.resetStore()">Reset</el-button>
            <el-button
                type="primary"
                style="width: 80%"
                :disabled="store.progress != 0"
                @click="store.generateImage()"
            > Generate
            </el-button>
        </div>
        <div class="image center-horizontal">
            <el-card class="center-both generated-image">
                <image-progress />
                <generated-carousel />
            </el-card>
        </div>
    </el-form>
</template>

<style>
.generated-image {
    aspect-ratio: 1 / 1;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}

.generated-image > .el-card__body {
    width: 100%;
    display: flex;
    justify-content: center;
}

.el-collapse, .sidebar-container {
    width: 100%
}

.anon {
    width: 15%
}

.apikey {
    width: 85%
}

.main {
    grid-area: main;
    display: flex;
    justify-content: center;
}

.sidebar {
    grid-area: sidebar;
    max-width: 90%;
}

.image {
    grid-area: image;
}

.container {
    display: grid;
    height: 75vh;
    grid-template-columns: 50% 50%;
    grid-template-rows: 5% 95%;
    grid-template-areas: 
        "sidebar main"
        "sidebar image";
}

@media only screen and (max-width: 1000px) {
    .generated-image > .el-card__body {
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    
    .generated-image {
        width: 100%;
        height: 50vw;
    }

    .container {
        display: grid;
        height: 110vh;
        grid-template-rows: 5% 55vw 60%;
        grid-template-columns: 100%;
        grid-template-areas: 
            "main"
            "image"
            "sidebar";
    }

    .sidebar {
        max-width: 100%;
    }

    .anon {
        width: 50%
    }

    .apikey {
        width: 100%
    }
}

@media only screen and (max-width: 700px) {
    .generated-image {
        width: 100%;
        height: 100%;
    }
}

</style>