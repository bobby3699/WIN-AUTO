import { execSync as _execSync } from 'node:child_process';
import koffi from 'koffi';
import { type MethodDef, IUnknownMethods, COMObject, IUnknownObject } from '../core/vtable.js';
import { createInstance, ptrBuf, readPtr, readBSTR, intBuf, readInt, dblBuf, readDouble } from '../core/com.js';
import { createBSTR, freeBSTR } from '../core/bstr.js';
import { CLSID_CUIAutomation, IID_IUIAutomation, ControlType, PatternId, type tagRECT } from './constants.js';

const _user32 = koffi.load('user32.dll');
const _SetCursorPos        = _user32.func('bool __stdcall SetCursorPos(int X, int Y)');
const _mouse_event         = _user32.func('void __stdcall mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, uintptr_t dwExtraInfo)');
const _keybd_event         = _user32.func('void __stdcall keybd_event(uint8 bVk, uint8 bScan, uint dwFlags, uintptr_t dwExtraInfo)');
const _VkKeyScanW          = _user32.func('int __stdcall VkKeyScanW(uint16 ch)');
const MOUSEEVENTF_LEFTDOWN = 0x0002;
const MOUSEEVENTF_LEFTUP   = 0x0004;
const KEYEVENTF_KEYUP      = 0x0002;
const VK_SHIFT             = 0x10;

const _sab = new Int32Array(new SharedArrayBuffer(4));
function _sleepMs(ms: number): void { Atomics.wait(_sab, 0, 0, ms); }

function _typeVK(text: string, delayMs = 50): void {
    for (const ch of text) {
        const code = ch.codePointAt(0) ?? 0;
        const vkResult = _VkKeyScanW(code);
        const vk = vkResult & 0xFF;
        if (vk === 0xFF || vkResult === -1) continue; // unmappable character
        const needShift = (vkResult >> 8) & 1;
        if (needShift) _keybd_event(VK_SHIFT, 0, 0, 0);
        _keybd_event(vk, 0, 0, 0);
        _keybd_event(vk, 0, KEYEVENTF_KEYUP, 0);
        if (needShift) _keybd_event(VK_SHIFT, 0, KEYEVENTF_KEYUP, 0);
        _sleepMs(delayMs);
    }
}

// ── VTable definitions ────────────────────────────────────────────────────────

export const IUIAutomationMethods: MethodDef[] = [
    ...IUnknownMethods,
    { name: 'CompareElements', returns: 'HRESULT', args: ['void*', 'void*', 'int*'] },          // 3
    { name: 'CompareRuntimeIds', returns: 'HRESULT', args: ['void*', 'void*', 'int*'] },        // 4
    { name: 'GetRootElement', returns: 'HRESULT', args: ['void*'] },                            // 5
    { name: 'ElementFromHandle', returns: 'HRESULT', args: ['void*', 'void*'] },                // 6
    { name: 'ElementFromPoint', returns: 'HRESULT', args: ['void*', 'void*'] },                 // 7
    { name: 'GetFocusedElement', returns: 'HRESULT', args: ['void*'] },                         // 8
    { name: 'GetRootElementBuildCache', returns: 'HRESULT', args: ['void*', 'void*'] },         // 9
    { name: 'ElementFromHandleBuildCache', returns: 'HRESULT', args: ['void*', 'void*', 'void*'] }, // 10
    { name: 'ElementFromPointBuildCache', returns: 'HRESULT', args: ['void*', 'void*', 'void*'] },  // 11
    { name: 'GetFocusedElementBuildCache', returns: 'HRESULT', args: ['void*', 'void*'] },      // 12
    { name: 'CreateTreeWalker', returns: 'HRESULT', args: ['void*', 'void*'] },                 // 13
    { name: 'get_ControlViewWalker', returns: 'HRESULT', args: ['void*'] },                     // 14
    { name: 'get_ContentViewWalker', returns: 'HRESULT', args: ['void*'] },                     // 15
    { name: 'get_RawViewWalker', returns: 'HRESULT', args: ['void*'] },                         // 16
    { name: 'get_RawViewCondition', returns: 'HRESULT', args: ['void*'] },                      // 17
    { name: 'get_ControlViewCondition', returns: 'HRESULT', args: ['void*'] },                  // 18
    { name: 'get_ContentViewCondition', returns: 'HRESULT', args: ['void*'] },                  // 19
    { name: 'CreateCacheRequest', returns: 'HRESULT', args: ['void*'] },                        // 20
    { name: 'CreateTrueCondition', returns: 'HRESULT', args: ['void*'] },                       // 21
    { name: 'CreateFalseCondition', returns: 'HRESULT', args: ['void*'] },                      // 22
    { name: 'CreatePropertyCondition', returns: 'HRESULT', args: ['int', 'void*', 'void*'] },   // 23
    { name: 'CreatePropertyConditionEx', returns: 'HRESULT', args: ['int', 'void*', 'int', 'void*'] }, // 24
    { name: 'CreateAndCondition', returns: 'HRESULT', args: ['void*', 'void*', 'void*'] },      // 25
    { name: 'CreateAndConditionFromArray', returns: 'HRESULT', args: ['void*', 'void*'] },      // 26
    { name: 'CreateAndConditionFromNativeArray', returns: 'HRESULT', args: ['void*', 'int', 'void*'] }, // 27
    { name: 'CreateOrCondition', returns: 'HRESULT', args: ['void*', 'void*', 'void*'] },       // 28
];

