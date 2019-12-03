export class MouseIn {
    button: number;
    buttons: number;
    offsetX: number;
    offsetY: number;
    movementX: number;
    movementY: number;
    
    ctrlKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
}
export class WheelIn {
    button: number;
    buttons: number;
    offsetX: number;
    offsetY: number;
    deltaX: number;
    deltaY: number;
    movementX: number;
    movementY: number;

    ctrlKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
}

export class MouseListener {
    public onclick(event: MouseIn): boolean {
        return false;
    }
    public ondblclick(event: MouseIn): boolean {
        return false;
    }

    public onwheel(event: WheelIn): boolean {
        return false;
    }

    public onmousedown(event: MouseIn): boolean {
        return false;
    }
    public onmouseup(event: MouseIn): boolean {
        return false;
    }
    public onmousemove(event: MouseIn): boolean {
        return false;
    }
    public onmouseout(event: MouseIn): boolean {
        return false;
    }
    public onpan(event: HammerInput): boolean {
        return false;
    }
}
