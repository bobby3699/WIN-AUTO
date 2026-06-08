import koffi from 'koffi';

export type MethodDef = {
    name: string;
    returns: string;
    args: string[];
};

export class COMObject {
    public ptr: any;
    protected vtable: any;

    constructor(ptr: any, methods: MethodDef[]) {
        this.ptr = ptr;
        
        // The first pointer in a COM object is a pointer to its VTable.
        // koffi.decode with 'void **' returns [undefined] for opaque pointers;
        // use koffi.array('void*', 1) instead to get a usable External back.
        const vtablePtrArr = koffi.decode(ptr, koffi.array('void*', 1));
        this.vtable = vtablePtrArr[0]; // Address of the actual method array
        
        this.bindMethods(methods);
    }

    private static protoCounter = 0;

    private bindMethods(methods: MethodDef[]) {
        // Read all function pointers from the VTable once
        const funcPtrArrayType = koffi.array('void *', methods.length);
        const funcPointers = koffi.decode(this.vtable, funcPtrArrayType);

        methods.forEach((method, index) => {
            // Use a unique proto name to avoid koffi global name collisions
            const uniqueName = `${method.name}_${COMObject.protoCounter++}`;
            const signature = `${method.returns} __stdcall ${uniqueName}(void* pThis${method.args.length > 0 ? ', ' + method.args.join(', ') : ''})`;
            const proto = koffi.proto(signature);
            const funcPtr = funcPointers[index];
            const callable = koffi.decode(funcPtr, proto) as Function;
            
            (this as any)[method.name] = (...args: any[]) => {
                return callable(this.ptr, ...args);
            };
        });
    }

    // Standard IUnknown methods (first 3 of any COM VTable)
    public QueryInterface(riid: any, ppvObject: any) {
        return (this as any)._QueryInterface(riid, ppvObject);
    }

    public AddRef() {
        return (this as any)._AddRef();
    }

    public Release() {
        return (this as any)._Release();
    }
}

// IUnknown occupies index 0, 1, and 2.
export const IUnknownMethods: MethodDef[] = [
    { name: '_QueryInterface', returns: 'HRESULT', args: ['void*', 'void*'] },
    { name: '_AddRef', returns: 'DWORD', args: [] },
    { name: '_Release', returns: 'DWORD', args: [] },
];

export class IUnknownObject extends COMObject {
    constructor(ptr: any) {
        super(ptr, IUnknownMethods);
    }
}
