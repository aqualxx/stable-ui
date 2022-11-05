<script setup lang="ts">
import { useCanvasStore } from '@/stores/canvas';
import { onMounted, ref } from 'vue';
import { ElUpload, ElIcon, ElButton, ElForm, type UploadFile, type UploadRawFile } from 'element-plus';
import { UploadFilled, Delete, Download, EditPen, Close, RefreshRight, RefreshLeft  } from '@element-plus/icons-vue';
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
    uploadFile.url = base64File;
    if (store.generatorType === "Inpainting") {
        store.inpainting.fileList = [uploadFile];
        store.inpainting.sourceImage = base64File.split(",")[1];
    }
    if (store.generatorType === "Img2Img") {
        store.img2img.fileList = [uploadFile];
        store.img2img.sourceImage = base64File.split(",")[1];
    }
    fabric.Image.fromURL(base64File, canvasStore.newImage);
}

function removeImage() {
    if (store.generatorType === "Inpainting") {
        store.inpainting.sourceImage = "";
        store.inpainting.fileList = [];
    }
    if (store.generatorType === "Img2Img") {
        store.img2img.sourceImage = "";
        store.img2img.fileList = [];
    }
    canvasStore.resetCanvas()
}

onMounted(() => {
    canvasStore.createNewCanvas("canvas");
    if (store.inpainting.fileList.length !== 0 && store.generatorType === "Inpainting") {
        const base64File = store.inpainting.fileList[0].url as string;
        store.inpainting.sourceImage = base64File.split(",")[1];
        fabric.Image.fromURL(base64File, canvasStore.newImage);
    }
    if (store.img2img.fileList.length !== 0 && store.generatorType === "Img2Img") {
        const base64File = store.img2img.fileList[0].url as string;
        store.img2img.sourceImage = base64File.split(",")[1];
        fabric.Image.fromURL(base64File, canvasStore.newImage);
    }
})
</script>

<template>
    <el-upload
        drag
        ref="upload"
        :auto-upload="false"
        @change="handleChange"
        :file-list="store.generatorType === 'Inpainting' ? store.inpainting.fileList : store.img2img.fileList"
        :limit="1"
        multiple
        v-if="store.generatorType === 'Inpainting' ? store.inpainting.sourceImage === '' : store.img2img.sourceImage === ''"
    >
        <el-icon :size="100"><upload-filled /></el-icon>
        <div>Drop file here or <em>click to upload</em></div>
    </el-upload>
    <div v-show="store.generatorType === 'Inpainting' ? store.inpainting.sourceImage !== '' : store.img2img.sourceImage !== ''">
        <div class="canvas-container">
            <canvas id="canvas" style="position: absolute;"></canvas>
            <div class="action-buttons" style="left: 10px; right: unset">
                <el-button @click="canvasStore.undoAction()"   :icon="RefreshLeft" plain :disabled="canvasStore.redoHistory.length === 0"></el-button>
                <el-button @click="canvasStore.redoAction()"   :icon="RefreshRight" plain :disabled="canvasStore.undoHistory.length === 0"></el-button>
            </div>
            <div class="action-buttons">
                <el-button @click="canvasStore.resetDrawing()" :icon="Close" plain></el-button>
                <el-button @click="removeImage"                :icon="Delete" plain></el-button>
                <el-button @click="canvasStore.downloadMask()" :icon="Download" plain></el-button>
                <el-button @click="canvasStore.flipErase()"    :icon="canvasStore.erasing ? EditPen : EraserIcon" plain></el-button>
            </div>
            <el-form label-width="110px" style="margin-top: 10px">
                <form-slider style="margin-bottom: 5px" label="Brush Size" prop="brushSize" v-model="canvasStore.brushSize" :min="10" :max="100" :step="10" :change="canvasStore.setBrush" />
                <form-slider label="Init Strength" prop="denoise" v-model="store.params.denoising_strength" :min="0.1" :max="1" :step="0.01" info="The final image will diverge from the starting image at higher values." />
            </el-form>
        </div>
    </div>
</template>

<style scoped>
.action-buttons {
    display: flex;
    flex-direction: column;
    position: absolute;
    gap: 10px;
    top: 10px;
    right: 10px;
}

.action-buttons > * {
    width: 30px;
    height: 30px;
    margin: 0;
}

.canvas {
    max-width: 100%;
    max-height: 100%
}

.canvas-container {
    position: relative;
}

@media only screen and (max-width: 1280px) {
    .canvas-container {
        transform: scale(0.7);
    }
}
</style>