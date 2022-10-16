<script setup lang="ts">
import { useUserStore } from '@/stores/user';
import {
    ElRow,
    ElCol,
    ElCard,
    ElEmpty,
    ElIcon
} from "element-plus";
import {
    Money,
    Aim,
    Picture,
    Avatar,
    Lock
} from "@element-plus/icons-vue"
import DataLabel from '../components/DataLabel.vue'
import WorkerEditor from '../components/WorkerEditor.vue';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import { computed } from 'vue';
import { useOptionsStore } from '@/stores/options';

const breakpoints = useBreakpoints(breakpointsTailwind);

const breakLabels = breakpoints.smallerOrEqual('xl');
const breakLabelsMore = breakpoints.smallerOrEqual('lg');

const userStore = useUserStore();
const optionsStore = useOptionsStore();

// Max: 24 for each col
const spanAmount = computed(() => breakLabels.value ? breakLabelsMore.value ? 20 : 10 : 5)
</script>

<template>
    <div class="dashboard">
        <div v-if="optionsStore.apiKey === '0000000000' || optionsStore.apiKey === ''">
            <div class="dashboard-title center-both-absolute" style="font-size: 40px;"><el-icon :size="50"><Lock /></el-icon><br>Enter your API key before accessing the dashboard</div>
        </div>
        <div v-else>
            <div class="dashboard-title">Welcome back, {{userStore.user.username}}</div>
            <el-row :gutter="20" justify="space-around" style="width: 100%; margin-bottom: 2rem;">
                <el-col :span="spanAmount"><data-label :icon="Money"   label="Kudos"           :content="userStore.user.kudos"                       color="var(--el-color-success)" /></el-col>
                <el-col :span="spanAmount"><data-label :icon="Picture" label="Requested"       :content="userStore.user.usage?.requests"             color="var(--el-color-danger)"  /></el-col>
                <el-col :span="spanAmount"><data-label :icon="Aim"     label="Fulfilled"       :content="userStore.user.contributions?.fulfillments" color="var(--el-color-primary)" /></el-col>
                <el-col :span="spanAmount"><data-label :icon="Avatar"  label="Total Workers"   :content="userStore.user.worker_count"                color="var(--el-color-warning)" /></el-col>
            </el-row>
            <el-card>
                <template #header><b>Your Workers</b></template>
                <div class="user-workers" v-if="userStore.userWorkers.length !== 0">
                    <WorkerEditor
                        v-for="worker in userStore.userWorkers"
                        :key="worker.id"
                        :worker="worker"
                    />
                </div>
                <div v-else><el-empty description="No Workers Found" /></div>
            </el-card>
        </div>
    </div>
</template>

<style>
.user-workers {
    display:flex;
    flex-direction:row;
    justify-content: center;
    flex-wrap: wrap;
}

.dashboard-title {
    font-size: 50px;
    margin-bottom: 1rem;
    text-align: center;
}

.center-both-absolute {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

@media only screen and (min-width: 1000px) {
    .user-workers {
        gap: 10px;
    }
}

@media only screen and (max-width: 1000px) {
    .dashboard-title {
        font-size: 40px;
    }
}
</style>