export const IUIAutomationElementMethods: MethodDef[] = [
    ...IUnknownMethods,
    { name: 'SetFocus', returns: 'HRESULT', args: [] },                                          // 3
    { name: 'GetRuntimeId', returns: 'HRESULT', args: ['void*'] },                              // 4
    { name: 'FindFirst', returns: 'HRESULT', args: ['int', 'void*', 'void*'] },                 // 5
    { name: 'FindAll', returns: 'HRESULT', args: ['int', 'void*', 'void*'] },                   // 6
    { name: 'FindFirstBuildCache', returns: 'HRESULT', args: ['int', 'void*', 'void*', 'void*'] }, // 7
    { name: 'FindAllBuildCache', returns: 'HRESULT', args: ['int', 'void*', 'void*', 'void*'] },   // 8
    { name: 'BuildUpdatedCache', returns: 'HRESULT', args: ['void*', 'void*'] },                // 9
    { name: 'GetCurrentPropertyValue', returns: 'HRESULT', args: ['int', 'void*'] },            // 10
    { name: 'GetCurrentPropertyValueEx', returns: 'HRESULT', args: ['int', 'int', 'void*'] },   // 11
    { name: 'GetCachedPropertyValue', returns: 'HRESULT', args: ['int', 'void*'] },             // 12
    { name: 'GetCachedPropertyValueEx', returns: 'HRESULT', args: ['int', 'int', 'void*'] },    // 13
    { name: 'GetCurrentPatternAs', returns: 'HRESULT', args: ['int', 'void*', 'void*'] },       // 14
    { name: 'GetCachedPatternAs', returns: 'HRESULT', args: ['int', 'void*', 'void*'] },        // 15
    { name: 'GetCurrentPattern', returns: 'HRESULT', args: ['int', 'void*'] },                  // 16
    { name: 'GetCachedPattern', returns: 'HRESULT', args: ['int', 'void*'] },                   // 17
    { name: 'GetCachedParent', returns: 'HRESULT', args: ['void*'] },                           // 18
    { name: 'GetCachedChildren', returns: 'HRESULT', args: ['void*'] },                         // 19
    { name: 'get_CurrentProcessId', returns: 'HRESULT', args: ['int*'] },                       // 20
    { name: 'get_CurrentControlType', returns: 'HRESULT', args: ['int*'] },                     // 21
    { name: 'get_CurrentLocalizedControlType', returns: 'HRESULT', args: ['void*'] },           // 22 (BSTR*)
    { name: 'get_CurrentName', returns: 'HRESULT', args: ['void*'] },                           // 23 (BSTR*)
    { name: 'get_CurrentAcceleratorKey', returns: 'HRESULT', args: ['void*'] },                 // 24 (BSTR*)
    { name: 'get_CurrentAccessKey', returns: 'HRESULT', args: ['void*'] },                      // 25 (BSTR*)
    { name: 'get_CurrentHasKeyboardFocus', returns: 'HRESULT', args: ['int*'] },                // 26 (BOOL*)
    { name: 'get_CurrentIsKeyboardFocusable', returns: 'HRESULT', args: ['int*'] },             // 27 (BOOL*)
    { name: 'get_CurrentIsEnabled', returns: 'HRESULT', args: ['int*'] },                       // 28 (BOOL*)
    { name: 'get_CurrentAutomationId', returns: 'HRESULT', args: ['void*'] },                   // 29 (BSTR*)
    { name: 'get_CurrentClassName', returns: 'HRESULT', args: ['void*'] },                      // 30 (BSTR*)
    { name: 'get_CurrentHelpText', returns: 'HRESULT', args: ['void*'] },                       // 31 (BSTR*)
    { name: 'get_CurrentCulture', returns: 'HRESULT', args: ['int*'] },                         // 32
    { name: 'get_CurrentIsControlElement', returns: 'HRESULT', args: ['int*'] },                // 33 (BOOL*)
    { name: 'get_CurrentIsContentElement', returns: 'HRESULT', args: ['int*'] },                // 34 (BOOL*)
    { name: 'get_CurrentIsPassword', returns: 'HRESULT', args: ['int*'] },                      // 35 (BOOL*)
    { name: 'get_CurrentNativeWindowHandle', returns: 'HRESULT', args: ['void*'] },             // 36 (UIA_HWND)
    { name: 'get_CurrentItemType', returns: 'HRESULT', args: ['void*'] },                       // 37 (BSTR*)
    { name: 'get_CurrentIsOffscreen', returns: 'HRESULT', args: ['int*'] },                     // 38 (BOOL*)
    { name: 'get_CurrentOrientation', returns: 'HRESULT', args: ['int*'] },                     // 39
    { name: 'get_CurrentFrameworkId', returns: 'HRESULT', args: ['void*'] },                    // 40 (BSTR*)
    { name: 'get_CurrentIsRequiredForForm', returns: 'HRESULT', args: ['int*'] },               // 41 (BOOL*)
    { name: 'get_CurrentItemStatus', returns: 'HRESULT', args: ['void*'] },                     // 42 (BSTR*)
    { name: 'get_CurrentBoundingRectangle', returns: 'HRESULT', args: ['void*'] },              // 43 (RECT*)
];

export const IUIAutomationElementArrayMethods: MethodDef[] = [
    ...IUnknownMethods,
    { name: 'get_Length', returns: 'HRESULT', args: ['int*'] },   // 3
    { name: 'GetElement', returns: 'HRESULT', args: ['int', 'void*'] } // 4
];

export const IUIAutomationInvokePatternMethods: MethodDef[] = [
    ...IUnknownMethods,
    { name: 'Invoke', returns: 'HRESULT', args: [] } // 3
];

export const IUIAutomationValuePatternMethods: MethodDef[] = [
    ...IUnknownMethods,
    { name: 'SetValue', returns: 'HRESULT', args: ['void*'] },           // 3 (BSTR)
    { name: 'get_CurrentValue', returns: 'HRESULT', args: ['void*'] },   // 4 (BSTR*)
    { name: 'get_CurrentIsReadOnly', returns: 'HRESULT', args: ['int*'] } // 5 (BOOL*)
];

export const IUIAutomationTogglePatternMethods: MethodDef[] = [
    ...IUnknownMethods,
    { name: 'Toggle', returns: 'HRESULT', args: [] },                          // 3
    { name: 'get_CurrentToggleState', returns: 'HRESULT', args: ['int*'] }     // 4
];

export const IUIAutomationExpandCollapsePatternMethods: MethodDef[] = [
    ...IUnknownMethods,
    { name: 'Expand', returns: 'HRESULT', args: [] },                                    // 3
    { name: 'Collapse', returns: 'HRESULT', args: [] },                                  // 4
    { name: 'get_CurrentExpandCollapseState', returns: 'HRESULT', args: ['int*'] }       // 5
];

export const IUIAutomationSelectionItemPatternMethods: MethodDef[] = [
    ...IUnknownMethods,
    { name: 'Select', returns: 'HRESULT', args: [] },                                    // 3
    { name: 'AddToSelection', returns: 'HRESULT', args: [] },                            // 4
    { name: 'RemoveFromSelection', returns: 'HRESULT', args: [] },                       // 5
    { name: 'get_CurrentIsSelected', returns: 'HRESULT', args: ['int*'] },               // 6
    { name: 'get_CurrentSelectionContainer', returns: 'HRESULT', args: ['void*'] }       // 7
];

