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
    type UploadFile,
} from 'element-plus';
import { Plus } from '@element-plus/icons-vue'
import ImageProgress from '../components/ImageProgress.vue';
import FormSlider from '../components/FormSlider.vue';
import FormSelect from '../components/FormSelect.vue';
import FormRadio from '../components/FormRadio.vue';
import GeneratedCarousel from '../components/GeneratedCarousel.vue'
import { useUIStore } from '@/stores/ui';
import { useUserStore } from '@/stores/user';

const store = useGeneratorStore();
const uiStore = useUIStore();
const userStore = useUserStore();
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
}

function getBase64(file: File) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}
</script>

<template>
    <el-form
        label-position="left"
        label-width="100px"
        :model="store"
        class="container"
        :rules="rules"
        @submit.prevent
    >
        <div class="sidebar">
            <el-collapse v-model="uiStore.activeCollapse">
                <el-collapse-item title="Generation Type" name="1">
                    <el-tooltip
                        content="You need to be logged in with an API key and also be trusted."
                        placement="bottom"
                        v-if="!userStore.user.trusted"
                    >
                        <form-radio style="width: 400px" label="Type" prop="type" :disabled="true" v-model="store.generatorType" :options="['Text2Img', 'Img2Img']"/>
                    </el-tooltip>
                    <form-radio v-else label="Type" prop="type" :disabled="false" v-model="store.generatorType" :options="['Text2Img', 'Img2Img']"/>
                    <el-upload
                        action="#"
                        ref="upload"
                        list-type="picture-card"
                        :on-exceed="handleExceed"
                        :on-change="handleChange"
                        :auto-upload="false"
                        :file-list="store.fileList"
                        :limit="1"
                        v-if="store.generatorType === 'Img2Img'"
                    >
                        <el-icon><Plus /></el-icon>
                        <template #file="{ file }">
                        <div>
                            <img class="el-upload-list__item-thumbnail" :src="file.url" alt="" />
                        </div>
                        </template>
                    </el-upload>
                </el-collapse-item>
                <el-collapse-item title="Generation Options" name="2">
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
                    <form-select label="Sampler"      prop="sampler"   v-model="store.params.sampler_name"  :options="samplerList" :multiple="false" />
                    <form-slider label="Batch Size"   prop="batchSize" v-model="store.params.n"             :min="minImages"     :max="maxImages" />
                    <form-slider label="Steps"        prop="steps"     v-model="store.params.steps"         :min="minSteps"      :max="maxSteps" />
                    <form-slider label="Width"        prop="width"     v-model="store.params.width"         :min="minDimensions" :max="maxDimensions" :step="64" />
                    <form-slider label="Height"       prop="height"    v-model="store.params.height"        :min="minDimensions" :max="maxDimensions" :step="64" />
                    <form-slider label="Guidance"     prop="cfgScale"  v-model="store.params.cfg_scale"     :min="minCfgScale"   :max="maxCfgScale" />
                    <form-slider label="Denoising"    prop="denoise"   v-model="store.params.denoising_strength" :min="0.1" :max="1" :step="0.01" />
                    <form-select label="Upscalers"    prop="upscalers" v-model="store.upscalers"            :options="upscalers"   :multiple="true" />
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

@media only screen and (max-width: 1000px) {
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

@media only screen and (max-width: 700px) {
    .generated-image {
        width: 100%;
        height: 100%;
    }
}

</style>