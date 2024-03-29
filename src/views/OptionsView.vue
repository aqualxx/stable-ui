<script setup lang="ts">
import {
    ElForm,
    ElFormItem,
    ElInput,
    ElButton,
    type UploadFile,
    ElIcon,
    ElUpload,
    ElTabs,
    ElTabPane,
    ElTooltip,
    ElLoading,
    vLoading,
    ElMessage,
} from 'element-plus';
import {
    UploadFilled,
    Download
} from '@element-plus/icons-vue';
import { useOptionsStore } from '@/stores/options';
import { useWorkerStore } from '@/stores/workers';
import { useTagsStore } from '@/stores/tags';
import type { BasicColorSchema } from '@vueuse/core';
import FormSlider from '../components/FormSlider.vue';
import FormSelect from '../components/FormSelect.vue';
import FormRadio from '../components/FormRadio.vue';
import { ref } from 'vue';
import { useOutputStore } from '@/stores/outputs';
import { downloadMultipleImages } from '@/utils/download';
import { db } from '@/utils/db';

const tagStore = useTagsStore();
const store = useOptionsStore();
const outputsStore = useOutputStore();
const workerStore = useWorkerStore();

interface ColorModeOption {
    value: BasicColorSchema;
    label: string;
}

const options: ColorModeOption[] = [
    {
        value: 'dark',
        label: 'Dark',
    }, {
        value: 'light',
        label: 'Light',
    }, {
        value: 'auto',
        label: 'Auto',
    }
]

const fileList = ref([]);
const upload = ref();
const downloading = ref(false);
const downloaded = ref(0);

async function handleChange(uploadFile: UploadFile) {
    outputsStore.importFromZip(uploadFile);
    upload.value!.clearFiles();
}

async function bulkDownload() {
    ElMessage({
        message: `Downloading ${outputsStore.outputsLength} image(s)... (this may take a while)`,
        type: 'info',
    })
    downloading.value = true;
    downloaded.value = 0;

    const selectedOutputs = await db.outputs.toCollection().primaryKeys();
    await downloadMultipleImages(selectedOutputs, false, () => { downloaded.value++ });

    downloading.value = false;
    downloaded.value = 0;
}

async function onTagsChange() {
    if (tagStore.tagsTypes[tagStore.currentTagsType].tags.length !== 0) return;
    tagStore.loadTags(tagStore.currentTagsType);
}
</script>

<template>
    <h1>Options</h1>
    <el-form
        label-position="top"
        :model="store.options"
        @submit.prevent
    >
        <el-tabs type="border-card" style="min-height: 50vh;">
            <el-tab-pane label="🖨️ Generation">
                <h2>Generation Options</h2>
                <el-form-item label="API Key" prop="apiKey">
                    <el-input
                        v-model="store.apiKey"
                        type="password"
                        placeholder="Enter API Key Here"
                        autocomplete="off"
                        class="apikey"
                        show-password
                    />
                    <el-button class="anon" @click="store.useAnon()">Anon?</el-button>
                </el-form-item>
                <form-select label="Tag Autocomplete" prop="tagAutocomplete" v-model="tagStore.currentTagsType" :options="tagStore.possibleTags" @change="onTagsChange" v-loading="tagStore.tagsLoading" info="Use the up and down arrow keys to scroll through tag options then press 'Enter' to insert it into the prompt." />
                <form-select label="Use Specific Worker" prop="worker" v-model="store.useWorker" :options="['None', ...workerStore.workers.map(el => {return {label: `${el.name} (${el.performance?.split(' ')[0]} MPS/s, ${Math.floor(Math.sqrt(el.max_pixels || 0))}x${Math.floor(Math.sqrt(el.max_pixels || 0))})`, value: el.id}}).sort((a,b) => (a.label || '').localeCompare(b.label || ''))]" filterable />
                <form-radio  label="Larger Values" prop="allowLargerParams" v-model="store.allowLargerParams" :options="['Enabled', 'Disabled']" info="Allows use of larger step values and dimension sizes if you have the kudos on hand." :disabled="store.apiKey === '0000000000' || store.apiKey === ''" />
                <form-radio  label="Share Generated Images with LAION" prop="shareWithLaion" v-model="store.shareWithLaion" :options="['Enabled', 'Disabled']" info="Automatically and anonymously share images with LAION (the non-profit that created the dataset that was used to train Stable Diffusion) for use in aesthetic training in order to improve future models. See the announcement at https://discord.com/channels/781145214752129095/1020707945694101564/1061980573096226826 for more information. NOTE: This option is automatically enabled for users without a valid API key. " :disabled="store.apiKey === '0000000000' || store.apiKey === ''" />
            </el-tab-pane>
            <el-tab-pane label="📷 Images">
                <h2>Image Options</h2>
                <form-slider label="Images Per Page" prop="pageSize" v-model="store.pageSize" :min="10" :max="50" :step="5" :disabled="store.pageless === 'Enabled'" />
                <form-radio  label="Pageless Format" prop="pageless" v-model="store.pageless" :options="['Enabled', 'Disabled']" />
                <form-radio  label="Carousel Auto Cycle" prop="autoCarousel" v-model="store.autoCarousel" :options="['Enabled', 'Disabled']" />
                <form-radio  label="Image Download Format" prop="downloadType" v-model="store.imageDownloadType" :options="['WEBP', 'PNG', 'JPG']" />
                <el-form-item label="Export Images (ZIP File)">
                    <el-button :icon="Download" @click="bulkDownload()" v-if="!downloading">Download {{outputsStore.outputsLength}} image(s)</el-button>
                    <el-button :icon="Download" disabled v-else>Downloading... ({{downloaded}} / {{outputsStore.outputsLength}} image(s))</el-button>
                </el-form-item>
                <el-form-item label="Import Images (ZIP File)">
                    <el-upload
                        drag
                        ref="upload"
                        :auto-upload="false"
                        @change="handleChange"
                        :file-list="fileList"
                        :limit="1"
                        multiple
                    >
                        <el-icon :size="100"><upload-filled /></el-icon>
                        <div>Drop file here OR <em>click to upload</em></div>
                    </el-upload>
                </el-form-item>
            </el-tab-pane>
            <el-tab-pane label="⚙️ General">
                <h2>General Options</h2>
                <form-select label="Color Scheme" prop="colorScheme" v-model="store.options.colorMode" :options="options" />
            </el-tab-pane>
            <el-tab-pane disabled>
                <template #label>
                    <el-tooltip content="No running experiments!">🧪 Experimental</el-tooltip>
                </template>
                <h2>Experimental Options</h2>
                <!--<form-radio label="Beta Testing" prop="betaTesting" v-model="store.useBeta" :options="['Enabled', 'Disabled']" info="Enables the beta channel for Stable Horde testing. WARNING: This beta channel is bleeding edge and may not function as intended. If you don't know what this is, leave this disabled." />-->
                <!--<form-radio label="Utilize Cloudflare" prop="useCloudflare" v-model="store.useCloudflare" :options="['Enabled', 'Disabled']" info="An experimental feature to retrieve potentially lossless images from the Horde by using Cloudflare. Note: not all workers support this feature at the moment - generation times may be slower." />-->
            </el-tab-pane>
        </el-tabs>
    </el-form>
</template>  

<style scoped>
.anon {
    width: 80px
}

.el-tab-pane {
    max-width: 600px;
}

h2 {
    margin-top: 0
}

.apikey {
    width: calc(100% - 80px)
}

@media only screen and (max-width: 1000px) {
    .anon {
        width: 80px
    }

    .apikey {
        width: 100%
    }
}
</style>