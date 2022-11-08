<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useGeneratorStore } from '@/stores/generator';
import {
    type FormRules,
    ElCollapse,
    ElCollapseItem,
    ElForm,
    ElButton,
    ElCard,
    ElMenu,
} from 'element-plus';
import {
    Comment,
    PictureFilled,
} from '@element-plus/icons-vue';
import ImageProgress from '../components/ImageProgress.vue';
import FormSlider from '../components/FormSlider.vue';
import FormSelect from '../components/FormSelect.vue';
import FormRadio from '../components/FormRadio.vue';
import FormInput from '../components/FormInput.vue';
import GeneratedCarousel from '../components/GeneratedCarousel.vue'
import BrushFilled from '../components/icons/BrushFilled.vue';
import CustomCanvas from '../components/CustomCanvas.vue';
import GeneratorMenuItem from '../components/GeneratorMenuItem.vue';
import { useUIStore } from '@/stores/ui';
import { useCanvasStore } from '@/stores/canvas';
import { useOptionsStore } from '@/stores/options';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.smallerOrEqual('md');

const store = useGeneratorStore();
const uiStore = useUIStore();
const canvasStore = useCanvasStore();
const optionsStore = useOptionsStore();
const samplerList = ["k_lms", "k_heun", "k_euler", "k_euler_a", "k_dpm_2", "k_dpm_2_a", 'k_dpm_fast', 'k_dpm_adaptive', 'k_dpmpp_2m', 'k_dpmpp_2s_a'];
const minDimensions = 64;
const maxDimensions = computed(() => optionsStore.allowLargerParams === "Enabled" ? 3072 : 1024);
const minImages = 1;
const maxImages = 20;
const minSteps = 1;
const maxSteps = computed(() => optionsStore.allowLargerParams === "Enabled" ? 500 : 100);
const minCfgScale = 1;
const maxCfgScale = 24;

const setKarras = computed({
    get() {
        return store.params.karras ? "Enabled" : "Disabled";
    },
    set(value: string) {
        store.params.karras = value === "Enabled";
    }
})

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

const upscalers = ['GFPGAN', 'Real ESRGAN', 'LDSR'];

function onMenuChange(key: any) {
    store.generatorType = key;
    console.log(key)
}

function onDimensionsChange() {
    canvasStore.showCropPreview = true;
    canvasStore.updateCropPreview();
}
</script>

