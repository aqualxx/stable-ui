<script setup lang="ts">
import { useGeneratorStore } from '@/stores/generator';
import { useOutputStore, type ImageData } from '@/stores/outputs';
import {
    StarFilled,
    Star,
    Refresh,
    Link
} from '@element-plus/icons-vue';
import {
    ElButton,
    ElMessage,
    ElMessageBox,
} from 'element-plus';
import { deflateRaw } from 'pako';
import { downloadWebp } from '@/utils/download'
const store = useGeneratorStore();
const outputStore = useOutputStore();

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
        seed: imageData.seed
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

</script>

<template>
    <el-button @click="confirmDelete" type="danger" plain>Delete</el-button>
    <el-button @click="downloadWebp(imageData.image, `${imageData.seed}-${imageData.prompt}`)" type="success" plain>Download</el-button>
    <el-button v-if="!imageData.starred" @click="outputStore.toggleStarred(imageData.id)" type="warning" :icon="Star" plain />
    <el-button v-if="imageData.starred" @click="outputStore.toggleStarred(imageData.id)" type="warning" :icon="StarFilled" plain />
    <el-button @click="store.generateText2Img(imageData)" type="success" :icon="Refresh" plain>Text2img</el-button>
    <el-button @click="store.generateImg2Img(imageData.image)" type="success" :icon="Refresh" plain>Img2img</el-button>
    <el-button @click="store.generateInpainting(imageData.image)" type="success" :icon="Refresh" plain>Inpainting</el-button>
    <el-button @click="copyLink(imageData)" type="success" :icon="Link" plain>Copy Link</el-button>
</template>