export const IUIAutomationScrollItemPatternMethods: MethodDef[] = [
    ...IUnknownMethods,
    { name: 'ScrollIntoView', returns: 'HRESULT', args: [] } // 3
];

export const IUIAutomationRangeValuePatternMethods: MethodDef[] = [
    ...IUnknownMethods,
    { name: 'SetValue', returns: 'HRESULT', args: ['double'] },              // 3
    { name: 'get_CurrentValue', returns: 'HRESULT', args: ['void*'] },       // 4 (double*)
    { name: 'get_CurrentIsReadOnly', returns: 'HRESULT', args: ['int*'] },   // 5 (BOOL*)
    { name: 'get_CurrentMaximum', returns: 'HRESULT', args: ['void*'] },     // 6 (double*)
    { name: 'get_CurrentMinimum', returns: 'HRESULT', args: ['void*'] },     // 7 (double*)
    { name: 'get_CurrentLargeChange', returns: 'HRESULT', args: ['void*'] }, // 8 (double*)
    { name: 'get_CurrentSmallChange', returns: 'HRESULT', args: ['void*'] }, // 9 (double*)
];

export const IUIAutomationWindowPatternMethods: MethodDef[] = [
    ...IUnknownMethods,
    { name: 'Close', returns: 'HRESULT', args: [] },                                      // 3
    { name: 'WaitForInputIdle', returns: 'HRESULT', args: ['int', 'int*'] },              // 4
    { name: 'get_CurrentCanMaximize', returns: 'HRESULT', args: ['int*'] },               // 5
    { name: 'get_CurrentCanMinimize', returns: 'HRESULT', args: ['int*'] },               // 6
    { name: 'get_CurrentIsModal', returns: 'HRESULT', args: ['int*'] },                   // 7
    { name: 'get_CurrentIsTopmost', returns: 'HRESULT', args: ['int*'] },                 // 8
    { name: 'get_CurrentWindowVisualState', returns: 'HRESULT', args: ['int*'] },         // 9
    { name: 'get_CurrentWindowInteractionState', returns: 'HRESULT', args: ['int*'] },    // 10
    { name: 'SetWindowVisualState', returns: 'HRESULT', args: ['int'] },                  // 11
];

export const IUIAutomationLegacyIAccessiblePatternMethods: MethodDef[] = [
    ...IUnknownMethods,
    { name: '_la_Select', returns: 'HRESULT', args: ['int'] },                            // 3
    { name: 'DoDefaultAction', returns: 'HRESULT', args: [] },                            // 4
    { name: 'SetValue', returns: 'HRESULT', args: ['void*'] },                            // 5 (LPCWSTR)
    { name: 'get_CurrentChildId', returns: 'HRESULT', args: ['int*'] },                   // 6
    { name: '_la_get_CurrentName', returns: 'HRESULT', args: ['void*'] },                 // 7 (BSTR*)
    { name: 'get_CurrentValue', returns: 'HRESULT', args: ['void*'] },                    // 8 (BSTR*)
    { name: 'get_CurrentDescription', returns: 'HRESULT', args: ['void*'] },              // 9 (BSTR*)
    { name: 'get_CurrentRole', returns: 'HRESULT', args: ['int*'] },                      // 10
    { name: 'get_CurrentState', returns: 'HRESULT', args: ['int*'] },                     // 11
    { name: 'get_CurrentHelp', returns: 'HRESULT', args: ['void*'] },                     // 12 (BSTR*)
    { name: 'get_CurrentKeyboardShortcut', returns: 'HRESULT', args: ['void*'] },         // 13 (BSTR*)
    { name: 'GetCurrentSelection', returns: 'HRESULT', args: ['void*'] },                 // 14
    { name: 'get_CurrentDefaultAction', returns: 'HRESULT', args: ['void*'] },            // 15 (BSTR*)
];

// IUIAutomationTextPattern — need through slot 7 (get_DocumentRange)
export const IUIAutomationTextPatternMethods: MethodDef[] = [
    ...IUnknownMethods,
    { name: '_tp_RangeFromPoint', returns: 'HRESULT', args: ['void*', 'void*'] },        // 3
    { name: '_tp_RangeFromChild', returns: 'HRESULT', args: ['void*', 'void*'] },        // 4
    { name: '_tp_GetSelection', returns: 'HRESULT', args: ['void*'] },                   // 5
    { name: '_tp_GetVisibleRanges', returns: 'HRESULT', args: ['void*'] },               // 6
    { name: 'get_DocumentRange', returns: 'HRESULT', args: ['void*'] },                  // 7
    { name: '_tp_get_SupportedTextSelection', returns: 'HRESULT', args: ['int*'] },      // 8
];

// IUIAutomationTextRange — need through slot 12 (GetText)
export const IUIAutomationTextRangeMethods: MethodDef[] = [
    ...IUnknownMethods,
    { name: '_tr_Clone', returns: 'HRESULT', args: ['void*'] },                          // 3
    { name: '_tr_Compare', returns: 'HRESULT', args: ['void*', 'int*'] },                // 4
    { name: '_tr_CompareEndpoints', returns: 'HRESULT', args: ['int', 'void*', 'int', 'int*'] }, // 5
    { name: '_tr_ExpandToEnclosingUnit', returns: 'HRESULT', args: ['int'] },            // 6
    { name: '_tr_FindAttribute', returns: 'HRESULT', args: ['int', 'void*', 'int', 'void*'] }, // 7
    { name: '_tr_FindText', returns: 'HRESULT', args: ['void*', 'int', 'int', 'void*'] }, // 8
    { name: '_tr_GetAttributeValue', returns: 'HRESULT', args: ['int', 'void*'] },       // 9
    { name: '_tr_GetBoundingRectangles', returns: 'HRESULT', args: ['void*'] },          // 10
    { name: '_tr_GetEnclosingElement', returns: 'HRESULT', args: ['void*'] },            // 11
    { name: 'GetText', returns: 'HRESULT', args: ['int', 'void*'] },                     // 12 (maxLength, BSTR*)
];

// ── Helper Classes ────────────────────────────────────────────────────────────

export class CUIAutomation extends COMObject {
    constructor() {
        const ptr = createInstance(CLSID_CUIAutomation, IID_IUIAutomation);
        super(ptr, IUIAutomationMethods);
    }

    getRootElement(): UIAElement {
        const buf = ptrBuf();
        const hr = (this as any).GetRootElement(buf);
        if (hr !== 0) throw new Error(`GetRootElement failed: HRESULT 0x${(hr >>> 0).toString(16)}`);
        return new UIAElement(readPtr(buf));
    }