<template>
    <el-menu
        :default-active="store.generatorType"
        :collapse="true"
        @select="onMenuChange"
        :mode="isMobile ? 'horizontal' : 'vertical'"
        :class="isMobile ? 'mobile-generator-types' : 'generator-types'"
    >
        <GeneratorMenuItem index="Text2Img"   :icon-one="Comment"       :icon-two="PictureFilled" :isMobile="isMobile" />
        <GeneratorMenuItem index="Img2Img"    :icon-one="PictureFilled" :icon-two="PictureFilled" :isMobile="isMobile" />
        <GeneratorMenuItem index="Inpainting" :icon-one="BrushFilled"   :icon-two="PictureFilled" :isMobile="isMobile" />
    </el-menu>
    <div class="form">
        <el-form
            label-position="left"
            label-width="140px"
            :model="store"
            class="container"
            :rules="rules"
            @submit.prevent
        >
            <div class="sidebar">
                <el-collapse v-model="uiStore.activeCollapse">
                    <el-collapse-item title="Generation Options" name="2">
                        <form-input label="Prompt" prop="prompt" v-model="store.prompt" autosize resize="vertical" type="textarea" placeholder="Enter prompt here" />
                        <form-input
                            label="Negative Prompt"
                            prop="negativePrompt"
                            v-model="store.negativePrompt"
                            autosize
                            resize="vertical"
                            type="textarea"
                            placeholder="Enter negative prompt here"
                            info="What to exclude from the image. Not working? Try increasing the guidance."
                        />
                        <form-input  label="Seed"        prop="seed"      v-model="store.params.seed" placeholder="Enter seed here" />
                        <form-select label="Sampler"     prop="sampler"   v-model="store.params.sampler_name" :options="samplerList" info="k_heun and k_dpm_2 double generation time and kudos cost, but converge twice as fast." />
                        <form-slider label="Batch Size"  prop="batchSize" v-model="store.params.n"            :min="minImages"     :max="maxImages" />
                        <form-slider label="Steps"       prop="steps"     v-model="store.params.steps"        :min="minSteps"      :max="maxSteps" info="Keep step count between 30 to 50 for optimal generation times. Coherence typically peaks between 60 and 90 steps, with a trade-off in speed." />
                        <form-slider label="Width"       prop="width"     v-model="store.params.width"        :min="minDimensions" :max="maxDimensions" :step="64" :change="onDimensionsChange" />
                        <form-slider label="Height"      prop="height"    v-model="store.params.height"       :min="minDimensions" :max="maxDimensions" :step="64" :change="onDimensionsChange" />
                        <form-slider label="Guidance"    prop="cfgScale"  v-model="store.params.cfg_scale"    :min="minCfgScale"   :max="maxCfgScale" info="Higher values will make the AI respect your prompt more. Lower values allow the AI to be more creative." />
                        <form-select label="Model"       prop="model"     v-model="store.selectedModel"       :options="store.filteredAvailableModels" :info="`Model Description: ${store.modelDescription}`" />
                        <!--<form-select label="Upscalers"   prop="upscalers" v-model="store.upscalers"           :options="upscalers" multiple />-->
                        <form-radio  label="Karras"      prop="karras"    v-model="setKarras"                 :options="['Enabled', 'Disabled']" info="Improves image generation while requiring fewer steps. Mostly magic!" />
                        <form-radio  label="NSFW"        prop="nsfw"      v-model="store.nsfw"                :options="['Enabled', 'Disabled', 'Censored']" />
                        <form-radio  label="Worker Type" prop="trusted"   v-model="store.trustedOnly"         :options="['All Workers', 'Trusted Only']" />
                    </el-collapse-item>
                </el-collapse>
            </div>
            <div class="main">
                <el-button @click="store.resetStore()">Reset</el-button>
                <el-button
                    v-if="!store.generating"
                    type="primary"
                    style="width: 80%;"
                    @click="store.generateImage(store.generatorType)"
                > Generate ({{optionsStore.allowLargerParams === 'Enabled' ? store.canGenerate ? '✅ ' : '❌ ' : ''}}{{store.kudosCost.toFixed(2)}} kudos{{store.canGenerate ? '' : ' required'}})
                </el-button>
                <el-button
                    v-if="store.generating"
                    type="danger"
                    style="width: 80%"
                    :disabled="store.cancelled"
                    @click="store.cancelled = true"
                > Cancel
                </el-button>
            </div>
            <div class="image center-horizontal">
                <el-card class="center-both generated-image">
                    <CustomCanvas v-if="/Inpainting/.test(store.generatorType) && !store.generating && store.images.length == 0" />
                    <CustomCanvas v-if="/Img2Img/.test(store.generatorType) && !store.generating && store.images.length == 0" />
                    <image-progress />
                    <generated-carousel />
                </el-card>
            </div>
        </el-form>
    </div>
</template>

<style>
:root {
    --sidebar-width: 70px
}

.generator-types {
    position: absolute;
    height: 100vh;
    top: 60px;
}

.mobile-generator-types {
    width: 100%
}

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
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}

.el-collapse, .sidebar-container {
    width: 100%
}

.form {
    padding-left: 20px;
    margin-left: var(--sidebar-width);
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
    grid-template-rows: 40px 95%;
    grid-template-areas: 
        "sidebar main"
        "sidebar image";
}

@media only screen and (max-width: 1280px) {
    .generated-image > .el-card__body {
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    
    .generated-image {
        width: 80%;
        height: 100%;
    }

    .container {
        display: grid;
        height: 110vh;
        grid-template-rows: 45vh 40px 60%;
        grid-template-columns: 100%;
        gap: 10px;
        grid-template-areas: 
            "image"
            "main"
            "sidebar";
    }

    .sidebar {
        max-width: 100%;
    }
}

@media only screen and (max-width: 768px) {
    .generated-image {
        width: 100%;
        height: 100%;
    }

    .container {
        grid-template-rows: 50vh 40px 60%;
    }

    .form {
        padding-top: 20px;
        padding-left: 0;
        margin-left: 0;
    }
}

</style>