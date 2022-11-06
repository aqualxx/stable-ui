<script setup lang="ts">
import { useGeneratorStore } from '@/stores/generator';
import { useOutputStore } from '@/stores/outputs';
import {
    StarFilled,
    Star,
} from '@element-plus/icons-vue';
import {
    ElButton,
    ElMessage,
    ElMessageBox,
} from 'element-plus';

const store = useGeneratorStore();
const outputStore = useOutputStore();

const props = defineProps<{
    id: number;
    image: string;
    prompt: string;
    seed: string;
    starred: boolean;
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
            outputStore.deleteOutput(props.id);
            if (props.onDelete !== undefined) props.onDelete(props.id);
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
    downloadLink.download = fileName.substring(0, 255) + ".webp"; // Only get first 255 characters so we don't break the max file name limit
    downloadLink.click();
}
</script>

<template>
    <el-button @click="confirmDelete" type="danger" plain>Delete</el-button>
    <el-button @click="downloadWebp(image, `${seed}-${prompt}`)" type="success" plain>Download</el-button>
    <el-button v-if="!starred" @click="outputStore.toggleStarred(id)" type="warning" :icon="Star" plain />
    <el-button v-if="starred" @click="outputStore.toggleStarred(id)" type="warning" :icon="StarFilled" plain />
    <el-button @click="store.generateImg2Img(image)" type="success" plain>Send to img2img</el-button>
    <el-button @click="store.generateInpainting(image)" type="success" plain>Send to inpainting</el-button>
</template>
