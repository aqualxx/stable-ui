<script setup lang="ts">
import { RouterView, useRoute, useRouter } from "vue-router";
import {
    Document,
    Menu as IconMenu,
    Operation,
    Tools as Options,
    User,
    HomeFilled
} from '@element-plus/icons-vue';
import {
    ElMenu,
    ElMenuItem,
    ElIcon,
    ElScrollbar
} from 'element-plus';
import { onMounted } from "vue";
import { useOptionsStore } from "@/stores/options";
import { useUIStore } from "./stores/ui";
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import { useOutputStore } from "./stores/outputs";

const breakpoints = useBreakpoints(breakpointsTailwind);

const isMobile = breakpoints.smallerOrEqual('md');

useOptionsStore();
useOutputStore().useImagesDB();
const uiStore = useUIStore();
onMounted(async () => {
    const route  = useRoute();
    const router = useRouter();
    await router.isReady();
    uiStore.activeIndex = route.path;
})
</script>

<template>
    <el-scrollbar>
        <el-menu
            :default-active="uiStore.activeIndex"
            mode="horizontal"
            :router="true"
            class="menu"
            v-if="!isMobile"
        >
            <el-menu-item class="remove-item-styling center-vertical">
                <template #title>
                    <div style="font-size: 20px;">Stable Horde</div>
                </template>
            </el-menu-item>
            <el-menu-item index="/dashboard">
                <el-icon><home-filled /></el-icon>
                <template #title>Dashboard</template>
            </el-menu-item>
            <el-menu-item index="/">
                <el-icon><operation /></el-icon>
                <template #title>Generate</template>
            </el-menu-item>
            <el-menu-item index="/images">
                <el-icon><icon-menu /></el-icon>
                <template #title>Images</template>
            </el-menu-item>
            <el-menu-item index="/workers">
                <el-icon><user /></el-icon>
                <template #title>Workers</template>
            </el-menu-item>
            <el-menu-item index="/about">
                <el-icon><document /></el-icon>
                <template #title>About</template>
            </el-menu-item>
            <el-menu-item index="/options">
                <el-icon><options /></el-icon>
                <template #title>Options</template>
            </el-menu-item>
        </el-menu>
        <router-view />
        <el-menu
            :default-active="uiStore.activeIndex"
            mode="horizontal"
            :router="true"
            :ellipsis="false"
            class="mobile-menu"
            v-if="isMobile"
        >
            <el-menu-item index="/dashboard">
                <el-icon><home-filled /></el-icon>
            </el-menu-item>
            <el-menu-item index="/">
                <el-icon><operation /></el-icon>
            </el-menu-item>
            <el-menu-item index="/images">
                <el-icon><icon-menu /></el-icon>
            </el-menu-item>
            <el-menu-item index="/workers">
                <el-icon><user /></el-icon>
            </el-menu-item>
            <el-menu-item index="/about">
                <el-icon><document /></el-icon>
            </el-menu-item>
            <el-menu-item index="/options">
                <el-icon><options /></el-icon>
            </el-menu-item>
        </el-menu>
    </el-scrollbar>
</template>
  
<style scoped>
    .menu {
        margin-bottom: 20px;
        z-index: 100;
    }

    .mobile-menu {
        z-index: 100;
        position: fixed;
        bottom: 0;
        height: 50px;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        justify-content: center;
        --el-menu-bg-color: var(--el-mask-color)
    }

    .mobile-menu > * {
        width: 60px
    }

    .remove-item-styling {
        cursor: default;
        color: var(--el-menu-text-color) !important;
        background-color: transparent !important;
    }
    .remove-item-styling:hover {
        cursor: default;
        color: var(--el-menu-text-color) !important;
    }
</style>