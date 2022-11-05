<script setup lang="ts">
import { useWorkerStore } from '@/stores/workers';
import {
    ElEmpty,
    ElTabs,
    ElTabPane
} from 'element-plus';
import { ref } from 'vue';
import WorkerBox from '../components/WorkerBox.vue';
import TeamBox from '../components/TeamBox.vue';

const store = useWorkerStore();

const activeName = ref('workers');
</script>

<template>
    <el-tabs v-model="activeName">
        <el-tab-pane label="Workers" name="workers">
            <div class="workers">
                <div class="workers" v-if="store.workers.length != 0">
                    <WorkerBox
                        v-for="worker in store.workers.sort((a, b) => (b.info ? b.info.length : 0) - (a.info ? a.info.length : 0))"
                        :key="worker.id"
                        :worker="worker"
                    />
                </div>
                <div v-if="store.workers.length == 0">
                    <el-empty description="No Workers Found" />
                </div>
            </div>
        </el-tab-pane>
        <el-tab-pane label="Teams" name="teams">
            <div class="workers" v-if="store.workers.length != 0">
                <TeamBox
                    v-for="team in store.teams"
                    :key="team.id"
                    :top="store.teams.sort((a, b) => (b.requests_fulfilled as number) - (a.requests_fulfilled as number))[0] === team"
                    :team="team"
                />
            </div>
            <div v-if="store.workers.length == 0">
                <el-empty description="No Teams Found" />
            </div>
        </el-tab-pane>
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
</style>