export class KeyboardIn {
    key: string;    
    ctrlKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
}

export class KeyboardListener {
    public onkeydown(event: KeyboardIn): boolean {
        return false;
    }
    public onkeyup(event: KeyboardIn): boolean {
        return false;
    }
    public onkeypress(event: KeyboardIn): boolean {
        return false;
    }
}