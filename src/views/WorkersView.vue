<script setup lang="ts">
import { useWorkerStore } from '@/stores/workers';
import {
    ElEmpty,
    ElTabs,
    ElTabPane
} from 'element-plus';
import WorkerBox from '../components/WorkerBox.vue';
import TeamBox from '../components/TeamBox.vue';
import ModelBox from '@/components/ModelBox.vue';
import SortWorkers from '@/components/SortWorkers.vue';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.smallerOrEqual('lg');
const store = useWorkerStore();
</script>

<template>
    <el-tabs v-model="store.activeTab">
        <el-tab-pane label="Workers" name="workers">
            <sort-workers mobile v-if="isMobile" />
            <div class="workers">
                <div class="workers" v-if="store.sortedWorkers.length != 0">
                    <WorkerBox
                        v-for="worker in store.sortedWorkers"
                        :key="worker.id"
                        :worker="worker"
                    />
                </div>
                <div v-else>
                    <el-empty description="No Workers Found" />
                </div>
            </div>
        </el-tab-pane>
        <el-tab-pane label="Teams" name="teams">
            <sort-workers mobile v-if="isMobile" />
            <div class="workers" v-if="store.sortedTeams.length != 0">
                <TeamBox
                    v-for="team in store.sortedTeams"
                    :key="team.id"
                    :top="store.teams.sort((a, b) => (b.requests_fulfilled as number) - (a.requests_fulfilled as number))[0] === team"
                    :team="team"
                />
            </div>
            <div v-else>
                <el-empty description="No Teams Found" />
            </div>
        </el-tab-pane>
        <el-tab-pane label="Models" name="models">
            <sort-workers mobile v-if="isMobile" />
            <div class="workers" v-if="store.sortedModels.length != 0">
                <ModelBox
                    v-for="model in store.sortedModels"
                    :key="model.name"
                    :model="model"
                />
            </div>
            <div v-else>
                <el-empty description="No Models Found" />
            </div>
        </el-tab-pane>
        <el-tab-pane disabled v-if="!isMobile"><template #label><sort-workers /></template></el-tab-pane>
    </el-tabs>
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
    @media only screen and (min-width: 1280px) {
        :deep(.el-tabs__nav) {
            width: 100%;
        }

        :deep(.el-tabs__item.is-top:last-child) {
            padding: 0 20px;
            float: right;
        }
    }
</style>