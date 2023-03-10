<script setup lang=ts>
import { ref } from "vue";
import {
    ElButton,
    ElDialog,
    ElForm,
    ElSwitch,
    ElFormItem,
    ElInput,
    ElMessageBox
} from 'element-plus';
import WorkerBox from './WorkerBox.vue';
import FormSelect from './FormSelect.vue';
import type { ModifyWorkerInput, WorkerDetails } from "@/types/stable_horde";
import { useWorkerStore } from "@/stores/workers";
import { useOptionsStore } from "@/stores/options";
import { validateResponse } from "@/utils/validate";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
    worker: WorkerDetails;
}>();

const emit = defineEmits(["updated"]);

const workerStore = useWorkerStore();
const optionsStore = useOptionsStore();

async function updateWorkerOptions(body: ModifyWorkerInput) {
    const response = await fetch(`${optionsStore.baseURL}/api/v2/workers/${props.worker?.id}`, {
        method: "PUT",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json",
            apikey: optionsStore.apiKey
        }
    });
    const resJSON = await response.json();
    if (!validateResponse(response, resJSON, 200, "Failed to modify worker")) return false;
    emit("updated", props.worker?.id);
    return resJSON;
}

let deleteTimer = ref<any>(undefined);

function deleteWorker() {
    ElMessageBox.confirm(
        "This action will permanently delete this worker. Continue?",
        'Delete Worker?',
        {
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel',
            type: 'warning',
        }
    ).then(() => {
        deleteTimer.value = setTimeout(async () => {
            const response = await fetch(`${optionsStore.baseURL}/api/v2/workers/${props.worker?.id}`, {
                method: "DELETE",
                headers: {
                    apikey: optionsStore.apiKey
                }
            });
            const resJSON = await response.json();
            if (!validateResponse(response, resJSON, 200, "Failed to delete worker")) return false;
            workerStore.updateWorkers();
            dialogOpen.value = false;
        }, 60 * 1000)
    })
}

function cancelDeleteWorker() {
    clearTimeout(deleteTimer.value);
    deleteTimer.value = undefined;
}

const dialogOpen = ref(false);
const workerOptions = ref<ModifyWorkerInput>({
    maintenance: props.worker?.maintenance_mode,
    info: props.worker.info,
    name: props.worker.name,
    team: props.worker.team?.id === null ? '' : props.worker.team?.id,
})
</script>

<template>
    <WorkerBox
        v-if="worker != undefined"
        :worker="worker"
    >
        <template #header>
            <el-button @click="dialogOpen = true">Edit Worker</el-button>
            <el-dialog
                v-model="dialogOpen"
                :title="worker.name"
                style="min-height: 500px; width: 600px;"
                align-center
            >
                <el-form label-width="140px" :model="workerOptions" label-position="left" @submit.prevent>
                    <el-form-item label="Change Name">
                        <div style="font-size: 13px; word-break: keep-all;">Make sure to stop the worker first and then edit bridgeData.py!</div>
                        <el-input
                            v-model="workerOptions.name"
                            placeholder="Enter new name here" 
                            style="width: 80%; min-width: 200px"
                        />
                        <el-button @click="updateWorkerOptions({ name: workerOptions.name })">Submit</el-button>
                    </el-form-item>
                    <el-form-item label="Info">
                        <el-input
                            v-model="workerOptions.info"
                            :autosize="{ minRows: 2, maxRows: 10 }"
                            clearable
                            resize="none"
                            type="textarea"
                            style="width: 80%; word-break:keep-all; min-width: 200px;"
                            maxlength="1000"
                            placeholder="Enter new info here"
                        />
                        <el-button @click="updateWorkerOptions({ info: workerOptions.info })">Submit</el-button>
                    </el-form-item>
                    <FormSelect
                        label="Team"
                        prop="team"
                        v-model="workerOptions.team"
                        :options="[
                            {label: 'None', value: ''},
                            ...workerStore.teams.map(el => {return {label: el.name, value: el.id}})
                        ]"
                        @change="updateWorkerOptions({ team: workerOptions.team })"
                    />
                    <el-form-item label="Maintenance Mode">
                        <el-switch v-model="workerOptions.maintenance" @change="updateWorkerOptions({ maintenance: workerOptions.maintenance })" />
                    </el-form-item>
                    <el-form-item label="Delete Worker">
                        <el-button type="danger" v-if="deleteTimer == undefined" @click="deleteWorker">Remove</el-button>
                        <el-button type="danger" v-if="deleteTimer != undefined" @click="cancelDeleteWorker">Cancel Remove (60s timer)</el-button>
                    </el-form-item>
                </el-form>
            </el-dialog>
        </template>
    </WorkerBox>
</template>