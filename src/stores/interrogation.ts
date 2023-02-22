import { CLIENT_AGENT } from "@/constants";
import type { RequestInterrogationResponse, ModelInterrogationInputStable, InterrogationStatus } from "@/types/stable_horde";
import { validateResponse } from "@/utils/validate";
import { defineStore } from "pinia";
import { ref } from "vue";
import { useOptionsStore } from "./options";
import { useUIStore } from "./ui";

function sleep(ms: number) {
    return new Promise(res=>setTimeout(res, ms));
}

export interface InterrogationInfo {
    status?: InterrogationStatus;
    id?: string;
    source_image?: string;
    forms_selected?: ("nsfw" | "caption" | "interrogation")[];
    elapsed_seconds?: number;
}

export const useInterrogationStore = defineStore("interrogate", () => {
    const currentInterrogation = ref<InterrogationInfo>({});
    const interrogating = ref(false);
    const possibleForms: ("nsfw" | "caption" | "interrogation")[] = ["nsfw", "caption", "interrogation"];
    const selectedForms = ref<typeof possibleForms>(["nsfw", "caption"]);

    async function onError(msg: string) {
        const uiStore = useUIStore();
        uiStore.raiseError(msg, false);
        interrogating.value = false;
        currentInterrogation.value = {};
    }

    async function interrogateImage() {
        const optionsStore = useOptionsStore();
        const { source_image } = currentInterrogation.value;
        const forms = selectedForms.value;
        if (!source_image) return onError("Failed to get interrogation ID: No image supplied.");
        interrogating.value = true;
        const response = await fetch(`${optionsStore.baseURL}/api/v2/interrogate/async`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                "Client-Agent": CLIENT_AGENT,
                apikey: optionsStore.apiKey,
            },
            body: JSON.stringify(<ModelInterrogationInputStable>{
                source_image: source_image.split(",")[1],
                forms: forms.map(el => ({ name: el })),
            })
        });
        const json: RequestInterrogationResponse = await response.json();
        if (!validateResponse(response, json, 202, "Failed to get interrogation ID", onError)) return;
        currentInterrogation.value.id = json.id;
        currentInterrogation.value.forms_selected = forms;
        currentInterrogation.value.elapsed_seconds = 0;
        while (currentInterrogation.value.status?.state !== "done" && interrogating.value) {
            const t0 = performance.now() / 1000;

            await sleep(2000);
            const status = await getInterrogationStatus();
            if (!status) interrogating.value = false;

            const t1 = performance.now() / 1000;
            currentInterrogation.value.elapsed_seconds += t1 - t0;
        }
        currentInterrogation.value = {
            source_image: currentInterrogation.value.source_image,
        }
    }

    async function getInterrogationStatus() {
        const optionsStore = useOptionsStore();
        interrogating.value = true;
        const response = await fetch(`${optionsStore.baseURL}/api/v2/interrogate/status/${currentInterrogation.value.id}`, {
            headers: {
                'Content-Type': 'application/json',
                "Client-Agent": CLIENT_AGENT,
            }
        });
        const json: InterrogationStatus = await response.json();
        if (!validateResponse(response, json, 200, "Failed to get interrogation status", onError)) return;
        currentInterrogation.value.status = json;
        return json;
    }

    return {
        // Variables
        currentInterrogation,
        interrogating,
        selectedForms,
        // Constants
        possibleForms,
        // Actions
        interrogateImage,
        getInterrogationStatus,
    }
})