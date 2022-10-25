<script setup lang="ts">
import CustomImage from '@/components/CustomImage.vue';
import { useOutputStore } from '@/stores/outputs';
import { useUIStore } from '@/stores/ui';
import {
    ElEmpty,
    ElButton,
    ElMessageBox
} from 'element-plus';
import {
    Delete,
    Download
} from '@element-plus/icons-vue';
import type { ImageData } from '@/stores/outputs'
import { computed } from 'vue';
import JSZip from 'jszip';

const store = useOutputStore();
const sortedOutputs = computed(() => store.sortOutputsBy('stars', store.sortOutputsBy('id', store.outputs)));

const uiStore = useUIStore();

async function downloadMultipleWebp(outputs: ImageData[]) {
    const zip = new JSZip();

    for (let i = 0; i < outputs.length; i++) {
        zip.file(
            `${outputs[i].seed}-${outputs[i].prompt}`.replace(/[/\\:*?"<>]/g, "").substring(0, 200).trimEnd() + ".webp", // Make a valid file name, and only get first 255 characters so we don't break the max file name limit
            outputs[i].image.split(",")[1], // Get base64 from data url
            {base64: true}
        );
    }

    const zipFile = await zip.generateAsync({type: "blob"});
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(zipFile);
    downloadLink.download = "stable_horde.zip";
    downloadLink.click();
}

const confirmDelete = () => {
    ElMessageBox.confirm(
        `This action will permanently delete ${uiStore.selected.length} images. Continue?`,
        'Warning',
        {
            confirmButtonText: 'OK',
            cancelButtonText: 'Cancel',
            type: 'warning',
        }
    )
        .then(() => {
            store.deleteMultipleOutputs(uiStore.selected);
        })
}

const selectedOutputs = computed(() => store.outputs.filter(output => uiStore.selected.includes(output.id)));
</script>

<template>
    <div class="center-horizontal" style="margin-bottom: 10px" v-if="uiStore.multiSelect">
        <el-button type="danger" @click="confirmDelete" :icon="Delete" plain>Delete</el-button>
        <el-button type="success" @click="downloadMultipleWebp(selectedOutputs)" :icon="Download" plain>Download</el-button>
    </div>
    <div class="center-horizontal" v-else>
        <em style="font-size: 14px; margin-bottom: 5px">(long press to select multiple)</em>
    </div>
    <div class="images">
        <div class="images" v-if="store.outputs.length != 0">
            <CustomImage
                v-for="image in sortedOutputs"
                :key="image.id"
                v-bind="(image as any)"
            />
        </div>
        <div v-if="store.outputs.length == 0">
            <el-empty description="No Images Found" />
        </div>
    </div>
</template>

<style scoped>
</style>
