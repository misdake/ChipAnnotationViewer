export type ToastKind = "saving" | "success" | "copied" | "pasted" | "warning" | "error";

export interface ToastDetail {
    message: string;
    kind: ToastKind;
}

export function notifyToast(message: string, kind: ToastKind = "success"): void {
    window.dispatchEvent(new CustomEvent<ToastDetail>("chipannotation-toast", {
        detail: { message, kind },
    }));
}
