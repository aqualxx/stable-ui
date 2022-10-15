<script setup lang="ts">
import { useWorkerStore } from '@/stores/workers';
import {
    ElEmpty
} from 'element-plus';
import WorkerBox from '../components/WorkerBox.vue';

const store = useWorkerStore();
</script>

<template>
    <div class="workers">
        <div class="workers" v-if="store.workers.length != 0">
            <WorkerBox
                v-for="worker in store.workers.sort((a, b) => (b.info ? b.info.length : 0) - (a.info ? a.info.length : 0))"
                :key="worker.id"
                v-bind="(worker as any)"
            />
        </div>
        <div v-if="store.workers.length == 0">
            <el-empty description="No Workers Found" />
        </div>
    </div>
</template>

<style scoped>
    .workers {
        display: flex;
        flex-direction: row;
        justify-content: center;
        flex-wrap: wrap;
        gap: 10px;
        width: 100%;
    }
</style>