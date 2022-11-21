import type { ImageData } from "@/stores/outputs";
import { useGeneratorStore } from '@/stores/generator';
import { inflateRaw } from 'pako';
import { useUIStore } from '../stores/ui';

function mapParams(params: any[]) {
    const paramMap = new Map();
    for (const param of params) {
        const [key, value] = param.split("=");
        // url decode
        const decodedValue = decodeURIComponent(value);
        paramMap.set(key,decodedValue);
    }
    return paramMap;
}

// Fill the 'generateView' if we're given information in the url
const handleUrlParams = function() {
    if (!window.location.search.includes("?"))
        return;

    // Retrieve url params and parse them in a map
    const urlParams = window.location.search.replace("?", "");
    const params = urlParams.split("&");
    let paramMap = mapParams(params);
    console.log("URL params:", paramMap);

    if (paramMap.get("share")) {
        // Decodes base64 string, then turns string to Uint8Array, then decodes the array.
        const newParams = inflateRaw(new Uint8Array(atob(paramMap.get("share")).split("").map(c => c.charCodeAt(0))), { to: "string" });
        if (!newParams) {
            useUIStore().raiseError("Error when trying to decode share parameter!");
            return;
        }
        paramMap = mapParams(newParams.split("&"));
        console.log("Share URL params:", paramMap);
    }

    // Fill ModelGenerationInputStable
    const imageData: ImageData = <ImageData>{
        id: -1,
        image: "",
        prompt: paramMap.get("prompt") || "",
        sampler_name: paramMap.get("sampler_name") || "k_euler",
        seed: paramMap.get("seed") || "",
        modelName: paramMap.get("model_name") || "stable_diffusion",
        steps: Number(paramMap.get("steps") || 30),
        cfg_scale: Number(paramMap.get("cfg_scale") || 7),
        height: Number(paramMap.get("height") || 512),
        width: Number(paramMap.get("width") || 512),
        karras: Boolean(paramMap.get("karras") || true),
        post_processing: paramMap.get("post_processing") ? JSON.parse(paramMap.get("post_processing")) : [],
    }

    // Pass to generator view
    const store = useGeneratorStore();
    store.generateText2Img(imageData);
}

export default handleUrlParams;
