// win-auto-ts — Windows UI Automation library for TypeScript (COM/UIA via Koffi FFI)
export * from './core/com.js';
export * from './core/bstr.js';
export * from './core/vtable.js';
export * from './uia/constants.js';
export * from './uia/interfaces.js';

import { exec } from 'node:child_process';
import koffi from 'koffi';
import { initializeCOM, uninitializeCOM, ptrBuf, readPtr } from './core/com.js';
import { CUIAutomation, UIAElement, UIALocatorResult, UIALocatorPromise } from './uia/interfaces.js';
import { TreeScope, ControlType, PropertyId } from './uia/constants.js';

export type LocatorType =
    | 'button' | 'edit'      | 'menuitem'   | 'checkbox'   | 'combobox'
    | 'listitem'| 'label'    | 'radiobutton'| 'tab'        | 'treeitem'
    | 'datagrid'| 'dataitem' | 'hyperlink'  | 'slider'     | 'spinner'
    | 'progressbar' | 'image';

const LOCATOR_TYPE_MAP: Record<LocatorType, number> = {
    button:      ControlType.UIA_ButtonControlTypeId,
    edit:        ControlType.UIA_EditControlTypeId,
    menuitem:    ControlType.UIA_MenuItemControlTypeId,
    checkbox:    ControlType.UIA_CheckBoxControlTypeId,
    combobox:    ControlType.UIA_ComboBoxControlTypeId,
    listitem:    ControlType.UIA_ListItemControlTypeId,
    label:       ControlType.UIA_TextControlTypeId,
    radiobutton: ControlType.UIA_RadioButtonControlTypeId,
    tab:         ControlType.UIA_TabItemControlTypeId,
    treeitem:    ControlType.UIA_TreeItemControlTypeId,
    datagrid:    ControlType.UIA_DataGridControlTypeId,
    dataitem:    ControlType.UIA_DataItemControlTypeId,
    hyperlink:   ControlType.UIA_HyperlinkControlTypeId,
    slider:      ControlType.UIA_SliderControlTypeId,
    spinner:     ControlType.UIA_SpinnerControlTypeId,
    progressbar: ControlType.UIA_ProgressBarControlTypeId,
    image:       ControlType.UIA_ImageControlTypeId,
};

const user32 = koffi.load('user32.dll');
const ShowWindow   = user32.func('bool __stdcall ShowWindow(void* hWnd, int nCmdShow)');
const keybd_event  = user32.func('void __stdcall keybd_event(uint8 bVk, uint8 bScan, uint dwFlags, uintptr_t dwExtraInfo)');
const SW_MAXIMIZE      = 3;
const KEYEVENTF_KEYUP  = 0x0002;

const VK_NAMES: Record<string, number> = {
    'enter':     0x0D, 'return':    0x0D,
    'tab':       0x09,
    'escape':    0x1B, 'esc':       0x1B,
    'backspace': 0x08,
    'delete':    0x2E, 'del':       0x2E,
    'space':     0x20,
    'home':      0x24, 'end':       0x23,
    'pageup':    0x21, 'pagedown':  0x22,
    'left':      0x25, 'up':        0x26, 'right':     0x27, 'down':      0x28,
    'f1':  0x70, 'f2':  0x71, 'f3':  0x72, 'f4':  0x73,
    'f5':  0x74, 'f6':  0x75, 'f7':  0x76, 'f8':  0x77,
    'f9':  0x78, 'f10': 0x79, 'f11': 0x7A, 'f12': 0x7B,
};

export class WinAutoTS {
    private uia_obj: CUIAutomation | null = null;
    public defaultTimeout: number | undefined = undefined;

    constructor() {
        initializeCOM();
        this.uia_obj = new CUIAutomation();
    }

    public get uiAutomation(): CUIAutomation {
        if (!this.uia_obj) throw new Error("CUIAutomation not initialized.");
        return this.uia_obj;
    }

    public getDesktop(): UIAElement {
        return this.uiAutomation.getRootElement();
    }

    public getFocusedElement(): UIAElement | null {
        return this.uiAutomation.getFocusedElement();
    }

