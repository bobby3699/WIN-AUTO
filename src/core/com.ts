import koffi from 'koffi';
import { freeBSTR } from './bstr.js';

export const ole32 = koffi.load('ole32.dll');

// COM Types
export const HRESULT = koffi.alias('HRESULT', 'long');
export const LPVOID = koffi.pointer('LPVOID', koffi.opaque());
export const DWORD = koffi.alias('DWORD', 'uint32');
export const LPOLESTR = koffi.pointer('LPOLESTR', koffi.types.char16_t);

export const GUID_Struct = koffi.struct('GUID', {
    Data1: 'uint32',
    Data2: 'uint16',
    Data3: 'uint16',
    Data4: koffi.array('uint8', 8)
});
export const REFIID = koffi.pointer('REFIID', GUID_Struct);
export const REFCLSID = koffi.pointer('REFCLSID', GUID_Struct);
export const COINIT = {
    MULTITHREADED: 0,
    APARTMENTTHREADED: 2,
    DISABLE_OLE1DDE: 4,
    SPEED_OVER_MEMORY: 8
};

export const CLSCTX = {
    INPROC_SERVER: 1,
    INPROC_HANDLER: 2,
    LOCAL_SERVER: 4,
    INPROC_SERVER16: 8,
    REMOTE_SERVER: 16
};
export const CLSCTX_ALL = CLSCTX.INPROC_SERVER | CLSCTX.INPROC_HANDLER | CLSCTX.LOCAL_SERVER | CLSCTX.REMOTE_SERVER;

export const GUID_SIZE = 16; // bytes: 4 + 2 + 2 + 8
export const PTR_SIZE = 8;  // x64 pointer size

// ole32.dll Methods
export const CoInitializeEx = ole32.func('HRESULT __stdcall CoInitializeEx(LPVOID pvReserved, DWORD dwCoInit)');
export const CoUninitialize = ole32.func('void __stdcall CoUninitialize()');
// Use void* for GUID output params — koffi doesn't copy struct fields back to JS objects
export const IIDFromString = ole32.func('HRESULT __stdcall IIDFromString(const char16_t* lpsz, void* lpiid)');
export const CLSIDFromString = ole32.func('HRESULT __stdcall CLSIDFromString(const char16_t* lpsz, void* pclsid)');
// Use void* for ppv — koffi won't read back opaque pointers via void**; we use Buffer + decode
export const CoCreateInstance = ole32.func('HRESULT __stdcall CoCreateInstance(void* rclsid, void* pUnkOuter, DWORD dwClsContext, void* riid, void* ppv)');

export function initializeCOM(coInit = COINIT.MULTITHREADED) {
    const hr = CoInitializeEx(null, coInit);
    if (hr !== 0 && hr !== 1) { // S_OK or S_FALSE
        throw new Error(`CoInitializeEx failed with HRESULT ${hr}`);
    }
}

export function uninitializeCOM() {
    CoUninitialize();
}

export function createGUID(guidString: string): Buffer {
    const buf = Buffer.alloc(GUID_SIZE);
    const hr = IIDFromString(guidString, buf);
    if (hr !== 0) {
        throw new Error(`IIDFromString failed: ${hr}`);
    }
    return buf;
}

export function createInstance(clsidString: string, iidString: string): any {
    const clsid = createGUID(clsidString);
    const iid = createGUID(iidString);
    const ppvBuf = Buffer.alloc(PTR_SIZE);
    
    const hr = CoCreateInstance(clsid, null, CLSCTX_ALL, iid, ppvBuf);
    if (hr !== 0) {
        throw new Error(`CoCreateInstance failed with HRESULT ${hr} for CLSID ${clsidString}`);
    }
    return koffi.decode(ppvBuf, 'void*');
}

/** Allocate a Buffer for receiving a pointer output param, then decode it after a COM call. */
export function ptrBuf(): Buffer {
    return Buffer.alloc(PTR_SIZE);
}

/** Decode a pointer from a Buffer returned by a COM out-param. */
export function readPtr(buf: Buffer): any {
    return koffi.decode(buf, 'void*');
}

/** Read a BSTR (char16_t*) from a pointer buffer, return a JS string, and free the BSTR. */
export function readBSTR(buf: Buffer): string {
    const ptr = koffi.decode(buf, 'void*');
    if (!ptr) return '';
    const str = koffi.decode(ptr, 'char16_t', -1);
    freeBSTR(ptr);
    return str;
}

/** Allocate a Buffer for receiving an int32 output param. */
export function intBuf(): Buffer {
    return Buffer.alloc(4);
}

/** Read an int32 from a Buffer returned by a COM out-param. */
export function readInt(buf: Buffer): number {
    return buf.readInt32LE(0);
}

/** Allocate a Buffer for receiving a double (float64) output param. */
export function dblBuf(): Buffer {
    return Buffer.alloc(8);
}

/** Read a double from a Buffer returned by a COM out-param. */
export function readDouble(buf: Buffer): number {
    return buf.readDoubleLE(0);
}
