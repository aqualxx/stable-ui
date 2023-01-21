import type { DatasetImagePopResponse, RatePostInput, RatePostResponse } from "@/types/ratings";
import { validateResponse } from "@/utils/validate";
import { useLocalStorage } from "@vueuse/core";
import { defineStore } from "pinia";
import { ref } from "vue";
import { useOptionsStore } from "./options";
import { useUIStore } from "./ui";

export const useRatingStore = defineStore("rating", () => {
    const currentRatingInfo = ref<DatasetImagePopResponse>({});
    const currentRating = ref<RatePostInput>({
        rating: 5,
        artifacts: 1,
    })
    const imagesRated = useLocalStorage<number>("ratedImages", 0);
    const kudosEarned = useLocalStorage<number>("ratedImagesKudos", 0);
    const submitted = ref(false);

    const rating = [
        null,
        "No Flaws",
        "Hardly Recognizable",
        "Minor",
        "Noticeable",
        "Major",
        "Significant",
    ]

    async function onInvalidResponse(msg: string) {
        const uiStore = useUIStore();
        uiStore.raiseError(msg, false);
        submitted.value = false;
    }

    async function getNewRating() {
        const optionsStore = useOptionsStore();
        if (optionsStore.apiKey === '0000000000' || optionsStore.apiKey === '') return;
        currentRatingInfo.value.url = "";
        submitted.value = true;
        const response = await fetch("https://ratings.droom.cloud/api/v1/rating/new", {
            headers: {
                apikey: optionsStore.apiKey,
            }
        });
        const json: DatasetImagePopResponse = await response.json();
        if (!validateResponse(response, json, 200, "Failed to get rating", onInvalidResponse)) return;
        currentRatingInfo.value = json;
        submitted.value = false;
    }

    async function sumbitRating() {
        const optionsStore = useOptionsStore();
        if (optionsStore.apiKey === '0000000000' || optionsStore.apiKey === '') return;
        submitted.value = true;
        const response = await fetch("https://ratings.droom.cloud/api/v1/rating/"+currentRatingInfo.value.id, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                "Client-Agent": "StableUI:1.0:(discord)aqualxx#5004",
                apikey: optionsStore.apiKey,
            },
            body: JSON.stringify({
                rating: currentRating.value.rating,
                artifacts: (currentRating.value.artifacts || 1) - 1,
            }),
        });
        const json: RatePostResponse = await response.json();
        if (!validateResponse(response, json, 201, "Failed to submit rating", onInvalidResponse)) return;
        imagesRated.value = (imagesRated.value || 0) + 1;
        kudosEarned.value = (kudosEarned.value || 0) + (json.reward || 5);
        getNewRating();
    }

    return {
        // Variables
        currentRatingInfo,
        currentRating,
        imagesRated,
        kudosEarned,
        submitted,
        // Constants
        rating,
        // Actions
        getNewRating,
        sumbitRating,
    }
})