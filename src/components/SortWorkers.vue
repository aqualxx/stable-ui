<script setup lang="ts">
import {
    ElPopover,
    ElButton,
    ElIcon,
    ElInput
} from 'element-plus';
import {
    Search,
    Sort,
} from '@element-plus/icons-vue';
import { useWorkerStore } from '@/stores/workers';
import ButtonCycle from './ButtonCycle.vue';
import SortDown from './icons/SortDown.vue';
import SortUp from './icons/SortUp.vue';
import { ref } from 'vue';
const store = useWorkerStore();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
    mobile?: boolean;
}>();

const visible = ref(false);
</script>

<template>
    <div class="sort-workers">
        <el-input prop="search" v-model="store.searchFilter" placeholder="Search by name" clearable :style="`max-width: 300px; ${mobile && 'margin-bottom: 0;'}`" :suffix-icon="Search" />
        <el-popover
            :visible="visible"
            placement="bottom"
            title="Sort By"
            :width="200"
        >
            <template #reference>
                <el-button @click="visible = !visible" class="square-btn"><el-icon :size="16" color="white"><Sort /></el-icon></el-button>
            </template>
            <div
                v-for="option in store.sortOptions"
                :key="option"
                @click="() => store.sortBy = option"
                :class="`el-select-dropdown__item ${store.sortBy === option ? 'selected' : ''}`"
            >{{option}}</div>
        </el-popover>
        <ButtonCycle v-model="store.sortDirection" :options="[{value: 'Descending', icon: SortDown}, {value: 'Ascending', icon: SortUp}]" :dimensions="32" style="margin-left: 0" />
    </div>
</template>

<style scoped>
    .sort-workers {
        display: flex;
        justify-content: center;
        gap: 10px;
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

    @media only screen and (max-width: 1024px) {
        .sort-workers {
            margin-bottom: 5px;
        }
    }
</style>