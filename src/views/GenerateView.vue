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
} from 'element-plus';
import {
    Comment,
    PictureFilled,
    MagicStick
} from '@element-plus/icons-vue';
import ImageProgress from '../components/ImageProgress.vue';
import FormSlider from '../components/FormSlider.vue';
import FormSelect from '../components/FormSelect.vue';
import FormRadio from '../components/FormRadio.vue';
import FormInput from '../components/FormInput.vue';
import FormModelSelect from '../components/FormModelSelect.vue';
import FormPromptInput from '../components/FormPromptInput.vue';
import GeneratedCarousel from '../components/GeneratedCarousel.vue'
import BrushFilled from '../components/icons/BrushFilled.vue';
import CustomCanvas from '../components/CustomCanvas.vue';
import GeneratorMenuItem from '../components/GeneratorMenuItem.vue';
import DialogList from '../components/DialogList.vue';
import StarEdit24Regular from '../components/icons/StarEdit24Regular.vue';
import RatingView from '../components/RatingView.vue';
import BaseLink from '../components/BaseLink.vue';
import { useUIStore } from '@/stores/ui';
import { useCanvasStore } from '@/stores/canvas';
import { useOptionsStore } from '@/stores/options';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import handleUrlParams from "@/router/handleUrlParams";
import { useRatingStore } from '@/stores/rating';

const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.smallerOrEqual('md');

const store = useGeneratorStore();
const uiStore = useUIStore();
const canvasStore = useCanvasStore();
const optionsStore = useOptionsStore();
const ratingStore = useRatingStore();

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

const setKarras = computed({
    get() {
        return store.params.karras ? "Enabled" : "Disabled";
    },
    set(value: string) {
        store.params.karras = value === "Enabled";
    }
})

const setTiling = computed({
    get() {
        return store.params.tiling ? "Enabled" : "Disabled";
    },
    set(value: string) {
        store.params.tiling = value === "Enabled";
    }
})

function disableBadge() {
    if (store.generatorType !== "Rating") uiStore.showGeneratorBadge = false;
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
</script>

<template>
    <el-menu
        :default-active="store.generatorType"
        :collapse="true"
        @select="onMenuChange"
        :mode="isMobile ? 'horizontal' : 'vertical'"
        :class="isMobile ? 'mobile-generator-types' : 'generator-types'"
    >
        <GeneratorMenuItem index="Text2Img"      :icon-one="Comment"             :icon-two="PictureFilled" :isMobile="isMobile" />
        <GeneratorMenuItem index="Img2Img"       :icon-one="PictureFilled"       :icon-two="PictureFilled" :isMobile="isMobile" />
        <GeneratorMenuItem index="Inpainting"    :icon-one="BrushFilled"         :icon-two="PictureFilled" :isMobile="isMobile" />
        <GeneratorMenuItem index="Rating"        :icon-one="StarEdit24Regular"   :isMobile="isMobile" />
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
                        <form-slider label="Guidance"        prop="cfgScale"       v-model="store.params.cfg_scale"          :min="store.minCfgScale"   :max="store.maxCfgScale"   info="Higher values will make the AI respect your prompt more. Lower values allow the AI to be more creative." />
                        <form-slider label="Init Strength"   prop="denoise"        v-model="store.params.denoising_strength" :min="store.minDenoise"    :max="store.maxDenoise"    :step="0.01" info="The final image will diverge from the starting image at higher values." v-if="store.generatorType !== 'Text2Img'" />
                        <form-model-select />
                        <form-select label="Post-processors" prop="postProcessors" v-model="store.postProcessors"   :options="store.availablePostProcessors" info="GPFGAN: Improves faces   RealESRGAN_x4plus: Upscales by 4x   CodeFormers: Improves faces" multiple />
                        <form-radio  label="Multi-model select" prop="multiModel"  v-model="store.multiModelSelect" :options="['Enabled', 'Disabled']" />
                        <form-radio  label="Tiling"          prop="tiling"         v-model="setTiling"              :options="['Enabled', 'Disabled']"       info="Creates seamless textures! You can test your resulting images here: https://www.pycheung.com/checker/" />
                        <form-radio  label="Karras"          prop="karras"         v-model="setKarras"              :options="['Enabled', 'Disabled']"       info="Improves image generation while requiring fewer steps. Mostly magic!" />
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
