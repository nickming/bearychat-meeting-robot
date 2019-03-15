import { ActionType } from "utils/constants";

enum FormActionTypes {
    // static
    SECTION = 'section',
    CONTEXT = 'context',
    IMAGE = 'image',
    DIVIDER = 'divider',
    // interactable
    INPUT = 'input',
    SELECT = 'select',
    MEMBER_SELECT = 'member-select',
    CHANNEL_SELECT = 'channel-select',
    DATE_SELECT = 'date-select',
    CHECKBOX = 'checkbox',
    // multiSelect/charts...
    SUBMIT = 'submit',
}


export class Action {
    type: string

    constructor(type: string) {
        this.type = type;
    }
}

export class Form {
    version: string = '1.0';
    actions: Array<Action>;

    constructor(actions: Array<Action>) {
        this.actions = actions
    }

    render(): string {
        return JSON.stringify(this);
    }
}

export class Section extends Action {
    text: {
        value: string,
        markdown: boolean
    }

    constructor(text: string) {
        super(FormActionTypes.SECTION);
        this.text = {
            value: text,
            markdown: true
        }
    }
}

export class Submit extends Action {
    name: string;
    text: string;
    kind: string;

    constructor(name: string, text: string, kind: string) {
        super(FormActionTypes.SUBMIT);
        this.name = name;
        this.text = text;
        this.kind = kind;
    }
}

export class Context extends Action {

    elements: Array<Element>

    constructor(elements: Array<Element>) {
        super(FormActionTypes.CONTEXT);
        this.elements = elements;
    }
}

export class Element {
    text: string;
    markdown: boolean;
    type: string;

    constructor(text: string, markdown: boolean, type: string) {
        this.markdown = markdown;
        this.text = text;
        this.type = type;
    }
}

export class Input extends Action {
    name: string;
    label: string;
    placeholder: string;
    hidden?: boolean;
    value?: any;

    constructor(name: string, label: string, placeholder: string, hidden?: boolean, value?: any) {
        super(FormActionTypes.INPUT);
        this.name = name;
        this.label = label;
        this.placeholder = placeholder;
        this.hidden = hidden;
        this.value = value;
    }
}

export class MemberSelct extends Action {
    name: string;
    label?: string;
    placeholder?: string;
    multi: boolean;

    constructor(name: string, multi: boolean, label?: string, placeholder?: string) {
        super(FormActionTypes.MEMBER_SELECT)
        this.name = name;
        this.label = label;
        this.placeholder = placeholder;
        this.multi = multi
    }
}

export class DateSelect extends Action {
    name: string;
    label?: string;

    constructor(name: string, label?: string) {
        super(FormActionTypes.DATE_SELECT)
        this.name = name;
        this.label = label;
    }
}

export class Select extends Action {

    name: string;
    label?: string;
    placeholder?: string;
    multi: boolean = false;
    options: Array<SelectOption>

    constructor(name: string, multi: boolean, options: Array<SelectOption>, placeholder?: string, label?: string) {
        super(FormActionTypes.SELECT)
        this.name = name;
        this.multi = multi;
        this.options = options;
        this.placeholder = placeholder;
        this.label = label;
    }
}

export class SelectOption {
    text: string;
    value: string | number

    constructor(text: string, value: string) {
        this.text = text;
        this.value = value;
    }
}

export class Divider extends Action {

    constructor() {
        super(FormActionTypes.DIVIDER);
    }
}


export class ChannelSelect extends Action {

    name: string;
    multi: boolean;
    label: string;
    placeholder: string;

    constructor(name: string, multi: boolean, label?: string, placeholder?: string) {
        super(FormActionTypes.CHANNEL_SELECT)
        this.name = name;
        this.label = label;
        this.placeholder = placeholder;
        this.multi = multi
    }
}