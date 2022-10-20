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
    ElButton,
    ElCard,
    ElUpload,
    ElIcon,
    ElTooltip,
    type UploadProps,
    type UploadRawFile,
    type UploadInstance,
    genFileId,
    ElMenu,
    ElMenuItem
} from 'element-plus';
import {
    Plus,
    Comment,
    PictureFilled
} from '@element-plus/icons-vue';
import ImageProgress from '../components/ImageProgress.vue';
import FormSlider from '../components/FormSlider.vue';
import FormSelect from '../components/FormSelect.vue';
import FormRadio from '../components/FormRadio.vue';
import GeneratedCarousel from '../components/GeneratedCarousel.vue'
import StackedIcon from '../components/StackedIcon.vue';
import { useUIStore } from '@/stores/ui';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';

const breakpoints = useBreakpoints(breakpointsTailwind);

const isMobile = breakpoints.smallerOrEqual('md');

const store = useGeneratorStore();
const uiStore = useUIStore();
const samplerList = ["k_lms", "k_heun", "k_euler", "k_euler_a", "k_dpm_2", "k_dpm_2_a", "DDIM", "PLMS"];
const minDimensions = 64;
const maxDimensions = 1024;
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

const upscalers = ['GFPGAN', 'Real ESRGAN', 'LDSR']

const upload = ref<UploadInstance>()

const handleExceed: UploadProps['onExceed'] = (files) => {
    upload.value!.clearFiles()
    const file = files[0] as UploadRawFile
    file.uid = genFileId()
    upload.value!.handleStart(file)
}

const handleChange = async (uploadFile: any) => {
    if (!uploadFile.raw.type.includes("image")) {
        uiStore.raiseError("Uploaded file needs to be a image!");
        upload.value!.clearFiles();
    }
    const base64File: string = await getBase64(uploadFile.raw) as string;
    store.sourceImage = base64File.split(",")[1];
    const img = new Image();
    img.onload = function() {
        store.uploadDimensions = `${(this as any).naturalWidth}x${(this as any).naturalHeight}`;
    }
    img.src = base64File;
}

function getBase64(file: File) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

function onMenuChange(key: any) {
    store.generatorType = key;
    console.log(key)
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
        <el-tooltip content="Text2Img" :placement="isMobile ? 'bottom' : 'right'" :enterable="false" :hide-after="100">
            <el-menu-item index="Text2Img">
                <StackedIcon :iconOne="Comment" :iconTwo="PictureFilled" :size="40" />
            </el-menu-item>
        </el-tooltip>
        <el-tooltip content="Img2Img" :placement="isMobile ? 'bottom' : 'right'" :enterable="false" :hide-after="100">
            <el-menu-item index="Img2Img">
                <StackedIcon :iconOne="PictureFilled" :iconTwo="PictureFilled" :size="40" />
            </el-menu-item>
        </el-tooltip>
    </el-menu>
    <div class="form">
        <el-form
            label-position="left"
            label-width="125px"
            :model="store"
            class="container"
            :rules="rules"
            @submit.prevent
        >
            <div class="sidebar">
                <el-collapse v-model="uiStore.activeCollapse">
                    <el-collapse-item title="Image Options" name="1" v-if="store.generatorType === 'Img2Img'">
                        <form-slider label="Denoising" prop="denoise" v-model="store.params.denoising_strength" :min="0.1" :max="1" :step="0.01" />
                        <el-form-item label="Image" prop="image">
                            <el-upload
                                action="#"
                                ref="upload"
                                list-type="picture-card"
                                :on-exceed="handleExceed"
                                :on-change="handleChange"
                                :auto-upload="false"
                                :file-list="store.fileList"
                                :limit="1"
                            >
                                <el-icon><Plus /></el-icon>
                                <template #file="{ file }">
                                <div>
                                    <img class="el-upload-list__item-thumbnail" :src="file.url" alt="" />
                                </div>
                                </template>
                            </el-upload>
                        </el-form-item>
                        <div>Image dimensions: {{store.uploadDimensions}}</div>
                    </el-collapse-item>
                    <el-collapse-item title="Generation Options" name="2">
                        <el-form-item label="Prompt" prop="prompt">
                            <el-input
                                v-model="store.prompt"
                                autosize
                                clearable
                                resize="x"
                                type="textarea"
                                placeholder="Enter prompt here" 
                            />
                        </el-form-item>
                        <el-form-item label="Negative Prompt" prop="negativePrompt">
                            <el-input
                                v-model="store.negativePrompt"
                                autosize
                                clearable
                                resize="x"
                                type="textarea"
                                placeholder="Enter negative prompt here" 
                            />
                        </el-form-item>
                        <el-form-item label="Seed" prop="seed">
                            <el-input v-model="store.params.seed" placeholder="Enter seed here" />
                        </el-form-item>
                        <form-select label="Sampler"      prop="sampler"   v-model="store.params.sampler_name"  :options="samplerList" :multiple="false" />
                        <form-slider label="Batch Size"   prop="batchSize" v-model="store.params.n"             :min="minImages"     :max="maxImages" />
                        <form-slider label="Steps"        prop="steps"     v-model="store.params.steps"         :min="minSteps"      :max="maxSteps" />
                        <form-slider label="Width"        prop="width"     v-model="store.params.width"         :min="minDimensions" :max="maxDimensions" :step="64" />
                        <form-slider label="Height"       prop="height"    v-model="store.params.height"        :min="minDimensions" :max="maxDimensions" :step="64" />
                        <form-slider label="Guidance"     prop="cfgScale"  v-model="store.params.cfg_scale"     :min="minCfgScale"   :max="maxCfgScale" />
                        <form-select label="Model"        prop="model"     v-model="store.selectedModel"        :options="store.availableModels" :multiple="false" />
                        <form-select label="Upscalers"    prop="upscalers" v-model="store.upscalers"            :options="upscalers"             :multiple="true" />
                        <form-radio  label="NSFW"         prop="nsfw"      v-model="store.nsfw"                 :options="['Enabled', 'Disabled', 'Censored']" :disabled="false"/>
                        <form-radio  label="Worker Type"  prop="trusted"   v-model="store.trustedOnly"          :options="['All Workers', 'Trusted Only']" :disabled="false"/>
                    </el-collapse-item>
                </el-collapse>
            </div>
            <div class="main">
                <el-button @click="store.resetStore()">Reset</el-button>
                <el-button
                    v-if="uiStore.progress === 0"
                    type="primary"
                    style="width: 80%"
                    :disabled="uiStore.progress != 0"
                    @click="store.generateImage(store.generatorType === 'Img2Img')"
                > Generate
                </el-button>
                <el-button
                    v-if="uiStore.progress !== 0"
                    type="danger"
                    style="width: 80%"
                    :disabled="store.cancelled"
                    @click="store.cancelled = true"
                > Cancel
                </el-button>
            </div>
            <div class="image center-horizontal">
                <el-card class="center-both generated-image">
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
    display: flex;
    justify-content: center;
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
        width: 100%;
        height: 100%;
    }

    .container {
        display: grid;
        height: 110vh;
        grid-template-rows: 40px 55vw 60%;
        grid-template-columns: 100%;
        grid-template-areas: 
            "main"
            "image"
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

    .form {
        padding-top: 20px;
        padding-left: 0;
        margin-left: 0;
    }
}

</style>