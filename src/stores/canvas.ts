import { defineStore } from "pinia";
import { computed, ref, toRefs } from "vue";
import { useGeneratorStore } from "./generator";
import { fabric } from "fabric";

export const useCanvasStore = defineStore("canvas", () => {
    interface ICanvasParams {
        canvas: fabric.Canvas | undefined;
        brush: fabric.BaseBrush | undefined;
        visibleImageLayer: fabric.Group | undefined;
        imageLayer: fabric.Canvas | undefined;
        visibleDrawLayer: fabric.Group | undefined;
        drawLayer: fabric.Canvas | undefined;
        cropPreviewLayer: fabric.Group | undefined;
        maskPathColor: string;
        maskBackgroundColor: string;
        imageScale: number;
        undoHistory: IHistory[];
        redoHistory: IHistory[];
        drawing: boolean;
    }

    const defaultCanvasParams = (): ICanvasParams => ({
        canvas: undefined,
        brush: undefined,
        visibleImageLayer: undefined,
        imageLayer: undefined,
        visibleDrawLayer: undefined,
        drawLayer: undefined,
        cropPreviewLayer: undefined,
        maskPathColor: "",
        maskBackgroundColor: "",
        imageScale: 1,
        undoHistory: [],
        redoHistory: [],
        drawing: false, 
    })

    const inpainting = ref<ICanvasParams>({
        ...defaultCanvasParams(),
        maskPathColor: "white",
        maskBackgroundColor: "black",
    });

    const img2img = ref<ICanvasParams>({
        ...defaultCanvasParams(),
        maskPathColor: "black",
        maskBackgroundColor: "white",
    });

    const usingInpainting = computed(() => {
        const store = useGeneratorStore();
        return store.generatorType === "Inpainting";
    })
    
    const imageProps = computed(() => usingInpainting.value ? inpainting.value : img2img.value);
    const generatorImageProps = computed(() => useGeneratorStore().currentImageProps);

    const {
        canvas,
        brush,
        visibleImageLayer,
        imageLayer,
        visibleDrawLayer,
        drawLayer,
        cropPreviewLayer,
        maskPathColor,
        maskBackgroundColor,
        imageScale,
        undoHistory,
        redoHistory,
    } = toRefs(imageProps.value);

    const drawing = computed({
        get: () => imageProps.value.drawing && !usingInpainting.value,
        set: (value) => imageProps.value.drawing = value
    })

    const width = ref(512);
    const height = ref(512);
    const erasing = ref(false);
    const brushSize = ref(30);
    const showCropPreview = ref(false);
    const outlineLayer  = new fabric.Circle({
        radius: brushSize.value,
        left: 0,
        originX: "center",
        originY: "center",
        angle: 0,
        fill: "",
        stroke: "red",
        strokeWidth: 3,
        opacity: 0,
    });
    const switchToolText = ref("Erase");
    const drawColor = ref("rgb(0, 0, 0, 1)");

    interface IHistory {
        path: fabric.Path;
        drawPath?: fabric.Path;
        visibleDrawPath?: fabric.Path;
    }

    function updateCanvas() {
        if (!canvas.value) return;
        canvas.value.renderAll();
    }

    function flipErase() {
        erasing.value = !erasing.value;
        switchToolText.value = erasing.value ? "Draw" : "Erase";
    }

    function setBrush(color: string | null = null) {
        if (!canvas.value) return;
        brush.value = canvas.value.freeDrawingBrush;
        brush.value.color = color || brush.value.color;
        brush.value.width = brushSize.value;
    }

    interface pathCreateOptions {
        history?: IHistory;
        erase?: boolean;
        draw?: boolean;
    }

    async function pathCreate({history, erase = false, draw = false}: pathCreateOptions = {}) {
        if (!history) return; 
        if (!drawLayer.value) return;
        if (!visibleDrawLayer.value) return;
        if (!imageLayer.value) return;
        if (!visibleImageLayer.value) return;
        if (!canvas.value) return;

        history.path.selectable = false;
        history.path.opacity = 1;

        history.drawPath  = await asyncClone(history.path) as fabric.Path;
        history.visibleDrawPath = await asyncClone(history.path) as fabric.Path;

        if (erase) {
            history.visibleDrawPath.globalCompositeOperation = 'destination-out';
            history.drawPath.stroke = maskBackgroundColor.value;
        } else {
            history.visibleDrawPath.globalCompositeOperation = 'source-over';
            history.drawPath.stroke = draw ? drawColor.value : maskPathColor.value;
        }
        let scaledDrawPath = await asyncClone(history.drawPath) as fabric.Path;
        scaledDrawPath = scaledDrawPath.scale(imageScale.value) as fabric.Path;
        scaledDrawPath.left = (scaledDrawPath.left as number) + (history.drawPath.left as number) * (imageScale.value - 1);
        scaledDrawPath.top = (scaledDrawPath.top as number) + (history.drawPath.top as number) * (imageScale.value - 1);
        if (draw) {
            imageLayer.value.add(scaledDrawPath);
            visibleImageLayer.value.addWithUpdate(history.visibleDrawPath);
        } else {
            drawLayer.value.add(scaledDrawPath);
            visibleDrawLayer.value.addWithUpdate(history.visibleDrawPath);
        }

        canvas.value.remove(history.path);
        updateCanvas();
    }

    function redoAction() {
        if (undoHistory.value.length === 0) return;
        const path = undoHistory.value.pop() as IHistory;
        pathCreate({history: path, erase: false, draw: drawing.value});
        redoHistory.value.push(path);
    }

    function undoAction() {
        if (redoHistory.value.length === 0) return;
        if (!drawLayer.value) return;
        if (!visibleDrawLayer.value) return;
        if (!imageLayer.value) return;
        if (!visibleImageLayer.value) return;
        if (!canvas.value) return;
        const path = redoHistory.value.pop() as IHistory;
        undoHistory.value.push(path);
        if (drawing.value) {
            imageLayer.value.remove(path.drawPath as fabric.Path);
            visibleImageLayer.value.remove(path.visibleDrawPath as fabric.Path);  
        } else {
            drawLayer.value.remove(path.drawPath as fabric.Path);
            visibleDrawLayer.value.remove(path.visibleDrawPath as fabric.Path);  
        }
        delete path.drawPath; 
        delete path.visibleDrawPath;
        updateCanvas();
    }

    function createNewCanvas(canvasElement: string) {
        canvas.value = new fabric.Canvas(canvasElement, {
            isDrawingMode: false,
            width: width.value,
            height: height.value,
            backgroundColor: "white"
        });
        canvas.value.selection = false;
        canvas.value.freeDrawingCursor = "crosshair";
        setBrush(maskPathColor.value);
        canvas.value.on("mouse:move", onMouseMove);
        canvas.value.on("path:created", onPathCreated);
        updateCanvas();
    }

    function scaleImageTo(image: fabric.Image, widthAmount: number, heightAmount: number, minDimensions: number) {
        let newHeight = minDimensions;
        let newWidth = minDimensions;
        if (widthAmount > heightAmount) {
            image.scaleToWidth(minDimensions);
            newHeight = minDimensions * (height.value / width.value);
        } else {
            image.scaleToHeight(minDimensions);
            newWidth = minDimensions * (width.value / height.value);
        }
        return { newHeight, newWidth };
    }

    function newImage(image: fabric.Image) {
        const store = useGeneratorStore();
        resetCanvas();
        image.selectable = false;
        width.value = image.width as number;
        height.value = image.height as number;

        if (width.value > store.maxDimensions || height.value > store.maxDimensions) {
            const { newHeight, newWidth } = scaleImageTo(image, width.value, height.value, store.maxDimensions);
            width.value = newWidth;
            height.value = newHeight;
        }

        if (width.value < store.minDimensions || height.value < store.minDimensions) {
            const { newHeight, newWidth } = scaleImageTo(image, width.value, height.value, store.minDimensions);
            width.value = newWidth;
            height.value = newHeight;
        }

        const visibleDimensions = 512;

        image.cloneAsImage((clonedImage: fabric.Image) => {
            // Scaling relative to the downsized visible image layer
            if (width.value > height.value) {
                imageScale.value = width.value / visibleDimensions;
            } else {
                imageScale.value = height.value / visibleDimensions;
            }
            imageLayer.value = makeInvisibleLayer({image: clonedImage, layerHeight: clonedImage.height, layerWidth: clonedImage.width});
        })

        image.cloneAsImage((clonedImage: fabric.Image) => {
            if (!canvas.value) return;
            if (width.value !== visibleDimensions || height.value !== visibleDimensions) {
                const { newHeight, newWidth } = scaleImageTo(clonedImage, width.value, height.value, visibleDimensions);
                width.value = newWidth;
                height.value = newHeight;
            }
            canvas.value.setWidth(width.value);
            canvas.value.setHeight(height.value);
            canvas.value.isDrawingMode = true;
    
            visibleDrawLayer.value = makeNewLayer();
            visibleImageLayer.value = makeNewLayer({image:clonedImage});
            drawLayer.value = makeInvisibleLayer();
            const scaledWidth = width.value * imageScale.value;
            const scaledHeight = height.value * imageScale.value;
            store.params.width = scaledWidth - (scaledWidth % 64);
            store.params.height = scaledHeight - (scaledHeight % 64);
            visibleDrawLayer.value.set("opacity", 0.8);
            canvas.value.add(visibleImageLayer.value);
            canvas.value.add(visibleDrawLayer.value);
            canvas.value.add(outlineLayer);
            showCropPreview.value = true;
            updateCropPreview();
        })
    }

    function saveImages() {
        const store = useGeneratorStore();
        if (!imageLayer.value) return;
        if (!drawLayer.value) return;
        const cropX = imageLayer.value.getCenter().left - (store.params.width as number / 2);
        const cropWidth = store.params.width;
        const cropY = imageLayer.value.getCenter().top - (store.params.height as number / 2);
        const cropHeight = store.params.height;
        const dataUrlOptions = {
            format: "webp",
            left: cropX,
            top: cropY,
            width: cropWidth,
            height: cropHeight
        };
        generatorImageProps.value.sourceImage = imageLayer.value.toDataURL(dataUrlOptions).split(",")[1];
        generatorImageProps.value.maskImage = redoHistory.value.length === 0 || drawing.value ? undefined : drawLayer.value.toDataURL(dataUrlOptions).split(",")[1];
    }

    let timeout: undefined | NodeJS.Timeout;

    function updateCropPreview() {
        if (!canvas.value) return;
        const store = useGeneratorStore();
        if (cropPreviewLayer.value) {
            canvas.value.remove(cropPreviewLayer.value);
            cropPreviewLayer.value = undefined;
        }
        if (!showCropPreview.value) return;
        cropPreviewLayer.value = makeNewLayer({
            layerWidth: (store.params.width as number) / imageScale.value,
            layerHeight: (store.params.height as number) / imageScale.value,
            fill: "rgba(100, 0, 0, 0.5)"
        });
        canvas.value.centerObject(cropPreviewLayer.value);
        canvas.value.add(cropPreviewLayer.value);
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            showCropPreview.value = false;
            updateCropPreview();
            timeout = undefined;
        }, 5000)
    }

    interface ILayerParams {
        image?: fabric.Image;
        layerWidth?: number;
        layerHeight?: number;
        fill?: string;
        abosolute?: boolean;
    }

    function newBlankImage(height: number, width: number) {
        // Create a 1x1 white pixel and resize
        const whitePixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdj+P///38ACfsD/QVDRcoAAAAASUVORK5CYII=';
        fabric.Image.fromURL(whitePixel, image => {
            image.set({ height, width });
            const imageBase64 = image.toDataURL({ format: "webp" });
            generatorImageProps.value.sourceImage = imageBase64.split(",")[1];
            drawing.value = true;
            newImage(image);
        })
    }

    function makeInvisibleLayer({image, layerWidth, layerHeight}: ILayerParams = {}) {
        const newLayer = new fabric.Canvas(null);
        newLayer.selection = false;
        newLayer.backgroundColor = maskBackgroundColor.value;
        newLayer.setHeight(layerHeight || height.value);
        newLayer.setWidth(layerWidth || width.value);
        if (image) newLayer.add(image);
        return newLayer;
    }

    function makeNewLayer({image, layerWidth, layerHeight, fill, abosolute}: ILayerParams = {}) {
        const newLayer = image || new fabric.Rect({
            width: layerWidth || width.value,
            height: layerHeight || height.value,
            left: 0,
            top: 0,
            fill: fill || "transparent",
            absolutePositioned: abosolute || true,
            selectable: false,
        })

        const newGroup = new fabric.Group([newLayer], {
            selectable: false,
            absolutePositioned: abosolute || true,
        });

        return newGroup;
    }

    function resetCanvas() {
        if (!canvas.value) return;
        if (visibleImageLayer.value) {
            canvas.value.remove(visibleImageLayer.value);
            visibleImageLayer.value = undefined;
        }
        if (visibleDrawLayer.value) {
            canvas.value.remove(visibleDrawLayer.value);
            visibleDrawLayer.value = undefined;
        }
        imageLayer.value = undefined;
        drawLayer.value = undefined;
        redoHistory.value = [];
        undoHistory.value = [];
        canvas.value.isDrawingMode = false;
    }

    function resetDrawing() {
        if (!canvas.value) return;
        if (visibleDrawLayer.value) {
            canvas.value.remove(visibleDrawLayer.value);
            visibleDrawLayer.value = undefined;
        }
        if (drawing.value) {
            const store = useGeneratorStore();
            newBlankImage(store.params.height || 512, store.params.width || 512);
        }
        drawLayer.value = undefined;
        redoHistory.value = [];
        undoHistory.value = [];
        visibleDrawLayer.value = makeNewLayer();
        drawLayer.value = makeInvisibleLayer();
        visibleDrawLayer.value.set("opacity", 0.8)
        canvas.value.add(visibleDrawLayer.value);
    }

    function downloadMask() {
        saveImages();
        const anchor = document.createElement("a");
        if (drawing.value) {
            anchor.href = 'data:image/webp;base64,'+generatorImageProps.value.sourceImage;
            anchor.download = "image_drawing.webp";
            anchor.click();
            return;
        }
        anchor.href = 'data:image/webp;base64,'+generatorImageProps.value.maskImage;
        anchor.download = "image_mask.webp";
        anchor.click();
    }

    async function asyncClone(object: any) {
        return new Promise((resolve, reject) => {
            try {
                object.clone(resolve);
            } catch (error) {
                reject(error);
            }
        });
    }

    async function onPathCreated(e: any) {
        const path: IHistory = { path: e.path }
        pathCreate({history: path, erase: erasing.value, draw: drawing.value});
        redoHistory.value.push(path);
    }

    function onMouseMove(event: fabric.IEvent<Event>) {
        if (!canvas.value) return;

        const pointer = canvas.value.getPointer(event.e);
        outlineLayer.left = pointer.x;
        outlineLayer.top = pointer.y;
        outlineLayer.opacity = 0.8;

        if (erasing.value) {
            outlineLayer.set("strokeWidth", 3);
            outlineLayer.set("fill", "");
            setBrush("red");
        } else {
            outlineLayer.set("strokeWidth", 0);
            if (drawing.value) {
                outlineLayer.set("fill", drawColor.value);
                setBrush(drawColor.value);
            } else {
                outlineLayer.set("fill", "white");
                setBrush("white");
            }
        }
        outlineLayer.set("radius", brushSize.value / 2);
        updateCanvas();
    }

    return {
        // Variables
        showCropPreview,
        erasing,
        switchToolText,
        brushSize,
        undoHistory,
        redoHistory,
        drawColor,
        drawing,
        // Computed
        canvas,
        // Actions
        updateCropPreview,
        createNewCanvas,
        downloadMask,
        resetCanvas,
        resetDrawing,
        flipErase,
        undoAction,
        redoAction,
        newImage,
        newBlankImage,
        setBrush,
        saveImages
    };
});
