<script setup lang="ts">
import { computed, onUnmounted, reactive, ref } from 'vue';
import { useGeneratorStore } from '@/stores/generator';
import {
    type FormRules,
    ElCollapse,
    ElCollapseItem,
    ElForm,
    ElButton,
    ElCard,
    ElMenu,
    vLoading,
    ElLoading,
    ElTooltip,
    ElUpload,
    ElIcon,
    ElCheckbox,
    ElCheckboxGroup,
    ElImage,
    type UploadFile,
    type UploadRawFile,
} from 'element-plus';
import {
    Comment,
    PictureFilled,
    MagicStick,
    UploadFilled,
    Refresh,
} from '@element-plus/icons-vue';
import ImageProgress from '../components/ImageProgress.vue';
import FormSlider from '../components/FormSlider.vue';
import FormSelect from '../components/FormSelect.vue';
import FormRadio from '../components/FormRadio.vue';
import FormInput from '../components/FormInput.vue';
import FormModelSelect from '../components/FormModelSelect.vue';
import FormPromptInput from '../components/FormPromptInput.vue';
import GeneratedCarousel from '../components/GeneratedCarousel.vue'
import CustomCanvas from '../components/CustomCanvas.vue';
import GeneratorMenuItem from '../components/GeneratorMenuItem.vue';
import DialogList from '../components/DialogList.vue';
import BrushFilled from '../components/icons/BrushFilled.vue';
import StarEdit24Regular from '../components/icons/StarEdit24Regular.vue';
import ImageSearch from '../components/icons/ImageSearch.vue';
import RatingView from '../components/RatingView.vue';
import BaseLink from '../components/BaseLink.vue';
import { useUIStore } from '@/stores/ui';
import { useCanvasStore } from '@/stores/canvas';
import { useOptionsStore } from '@/stores/options';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import handleUrlParams from "@/router/handleUrlParams";
import { useRatingStore } from '@/stores/rating';
import { useInterrogationStore } from '@/stores/interrogation';
import { convertToBase64 } from '@/utils/base64';

const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.smallerOrEqual('md');

const store = useGeneratorStore();
const uiStore = useUIStore();
const canvasStore = useCanvasStore();
const optionsStore = useOptionsStore();
const ratingStore = useRatingStore();
const interrogationStore = useInterrogationStore();

const samplerListLite = ["k_lms", "k_heun", "k_euler", "k_euler_a", "k_dpm_2", "k_dpm_2_a"]
const dpmSamplers = ['k_dpm_fast', 'k_dpm_adaptive', 'k_dpmpp_2m', 'k_dpmpp_2s_a', 'k_dpmpp_sde']

function updateCurrentSampler(newSamplers: string[]) {
    if (!store.params) return newSamplers;
    if (!store.params.sampler_name) return newSamplers;
    if (newSamplers.indexOf(store.params.sampler_name) === -1) {
        store.params.sampler_name = newSamplers[0] as any;
    }
    return newSamplers;
}

const availableSamplers = computed(() => {
    if (store.selectedModel === "stable_diffusion_2.0") return updateCurrentSampler(["dpmsolver"])
    if (store.generatorType === 'Text2Img') return updateCurrentSampler([...samplerListLite, ...dpmSamplers]);
    return updateCurrentSampler(samplerListLite);
})

function disableBadge() {
    if (!store.validGeneratorTypes.includes(store.generatorType)) uiStore.showGeneratorBadge = false;
}

function onMenuChange(key: any) {
    store.generatorType = key;
    disableBadge();
    console.log(key)
}

function onDimensionsChange() {
    canvasStore.showCropPreview = true;
    canvasStore.updateCropPreview();
}

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
});
const negativePromptLibrary = ref(false);
const dots = ref("...");

const ellipsis = setInterval(() => dots.value = dots.value.length >= 3 ? "" : ".".repeat(dots.value.length+1), 1000);

onUnmounted(() => {
    clearInterval(ellipsis);
})

disableBadge();
handleUrlParams();

const upload = ref();

async function handleChange(uploadFile: UploadFile) {
    upload.value!.clearFiles();
    if (!(uploadFile.raw as UploadRawFile).type.includes("image")) {
        uiStore.raiseError("Uploaded file needs to be a image!", false);
        return;
    }
    const base64File = await convertToBase64(uploadFile.raw as UploadRawFile) as string;
    interrogationStore.currentInterrogation.source_image = base64File;
    interrogationStore.interrogateImage();
}

function getFormStatus(form: string) {
    return (interrogationStore.currentInterrogation?.status?.forms || []).filter(el => el.form === form)[0];
}
</script>

