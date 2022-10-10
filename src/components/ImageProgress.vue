<script setup lang="ts">
import { useGeneratorStore } from '@/stores/generator';
import { ElProgress } from 'element-plus';
const store = useGeneratorStore();
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