    getFocusedElement(): UIAElement | null {
        const buf = ptrBuf();
        const hr = (this as any).GetFocusedElement(buf);
        if (hr !== 0) return null;
        const ptr = readPtr(buf);
        return ptr ? new UIAElement(ptr) : null;
    }

    createTrueCondition(): IUnknownObject {
        const buf = ptrBuf();
        const hr = (this as any).CreateTrueCondition(buf);
        if (hr !== 0) throw new Error(`CreateTrueCondition failed: HRESULT 0x${(hr >>> 0).toString(16)}`);
        return new IUnknownObject(readPtr(buf));
    }

    createPropertyCondition(propertyId: number, intValue: number): IUnknownObject {
        // VARIANT: vt=VT_I4(3) at offset 0, lVal at offset 8
        const variant = Buffer.alloc(16, 0);
        variant.writeUInt16LE(3, 0);
        variant.writeInt32LE(intValue, 8);
        const out = ptrBuf();
        const hr = (this as any).CreatePropertyCondition(propertyId, variant, out);
        if (hr !== 0) throw new Error(`CreatePropertyCondition failed: HRESULT 0x${(hr >>> 0).toString(16)}`);
        return new IUnknownObject(readPtr(out));
    }

    createFalseCondition(): IUnknownObject {
        const buf = ptrBuf();
        const hr = (this as any).CreateFalseCondition(buf);
        if (hr !== 0) throw new Error(`CreateFalseCondition failed`);
        return new IUnknownObject(readPtr(buf));
    }
}

export class UIAElement extends COMObject {
    constructor(ptr: any) {
        super(ptr, IUIAutomationElementMethods);
    }

    // ── Property getters ─────────────────────────────────────────────
    getName(): string {
        const buf = ptrBuf();
        if ((this as any).get_CurrentName(buf) !== 0) return '';
        return readBSTR(buf);
    }

    getAutomationId(): string {
        const buf = ptrBuf();
        if ((this as any).get_CurrentAutomationId(buf) !== 0) return '';
        return readBSTR(buf);
    }

    getClassName(): string {
        const buf = ptrBuf();
        if ((this as any).get_CurrentClassName(buf) !== 0) return '';
        return readBSTR(buf);
    }

    getControlType(): number {
        const buf = intBuf();
        (this as any).get_CurrentControlType(buf);
        return readInt(buf);
    }

    getControlTypeName(): string {
        const ct = this.getControlType();
        return Object.entries(ControlType).find(([, v]) => v === ct)?.[0] ?? `Unknown(${ct})`;
    }

    getProcessId(): number {
        const buf = intBuf();
        (this as any).get_CurrentProcessId(buf);
        return readInt(buf);
    }

    isEnabled(): boolean {
        const buf = intBuf();
        (this as any).get_CurrentIsEnabled(buf);
        return readInt(buf) !== 0;
    }

    isKeyboardFocusable(): boolean {
        const buf = intBuf();
        (this as any).get_CurrentIsKeyboardFocusable(buf);
        return readInt(buf) !== 0;
    }

    isOffscreen(): boolean {
        const buf = intBuf();
        (this as any).get_CurrentIsOffscreen(buf);
        return readInt(buf) !== 0;
    }

    isPasswordField(): boolean {
        const buf = intBuf();
        (this as any).get_CurrentIsPassword(buf);
        return readInt(buf) !== 0;
    }

    getHelpText(): string {
        const buf = ptrBuf();
        if ((this as any).get_CurrentHelpText(buf) !== 0) return '';
        return readBSTR(buf);
    }

    getFrameworkId(): string {
        const buf = ptrBuf();
        if ((this as any).get_CurrentFrameworkId(buf) !== 0) return '';
        return readBSTR(buf);
    }

    getBoundingRect(): tagRECT {
        const buf = Buffer.alloc(16); // RECT = 4 x int32
        const hr = (this as any).get_CurrentBoundingRectangle(buf);
        if (hr < 0) throw new Error(`getBoundingRect failed (HRESULT 0x${(hr >>> 0).toString(16)})`);
        return {
            left:   buf.readInt32LE(0),
            top:    buf.readInt32LE(4),
            right:  buf.readInt32LE(8),
            bottom: buf.readInt32LE(12),
        };
    }

    // ── Focus ────────────────────────────────────────────────────────
    focus(): void {
        const hr = (this as any).SetFocus();
        if (hr < 0) throw new Error(`SetFocus failed (HRESULT 0x${(hr >>> 0).toString(16)})`);
    }

    // ── Search ───────────────────────────────────────────────────────
    findFirst(scope: number, cond: any): UIAElement | null {
        const condPtr = cond?.ptr ?? cond;
        const buf = ptrBuf();
        if ((this as any).FindFirst(scope, condPtr, buf) !== 0) return null;
        const ptr = readPtr(buf);
        return ptr ? new UIAElement(ptr) : null;
    }

    findAll(scope: number, cond: any): UIAElement[] {
        const condPtr = cond?.ptr ?? cond;
        const buf = ptrBuf();
        if ((this as any).FindAll(scope, condPtr, buf) !== 0) return [];
        const arrPtr = readPtr(buf);
        if (!arrPtr) return [];
        return new UIAElementArray(arrPtr).toArray();
    }

    // ── Click / Invoke ────────────────────────────────────────────────
    // For buttons, hyperlinks, menu items
    click(): void {
        const buf = ptrBuf();
        const hr = (this as any).GetCurrentPattern(PatternId.UIA_InvokePatternId, buf);
        const ptr = hr >= 0 ? readPtr(buf) : null;
        if (ptr) {
            const ip = new UIAInvokePattern(ptr);
            const r = (ip as any).Invoke();
            ip.Release();
            this.Release();
            if (r < 0) throw new Error(`Invoke failed (HRESULT 0x${(r >>> 0).toString(16)})`);
            return;
        }
        // Fallback: LegacyIAccessible DoDefaultAction
        const lbuf = ptrBuf();
        const lhr = (this as any).GetCurrentPattern(PatternId.UIA_LegacyIAccessiblePatternId, lbuf);
        const lptr = lhr >= 0 ? readPtr(lbuf) : null;
        if (lptr) {
            const lp = new UIALegacyIAccessiblePattern(lptr);
            const r = (lp as any).DoDefaultAction();
            lp.Release();
            this.Release();
            if (r < 0) throw new Error(`DoDefaultAction failed (HRESULT 0x${(r >>> 0).toString(16)})`);
            return;
        }
        this.Release();
        throw new Error('click: element supports neither InvokePattern nor LegacyIAccessible DoDefaultAction');
    }

