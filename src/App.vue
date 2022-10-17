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

useOptionsStore();
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
        >
            <el-menu-item class="remove-item-styling center-vertical">
                <template #title>
                    <div style="font-size: 20px">Stable Horde</div>
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
    </el-scrollbar>
</template>
  
<style scoped>
    .el-menu {
        margin-bottom: 20px;
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