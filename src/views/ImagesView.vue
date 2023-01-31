<script setup lang="ts">
import CustomImage from '@/components/CustomImage.vue';
import { useOutputStore, type ImageData } from '@/stores/outputs';
import { useUIStore } from '@/stores/ui';
import {
    ElEmpty,
    ElButton,
    ElMessageBox,
    ElPagination,
    ElPopover,
    ElIcon,
} from 'element-plus';
import {
    Delete,
    Download,
    Filter,
    Document,
    DocumentChecked,
    CircleCheck,
    CircleCheckFilled,
    Sort,
} from '@element-plus/icons-vue';
import { ref } from 'vue';
import { useOptionsStore } from '@/stores/options';
import { onKeyStroke } from '@vueuse/core';
import { downloadMultipleWebp } from '@/utils/download';
import { db } from '@/utils/db';

const store = useOutputStore();
const optionStore = useOptionsStore();
const uiStore = useUIStore();

function selectPage() {
    uiStore.selected = uiStore.selected.filter(el => !store.currentOutputs.map(el => el.id).includes(el));
    uiStore.selected = [...uiStore.selected, ...store.currentOutputs.map(el => el.id)];
    uiStore.multiSelect = true;
}

async function selectAll() {
    const allKeys = await db.outputs
        .toCollection()
        .primaryKeys() as number[];
    uiStore.selected = allKeys;
    uiStore.multiSelect = true;
}

function deselectPage() {
    uiStore.selected = uiStore.selected.filter(el => !store.currentOutputs.map(el => el.id).includes(el));
    if (uiStore.selected.length === 0) uiStore.multiSelect = false;
}

function deselectAll() {
    uiStore.selected = [];
    uiStore.multiSelect = false;
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

const sortByVisible = ref(false);
const filterByVisible = ref(false);

onKeyStroke(['a', 'A', 'ArrowLeft'], uiStore.openModalToLeft)
onKeyStroke(['d', 'D', 'ArrowRight'], uiStore.openModalToRight)

async function bulkDownload() {
    const selectedOutputs = await db.outputs.bulkGet(uiStore.selected);
    downloadMultipleWebp((selectedOutputs.filter(el => el != undefined) as ImageData[]))
}
</script>

<template>
    <div class="images-top-bar">
        <div>
            <el-popover
                :visible="sortByVisible"
                placement="bottom"
                title="Sort By"
                :width="200"
            >
                <template #reference>
                    <el-button @click="sortByVisible = !sortByVisible" class="square-btn"><el-icon :size="16" color="white"><Sort /></el-icon></el-button>
                </template>
                <div
                    v-for="option in ['Newest', 'Oldest']"
                    :key="option"
                    @click="() => store.sortBy = (option as any)"
                    :class="`el-select-dropdown__item ${store.sortBy === option ? 'selected' : ''}`"
                >{{option}}</div>
            </el-popover>
            <el-popover
                :visible="filterByVisible"
                placement="bottom"
                title="Filter By"
                :width="240"
            >
                <template #reference>
                    <el-button @click="filterByVisible = !filterByVisible" class="square-btn"><el-icon :size="16" color="white"><Filter /></el-icon></el-button>
                </template>
                <div
                    v-for="option in ['all', 'favourited', 'unfavourited', 'unrated']"
                    :key="option"
                    @click="() => store.filterBy = (option as any)"
                    :class="`el-select-dropdown__item ${store.filterBy === option ? 'selected' : ''}`"
                >{{store.filterBy === option ? "Showing" : "Show"}} {{option}}</div>
            </el-popover>
            <el-button @click="deselectPage" :icon="DocumentChecked" v-if="uiStore.selected.filter(el => store.currentOutputs.map(el => el.id).includes(el)).length > 0">Deselect Page</el-button>
            <el-button @click="selectPage" :icon="Document" v-else>Select Page</el-button>
            <el-button @click="deselectAll" :icon="CircleCheckFilled" v-if="uiStore.selected.length > 0">Deselect All</el-button>
            <el-button @click="selectAll" :icon="CircleCheck" v-else>Select All</el-button>
        </div>
        <el-pagination v-if="optionStore.pageless === 'Disabled'" layout="prev, pager, next" hide-on-single-page :total="store.outputsLength" :page-size="optionStore.pageSize" @update:current-page="(val: number) => store.currentPage = val" :current-page="store.currentPage" />
        <div class="center-horizontal" v-if="uiStore.multiSelect">
            <el-button type="danger" @click="confirmDelete" :icon="Delete" plain>Delete</el-button>
            <el-button type="success" @click="bulkDownload" :icon="Download" plain>Download</el-button>
        </div>
        <div v-else>
            <em style="font-size: 14px;">(long press to select multiple images)</em>
        </div>
    </div>
    <div class="images">
        <div class="images" v-if="store.outputsLength != 0">
            <CustomImage
                v-for="image in store.currentOutputs"
                :key="image.id"
                :image-data="image"
            />
        </div>
        <div v-if="store.outputsLength == 0">
            <el-empty description="No Images Found" />
        </div>
    </div>
    <div class="center-horizontal bottom-pagination" style="margin-top: 12px;">
        <el-pagination v-if="optionStore.pageless === 'Disabled'" layout="prev, pager, next" hide-on-single-page :total="store.outputsLength" :page-size="optionStore.pageSize" @update:current-page="(val: number) => store.currentPage = val" :current-page="store.currentPage" />
    </div>
</template>

<style scoped>
.images {
    display: flex;
    flex-direction: row;
    justify-content: center;
    flex-wrap: wrap;
    gap: 10px;
    width: 100%;
}

.selected {
    color: var(--el-color-primary);
    text-decoration: underline;
    background-color: #262626;
}

.square-btn {
    width: 32px;
    height: 32px
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