    // Simulate a physical mouse click at the element's center — works on any element (edit, label, etc.)
    clickInput(): void {
        const rect = this.getBoundingRect();
        const x = Math.floor((rect.left + rect.right) / 2);
        const y = Math.floor((rect.top + rect.bottom) / 2);
        _SetCursorPos(x, y);
        _mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
        _mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
        this.Release();
    }

    // Focus the element then press Enter
    pressEnter(): void {
        try { this.focus(); } catch {}
        _keybd_event(0x0D, 0, 0, 0);
        _keybd_event(0x0D, 0, 0x0002, 0);
        this.Release();
    }

    // ── Text Input ────────────────────────────────────────────────────
    // Set text in an edit field (ValuePattern)
    setValue(text: string): void {
        const buf = ptrBuf();
        const hr = (this as any).GetCurrentPattern(PatternId.UIA_ValuePatternId, buf);
        if (hr < 0) throw new Error(`ValuePattern not available (HRESULT 0x${(hr >>> 0).toString(16)})`);
        const ptr = readPtr(buf);
        if (!ptr) throw new Error('ValuePattern returned null');
        const vp = new UIAValuePattern(ptr);
        const roBuf = intBuf();
        (vp as any).get_CurrentIsReadOnly(roBuf);
        if (readInt(roBuf) !== 0) {
            vp.Release();
            throw new Error('Element is read-only');
        }
        const bstr = createBSTR(text);
        const r = (vp as any).SetValue(bstr);
        freeBSTR(bstr);
        vp.Release();
        if (r < 0) throw new Error(`SetValue failed (HRESULT 0x${(r >>> 0).toString(16)})`);
    }

    // Get current text from an edit field (ValuePattern)
    getValue(): string {
        const buf = ptrBuf();
        const hr = (this as any).GetCurrentPattern(PatternId.UIA_ValuePatternId, buf);
        if (hr < 0) return '';
        const ptr = readPtr(buf);
        if (!ptr) return '';
        const vp = new UIAValuePattern(ptr);
        const valBuf = ptrBuf();
        (vp as any).get_CurrentValue(valBuf);
        vp.Release();
        return readBSTR(valBuf);
    }

    // Smart input — tries ValuePattern → LegacyIAccessible → VK keystrokes
    typeValue(text: string): void {
        try { this.focus(); } catch {}
        try { this.setValue(text); this.Release(); return; } catch {}
        try { this.legacySetValue(text); this.Release(); return; } catch {}
        _sleepMs(150);
        _typeVK(text);
        this.Release();
    }

