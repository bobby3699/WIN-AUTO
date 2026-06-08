import koffi from 'koffi';

export const oleaut32 = koffi.load('oleaut32.dll');

export const BSTR = koffi.pointer('BSTR', koffi.types.char16_t);
export const SysAllocString = oleaut32.func('void* __stdcall SysAllocString(const char16_t *psz)');
export const SysFreeString = oleaut32.func('void __stdcall SysFreeString(void* bstrString)');

export function createBSTR(str: string) {
    return SysAllocString(str);
}

export function freeBSTR(bstr: any) {
    if (bstr) {
        SysFreeString(bstr);
    }
}
