import { CLIENT_AGENT } from "@/constants";
import type { DatasetImagePopResponse, RatePostInput, RatePostResponse } from "@/types/ratings";
import type { AestheticRating, GenerationSubmitted } from "@/types/stable_horde";
import { validateResponse } from "@/utils/validate";
import { useLocalStorage } from "@vueuse/core";
import { defineStore } from "pinia";
import { ref } from "vue";
import { useOptionsStore } from "./options";
import { useUIStore } from "./ui";

export const useRatingStore = defineStore("rating", () => {
    const currentRatingInfo = ref<DatasetImagePopResponse>({});
    const pendingRatingInfo = ref<DatasetImagePopResponse>({});
    const imagesRated = useLocalStorage<number>("ratedImages", 0);
    const kudosEarned = useLocalStorage<number>("ratedImagesKudos", 0);
    const submitted = ref(false);

    async function onInvalidResponse(msg: string) {
        const uiStore = useUIStore();
        uiStore.raiseError(msg, false);
        submitted.value = false;
    }

    async function getNewRating() {
        const optionsStore = useOptionsStore();
        submitted.value = true;
        const response = await fetch("https://ratings.droom.cloud/api/v1/rating/new", {
            headers: {
                apikey: optionsStore.apiKey,
            }
        });
        const json: DatasetImagePopResponse = await response.json();
        if (!validateResponse(response, json, 200, "Failed to get rating", onInvalidResponse)) return;
        submitted.value = false;
        return json;
    }

    async function baseSubmitRating(currentRating: RatePostInput, id: string) {
        const optionsStore = useOptionsStore();
        const response = await fetch("https://ratings.droom.cloud/api/v1/rating/"+id, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                "Client-Agent": "StableUI:1.0:(discord)aqualxx#5004",
                apikey: optionsStore.apiKey,
            },
            body: JSON.stringify(currentRating),
        });
        const json: RatePostResponse = await response.json();
        if (!validateResponse(response, json, 201, "Failed to submit rating", onInvalidResponse)) return;
        imagesRated.value = (imagesRated.value || 0) + 1;
        if (optionsStore.apiKey !== '0000000000' && optionsStore.apiKey !== '') kudosEarned.value = (kudosEarned.value || 0) + (json.reward || 5);
    }

    async function submitRatingHorde(currentRating: AestheticRating, jobId: string) {
        const optionsStore = useOptionsStore();
        const response = await fetch(`${optionsStore.baseURL}/api/v2/generate/rate/`+jobId, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                "Client-Agent": CLIENT_AGENT,
                apikey: optionsStore.apiKey,
            },
            body: JSON.stringify({
                ratings: [currentRating]
            }),
        });
        const json: GenerationSubmitted = await response.json();
        if (!validateResponse(response, json, 200, "Failed to submit rating", onInvalidResponse)) return;
        imagesRated.value = (imagesRated.value || 0) + 1;
        if (optionsStore.apiKey !== '0000000000' && optionsStore.apiKey !== '') kudosEarned.value = (kudosEarned.value || 0) + (json.reward || 5);
    }

    async function updateRatingInfo() {
        if (pendingRatingInfo.value.id) {
            currentRatingInfo.value = pendingRatingInfo.value;
        } else {
            getNewRating().then(ratingInfo => {
                currentRatingInfo.value = ratingInfo || {};
            })
        }
        getNewRating().then(ratingInfo => {
            pendingRatingInfo.value = ratingInfo || {};
        })
    }

    async function submitRating(currentRating: RatePostInput, id: string) {
        submitted.value = true;
        baseSubmitRating(currentRating, id);
        updateRatingInfo();
    }

    return {
        // Variables
        currentRatingInfo,
        imagesRated,
        kudosEarned,
        submitted,
        // Actions
        getNewRating,
        updateRatingInfo,
        baseSubmitRating,
        submitRating,
        submitRatingHorde,
    }
})