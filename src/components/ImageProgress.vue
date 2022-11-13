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
            <span>EST: {{ Math.round(store.waitData.wait_time as number) }}s</span><br>
        </template>
    </el-progress>
</template>