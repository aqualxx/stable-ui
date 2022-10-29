<script setup lang="ts">
import { useCanvasStore } from '@/stores/canvas';
import { onMounted, ref } from 'vue';
import { ElUpload, ElIcon, ElButton, ElSlider, ElForm, ElFormItem, type UploadFile, type UploadRawFile } from 'element-plus';
import { UploadFilled, Delete, Download, EditPen, Close } from '@element-plus/icons-vue';
import { fabric } from 'fabric';
import { useGeneratorStore } from '@/stores/generator';
import EraserIcon from './icons/EraserIcon.vue';
import FormSlider from './FormSlider.vue';
import { useUIStore } from '@/stores/ui';
const store = useGeneratorStore();
const uiStore = useUIStore();
const canvasStore = useCanvasStore();

const upload = ref();

async function handleChange(uploadFile: UploadFile) {
    if (!(uploadFile.raw as UploadRawFile).type.includes("image")) {
        uiStore.raiseError("Uploaded file needs to be a image!");
        upload.value!.clearFiles();
        return;
    }
    const base64File = await store.getBase64(uploadFile.raw as UploadRawFile) as string;
    store.sourceImage = base64File.split(",")[1];

    const url = URL.createObjectURL(uploadFile.raw as UploadRawFile);
    fabric.Image.fromURL(url, canvasStore.newImage);
}

function removeImage() {
    store.sourceImage = "";
    canvasStore.resetCanvas()
}

onMounted(() => {
    canvasStore.createNewCanvas("canvas");
})
</script>

<template>
    <el-upload
        drag
        ref="upload"
        :auto-upload="false"
        @change="handleChange"
        :file-list="store.fileList"
        :limit="1"
        multiple
        v-if="store.sourceImage === ''"
    >
        <el-icon :size="100"><upload-filled /></el-icon>
        <div>Drop file here or <em>click to upload</em></div>
    </el-upload>
    <div :style="'display: ' + (store.sourceImage === '' ? 'none' : '')">
        <div style="position: relative;">
            <canvas id="canvas" style="position: absolute;"></canvas>
            <el-button @click="canvasStore.resetDrawing()" class="action-button" style="top: calc(calc(var(--spacing) * 0) + var(--from-top)); right: 10px;" :icon="Close" plain></el-button>
            <el-button @click="removeImage" :icon="Delete" class="action-button" style="top: calc(calc(var(--spacing) * 1) + var(--from-top)); right: 10px;" plain></el-button>
            <el-button @click="canvasStore.downloadMask()" class="action-button" style="top: calc(calc(var(--spacing) * 2) + var(--from-top)); right: 10px;" :icon="Download" plain></el-button>
            <el-button @click="canvasStore.flipErase()"    class="action-button" style="top: calc(calc(var(--spacing) * 3) + var(--from-top)); right: 10px;" :icon="canvasStore.erasing ? EditPen : EraserIcon" plain></el-button>
            <el-form label-width="110px" style="margin-top: 10px">
                <form-slider style="margin-bottom: 5px" label="Brush Size" prop="brushSize" v-model="canvasStore.brushSize" :min="10" :max="100" :step="10" :change="canvasStore.setBrush" />
                <form-slider label="Init Strength" prop="denoise" v-model="store.params.denoising_strength" :min="0.1" :max="1" :step="0.01" info="The final image will diverge from the starting image at higher values." />
            </el-form>
        </div>
    </div>
</template>

<style scoped>
    .action-button {
        --from-top: 10px;
        --spacing: 40px;
        position: absolute;
        width: 30px;
        height: 30px
    }
</style>