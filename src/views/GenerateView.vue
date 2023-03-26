<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
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
    ElRow,
    ElCol
} from 'element-plus';
import {
    Comment,
    PictureFilled,
    MagicStick,
} from '@element-plus/icons-vue';
import ImageProgress from '../components/ImageProgress.vue';
import FormSlider from '../components/FormSlider.vue';
import FormSelect from '../components/FormSelect.vue';
import FormInput from '../components/FormInput.vue';
import FormSwitch from '../components/FormSwitch.vue';
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
import InterrogationView from '@/components/InterrogationView.vue';
import { useEllipsis } from '@/utils/useEllipsis';

const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.smallerOrEqual('md');

const store = useGeneratorStore();
const uiStore = useUIStore();
const canvasStore = useCanvasStore();
const optionsStore = useOptionsStore();
const ratingStore = useRatingStore();
const { ellipsis } = useEllipsis();

const negativePromptLibrary = ref(false);

const samplerListLite = ["k_lms", "k_heun", "k_euler", "k_euler_a", "k_dpm_2", "k_dpm_2_a"]
const dpmSamplers = ['k_dpm_fast', 'k_dpm_adaptive', 'k_dpmpp_2m', 'k_dpmpp_2s_a', 'k_dpmpp_sde']

const availableSamplers = computed(() => {
    if (store.selectedModel === "stable_diffusion_2.0") return updateCurrentSampler(["dpmsolver"])
    if (store.generatorType === 'Text2Img') return updateCurrentSampler([...samplerListLite, ...dpmSamplers]);
    return updateCurrentSampler(samplerListLite);
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
});

function updateCurrentSampler(newSamplers: string[]) {
    if (!store.params) return newSamplers;
    if (!store.params.sampler_name) return newSamplers;
    if (newSamplers.indexOf(store.params.sampler_name) === -1) {
        store.params.sampler_name = newSamplers[0] as any;
    }
    return newSamplers;
}

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

const availablePostProcessors = computed(() => {
    const upscalersDisabled = 
        store.postProcessors.includes("RealESRGAN_x4plus_anime_6B") ||
        store.postProcessors.includes("RealESRGAN_x4plus") ||
        store.postProcessors.includes("NMKD_Siax") ||
        store.postProcessors.includes("4x_AnimeSharp");

    const upscalerDisabled = (name: string) => !store.postProcessors.includes(name as any) && upscalersDisabled;

    return [
        "GFPGAN",
        "CodeFormers",
        { label: "RealESRGAN_x4plus", value: "RealESRGAN_x4plus", disabled: upscalerDisabled("RealESRGAN_x4plus") }, 
        { label: "RealESRGAN_x4plus_anime_6B", value: "RealESRGAN_x4plus_anime_6B", disabled: upscalerDisabled("RealESRGAN_x4plus_anime_6B") },
        { label: "NMKD_Siax", value: "NMKD_Siax", disabled: upscalerDisabled("NMKD_Siax") },
        { label: "4x_AnimeSharp", value: "4x_AnimeSharp", disabled: upscalerDisabled("4x_AnimeSharp") },
        "strip_background"
    ]
})