    // Keyboard simulation via WScript.Shell SendKeys.
    // Uses CapsLock + lowercase to avoid Shift key events — prevents NumLock toggling.
    // Call locator(...).clickInput() on the field BEFORE this to activate it.
    typeKeyboard(text: string): void {
        const pid = this.getProcessId();
        if (pid > 0) {
            // Send lowercase text with CapsLock ON so the app receives the correct uppercase chars
            // without any Shift key events (Shift is what causes NumLock side-effects).
            const textLower = text.toLowerCase();
            const textEsc = textLower.replace(/[+^%~(){}\[\]]/g, '{$&}').replace(/'/g, "''");
            _execSync(
                `powershell -NonInteractive -NoProfile -WindowStyle Hidden -Command ` +
                `"Add-Type -AssemblyName System.Windows.Forms;` +
                `$w=New-Object -ComObject WScript.Shell;` +
                `$w.AppActivate(${pid});` +
                `Start-Sleep -Milliseconds 300;` +
                `$cl=[System.Windows.Forms.Control]::IsKeyLocked([System.Windows.Forms.Keys]::CapsLock);` +
                `if(-not $cl){$w.SendKeys('{CAPSLOCK}')};` +
                `$w.SendKeys('${textEsc}');` +
                `if(-not $cl){$w.SendKeys('{CAPSLOCK}')}"`,
                { timeout: 10000 }
            );
        } else {
            try { this.focus(); } catch {}
            _sleepMs(300);
            _typeVK(text);
        }
        this.Release();
    }

    // Fallback input for legacy Win32/WPF controls that don't support ValuePattern
    legacySetValue(text: string): void {
        const buf = ptrBuf();
        const hr = (this as any).GetCurrentPattern(PatternId.UIA_LegacyIAccessiblePatternId, buf);
        if (hr < 0) throw new Error(`LegacyIAccessiblePattern not available (HRESULT 0x${(hr >>> 0).toString(16)})`);
        const ptr = readPtr(buf);
        if (!ptr) throw new Error('LegacyIAccessiblePattern returned null');
        const lp = new UIALegacyIAccessiblePattern(ptr);
        const bstr = createBSTR(text);
        const r = (lp as any).SetValue(bstr);
        freeBSTR(bstr);
        lp.Release();
        if (r < 0) throw new Error(`LegacySetValue failed (HRESULT 0x${(r >>> 0).toString(16)})`);
    }

    // Fallback value reader for legacy controls
    legacyGetValue(): string {
        const buf = ptrBuf();
        const hr = (this as any).GetCurrentPattern(PatternId.UIA_LegacyIAccessiblePatternId, buf);
        if (hr < 0) return '';
        const ptr = readPtr(buf);
        if (!ptr) return '';
        const lp = new UIALegacyIAccessiblePattern(ptr);
        const valBuf = ptrBuf();
        (lp as any).get_CurrentValue(valBuf);
        lp.Release();
        return readBSTR(valBuf);
    }

    // Read all text from a text area / document (TextPattern)
    getDocumentText(): string {
        const buf = ptrBuf();
        const hr = (this as any).GetCurrentPattern(PatternId.UIA_TextPatternId, buf);
        if (hr < 0) throw new Error(`TextPattern not available (HRESULT 0x${(hr >>> 0).toString(16)})`);
        const ptr = readPtr(buf);
        if (!ptr) throw new Error('TextPattern returned null');
        const tp = new UIATextPattern(ptr);
        const rangeBuf = ptrBuf();
        const rhr = (tp as any).get_DocumentRange(rangeBuf);
        tp.Release();
        if (rhr < 0) throw new Error(`get_DocumentRange failed (HRESULT 0x${(rhr >>> 0).toString(16)})`);
        const rangePtr = readPtr(rangeBuf);
        if (!rangePtr) throw new Error('DocumentRange returned null');
        const tr = new UIATextRange(rangePtr);
        const textBuf = ptrBuf();
        (tr as any).GetText(-1, textBuf);
        tr.Release();
        return readBSTR(textBuf);
    }

    // ── Toggle (checkboxes, toggle buttons) ──────────────────────────
    toggle(): void {
        const buf = ptrBuf();
        const hr = (this as any).GetCurrentPattern(PatternId.UIA_TogglePatternId, buf);
        if (hr < 0) { this.Release(); throw new Error(`TogglePattern not available (HRESULT 0x${(hr >>> 0).toString(16)})`); }
        const ptr = readPtr(buf);
        if (!ptr) { this.Release(); throw new Error('TogglePattern returned null'); }
        const tp = new UIATogglePattern(ptr);
        const r = (tp as any).Toggle();
        tp.Release();
        this.Release();
        if (r < 0) throw new Error(`Toggle failed (HRESULT 0x${(r >>> 0).toString(16)})`);
    }

    // Returns 0=Off, 1=On, 2=Indeterminate, -1=not available (compare with ToggleState)
    getToggleState(): number {
        const buf = ptrBuf();
        const hr = (this as any).GetCurrentPattern(PatternId.UIA_TogglePatternId, buf);
        if (hr < 0) return -1;
        const ptr = readPtr(buf);
        if (!ptr) return -1;
        const tp = new UIATogglePattern(ptr);
        const stateBuf = intBuf();
        (tp as any).get_CurrentToggleState(stateBuf);
        tp.Release();
        return readInt(stateBuf);
    }

    // ── Expand / Collapse (dropdowns, combos, tree nodes) ────────────
    expand(): void {
        const buf = ptrBuf();
        const hr = (this as any).GetCurrentPattern(PatternId.UIA_ExpandCollapsePatternId, buf);
        if (hr < 0) { this.Release(); throw new Error(`ExpandCollapsePattern not available (HRESULT 0x${(hr >>> 0).toString(16)})`); }
        const ptr = readPtr(buf);
        if (!ptr) { this.Release(); throw new Error('ExpandCollapsePattern returned null'); }
        const ep = new UIAExpandCollapsePattern(ptr);
        const r = (ep as any).Expand();
        ep.Release();
        this.Release();
        if (r < 0) throw new Error(`Expand failed (HRESULT 0x${(r >>> 0).toString(16)})`);
    }

    collapse(): void {
        const buf = ptrBuf();
        const hr = (this as any).GetCurrentPattern(PatternId.UIA_ExpandCollapsePatternId, buf);
        if (hr < 0) { this.Release(); throw new Error(`ExpandCollapsePattern not available (HRESULT 0x${(hr >>> 0).toString(16)})`); }
        const ptr = readPtr(buf);
        if (!ptr) { this.Release(); throw new Error('ExpandCollapsePattern returned null'); }
        const ep = new UIAExpandCollapsePattern(ptr);
        const r = (ep as any).Collapse();
        ep.Release();
        this.Release();
        if (r < 0) throw new Error(`Collapse failed (HRESULT 0x${(r >>> 0).toString(16)})`);
    }

    // Returns 0=Collapsed, 1=Expanded, 2=PartiallyExpanded, 3=LeafNode, -1=not available
    getExpandCollapseState(): number {
        const buf = ptrBuf();
        const hr = (this as any).GetCurrentPattern(PatternId.UIA_ExpandCollapsePatternId, buf);
        if (hr < 0) return -1;
        const ptr = readPtr(buf);
        if (!ptr) return -1;
        const ep = new UIAExpandCollapsePattern(ptr);
        const stateBuf = intBuf();
        (ep as any).get_CurrentExpandCollapseState(stateBuf);
        ep.Release();
        return readInt(stateBuf);
    }

    // ── Selection (list items, radio buttons, tabs) ───────────────────
    select(): void {
        const buf = ptrBuf();
        const hr = (this as any).GetCurrentPattern(PatternId.UIA_SelectionItemPatternId, buf);
        if (hr < 0) { this.Release(); throw new Error(`SelectionItemPattern not available (HRESULT 0x${(hr >>> 0).toString(16)})`); }
        const ptr = readPtr(buf);
        if (!ptr) { this.Release(); throw new Error('SelectionItemPattern returned null'); }
        const sp = new UIASelectionItemPattern(ptr);
        const r = (sp as any).Select();
        sp.Release();
        this.Release();
        if (r < 0) throw new Error(`Select failed (HRESULT 0x${(r >>> 0).toString(16)})`);
    }

    isSelected(): boolean {
        const buf = ptrBuf();
        const hr = (this as any).GetCurrentPattern(PatternId.UIA_SelectionItemPatternId, buf);
        if (hr < 0) return false;
        const ptr = readPtr(buf);
        if (!ptr) return false;
        const sp = new UIASelectionItemPattern(ptr);
        const stateBuf = intBuf();
        (sp as any).get_CurrentIsSelected(stateBuf);
        sp.Release();
        return readInt(stateBuf) !== 0;
    }

    // ── Scroll ────────────────────────────────────────────────────────
    // Scroll the element into the visible area of its container
    scrollIntoView(): void {
        const buf = ptrBuf();
        const hr = (this as any).GetCurrentPattern(PatternId.UIA_ScrollItemPatternId, buf);
        if (hr < 0) { this.Release(); throw new Error(`ScrollItemPattern not available (HRESULT 0x${(hr >>> 0).toString(16)})`); }
        const ptr = readPtr(buf);
        if (!ptr) { this.Release(); throw new Error('ScrollItemPattern returned null'); }
        const sp = new UIAScrollItemPattern(ptr);
        const r = (sp as any).ScrollIntoView();
        sp.Release();
        this.Release();
        if (r < 0) throw new Error(`ScrollIntoView failed (HRESULT 0x${(r >>> 0).toString(16)})`);
    }

    // ── Range value (spinners, sliders, progress bars) ────────────────
    setRangeValue(value: number): void {
        const buf = ptrBuf();
        const hr = (this as any).GetCurrentPattern(PatternId.UIA_RangeValuePatternId, buf);
        if (hr < 0) throw new Error(`RangeValuePattern not available (HRESULT 0x${(hr >>> 0).toString(16)})`);
        const ptr = readPtr(buf);
        if (!ptr) throw new Error('RangeValuePattern returned null');
        const rv = new UIARangeValuePattern(ptr);
        const roBuf = intBuf();
        (rv as any).get_CurrentIsReadOnly(roBuf);
        if (readInt(roBuf) !== 0) {
            rv.Release();
            throw new Error('Range element is read-only');
        }
        const r = (rv as any).SetValue(value);
        rv.Release();
        if (r < 0) throw new Error(`SetRangeValue failed (HRESULT 0x${(r >>> 0).toString(16)})`);
    }

    getRangeValue(): number {
        const buf = ptrBuf();
        const hr = (this as any).GetCurrentPattern(PatternId.UIA_RangeValuePatternId, buf);
        if (hr < 0) return 0;
        const ptr = readPtr(buf);
        if (!ptr) return 0;
        const rv = new UIARangeValuePattern(ptr);
        const d = dblBuf();
        (rv as any).get_CurrentValue(d);
        rv.Release();
        return readDouble(d);
    }

    getRangeMin(): number {
        const buf = ptrBuf();
        const hr = (this as any).GetCurrentPattern(PatternId.UIA_RangeValuePatternId, buf);
        if (hr < 0) return 0;
        const ptr = readPtr(buf);
        if (!ptr) return 0;
        const rv = new UIARangeValuePattern(ptr);
        const d = dblBuf();
        (rv as any).get_CurrentMinimum(d);
        rv.Release();
        return readDouble(d);
    }

    getRangeMax(): number {
        const buf = ptrBuf();
        const hr = (this as any).GetCurrentPattern(PatternId.UIA_RangeValuePatternId, buf);
        if (hr < 0) return 0;
        const ptr = readPtr(buf);
        if (!ptr) return 0;
        const rv = new UIARangeValuePattern(ptr);
        const d = dblBuf();
        (rv as any).get_CurrentMaximum(d);
        rv.Release();
        return readDouble(d);
    }

    // ── Window management ─────────────────────────────────────────────
    closeWindow(): void {
        const buf = ptrBuf();
        const hr = (this as any).GetCurrentPattern(PatternId.UIA_WindowPatternId, buf);
        if (hr < 0) throw new Error(`WindowPattern not available (HRESULT 0x${(hr >>> 0).toString(16)})`);
        const ptr = readPtr(buf);
        if (!ptr) throw new Error('WindowPattern returned null');
        const wp = new UIAWindowPattern(ptr);
        const r = (wp as any).Close();
        wp.Release();
        if (r < 0) throw new Error(`CloseWindow failed (HRESULT 0x${(r >>> 0).toString(16)})`);
    }

    // state: WindowVisualState.WindowVisualState_Normal/Maximized/Minimized
    setWindowState(state: number): void {
        const buf = ptrBuf();
        const hr = (this as any).GetCurrentPattern(PatternId.UIA_WindowPatternId, buf);
        if (hr < 0) throw new Error(`WindowPattern not available (HRESULT 0x${(hr >>> 0).toString(16)})`);
        const ptr = readPtr(buf);
        if (!ptr) throw new Error('WindowPattern returned null');
        const wp = new UIAWindowPattern(ptr);
        const r = (wp as any).SetWindowVisualState(state);
        wp.Release();
        if (r < 0) throw new Error(`SetWindowVisualState failed (HRESULT 0x${(r >>> 0).toString(16)})`);
    }

    // Returns 0=Normal, 1=Maximized, 2=Minimized, -1=not available
    getWindowState(): number {
        const buf = ptrBuf();
        const hr = (this as any).GetCurrentPattern(PatternId.UIA_WindowPatternId, buf);
        if (hr < 0) return -1;
        const ptr = readPtr(buf);
        if (!ptr) return -1;
        const wp = new UIAWindowPattern(ptr);
        const stateBuf = intBuf();
        (wp as any).get_CurrentWindowVisualState(stateBuf);
        wp.Release();
        return readInt(stateBuf);
    }

    // ── Description ──────────────────────────────────────────────────
    describe(indent = ''): string {
        return `${indent}[${this.getControlTypeName()}] Name="${this.getName()}" AutomationId="${this.getAutomationId()}" Class="${this.getClassName()}"`;
    }
}

export class UIAElementArray extends COMObject {
    constructor(ptr: any) {
        super(ptr, IUIAutomationElementArrayMethods);
    }