    public getTrueCondition(): any {
        return this.uiAutomation.createTrueCondition();
    }

    public findChildren(element: UIAElement): UIAElement[] {
        const cond = this.uiAutomation.createTrueCondition();
        const result = element.findAll(TreeScope.TreeScope_Children, cond);
        cond.Release();
        return result;
    }

    public findDescendants(element: UIAElement): UIAElement[] {
        const cond = this.uiAutomation.createTrueCondition();
        const result = element.findAll(TreeScope.TreeScope_Descendants, cond);
        cond.Release();
        return result;
    }

    /** Find all descendants of a given control type using native UIA filtering; falls back to JS filter if unavailable. */
    public findByType(element: UIAElement, controlType: number): UIAElement[] {
        try {
            const cond = this.uiAutomation.createPropertyCondition(PropertyId.UIA_ControlTypePropertyId, controlType);
            const result = element.findAll(TreeScope.TreeScope_Descendants, cond);
            cond.Release();
            return result;
        } catch {
            const all = this.findDescendants(element);
            const matched = all.filter(el => el.getControlType() === controlType);
            all.filter(el => !matched.includes(el)).forEach(el => el.Release());
            return matched;
        }
    }

    public findEdits(element: UIAElement): UIAElement[] {
        return this.findByType(element, ControlType.UIA_EditControlTypeId);
    }

    public findButtons(element: UIAElement): UIAElement[] {
        return this.findByType(element, ControlType.UIA_ButtonControlTypeId);
    }

    public findCheckBoxes(element: UIAElement): UIAElement[] {
        return this.findByType(element, ControlType.UIA_CheckBoxControlTypeId);
    }

    public findComboBoxes(element: UIAElement): UIAElement[] {
        return this.findByType(element, ControlType.UIA_ComboBoxControlTypeId);
    }

    public findListItems(element: UIAElement): UIAElement[] {
        return this.findByType(element, ControlType.UIA_ListItemControlTypeId);
    }

    public findLabels(element: UIAElement): UIAElement[] {
        return this.findByType(element, ControlType.UIA_TextControlTypeId);
    }

    public findMenuItems(element: UIAElement): UIAElement[] {
        return this.findByType(element, ControlType.UIA_MenuItemControlTypeId);
    }

    /** Single pass — buckets all descendants by control type and releases the rest. */
    public findControls(element: UIAElement): {
        edits:        UIAElement[];
        buttons:      UIAElement[];
        checkBoxes:   UIAElement[];
        comboBoxes:   UIAElement[];
        listItems:    UIAElement[];
        labels:       UIAElement[];
        menuItems:    UIAElement[];
        radioButtons: UIAElement[];
        tabs:         UIAElement[];
        treeItems:    UIAElement[];
        dataGrids:    UIAElement[];
        dataItems:    UIAElement[];
        hyperlinks:   UIAElement[];
        sliders:      UIAElement[];
        spinners:     UIAElement[];
        progressBars: UIAElement[];
        images:       UIAElement[];
    } {
        const result = {
            edits:        [] as UIAElement[],
            buttons:      [] as UIAElement[],
            checkBoxes:   [] as UIAElement[],
            comboBoxes:   [] as UIAElement[],
            listItems:    [] as UIAElement[],
            labels:       [] as UIAElement[],
            menuItems:    [] as UIAElement[],
            radioButtons: [] as UIAElement[],
            tabs:         [] as UIAElement[],
            treeItems:    [] as UIAElement[],
            dataGrids:    [] as UIAElement[],
            dataItems:    [] as UIAElement[],
            hyperlinks:   [] as UIAElement[],
            sliders:      [] as UIAElement[],
            spinners:     [] as UIAElement[],
            progressBars: [] as UIAElement[],
            images:       [] as UIAElement[],
        };

        result.edits        = this.findByType(element, ControlType.UIA_EditControlTypeId);
        result.buttons      = this.findByType(element, ControlType.UIA_ButtonControlTypeId);
        result.checkBoxes   = this.findByType(element, ControlType.UIA_CheckBoxControlTypeId);
        result.comboBoxes   = this.findByType(element, ControlType.UIA_ComboBoxControlTypeId);
        result.listItems    = this.findByType(element, ControlType.UIA_ListItemControlTypeId);
        result.labels       = this.findByType(element, ControlType.UIA_TextControlTypeId);
        result.menuItems    = this.findByType(element, ControlType.UIA_MenuItemControlTypeId);
        result.radioButtons = this.findByType(element, ControlType.UIA_RadioButtonControlTypeId);
        result.tabs         = this.findByType(element, ControlType.UIA_TabItemControlTypeId);
        result.treeItems    = this.findByType(element, ControlType.UIA_TreeItemControlTypeId);
        result.dataGrids    = this.findByType(element, ControlType.UIA_DataGridControlTypeId);
        result.dataItems    = this.findByType(element, ControlType.UIA_DataItemControlTypeId);
        result.hyperlinks   = this.findByType(element, ControlType.UIA_HyperlinkControlTypeId);
        result.sliders      = this.findByType(element, ControlType.UIA_SliderControlTypeId);
        result.spinners     = this.findByType(element, ControlType.UIA_SpinnerControlTypeId);
        result.progressBars = this.findByType(element, ControlType.UIA_ProgressBarControlTypeId);
        result.images       = this.findByType(element, ControlType.UIA_ImageControlTypeId);

        return result;
    }