disableBadge();
handleUrlParams();
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
            <InterrogationView />
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
                <el-collapse v-model="uiStore.activeCollapse" style="margin-bottom: 24px">
                    <el-collapse-item title="Generation Options" name="1">
                        <form-prompt-input />
                        <form-input
                            label="Negative Prompt"
                            prop="negativePrompt"
                            v-model="store.negativePrompt"
                            :autosize="{ maxRows: 15 }"
                            resize="vertical"
                            type="textarea"
                            placeholder="Enter negative prompt here"
                            info="What to exclude from the image. Not working? Try increasing the guidance."
                            label-position="top"
                        >
                            <template #inline>
                                <el-button class="small-btn" style="margin-top: 2px" @click="() => store.pushToNegativeLibrary(store.negativePrompt)" text>Save preset</el-button>
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
                        <form-select label="Sampler(s)"      prop="samplers"      v-model="store.multiSelect.sampler.selected"  :options="availableSamplers"  info="Multi-select enabled. k_heun and k_dpm_2 double generation time and kudos cost, but converge twice as fast." multiple v-if="store.multiSelect.sampler.enabled" />
                        <form-select label="Sampler"         prop="sampler"       v-model="store.params.sampler_name"           :options="availableSamplers"  info="k_heun and k_dpm_2 double generation time and kudos cost, but converge twice as fast." v-else />
                        <form-slider label="Batch Size"      prop="batchSize"     v-model="store.params.n"                      :min="store.minImages"        :max="store.maxImages" />
                        <form-slider label="Steps(s)"        prop="multiSteps"    v-model="store.multiSelect.steps.selected"    :min="store.minSteps"         :max="store.maxSteps"      info="Multi-select enabled. Keep step count between 30 to 50 for optimal generation times. Coherence typically peaks between 60 and 90 steps, with a trade-off in speed." multiple v-if="store.multiSelect.steps.enabled" />
                        <form-slider label="Steps"           prop="steps"         v-model="store.params.steps"                  :min="store.minSteps"         :max="store.maxSteps"      info="Keep step count between 30 to 50 for optimal generation times. Coherence typically peaks between 60 and 90 steps, with a trade-off in speed." v-else />
                        <form-slider label="Width"           prop="width"         v-model="store.params.width"                  :min="store.minDimensions"    :max="store.maxDimensions" :step="64"   :change="onDimensionsChange" />
                        <form-slider label="Height"          prop="height"        v-model="store.params.height"                 :min="store.minDimensions"    :max="store.maxDimensions" :step="64"   :change="onDimensionsChange" />
                        <form-slider label="Guidance(s)"     prop="cfgScales"     v-model="store.multiSelect.guidance.selected" :min="store.minCfgScale"      :max="store.maxCfgScale"   info="Multi-select enabled. Higher values will make the AI respect your prompt more. Lower values allow the AI to be more creative." multiple v-if="store.multiSelect.guidance.enabled" />
                        <form-slider label="Guidance"        prop="cfgScale"      v-model="store.params.cfg_scale"              :min="store.minCfgScale"      :max="store.maxCfgScale"   :step="0.5"  info="Higher values will make the AI respect your prompt more. Lower values allow the AI to be more creative." v-else />
                        <form-slider label="CLIP Skip(s)"    prop="clipSkips"     v-model="store.multiSelect.clipSkip.selected" :min="store.minClipSkip"      :max="store.maxClipSkip"   info="Multi-select enabled. Last layers of CLIP to ignore. For most situations this can be left alone. This may produce better results - for example, Anything Diffusion and CLIP skip 2 pairs well." multiple v-if="store.multiSelect.clipSkip.enabled" />
                        <form-slider label="CLIP Skip"       prop="clipSkip"      v-model="store.params.clip_skip"              :min="store.minClipSkip"      :max="store.maxClipSkip"   info="Last layers of CLIP to ignore. For most situations this can be left alone. This may produce better results - for example, Anything Diffusion and CLIP skip 2 pairs well." v-else />
                        <form-slider label="Init Strength"   prop="denoise"       v-model="store.params.denoising_strength"     :min="store.minDenoise"       :max="store.maxDenoise"    :step="0.01" info="The final image will diverge from the starting image at higher values." v-if="store.generatorType !== 'Text2Img'" />
                        <form-select label="Control Type(s)" prop="controlTypes"  v-model="store.multiSelect.controlType.selected" :options="store.availableControlTypes"                   info="Multi-select enabled. Greatly helps to keep image composition, but causes generations to be 3x slower and cost 3x as much kudos." multiple v-if="store.generatorType !== 'Text2Img' && store.multiSelect.controlType.enabled" />
                        <form-select label="Control Type"    prop="controlType"   v-model="store.controlType"                      :options="store.availableControlTypes"                   info="Greatly helps to keep image composition, but causes generations to be 3x slower and cost 3x as much kudos." v-if="store.generatorType !== 'Text2Img' && !store.multiSelect.controlType.enabled" />
                        <form-model-select />
                        <form-select label="Post-processors" prop="postProcess"   v-model="store.postProcessors"   :options="availablePostProcessors" info="GPFGAN: Improves faces   RealESRGAN_x4plus: Upscales by 4x   CodeFormers: Improves faces  RealESRGAN_x4plus_anime_6b: Upscales by 4x, tuned for anime     strip_background: Removes the background of an image" multiple />
                        <el-row>
                            <el-col :span="isMobile ? 24 : 12">
                                <form-switch label="Hi-res fix"       prop="hiresFix" v-model="store.params.hires_fix" info="May make high resolution images more coherent. Only works with Text2Img." :disabled="store.generatorType !== 'Text2Img' || store.multiSelect.hiResFix.enabled" />
                            </el-col>
                            <el-col :span="isMobile ? 24 : 12">
                                <form-switch label="Tiling"           prop="tiling"   v-model="store.params.tiling"    info="Creates seamless textures! You can test your resulting images here: https://www.pycheung.com/checker/" />
                            </el-col>
                            <el-col :span="isMobile ? 24 : 12">
                                <form-switch label="Karras"           prop="karras"   v-model="store.params.karras"    info="Improves image generation while requiring fewer steps. Mostly magic!" :disabled="store.multiSelect.karras.enabled" />
                            </el-col>
                            <el-col :span="isMobile ? 24 : 12">
                                <form-switch label="NSFW"             prop="nsfw"     v-model="store.nsfw"             info="Generated NSFW images will be censored if disabled." />
                            </el-col>
                            <el-col :span="isMobile ? 24 : 12">
                                <form-switch label="Trusted Workers"  prop="trusted"  v-model="store.trustedOnly"      info="Whether or not to allow only trusted workers to fulfill your requests." />
                            </el-col>
                            <el-col :span="isMobile ? 24 : 12">
                                <form-switch label="X/Y Plot"         prop="xyPlot"   v-model="store.xyPlot"          info="Generates an X/Y plot after generating - works with only two multi-select options. Note: will not be saved in the gallery." :disabled="Object.values(store.multiSelect).filter(el => el.enabled).length !== 2" />
                            </el-col>
                        </el-row>
                        <h3 style="margin: 16px 0 4px 0">Multi Select</h3>
                        <el-row>
                            <el-col :span="isMobile ? 24 : 12">
                                <form-switch label="Multi Model"      prop="multiModelSwitch"    v-model="store.multiSelect.model.enabled" />
                            </el-col>
                            <el-col :span="isMobile ? 24 : 12">
                                <form-switch label="Multi Sampler"    prop="multiSamplerSwitch"  v-model="store.multiSelect.sampler.enabled" info="Note: Stable Diffusion 2.0 forces the 'dpmsolver' sampler." />
                            </el-col>
                            <el-col :span="isMobile ? 24 : 12">
                                <form-switch label="Multi Guidance"   prop="multiGuidanceSwitch" v-model="store.multiSelect.guidance.enabled" />
                            </el-col>
                            <el-col :span="isMobile ? 24 : 12">
                                <form-switch label="Multi CLIP Skip"  prop="multiClipSkipSwitch" v-model="store.multiSelect.clipSkip.enabled" />
                            </el-col>
                            <el-col :span="isMobile ? 24 : 12">
                                <form-switch label="Multi Steps"      prop="multiStepsSwitch"    v-model="store.multiSelect.steps.enabled" />
                            </el-col>
                            <el-col :span="isMobile ? 24 : 12">
                                <form-switch label="Multi Karras"     prop="multiKarras"         v-model="store.multiSelect.karras.enabled" />
                            </el-col>
                            <el-col :span="isMobile ? 24 : 12">
                                <form-switch label="Multi Hi-res Fix" prop="multiHiResFix"       v-model="store.multiSelect.hiResFix.enabled" />
                            </el-col>
                            <el-col :span="isMobile ? 24 : 12">
                                <form-switch label="Multi Control Type" prop="multiControl"      v-model="store.multiSelect.controlType.enabled" :disabled="store.generatorType === 'Text2Img'" />
                            </el-col>
                        </el-row>
                    </el-collapse-item>
                </el-collapse>
            </div>
            <div class="main">
                <el-button @click="() => store.resetStore()">Reset</el-button>
                <el-button
                    v-if="!store.generating"
                    type="primary"
                    style="width: 80%;"
                    @click="() => store.generateImage(store.generatorType)"
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
                    @click="() => store.cancelled = true"
                > Cancel
                </el-button>
            </div>
            <div class="image center-horizontal">
                <el-card
                    class="center-both generated-image"
                    v-loading="store.generating && uiStore.progress === 0 ? {
                        text: `Waiting for request(s) to upload${ellipsis}${'&nbsp;'.repeat(3 - ellipsis.length)}`,
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
        @delete="() => store.removeFromNegativeLibrary"
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
