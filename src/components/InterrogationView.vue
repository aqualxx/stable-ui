<script setup lang="ts">
import {
    ElButton,
    ElUpload,
    ElIcon,
    ElCheckbox,
    ElCheckboxGroup,
    ElImage,
    type UploadFile,
    type UploadRawFile,
} from 'element-plus';
import {
    UploadFilled,
    Refresh,
} from '@element-plus/icons-vue';
import { computed, ref } from 'vue';
import { useInterrogationStore } from '@/stores/interrogation';
import { convertToBase64 } from '@/utils/base64';
import { useGeneratorStore } from '@/stores/generator';
import { useUIStore } from '@/stores/ui';
import { useEllipsis } from '@/utils/useEllipsis';

const store = useInterrogationStore();
const genStore = useGeneratorStore();
const uiStore = useUIStore();

const upload = ref();

async function handleChange(uploadFile: UploadFile) {
    upload.value!.clearFiles();
    if (!(uploadFile.raw as UploadRawFile).type.includes("image")) {
        uiStore.raiseError("Uploaded file needs to be a image!", false);
        return;
    }
    const base64File = await convertToBase64(uploadFile.raw as UploadRawFile) as string;
    store.currentInterrogation.source_image = base64File;
    store.interrogateImage();
}

function useInterrogationCaption() {
    genStore.generateText2Img({
        prompt: captionForm.value?.result?.caption,
    } as any);
}

function useInterrogation() {
    genStore.generateText2Img({
        prompt: interrogationAsPrompt.value,
    } as any);
}

const nsfwForm = computed(() => store.getFormStatus('nsfw'));
const captionForm = computed(() => store.getFormStatus('caption'));
const interrogationForm = computed(() => store.getFormStatus('interrogation'));

const showWarning = computed(() =>
    !store.currentInterrogation?.status?.forms?.every(el => el.state === 'done') &&
    (store.currentInterrogation.elapsed_seconds || 0) > 300
)

const interrogationAsPrompt = computed(() => {
    if (!interrogationForm.value?.result?.interrogation) return "";
    return Object.values(interrogationForm.value.result.interrogation)
        .flat()
        .sort((a, b) => b.confidence - a.confidence)
        .map(el => el.text)
        .join(", ")
})

const { ellipsis } = useEllipsis();
</script>

<template>
    <el-checkbox-group v-model="store.selectedForms" class="interrogation-form-select">
        <el-checkbox v-for="form in store.possibleForms" :key="form" :label="form">
            <span>{{ form }}</span>
            <span class="danger">{{ form === "interrogation" ? " (warning: may not fulfill)" : "" }}</span>
        </el-checkbox>
    </el-checkbox-group>
    <div v-if="!store.currentInterrogation.source_image" style="margin-top: 16px;">
        <strong v-if="!store.selectedForms.length" class="danger">Choose an interrogation option to proceed!</strong>
        <div :style="store.selectedForms.length ? '' : { pointerEvents: 'none', opacity: 0.5 }">
            <el-upload
                @change="handleChange"
                :auto-upload="false"
                :limit="1"
                :disabled="!store.selectedForms.length"
                class="interrogation-upload"
                ref="upload"
                multiple
                drag
            >
                <el-icon :size="100"><upload-filled /></el-icon>
                <div>Drop file here OR <em>click to upload</em></div>
            </el-upload>
        </div>
    </div>
    <div v-else-if="!store.currentInterrogation.status" style="margin-top: 16px;">
        <strong>Uploading image{{ellipsis}}</strong>
    </div>
    <div v-else>
        <div style="margin-top: 8px">
            <el-button :icon="Refresh" @click="store.resetInterrogation">New Interrogation</el-button>
            <el-button :icon="Refresh" @click="useInterrogationCaption" :disabled="captionForm?.processing" v-if="captionForm">Text2Img (Caption)</el-button>
            <el-button :icon="Refresh" @click="useInterrogation"  :disabled="interrogationForm?.processing" v-if="interrogationForm">Text2Img (Interrogation)</el-button>
        </div>
        <h2 style="margin: 16px 0 8px 0;">Interrogation Results</h2>
        <el-image :src="store.currentInterrogation.source_image" alt="Uploaded Image" />
        <div class="danger" v-if="showWarning">
            <strong>Interrogation is taking longer than expected and may not fulfill.</strong>
        </div>
        <div v-if="nsfwForm">
            <h3>NSFW</h3>
            <div v-if="nsfwForm.processing">Processing{{ellipsis}}</div>
            <div v-else>This image is predicted to be <strong>{{ nsfwForm?.result?.nsfw ? "not safe for work" : "safe for work" }}</strong>.</div>
        </div>
        <div v-if="captionForm">
            <h3>Caption</h3>
            <div v-if="captionForm.processing">Processing{{ellipsis}}</div>
            <div v-else><strong>{{ captionForm?.result?.caption }}</strong></div>
        </div>
        <div v-if="interrogationForm">
            <h3>Interrogation</h3>
            <div v-if="interrogationForm.processing">Processing{{ellipsis}}</div>
            <div v-else>
                <div style="margin-bottom: 8px;">As a prompt: "{{ interrogationAsPrompt }}"</div>
                <div v-for="[subject, tags] in Object.entries(interrogationForm?.result?.interrogation || {})" :key="subject">
                    <strong>{{ subject }}</strong>
                    <div v-for="tag in tags" :key="tag.text" style="margin-left: 8px;">
                        {{ tag.text }} - <strong>{{ tag.confidence?.toFixed(2) }}%</strong>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
h3 {
    margin-bottom: 0;
}

.interrogation-form-select {
    display: inline-flex;
    flex-direction: column;
}

.interrogation-upload {
    max-width: 720px;
}

.danger {
    color: var(--el-color-danger);
}
</style>