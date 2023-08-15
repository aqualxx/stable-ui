<script setup lang="ts">
import { useGeneratorStore } from '@/stores/generator';
import { useOutputStore, type ImageData } from '@/stores/outputs';
import { useRatingStore } from '@/stores/rating';
import {
    StarFilled,
    Star,
    Refresh,
    Link,
    Delete,
    Download,
} from '@element-plus/icons-vue';
import {
    ElButton,
    ElMessage,
    ElMessageBox,
    ElDialog,
} from 'element-plus';
import { deflateRaw } from 'pako';
import { downloadImage } from '@/utils/download'
import type { RatePostInput } from '@/types/ratings';
import type { AestheticRating } from '@/types/stable_horde';
import { db } from '@/utils/db';
import RatingView from './RatingView.vue';
import { ref } from 'vue';

const store = useGeneratorStore();
const outputStore = useOutputStore();
const ratingStore = useRatingStore();

const props = defineProps<{
    imageData: ImageData;
    onDelete?: Function;
}>();

const confirmDelete = () => {
    ElMessageBox.confirm(
        'This action will permanently delete this image. Continue?',
        'Warning',
        {
            confirmButtonText: 'OK',
            cancelButtonText: 'Cancel',
            type: 'warning',
        }
    )
        .then(() => {
            outputStore.deleteOutput(props.imageData.id);
            if (props.onDelete !== undefined) props.onDelete(props.imageData.id);
            ElMessage({
                type: 'success',
                message: 'Deleted Image',
            })
        })
}

async function copyLink(imageData: ImageData) {
    const urlBase = window.location.origin;
    const hasUpscaling = imageData.post_processing?.includes("RealESRGAN_x4plus");
    const linkParams = {
        prompt: imageData.prompt,
        width: imageData.width ? imageData.width / (hasUpscaling ? 4 : 1) : undefined,
        height: imageData.height ? imageData.height / (hasUpscaling ? 4 : 1) : undefined,
        steps: imageData.steps,
        cfg_scale: imageData.cfg_scale,
        sampler_name: imageData.sampler_name,
        karras: imageData.karras,
        post_processing: imageData.post_processing,
        model_name: imageData.modelName,
        seed: imageData.seed,
        hires_fix: imageData.hires_fix,
        clip_skip: imageData.clip_skip,
        tiling: imageData.tiling,
    }
    const path = window.location.pathname.replace("images", "");
    let link = `${urlBase}${path}?share=`;
    let toBeCompressed = "";
    let paramChar = "";
    for (const [key, value] of Object.entries(linkParams)) {
        if (!value) continue;
        let filteredValue = value;
        if (typeof value === "string") filteredValue = encodeURIComponent(value);
        else if (Array.isArray(value)) filteredValue = JSON.stringify(value);
        toBeCompressed += `${paramChar}${key}=${filteredValue}`
        paramChar = "&";
    }
    const compressedBase64 = btoa(String.fromCharCode.apply(null, Array.from(deflateRaw(toBeCompressed))));
    link += compressedBase64;
    await navigator.clipboard.writeText(link);
    ElMessage({
        type: 'success',
        message: 'Copied shareable link to clipboard',
    });
}

function onRatingSubmit(rating: RatePostInput, id: string) {
    ratingStore.submitRatingHorde(
        { ...rating, id } as AestheticRating,
        props.imageData.jobId as string
    );

    db.outputs
        .filter(el => el.jobId === props.imageData.jobId)
        .modify({ rated: 1 });

    ratingDialog.value = false;
}

const ratingDialog = ref(false);
</script>

<template>
    <el-button @click="confirmDelete" type="danger" :icon="Delete" plain>Delete</el-button>
    <el-button @click="downloadImage(imageData.image, `${imageData.seed}-${imageData.prompt}`, imageData)" type="success" :icon="Download" plain>Download</el-button>
    <el-button v-if="!imageData.starred" @click="outputStore.toggleStarred(imageData.id)" type="warning" :icon="Star" plain>Favourite</el-button>
    <el-button v-if="imageData.starred" @click="outputStore.toggleStarred(imageData.id)" type="warning" :icon="StarFilled" plain>Unfavourite</el-button>
    <el-button @click="store.generateText2Img(imageData)" type="success" :icon="Refresh" plain>Text2img</el-button>
    <el-button @click="store.generateImg2Img(imageData.image)" type="success" :icon="Refresh" plain>Img2img</el-button>
    <el-button @click="store.generateInpainting(imageData.image)" type="success" :icon="Refresh" plain>Inpainting</el-button>
    <el-button @click="copyLink(imageData)" type="success" :icon="Link" plain>Copy Link</el-button>
    <el-button
        :disabled="!imageData.hordeImageId || !imageData.jobId || imageData.rated !== 0 || !imageData.sharedExternally"
        @click="() => ratingDialog = true"
        type="warning"
        :icon="Star"
        plain
    >Rate Image</el-button>
    <el-dialog
        v-model="ratingDialog"
        class="rating-dialog"
        title="Image Rating"
        append-to-body
    >
        <RatingView
            :id="imageData.hordeImageId || ''"
            :imageSource="imageData.image"
            :submitted="imageData.rated === 1"
            iconSize="24px"
            @onRatingSubmit="onRatingSubmit"
        />
    </el-dialog>
</template>

<style>
.rating-dialog {
    width: 640px;
}

@media only screen and (max-width: 1280px) {
    .rating-dialog {
        width: 480px;
    }
}

@media only screen and (max-width: 768px) {
    .rating-dialog {
        width: 90%;
    }
}
</style>