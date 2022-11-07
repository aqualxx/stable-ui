<script setup lang="ts">
import CustomImage from '@/components/CustomImage.vue';
import { useOutputStore } from '@/stores/outputs';
import { useUIStore } from '@/stores/ui';
import {
    ElEmpty,
    ElButton,
    ElMessageBox,
    ElPagination
} from 'element-plus';
import {
    Delete,
    Download
} from '@element-plus/icons-vue';
import FormSelect from '@/components/FormSelect.vue'
import type { ImageData } from '@/stores/outputs'
import JSZip from 'jszip';
import { computed } from 'vue';
import { useOptionsStore } from '@/stores/options';

const store = useOutputStore();
const optionStore = useOptionsStore();
const uiStore = useUIStore();

async function downloadMultipleWebp(outputs: ImageData[]) {
    const zip = new JSZip();

    for (let i = 0; i < outputs.length; i++) {
        zip.file(
            `${outputs[i].seed}-${outputs[i].prompt}`.replace(/[/\\:*?"<>]/g, "").substring(0, 128).trimEnd() + ".webp", // Make a valid file name, and only get first 128 characters so we don't break the max file name limit
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

function selectPage() {
    uiStore.selected = uiStore.selected.filter(el => !store.currentOutputs.map(el => el.id).includes(el));
    uiStore.selected = [...uiStore.selected, ...store.currentOutputs.map(el => el.id)];
    uiStore.multiSelect = true;
}

function deselectPage() {
    uiStore.selected = uiStore.selected.filter(el => !store.currentOutputs.map(el => el.id).includes(el));
    if (uiStore.selected.length === 0) uiStore.multiSelect = false;
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
    <div class="images-top-bar">
        <div>
            <FormSelect label="Sort By" prop="sort" v-model="store.sortBy" :options="['Newest', 'Oldest']" style="margin: 0" />
            <el-button @click="deselectPage" v-if="uiStore.selected.filter(el => store.currentOutputs.map(el => el.id).includes(el)).length > 0">Deselect Page</el-button>
            <el-button @click="selectPage" v-else>Select Page</el-button>
        </div>
        <el-pagination layout="prev, pager, next" hide-on-single-page :total="store.outputs.length" :page-size="optionStore.pageSize" @update:current-page="(val: number) => store.currentPage = val" :current-page="store.currentPage" />
        <div class="center-horizontal" v-if="uiStore.multiSelect">
            <el-button type="danger" @click="confirmDelete" :icon="Delete" plain>Delete</el-button>
            <el-button type="success" @click="downloadMultipleWebp(selectedOutputs)" :icon="Download" plain>Download</el-button>
        </div>
        <div v-else>
            <em style="font-size: 14px;">(long press to select multiple images)</em>
        </div>
    </div>
    <div class="images">
        <div class="images" v-if="store.outputs.length != 0">
            <CustomImage
                v-for="image in store.currentOutputs"
                :key="image.id"
                :image-data="image"
            />
        </div>
        <div v-if="store.outputs.length == 0">
            <el-empty description="No Images Found" />
        </div>
    </div>
    <div class="center-horizontal bottom-pagination" style="margin-top: 12px;">
        <el-pagination layout="prev, pager, next" hide-on-single-page :total="store.outputs.length" :page-size="optionStore.pageSize" @update:current-page="(val: number) => store.currentPage = val" :current-page="store.currentPage" />
    </div>
</template>

<style>
.images {
    display: flex;
    flex-direction: row;
    justify-content: center;
    flex-wrap: wrap;
    gap: 10px;
    width: 100%;
}

.images-top-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 12px;
}

.images-top-bar > * {
    width: 100%;
    display: flex;
    justify-content: center;
    text-align: center;
    white-space: nowrap;
    flex-grow: 0;
}

.images-top-bar > .el-form-item > .el-form-item__content {
    flex: initial
}

.bottom-pagination {
    display: none;
}

@media only screen and (max-width: 768px) {
    .images-top-bar {
        flex-wrap: wrap;
    }
    .bottom-pagination {
        margin-bottom: 50px;
        display: flex;
    }
}
</style>