    getLength(): number {
        const buf = intBuf();
        (this as any).get_Length(buf);
        return readInt(buf);
    }

    getElement(index: number): UIAElement | null {
        const buf = ptrBuf();
        if ((this as any).GetElement(index, buf) !== 0) return null;
        const ptr = readPtr(buf);
        return ptr ? new UIAElement(ptr) : null;
    }

    toArray(): UIAElement[] {
        const count = this.getLength();
        const elements: UIAElement[] = [];
        for (let i = 0; i < count; i++) {
            const el = this.getElement(i);
            if (el) elements.push(el);
        }
        this.Release();
        return elements;
    }
}

export class UIAInvokePattern extends COMObject {
    constructor(ptr: any) { super(ptr, IUIAutomationInvokePatternMethods); }
}
export class UIAValuePattern extends COMObject {
    constructor(ptr: any) { super(ptr, IUIAutomationValuePatternMethods); }
}
export class UIATogglePattern extends COMObject {
    constructor(ptr: any) { super(ptr, IUIAutomationTogglePatternMethods); }
}
export class UIAExpandCollapsePattern extends COMObject {
    constructor(ptr: any) { super(ptr, IUIAutomationExpandCollapsePatternMethods); }
}
export class UIASelectionItemPattern extends COMObject {
    constructor(ptr: any) { super(ptr, IUIAutomationSelectionItemPatternMethods); }
}
export class UIAScrollItemPattern extends COMObject {
    constructor(ptr: any) { super(ptr, IUIAutomationScrollItemPatternMethods); }
}
export class UIARangeValuePattern extends COMObject {
    constructor(ptr: any) { super(ptr, IUIAutomationRangeValuePatternMethods); }
}
export class UIAWindowPattern extends COMObject {
    constructor(ptr: any) { super(ptr, IUIAutomationWindowPatternMethods); }
}
export class UIALegacyIAccessiblePattern extends COMObject {
    constructor(ptr: any) { super(ptr, IUIAutomationLegacyIAccessiblePatternMethods); }
}
export class UIATextPattern extends COMObject {
    constructor(ptr: any) { super(ptr, IUIAutomationTextPatternMethods); }
}
export class UIATextRange extends COMObject {
    constructor(ptr: any) { super(ptr, IUIAutomationTextRangeMethods); }
}

// Wraps UIAElement | null — .exists() returns true/false, actions throw if element not found
export class UIALocatorResult {
    constructor(
        private readonly el: UIAElement | null,
        private readonly desc: string,
        private readonly findFn?: () => UIAElement | null
    ) {}