    /** Print all unique locator lines for every element on the page. Use during development to discover elements. */
    public printControlIdentifiers(elementObj: Record<string, UIAElement>): void {
        const label   = Object.keys(elementObj)[0] ?? 'element';
        const element = elementObj[label]!;
        const TYPE_TO_LOCATOR: Record<string, LocatorType> = {
            UIA_ButtonControlTypeId:      'button',
            UIA_EditControlTypeId:        'edit',
            UIA_MenuItemControlTypeId:    'menuitem',
            UIA_CheckBoxControlTypeId:    'checkbox',
            UIA_ComboBoxControlTypeId:    'combobox',
            UIA_ListItemControlTypeId:    'listitem',
            UIA_TextControlTypeId:        'label',
            UIA_RadioButtonControlTypeId: 'radiobutton',
            UIA_TabItemControlTypeId:     'tab',
            UIA_TreeItemControlTypeId:    'treeitem',
            UIA_DataGridControlTypeId:    'datagrid',
            UIA_DataItemControlTypeId:    'dataitem',
            UIA_HyperlinkControlTypeId:   'hyperlink',
            UIA_SliderControlTypeId:      'slider',
            UIA_SpinnerControlTypeId:     'spinner',
            UIA_ProgressBarControlTypeId: 'progressbar',
            UIA_ImageControlTypeId:       'image',
        };
        const seen = new Set<string>();
        for (const el of this.findDescendants(element)) {
            const typeName = el.getControlTypeName();
            const name     = el.getName();
            const key      = `${typeName}::${name}`;
            const locType  = TYPE_TO_LOCATOR[typeName];
            if (locType && name && !seen.has(key)) {
                seen.add(key);
                console.log(`locator(${label}, '${locType}', '${name}');`);
            }
            el.Release();
        }
    }

    /** Release one or more arrays of elements. */
    public releaseAll(...groups: UIAElement[][]): void {
        for (const group of groups) group.forEach(el => el.Release());
    }

    /** Find the first edit (text field) whose name matches. Releases all other edits. */
    public findEditByName(element: UIAElement, name: string): UIAElement | null {
        const all = this.findEdits(element);
        const match = all.find(el => el.getName() === name) ?? null;
        all.filter(el => el !== match).forEach(el => el.Release());
        return match;
    }

    /** Find the first button whose name matches. Releases all other buttons. */
    public findButtonByName(element: UIAElement, name: string): UIAElement | null {
        const all = this.findButtons(element);
        const match = all.find(el => el.getName() === name) ?? null;
        all.filter(el => el !== match).forEach(el => el.Release());
        return match;
    }