<template>
    <el-menu
        :default-active="store.generatorType"
        :collapse="true"
        @select="onMenuChange"
        :mode="isMobile ? 'horizontal' : 'vertical'"
        :class="isMobile ? 'mobile-generator-types' : 'generator-types'"
        :style="isMobile ? 'overflow-x: auto' : ''"
    >
        <GeneratorMenuItem index="Text2Img"      :icon-one="Comment"             :icon-two="PictureFilled" :isMobile="isMobile" />
        <GeneratorMenuItem index="Img2Img"       :icon-one="PictureFilled"       :icon-two="PictureFilled" :isMobile="isMobile" />
        <GeneratorMenuItem index="Inpainting"    :icon-one="BrushFilled"         :icon-two="PictureFilled" :isMobile="isMobile" />
        <GeneratorMenuItem index="Rating"        :icon-one="StarEdit24Regular"   :isMobile="isMobile" />
        <GeneratorMenuItem index="Interrogation" :icon-one="ImageSearch"         :isMobile="isMobile" />
    </el-menu>
    <div class="form">
        <div v-if="store.generatorType === 'Rating'" style="padding-bottom: 50px;">
            <h1 style="margin: 0">Image Rating</h1>
            <div>Rate images based on aesthetics to gain kudos and help <BaseLink href="https://laion.ai/">LAION</BaseLink> - the non-profit who helped train Stable Diffusion - improve their datasets!</div>
            <div v-if="optionsStore.apiKey === '0000000000' || optionsStore.apiKey === ''">You have rated a total of <strong>{{ ratingStore.imagesRated }}</strong> images! <BaseLink router href="/options">Sign in</BaseLink> using your API key to start earning kudos.</div>
            <div v-else>From rating a total of <strong>{{ ratingStore.imagesRated }}</strong> images, you have gained <strong>{{ ratingStore.kudosEarned }}</strong> kudos!</div>
            <el-button
                @click="() => ratingStore.updateRatingInfo()"
                v-if="!ratingStore.currentRatingInfo.id"
                :disabled="ratingStore.submitted"
                style="margin-top: 10px"
                size="large"
            >{{ ratingStore.submitted ? "Loading image..." : "Start rating!"}}</el-button>
            <RatingView
                :id="ratingStore.currentRatingInfo.id || ''"
                :image-source="ratingStore.currentRatingInfo.url || ''"
                :submitted="ratingStore.submitted"
                @onRatingSubmit="ratingStore.submitRating"
            />
        </div>
        <div v-else-if="store.generatorType === 'Interrogation'" style="padding-bottom: 50px;">
            <h1 style="margin: 0">Interrogation</h1>
            <div>Interrogate images to get their predicted descriptions, tags, and NSFW status.</div>
            <el-checkbox-group
                v-model="interrogationStore.selectedForms"
                style="display: inline-flex; flex-direction: column;"
            >
                <el-checkbox v-for="form in interrogationStore.possibleForms" :key="form" :label="form">
                    {{ form }}
                    <span style="color: var(--el-color-danger)">{{ form === "interrogation" ? " (warning: may not fulfill)" : "" }}</span>
                </el-checkbox>
            </el-checkbox-group>
            <div v-if="!interrogationStore.currentInterrogation.source_image" style="margin-top: 16px">
                <strong v-if="interrogationStore.selectedForms.length === 0" style="color: var(--el-color-danger)">Choose an interrogation option to proceed!</strong>
                <div :style="interrogationStore.selectedForms.length === 0 ? {
                    pointerEvents: 'none',
                    opacity: 0.5,
                } : ''">
                    <el-upload
                        drag
                        ref="upload"
                        :auto-upload="false"
                        @change="handleChange"
                        :limit="1"
                        multiple
                        style="max-width: 720px"
                        :disabled="interrogationStore.selectedForms.length === 0"
                    >
                        <el-icon :size="100"><upload-filled /></el-icon>
                        <div>Drop file here OR <em>click to upload</em></div>
                    </el-upload>
                </div>
            </div>
            <div v-else-if="!interrogationStore.currentInterrogation.status" style="margin-top: 16px">
                <strong>Uploading image{{dots}}</strong>
            </div>
            <div v-else>
                <div style="margin-top: 8px">
                    <el-button
                        :icon="Refresh"
                        @click="() => {
                            interrogationStore.currentInterrogation = {};
                            interrogationStore.interrogating = false;
                        }"
                    >New Interrogation</el-button>
                </div>
                <h2 style="margin: 16px 0 8px 0">Interrogation Results</h2>
                <el-image
                    :src="interrogationStore.currentInterrogation.source_image"
                    alt="Uploaded Image"
                />
                <div v-if="getFormStatus('nsfw')">
                    <h3 style="margin-bottom: 0">NSFW</h3>
                    <div v-if="getFormStatus('nsfw').state === 'processing'">Processing{{dots}}</div>
                    <div v-else>This image is predicted to be <strong>{{ (getFormStatus('nsfw').result as any).nsfw ? "not safe for work" : "safe for work" }}</strong>.</div>
                </div>
                <div v-if="getFormStatus('caption')">
                    <h3 style="margin-bottom: 0">Caption</h3>
                    <div v-if="getFormStatus('caption').state === 'processing'">Processing{{dots}}</div>
                    <div v-else><strong>{{ (getFormStatus('caption').result as any).caption }}</strong></div>
                </div>
                <div v-if="getFormStatus('interrogation')">
                    <h3 style="margin-bottom: 0">Interrogation</h3>
                    <div
                        v-if="getFormStatus('interrogation').state === 'processing' && (interrogationStore.currentInterrogation.elapsed_seconds || 0) > 300"
                        style="color: var(--el-color-danger)"
                    >
                        <strong>Interrogation is taking longer than expected and may not fulfill.</strong>
                    </div>
                    <div v-if="getFormStatus('interrogation').state === 'processing'">Processing{{dots}}</div>
                    <div v-else>
                        <div v-for="[subject, tags] in (Object.entries(getFormStatus('interrogation').result as any) as any[])" :key="subject">
                            <strong>{{ subject }}</strong>
                            <div v-for="tag in tags" :key="tag.text" style="margin-left: 8px">
                                {{ tag.text }} - <strong>{{ tag.confidence.toFixed(2) }}%</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <el-form
            label-position="left"
            label-width="140px"
            :model="store"
            class="container"
            :rules="rules"
            @submit.prevent
            v-else
        >
            <div class="sidebar">
                <el-collapse v-model="uiStore.activeCollapse">
                    <el-collapse-item title="Generation Options" name="2">
                        <form-prompt-input />
                        <form-input
                            label="Negative Prompt"
                            prop="negativePrompt"
                            v-model="store.negativePrompt"
                            autosize
                            resize="vertical"
                            type="textarea"
                            placeholder="Enter negative prompt here"
                            info="What to exclude from the image. Not working? Try increasing the guidance."
                            label-position="top"
                        >
                            <template #inline>
                                <el-button class="small-btn" style="margin-top: 2px" @click="store.pushToNegativeLibrary(store.negativePrompt)" text>Save preset</el-button>
                                <el-button class="small-btn" style="margin-top: 2px" @click="() => negativePromptLibrary = true" text>Load preset</el-button>
                            </template>
                        </form-input>
                        <form-input label="Seed" prop="seed" v-model="store.params.seed" placeholder="Enter seed here">
                            <template #append>
                                <el-tooltip content="Randomize!" placement="top">
                                    <el-button :icon="MagicStick" @click="() => store.params.seed = Math.abs((Math.random() * 2 ** 32) | 0).toString()" />
                                </el-tooltip>
                            </template>
                        </form-input>
                        <form-select label="Sampler"         prop="sampler"        v-model="store.params.sampler_name"   :options="availableSamplers"   info="k_heun and k_dpm_2 double generation time and kudos cost, but converge twice as fast." />
                        <form-slider label="Batch Size"      prop="batchSize"      v-model="store.params.n"                  :min="store.minImages"     :max="store.maxImages" />
                        <form-slider label="Steps"           prop="steps"          v-model="store.params.steps"              :min="store.minSteps"      :max="store.maxSteps"      info="Keep step count between 30 to 50 for optimal generation times. Coherence typically peaks between 60 and 90 steps, with a trade-off in speed." />
                        <form-slider label="Width"           prop="width"          v-model="store.params.width"              :min="store.minDimensions" :max="store.maxDimensions" :step="64"   :change="onDimensionsChange" />
                        <form-slider label="Height"          prop="height"         v-model="store.params.height"             :min="store.minDimensions" :max="store.maxDimensions" :step="64"   :change="onDimensionsChange" />
                        <form-slider label="Guidance"        prop="cfgScale"       v-model="store.params.cfg_scale"          :min="store.minCfgScale"   :max="store.maxCfgScale"   :step="0.5"  info="Higher values will make the AI respect your prompt more. Lower values allow the AI to be more creative." />
                        <form-slider label="CLIP Skip"       prop="clipSkip"       v-model="store.params.clip_skip"          :min="store.minClipSkip"   :max="store.maxClipSkip"   info="Last layers of CLIP to ignore. For most situations this can be left alone. This may produce better results - for example, Anything Diffusion and CLIP skip 2 pairs well." />
                        <form-slider label="Init Strength"   prop="denoise"        v-model="store.params.denoising_strength" :min="store.minDenoise"    :max="store.maxDenoise"    :step="0.01" info="The final image will diverge from the starting image at higher values." v-if="store.generatorType !== 'Text2Img'" />
                        <form-select label="Control Type"    prop="controlType"    v-model="store.controlType"               :options="store.availableControlTypes"                info="Helps to keep image composition." v-if="store.generatorType !== 'Text2Img'" />
                        <form-model-select />
                        <form-select label="Post-processors" prop="postProcessors" v-model="store.postProcessors"   :options="store.availablePostProcessors" info="GPFGAN: Improves faces   RealESRGAN_x4plus: Upscales by 4x   CodeFormers: Improves faces" multiple />
                        <form-radio  label="Multi-model select" prop="multiModel"  v-model="store.multiModelSelect" :options="['Enabled', 'Disabled']" />
                        <form-radio  label="Hi-res fix"      prop="hiresFix"       v-model="store.params.hires_fix" :options="['Enabled', 'Disabled']" use-boolean info="May make high resolution images more coherent." v-if="store.generatorType === 'Text2Img'" />
                        <form-radio  label="Tiling"          prop="tiling"         v-model="store.params.tiling"    :options="['Enabled', 'Disabled']" use-boolean info="Creates seamless textures! You can test your resulting images here: https://www.pycheung.com/checker/" />
                        <form-radio  label="Karras"          prop="karras"         v-model="store.params.karras"    :options="['Enabled', 'Disabled']" use-boolean info="Improves image generation while requiring fewer steps. Mostly magic!" />
                        <form-radio  label="NSFW"            prop="nsfw"           v-model="store.nsfw"             :options="['Enabled', 'Disabled', 'Censored']" />
                        <form-radio  label="Worker Type"     prop="trusted"        v-model="store.trustedOnly"      :options="['All Workers', 'Trusted Only']" />
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
                >
                    Generate 
                    (<span>
                        <span v-if="optionsStore.apiKey !== '0000000000' && optionsStore.apiKey !== ''">
                            {{ optionsStore.allowLargerParams === 'Enabled' ? store.canGenerate ? '✅ ' : '❌ ' : '' }}
                            {{ store.kudosCost.toFixed(2) }} kudos{{ store.canGenerate ? '' : ' required' }}
                            for
                        </span>
                        {{ store.totalImageCount }} image{{ store.totalImageCount === 1 ? "" : "s" }}
                    </span>)
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
                <el-card
                    class="center-both generated-image"
                    v-loading="store.generating && uiStore.progress === 0 ? {
                        text: `Waiting for request(s) to upload${dots}${'&nbsp;'.repeat(3 - dots.length)}`,
                        background: 'rgba(0, 0, 0, 0.5)'
                    } : false"
                >
                    <div v-if="!store.generating && store.images.length == 0">
                        <CustomCanvas v-if="/Inpainting/.test(store.generatorType)" />
                        <CustomCanvas v-if="/Img2Img/.test(store.generatorType)" />
                    </div>
                    <image-progress v-if="!uiStore.showGeneratedImages" />
                    <generated-carousel v-if="uiStore.showGeneratedImages && store.images.length !== 0" />
                </el-card>
            </div>
        </el-form>
    </div>
    <DialogList
        v-model="negativePromptLibrary"
        title="Negative Prompts"
        :list="store.negativePromptLibrary"
        empty-description="No negative prompts found"
        search-empty-description="Found no matching negative prompt(s) from your search."
        search-text="Search by prompt"
        deleteText="Delete preset"
        useText="Use preset"
        @use="negPrompt => store.negativePrompt = negPrompt"
        @delete="store.removeFromNegativeLibrary"
    />
</template>

<style>
:root {
    --sidebar-width: 70px
}

.small-btn {
    padding: 6px 8px;
    height: unset;
}

.generator-types {
    position: fixed;
    height: calc(100vh - 67px);
    top: 67px;
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
        grid-template-rows: minmax(400px, 45vh) 40px 60%;
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
        grid-template-rows: minmax(400px, 50vh) 40px 60%;
    }

    .form {
        padding-top: 20px;
        padding-left: 0;
        margin-left: 0;
    }
}

</style>
