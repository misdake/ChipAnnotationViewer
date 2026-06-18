import { AppModal } from "./AppModal";
import { html } from "lit-element";

export class DeleteConfirmation {
    public static confirm(target: string): Promise<boolean> {
        return new Promise<boolean>(resolve => {
            AppModal.open({
                title: "Confirm Delete",
                ariaLabel: "Confirm deletion",
                primaryText: "Delete",
                primaryClassName: "deleteAnnotationSubmit",
                body: html`
                    <p class="deleteAnnotationWarning">Delete <strong>${target}</strong>?</p>
                    <p class="deleteAnnotationTarget">This removes the selected item from the current annotation.</p>
                `,
                onSubmit: () => {
                    resolve(true);
                },
                onCancel: () => {
                    resolve(false);
                },
            });
        });
    }
}
