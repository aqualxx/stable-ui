import { useLocalStorage } from "@vueuse/core";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useUIStore } from "./ui";

export type TagListType = "none" | "e621" | "danbooru";

export interface Tags {
    type: string;
    tags: TagList[];
}

export interface TagList {
    name: string;
    color: string;
    postCount: number;
    aliases: string;
}

export interface TagTypes {
    e621: Tags;
    danbooru: Tags;
    none: Tags;
}

export const useTagsStore = defineStore("tags", () => {
    const possibleTags: TagListType[] = ["none", "danbooru", "e621"];
    const currentTagsType = useLocalStorage<TagListType>("tagsType", "none");
    const tagsLoading = ref(false);
    const tagsTypes = ref<TagTypes>({
        none: {
            type: "none",
            tags: [],
        },
        danbooru: {
            type: "danbooru",
            tags: [],
        },
        e621: {
            type: "e621",
            tags: [],
        },
    })

    const currentTags = computed(() => tagsTypes.value[currentTagsType.value])

    const colourFormatting = {
        "danbooru": {
            "-1": ["red", "maroon"],
            "0": ["lightblue", "dodgerblue"],
            "1": ["indianred", "firebrick"],
            "3": ["violet", "darkorchid"],
            "4": ["lightgreen", "darkgreen"],
            "5": ["orange", "darkorange"]
        },
        "e621": {
            "-1": ["red", "maroon"],
            "0": ["lightblue", "dodgerblue"],
            "1": ["gold", "goldenrod"],
            "3": ["violet", "darkorchid"],
            "4": ["lightgreen", "darkgreen"],
            "5": ["tomato", "darksalmon"],
            "6": ["red", "maroon"],
            "7": ["whitesmoke", "black"],
            "8": ["seagreen", "darkseagreen"]
        },
    }

    function getTagColor(type: "e621" | "danbooru", index: string) {
        return (colourFormatting?.[type] as any)?.[index]?.[0] || "red";
    }

    async function getTags(type: TagListType): Promise<TagList[]> {
        if (type === "none") {
            return [];
        }

        tagsLoading.value = true;

        const tagsBaseURL = "https://raw.githubusercontent.com/aqualxx/a1111-sd-webui-tagcomplete/"
        let tagsResponse: Response | undefined;
        if (type === "danbooru") {
            tagsResponse = await fetch(`${tagsBaseURL}main/tags/danbooru.csv`); 
        } 
        if (type === "e621") {
            tagsResponse = await fetch(`${tagsBaseURL}main/tags/e621.csv`);
        }

        if (!tagsResponse) {
            useUIStore().raiseWarning("Tag autocomplete failed to load!", false)
            tagsLoading.value = false;
            return [];
        }
        
        const csv = await tagsResponse.text();
        const tags = 
            csv.split("\n")
                .filter(el => el !== "")
                .map(el => el.split(","))
                .map(el => ({
                    name: el[0],
                    color: getTagColor(type, el[1]),
                    postCount: parseInt(el[2]),
                    aliases: el.slice(3, el.length).join(",").replace('"', "")
                }))
                .sort((a,b) => a.name.localeCompare(b.name));

        tagsLoading.value = false;
        
        return tags;
    }

    async function loadTags(tagType: TagListType) {
        // TODO: use IndexedDB as a cache
        tagsTypes.value[tagType].tags = await getTags(tagType);
    }

    loadTags(currentTagsType.value);
    
    return {
        // Constants
        possibleTags,
        colourFormatting,
        // Variables
        currentTagsType,
        tagsLoading,
        tagsTypes,
        // Computed
        currentTags,
        // Functions
        getTags,
        loadTags,
    }
})