    /** Find an element. Pass timeout (ms) to poll until it appears; omit for immediate find. */
    public locator(element: UIAElement, type: LocatorType, name: string, timeout?: number, pollMs = 100): UIALocatorResult | UIALocatorPromise {
        const controlTypeId = LOCATOR_TYPE_MAP[type];
        const desc = `${type} '${name}'`;
        timeout = timeout ?? this.defaultTimeout;
        const findFn = (): UIAElement | null => {
            const all = this.findByType(element, controlTypeId);
            const match = all.find(el => el.getName() === name) ?? null;
            all.filter(el => el !== match).forEach(el => el.Release());
            return match;
        };
        if (timeout === undefined) return new UIALocatorResult(findFn(), desc, findFn);
        const promise = (async () => {
            const start = Date.now();
            while (Date.now() - start < timeout) {
                const match = findFn();
                if (match) return new UIALocatorResult(match, desc, findFn);
                await new Promise(r => setTimeout(r, pollMs));
            }
            return new UIALocatorResult(null, desc, findFn);
        })();
        return new UIALocatorPromise(promise);
    }

    /** Find the first menu item whose name matches. Releases all other menu items. */
    public findMenuItemByName(element: UIAElement, name: string): UIAElement | null {
        const all = this.findMenuItems(element);
        const match = all.find(el => el.getName() === name) ?? null;
        all.filter(el => el !== match).forEach(el => el.Release());
        return match;
    }

    /** Find the first descendant whose name matches. Releases everything else. */
    public findByName(element: UIAElement, name: string): UIAElement | null {
        const all = this.findDescendants(element);
        const match = all.find(el => el.getName() === name) ?? null;
        all.filter(el => el !== match).forEach(el => el.Release());
        return match;
    }

    /** Find the first descendant whose AutomationId matches. Releases everything else. */
    public findById(element: UIAElement, id: string): UIAElement | null {
        const all = this.findDescendants(element);
        const match = all.find(el => el.getAutomationId() === id) ?? null;
        all.filter(el => el !== match).forEach(el => el.Release());
        return match;
    }

    /** Launch an app and wait for a window whose name contains `title`. */
    public async launchAndFind(cmd: string, title: string, timeoutMs = 15_000, pollMs = 500): Promise<UIAElement> {
        exec(cmd);
        const desktop = this.getDesktop();
        const cond = this.getTrueCondition();
        const start = Date.now();

        while (Date.now() - start < timeoutMs) {
            const children = desktop.findAll(TreeScope.TreeScope_Children, cond);
            for (const child of children) {
                if (child.getName().includes(title)) {
                    children.filter(c => c !== child).forEach(c => c.Release());
                    cond.Release();
                    desktop.Release();
                    return child;
                }
                child.Release();
            }
            await new Promise(r => setTimeout(r, pollMs));
        }
        cond.Release();
        desktop.Release();
        throw new Error(`Window "${title}" not found within ${timeoutMs}ms`);
    }

    public maximizeWindow(element: UIAElement): void {
        const buf = ptrBuf();
        (element as any).get_CurrentNativeWindowHandle(buf);
        const hwnd = readPtr(buf);
        if (hwnd) ShowWindow(hwnd, SW_MAXIMIZE);
    }

    public pressKey(key: string | number): void {
        const vk = typeof key === 'number' ? key : VK_NAMES[key.toLowerCase()];
        if (vk === undefined) throw new Error(`pressKey: unknown key name '${key}'`);
        keybd_event(vk, 0, 0, 0);
        keybd_event(vk, 0, KEYEVENTF_KEYUP, 0);
    }

    public setTimeOut(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }

    public async waitFor(condition: () => boolean, timeoutMs = 5000, pollMs = 100): Promise<void> {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            if (condition()) return;
            await new Promise(r => setTimeout(r, pollMs));
        }
        throw new Error(`waitFor timed out after ${timeoutMs}ms`);
    }

    public async pressEnter(): Promise<void>  { this.pressKey('Enter'); }
    public async pressTab(): Promise<void>    { this.pressKey('Tab'); }
    public async pressEscape(): Promise<void> { this.pressKey('Escape'); }

    public close() {
        this.uia_obj?.Release();
        this.uia_obj = null;
        uninitializeCOM();
    }
}
