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
    CircleCheck,
    CircleCheckFilled,
    Sort,
} from '@element-plus/icons-vue';
import { computed } from 'vue';
import { useOptionsStore } from '@/stores/options';
import { onKeyStroke } from '@vueuse/core';
import { downloadMultipleImages } from '@/utils/download';
import { db } from '@/utils/db';
import { useWindowSize } from '@vueuse/core'
import LayoutOutlined from '@/components/icons/LayoutOutlined.vue';

const { width } = useWindowSize();

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

onKeyStroke(['a', 'A', 'ArrowLeft'], uiStore.openModalToLeft)
onKeyStroke(['d', 'D', 'ArrowRight'], uiStore.openModalToRight)

async function bulkDownload() {
    const selectedOutputs = await db.outputs.bulkGet(uiStore.selected);
    downloadMultipleImages((selectedOutputs.filter(el => el != undefined) as ImageData[]))
}

const splitList = computed(() => {
    let columns = 2;
    if (width.value > 1440) {
        columns = 6;
    } else if (width.value > 1280) {
        columns = 5;
    } else if (width.value > 768) {
        columns = 4;
    } else if (width.value > 480) {
        columns = 3;
    }
    const result = [];
    for (let i = 0; i < columns; i++) {
        const column = [];
        for (let j = i; j < store.currentOutputs.length; j += columns) {
            column.push(store.currentOutputs[j]);
        }
        result.push(column);
    }
    return result;
})
</script>

<template>
    <div class="images-top-bar">
        <div class="options">
            <el-popover
                placement="bottom"
                title="Sort By"
                trigger="click"
                :width="200"
                transition="none"
                :hide-after="0"
            >
                <template #reference>
                    <el-button class="btn-select"><el-icon :size="16"><Sort /></el-icon></el-button>
                </template>
                <div
                    v-for="option in ['Newest', 'Oldest']"
                    :key="option"
                    @click="() => store.sortBy = (option as any)"
                    :class="`el-select-dropdown__item ${store.sortBy === option ? 'selected' : ''}`"
                >{{option}}</div>
            </el-popover>
            <el-popover
                placement="bottom"
                title="Filter By"
                trigger="click"
                :width="240"
                transition="none"
                :hide-after="0"
            >
                <template #reference>
                    <el-button class="btn-select"><el-icon :size="16"><Filter /></el-icon></el-button>
                </template>
                <div
                    v-for="option in ['all', 'favourited', 'unfavourited', 'unrated']"
                    :key="option"
                    @click="() => store.filterBy = (option as any)"
                    :class="`el-select-dropdown__item ${store.filterBy === option ? 'selected' : ''}`"
                >{{store.filterBy === option ? "Showing" : "Show"}} {{option}}</div>
            </el-popover>
            <el-popover
                placement="bottom"
                title="Image Layout"
                trigger="click"
                :width="240"
                transition="none"
                :hide-after="0"
            >
                <template #reference>
                    <el-button class="btn-select"><el-icon :size="16"><LayoutOutlined /></el-icon></el-button>
                </template>
                <div
                    v-for="option in [{
                        label: 'Square Grid',
                        value: 'grid'
                    }, {
                        label: 'Dynamic Layout',
                        value: 'dynamic'
                    }]"
                    :key="option.value"
                    @click="() => store.currentLayout = (option.value as any)"
                    :class="`el-select-dropdown__item ${store.currentLayout === option.value ? 'selected' : ''}`"
                >{{ option.label }}</div>
            </el-popover>
            <el-popover
                placement="bottom"
                title="Selection"
                trigger="click"
                :width="240"
                transition="none"
                :hide-after="0"
            >
                <template #reference>
                    <el-button class="btn-select"><el-icon :size="16"><CircleCheckFilled v-if="uiStore.multiSelect" /><CircleCheck v-else /></el-icon></el-button>
                </template>
                <div class="el-select-dropdown__item selected" @click="uiStore.toggleMultiSelect" v-if="uiStore.multiSelect">Disable multi-select</div>
                <div class="el-select-dropdown__item"          @click="uiStore.toggleMultiSelect" v-else>Enable multi-select</div>
                <div class="el-select-dropdown__item selected" @click="deselectAll"  v-if="uiStore.selected.length > 0">Deselect All</div>
                <div class="el-select-dropdown__item"          @click="selectAll"    v-else>Select All</div>
                <div class="el-select-dropdown__item selected" @click="deselectPage" v-if="!uiStore.selected.every(el => !store.currentOutputs.map(el => el.id).includes(el))">Deselect Page</div>
                <div class="el-select-dropdown__item"          @click="selectPage"   v-else>Select Page</div>
            </el-popover>
        </div>
        <el-pagination
            layout="prev, pager, next"
            :total="store.outputsLength"
            :page-size="optionStore.pageSize"
            :current-page="store.currentPage"
            @update:current-page="(val: number) => store.currentPage = val"
            hide-on-single-page
            v-if="optionStore.pageless === 'Disabled'"
        />
        <div class="center-both" v-if="uiStore.multiSelect" style="gap: 12px">
            <div>{{ uiStore.selected.length }} selected</div>
            <el-button type="danger" @click="confirmDelete" :icon="Delete" plain>Delete</el-button>
            <el-button type="success" @click="bulkDownload" :icon="Download" plain style="margin: 0">Download</el-button>
        </div>
        <div v-else>
            <em style="font-size: 14px;">(long press to select multiple images)</em>
        </div>
    </div>
    <div v-if="store.outputsLength != 0">
        <div style="display: flex; gap: 8px" v-if="store.currentLayout === 'dynamic'">
            <div v-for="(items, index) in splitList" :key="index" style="flex: 1 1 0%">
                <CustomImage
                    v-for="image in items"
                    :key="image.id"
                    :image-data="image"
                    style="margin-bottom: 8px;"
                />
            </div>
        </div>
        <div class="images" v-if="store.currentLayout === 'grid'">
            <CustomImage
                v-for="image in store.currentOutputs"
                :key="image.id"
                :image-data="image"
                style="width: 200px; height: 200px"
            />
        </div>
    </div>
    <div v-if="store.outputsLength == 0">
        <el-empty description="No Images Found" />
    </div>
</template>

<style scoped>
.images {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
    width: 100%;
}

.selected {
    color: var(--el-color-primary);
    text-decoration: underline;
    background-color: #262626;
}

.btn-select {
    width: 48px;
    height: 32px;
}

.options {
    display: flex;
    align-items: center;
    gap: 8px;
}

.options > * {
    margin: 0;
}

.images-top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
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
