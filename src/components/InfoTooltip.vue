<script setup lang="ts">
import {
    ElIcon,
    ElTooltip
} from 'element-plus';
import {
    InfoFilled
} from '@element-plus/icons-vue';

defineProps<{
    info?: string;
    size?: number;
    trigger?: "hover" | "click" | "focus" | "contextmenu";
}>();
</script>

<template>
    <el-tooltip :trigger="trigger">
        <template #content>
            <div style="width: 200px">
                <slot>{{info}}</slot>
            </div>
        </template>
        <el-icon :size="size"><InfoFilled /></el-icon>
    </el-tooltip>
</template>