<script setup lang="ts">
import { useUIStore } from '@/stores/ui';
import { ElProgress } from 'element-plus';
const store = useUIStore();
</script>

<template>
    <el-progress
        v-if="store.progress != 0"
        type="circle"
        :percentage="store.progress"
        :width="200"
    >
        <template #default>
            <span>{{ store.waitMsg }}</span>
        </template>
    </el-progress>
</template>