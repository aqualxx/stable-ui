// https://github.com/dexie/Dexie.js/issues/1528
import { onUnmounted, ref, type Ref, watch, type UnwrapRef } from "vue";
import { liveQuery } from "dexie";

interface UseObservableOptions<I> {
    onError?: (err: any) => void;
    /**
     * The value that should be set if the observable has not emitted.
     */
    initialValue?: I | undefined
}

export function useLiveQuery<T, I = undefined>(
    querier: () => T | Promise<T>,
    deps: Ref<any>[],
    options?: UseObservableOptions<I | undefined>,
): Readonly<Ref<T | I>> {
    const value = ref<T | I | undefined>(options?.initialValue);
    const observable = liveQuery<T>(querier);
    let subscription = observable.subscribe({
        next: val => (value.value = (val as UnwrapRef<T>)),
        error: options?.onError,
    });

    watch(deps, () => {
        subscription.unsubscribe();
        subscription = observable.subscribe({
            next: val => (value.value = (val as UnwrapRef<T>)),
            error: options?.onError,
        });
    });

    onUnmounted(() => {
        subscription.unsubscribe();
    });
    return value as Readonly<Ref<T | I>>;
}