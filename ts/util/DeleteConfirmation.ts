export class DeleteConfirmation {
    private static readonly MODAL_ID = "delete-item-modal-state";
    private static readonly MODAL_ROOT_ID = "delete-item-modal-root";
    private static resolvePending: (confirmed: boolean) => void;

    private static ensureModal() {
        if (document.getElementById(this.MODAL_ROOT_ID)) return;

        const root = document.createElement("div");
        root.id = this.MODAL_ROOT_ID;
        root.innerHTML = `
            <input class="chipInfoModalState" id="${this.MODAL_ID}" type="checkbox">
            <div class="chipInfoModalOverlay">
                <label class="chipInfoBackdrop" for="${this.MODAL_ID}" aria-label="Cancel deletion"></label>
                <div class="chipInfoModal" role="dialog" aria-modal="true" aria-label="Confirm deletion">
                    <div class="chipInfoModalHeader">
                        <h3>Confirm Delete</h3>
                        <label class="chipInfoCloseButton" for="${this.MODAL_ID}" aria-label="Cancel deletion">
                            <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" focusable="false">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"></path>
                            </svg>
                        </label>
                    </div>
                    <div class="chipInfoModalBody">
                        <p class="deleteAnnotationWarning">Delete <strong id="delete-item-target"></strong>?</p>
                        <p class="deleteAnnotationTarget">This removes the selected item from the current annotation.</p>
                        <div class="deleteAnnotationActions">
                            <label class="configButton" for="${this.MODAL_ID}">Cancel</label>
                            <button id="delete-item-submit" class="configButton deleteAnnotationSubmit">Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(root);

        const modalState = document.getElementById(this.MODAL_ID) as HTMLInputElement;
        root.querySelectorAll(`label[for="${this.MODAL_ID}"]`).forEach(label => {
            label.addEventListener("click", () => this.finish(false));
        });
        document.getElementById("delete-item-submit").addEventListener("click", () => {
            modalState.checked = false;
            this.finish(true);
        });
    }

    private static finish(confirmed: boolean) {
        const resolve = this.resolvePending;
        this.resolvePending = undefined;
        if (resolve) resolve(confirmed);
    }

    public static confirm(target: string): Promise<boolean> {
        this.ensureModal();
        this.finish(false);

        const modalState = document.getElementById(this.MODAL_ID) as HTMLInputElement;
        const targetElement = document.getElementById("delete-item-target");
        targetElement.textContent = target;
        modalState.checked = true;

        return new Promise<boolean>(resolve => {
            this.resolvePending = resolve;
        });
    }
}
