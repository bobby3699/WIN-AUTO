// Quick smoke test using the FIXED library
import koffi from 'koffi';
import { WinAutoTS } from '../src/winauto.js';
import { UIAElement } from '../src/uia/interfaces.js';
import { ptrBuf, readPtr, readBSTR } from '../src/core/com.js';

const wats = new WinAutoTS();
const uia = wats.uiAutomation;
console.log('CUIAutomation created OK, ptr:', uia.ptr);

// GetRootElement
const rootBuf = ptrBuf();
const hr = (uia as any).GetRootElement(rootBuf);
console.log('GetRootElement hr:', hr);

const rootPtr = readPtr(rootBuf);
console.log('Root ptr:', rootPtr);

const root = new UIAElement(rootPtr);

// Read Name
const nameBuf = ptrBuf();
const hr2 = (root as any).get_CurrentName(nameBuf);
console.log('get_CurrentName hr:', hr2);
const name = readBSTR(nameBuf);
console.log('Root name:', JSON.stringify(name));

// Read ControlType
const ctOut = [0];
const hr3 = (root as any).get_CurrentControlType(ctOut);
console.log('ControlType:', ctOut[0]);

// Read IsEnabled
const enOut = [0];
const hr4 = (root as any).get_CurrentIsEnabled(enOut);
console.log('IsEnabled:', enOut[0]);

// CreateTrueCondition
const condBuf = ptrBuf();
const hr5 = (uia as any).CreateTrueCondition(condBuf);
console.log('CreateTrueCondition hr:', hr5);
const condPtr = readPtr(condBuf);
console.log('Condition ptr:', condPtr);

// FindFirst child of desktop
const childBuf = ptrBuf();
const hr6 = (root as any).FindFirst(2, condPtr, childBuf); // TreeScope_Children = 2
console.log('FindFirst hr:', hr6);
const childPtr = readPtr(childBuf);
if (childPtr) {
    const child = new UIAElement(childPtr);
    const childNameBuf = ptrBuf();
    (child as any).get_CurrentName(childNameBuf);
    console.log('First child name:', JSON.stringify(readBSTR(childNameBuf)));
    child.Release();
}

root.Release();
wats.close();
console.log('ALL OK');