    exists(): boolean {
        if (this.el) { this.el.Release(); return true; }
        return false;
    }

    private require(): UIAElement {
        if (!this.el) throw new Error(`locator: '${this.desc}' not found`);
        return this.el;
    }

    // ── Actions ───────────────────────────────────────────────────────
    click(): void                          { this.require().click(); }
    clickInput(): void                     { this.require().clickInput(); }
    typeValue(text: string): void          { this.require().typeValue(text); }
    typeKeyboard(text: string): void       { this.require().typeKeyboard(text); }
    setValue(text: string): void           { const el = this.require(); el.setValue(text); el.Release(); }
    legacySetValue(text: string): void     { this.require().legacySetValue(text); }
    pressEnter(): void                     { this.require().pressEnter(); }
    scrollIntoView(): void        { this.require().scrollIntoView(); }
    select(): void                { this.require().select(); }
    toggle(): void                { this.require().toggle(); }
    expand(): void                { this.require().expand(); }
    collapse(): void              { this.require().collapse(); }

    // ── Readers ───────────────────────────────────────────────────────
    getValue(): string { const el = this.require(); const v = el.getValue(); el.Release(); return v; }
    getText(): string  { const el = this.require(); const t = el.getName(); el.Release(); return t; }

    // ── Assertions ────────────────────────────────────────────────────
    toBePresent(): void {
        if (!this.el) throw new Error(`Assert failed: '${this.desc}' not found`);
        this.el.Release();
    }

    toBeAbsent(): void {
        if (this.el) { this.el.Release(); throw new Error(`Assert failed: '${this.desc}' should not exist but was found`); }
    }

    toBeEnabled(): void {
        const el = this.require();
        const enabled = el.isEnabled();
        el.Release();
        if (!enabled) throw new Error(`Assert failed: '${this.desc}' is disabled`);
    }

    toBeDisabled(): void {
        const el = this.require();
        const enabled = el.isEnabled();
        el.Release();
        if (enabled) throw new Error(`Assert failed: '${this.desc}' should be disabled but is enabled`);
    }

    toHaveValue(expected: string): void {
        const el = this.require();
        const actual = el.getValue();
        el.Release();
        if (actual !== expected) throw new Error(`Assert failed: '${this.desc}' value is '${actual}', expected '${expected}'`);
    }

    toBeChecked(): void {
        const el = this.require();
        const selected = el.isSelected();
        el.Release();
        if (!selected) throw new Error(`Assert failed: '${this.desc}' is not checked`);
    }

    toBeUnchecked(): void {
        const el = this.require();
        const selected = el.isSelected();
        el.Release();
        if (selected) throw new Error(`Assert failed: '${this.desc}' should be unchecked but is checked`);
    }

    // ── Wait for disappear ────────────────────────────────────────────
    async waitForAbsent(timeout = 5000, pollMs = 500): Promise<void> {
        if (!this.findFn) throw new Error(`waitForAbsent: '${this.desc}' - use wats.locator() to enable polling`);
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const match = this.findFn();
            if (!match) return;
            match.Release();
            await new Promise(r => setTimeout(r, pollMs));
        }
        throw new Error(`waitForAbsent: '${this.desc}' still present after ${timeout}ms`);
    }
}

// Awaitable locator — actions wait for element (with timeout), assertions check immediately (no await needed)
export class UIALocatorPromise implements PromiseLike<UIALocatorResult> {
    constructor(private readonly promise: Promise<UIALocatorResult>) {}

    then<T, U>(
        onfulfilled?: ((value: UIALocatorResult) => T | PromiseLike<T>) | null,
        onrejected?: ((reason: unknown) => U | PromiseLike<U>) | null
    ): Promise<T | U> { return this.promise.then(onfulfilled, onrejected); }

    // ── Actions (async — wait for element) ────────────────────────────
    async click(): Promise<void>                          { (await this.promise).click(); }
    async clickInput(): Promise<void>                     { (await this.promise).clickInput(); }
    async typeValue(text: string): Promise<void>          { (await this.promise).typeValue(text); }
    async typeKeyboard(text: string): Promise<void>       { (await this.promise).typeKeyboard(text); }
    async setValue(text: string): Promise<void>           { (await this.promise).setValue(text); }
    async legacySetValue(text: string): Promise<void>     { (await this.promise).legacySetValue(text); }
    async pressEnter(): Promise<void>                     { (await this.promise).pressEnter(); }
    async scrollIntoView(): Promise<void>        { (await this.promise).scrollIntoView(); }
    async select(): Promise<void>                { (await this.promise).select(); }
    async toggle(): Promise<void>                { (await this.promise).toggle(); }
    async expand(): Promise<void>                { (await this.promise).expand(); }
    async collapse(): Promise<void>              { (await this.promise).collapse(); }

    // ── Readers ───────────────────────────────────────────────────────
    async getValue(): Promise<string> { return (await this.promise).getValue(); }
    async getText(): Promise<string>  { return (await this.promise).getText(); }

    // ── Existence (async) ─────────────────────────────────────────────
    async exists(): Promise<boolean> { return (await this.promise).exists(); }

    // ── Assertions (async — polls with timeout, needs await) ──────────
    async toBePresent(): Promise<void>                 { (await this.promise).toBePresent(); }
    async toBeAbsent(): Promise<void>                  { (await this.promise).toBeAbsent(); }
    async toBeEnabled(): Promise<void>                 { (await this.promise).toBeEnabled(); }
    async toBeDisabled(): Promise<void>                { (await this.promise).toBeDisabled(); }
    async toHaveValue(expected: string): Promise<void> { (await this.promise).toHaveValue(expected); }
    async toBeChecked(): Promise<void>                 { (await this.promise).toBeChecked(); }
    async toBeUnchecked(): Promise<void>               { (await this.promise).toBeUnchecked(); }

    // ── Wait for disappear ────────────────────────────────────────────
    async waitForAbsent(timeout?: number, pollMs = 500): Promise<void> {
        return (await this.promise).waitForAbsent(timeout, pollMs);
    }
}
