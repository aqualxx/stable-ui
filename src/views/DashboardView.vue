<script setup lang="ts">
import {
    ElRow,
    ElCol,
    ElCard,
    ElEmpty,
    ElIcon,
    ElTable,
    ElTableColumn,
    ElScrollbar,
    ElDivider
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
import { useDashboardStore } from '@/stores/dashboard';

const breakpoints = useBreakpoints(breakpointsTailwind);

const breakLabels = breakpoints.smallerOrEqual('xl');
const breakLabelsMore = breakpoints.smallerOrEqual('lg');

const dashStore = useDashboardStore();
const optionsStore = useOptionsStore();

// Max: 24 for each col
const spanLabels = computed(() => breakLabels.value ? breakLabelsMore.value ? 20 : 10 : 5);
const spanAmount = computed(() => breakLabels.value ? 24 : 12);

const sortChange = function(column: any) {
    dashStore.leaderboardOrderProp = column.prop;
    dashStore.leaderboardOrder = column.order;
    dashStore.updateLeaderboard();
}

const signedIn = computed(() => optionsStore.apiKey != '0000000000' && optionsStore.apiKey != '');
</script>

<template>
    <div class="dashboard">
        <div>
            <div v-if="signedIn">
                <div class="dashboard-title">Welcome back, {{dashStore.user.username}}</div>
                <el-row :gutter="breakLabels ? 0 : 20" justify="space-around" style="width: 100%; margin-bottom: 2rem;">
                    <el-col :span="spanLabels" class="label"><data-label style="width: 100%" :icon="Money"   label="Kudos"           :content="dashStore.user.kudos"                       color="var(--el-color-success)" /></el-col>
                    <el-col :span="spanLabels" class="label"><data-label style="width: 100%" :icon="Picture" label="Requested"       :content="dashStore.user.usage?.requests"             color="var(--el-color-danger)"  /></el-col>
                    <el-col :span="spanLabels" class="label"><data-label style="width: 100%" :icon="Aim"     label="Fulfilled"       :content="dashStore.user.contributions?.fulfillments" color="var(--el-color-primary)" /></el-col>
                    <el-col :span="spanLabels" class="label"><data-label style="width: 100%" :icon="Avatar"  label="Total Workers"   :content="dashStore.user.worker_count"                color="var(--el-color-warning)" /></el-col>
                </el-row>                
            </div>
            <div v-else>
                <div class="api-key-required"><el-icon :size="30" style="margin-right: 10px"><Lock /></el-icon>User statistics requires an API key</div>
            </div>
            <el-row :gutter="breakLabels ? 0 : 20" justify="space-around" style="margin-bottom: 2rem;">
                <el-col :span="spanAmount" class="label">
                    <el-card style="margin-bottom: 10px;">
                        <template #header>
                            <strong>Horde Performance</strong>
                        </template>
                        <div>There are <strong>{{dashStore.performance.queued_requests}}</strong> queued requests (<strong>{{dashStore.performance.queued_megapixelsteps}}</strong> MPS) with <strong>{{dashStore.performance.worker_count}}</strong> workers.</div>
                        <div>In the past minute, there have been <strong>{{dashStore.performance.past_minute_megapixelsteps}}</strong> MPS processed.</div>
                    </el-card>
                    <el-card>
                        <template #header>
                            <strong>News</strong>
                        </template>           
                        <el-scrollbar>
                            <div class="news">
                                <div v-for="news in dashStore.news" :key="news.newspiece" style="margin-bottom: 20px">
                                    <e>{{news.date_published}}</e>
                                    <el-divider style="margin: 0 0" />
                                    <div v-html="news.newspiece" />
                                </div>
                            </div>
                        </el-scrollbar>
                    </el-card>
                </el-col>
                <el-col :span="spanAmount" class="label" style="width: 100%">
                    <el-card style="height: 100%">
                        <template #header>
                            <strong>Leaderboard</strong>
                        </template>
                        <el-table style="height: 100%" :data="dashStore.leaderboard" @sort-change="sortChange" :default-sort="{ prop: 'kudos', order: 'descending' }" stripe :size="breakLabelsMore ? 'small' : 'medium' " class="leaderboard">
                            <el-table-column prop="id" label="#" />
                            <el-table-column prop="name" label="User" width="170" />
                            <el-table-column prop="kudos" sortable="custom" label="Kudos" />
                            <el-table-column prop="mps" sortable="custom" label="MPS" :sort-orders="['descending', null]" />
                        </el-table>
                    </el-card>
                </el-col>
            </el-row>
            <el-card v-if="signedIn">
                <template #header><strong>Your Workers</strong></template>
                <div class="user-workers" v-if="dashStore.userWorkers.length !== 0">
                    <WorkerEditor
                        v-for="worker in dashStore.userWorkers"
                        :key="worker.id"
                        :worker="worker"
                    />
                </div>
                <div v-else><el-empty description="No Workers Found" /></div>
            </el-card>
            <div v-else>
                <div class="api-key-required"><el-icon :size="30" style="margin-right: 10px"><Lock /></el-icon>Modifying/viewing user workers requires an API key</div>
            </div>
        </div>
    </div>
</template>

<style>
.user-workers {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    grid-gap: 10px;
    width: 100%;
}

.dashboard-title {
    font-size: 50px;
    margin-bottom: 1rem;
    text-align: center;
}

.api-key-required {
    font-size: 20px;
    margin-bottom: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
}

.center-both-absolute {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.leaderboard {
    width: 100%;
}

.news {
    height: 300px;
}

.news > div > div > p {
    margin-top: 0
}

@media only screen and (max-width: 1000px) {
    .dashboard-title {
        font-size: 40px;
    }
}

@media only screen and (max-width: 1280px) {
    .label {
        margin-bottom: 5px
    }
}
</style>