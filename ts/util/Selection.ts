export class Selection {

    private static list: (() => void)[] = [];

    public static register(ondeselect: () => void) {
        this.list.push(ondeselect);
    }

    public static deselectAll() {
        for (const ondeselect of this.list) {
            ondeselect();
        }
    }

}