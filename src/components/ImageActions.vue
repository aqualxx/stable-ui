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

function downloadWebp(base64Data: string, fileName: string) {
    const linkSource = `${base64Data}`;
    const downloadLink = document.createElement("a");
    downloadLink.href = linkSource;
    downloadLink.download = fileName.replace(/[/\\:*?"<>]/g, "").substring(0, 128).trimEnd() + ".webp"; // Only get first 128 characters so we don't break the max file name limit
    downloadLink.click();
}

function copyLink(imageData : ImageData) {
    const urlBase = document.URL.replace("/images", "");
    const link = `${urlBase}/?prompt=${encodeURIComponent(imageData.prompt ? imageData.prompt : "")}&width=${imageData.width}&height=${imageData.height}&steps=${imageData.steps}&cfg_scale=${imageData.cfg_scale}&sampler_name=${imageData.sampler_name}&karras=${imageData.karras}&seed=${imageData.seed}`;
    navigator.clipboard.writeText(link).then(() => {
        ElMessage({
            type: 'success',
            message: 'Copied shareable link to clipboard',
        });
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
