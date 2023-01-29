export interface button {
    text: string;
}
export interface task {
    text: string;
    buttons: button[];
    onClick?: (name: string) => void;
}
