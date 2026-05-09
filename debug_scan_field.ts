import { execSync } from 'child_process';
import { WinAutoTS } from '../src/winauto.js';
import { PatternId } from '../src/uia/constants.js';
import { ptrBuf, readPtr, readBSTR, intBuf, readInt } from '../src/core/com.js';
import { createBSTR, freeBSTR } from '../src/core/bstr.js';

const APP_CMD   = 'explorer.exe shell:AppsFolder\\Microsoft.WarehouseManagement_8wekyb3d8bbwe!App';
const APP_TITLE = 'Warehouse Management';
const LOGIN_USER = 'sya';
const LOGIN_PASS = '123456';

async function main() {
    try { execSync('taskkill /F /FI "WINDOWTITLE eq Warehouse Management*"'); } catch {}
    const wats = new WinAutoTS();
    wats.defaultTimeout = 5000;

    const appWindow = await wats.launchAndFind(APP_CMD, APP_TITLE);
    wats.maximizeWindow(appWindow);

    await wats.locator(appWindow, 'edit', 'User ID').typeValue(LOGIN_USER);
    await wats.locator(appWindow, 'edit', 'Password').typeValue(LOGIN_PASS);
    await wats.locator(appWindow, 'button', 'Sign in').click();
    await wats.locator(appWindow, 'menuitem', 'RAF and put away', 15000).click();

    // ─── DIAGNOSTIC: Print all elements on this page BEFORE clicking ─────
    console.log('\n=== ELEMENTS BEFORE clickInput ===');
    wats.printControlIdentifiers({ appWindow });

    // Click the label to activate the field
    console.log('\n--- Clicking label "Scan or enter here" ---');
    await wats.locator(appWindow, 'label', 'Scan or enter here', 10000).clickInput();

    // Small delay for field to activate
    await new Promise(r => setTimeout(r, 1000));

    // ─── DIAGNOSTIC: Print all elements AFTER clicking ─────
    console.log('\n=== ELEMENTS AFTER clickInput (1s delay) ===');
    wats.printControlIdentifiers({ appWindow });

    // ─── DIAGNOSTIC: Try to find the edit element and inspect it ─────
    console.log('\n=== INSPECTING EDIT ELEMENTS ===');
    const allEdits = wats.findEdits(appWindow);
    console.log(`Found ${allEdits.length} edit field(s):`);
    for (const edit of allEdits) {
        const name = edit.getName();
        const autoId = edit.getAutomationId();
        const className = edit.getClassName();
        const enabled = edit.isEnabled();
        const focusable = edit.isKeyboardFocusable();
        const isPassword = edit.isPasswordField();
        const helpText = edit.getHelpText();
        const frameworkId = edit.getFrameworkId();

        console.log(`  Edit: name="${name}" autoId="${autoId}" class="${className}" framework="${frameworkId}"`);
        console.log(`        enabled=${enabled} focusable=${focusable} isPassword=${isPassword} helpText="${helpText}"`);

        // Check which patterns are supported
        const patterns = [
            { id: PatternId.UIA_ValuePatternId, name: 'ValuePattern' },
            { id: PatternId.UIA_LegacyIAccessiblePatternId, name: 'LegacyIAccessible' },
            { id: PatternId.UIA_TextPatternId, name: 'TextPattern' },
            { id: PatternId.UIA_InvokePatternId, name: 'InvokePattern' },
        ];
        for (const p of patterns) {
            const buf = ptrBuf();
            const hr = (edit as any).GetCurrentPattern(p.id, buf);
            const ptr = hr >= 0 ? readPtr(buf) : null;
            console.log(`        ${p.name}: ${ptr ? 'YES' : 'NO'} (hr=${hr})`);
        }

        // If this is the "Scan or enter here" field, try to input step by step
        if (name === 'Scan or enter here' || name.toLowerCase().includes('scan')) {
            console.log(`\n  >>> Found target field: "${name}" — testing input methods...`);

            // Method 1: ValuePattern.SetValue
            try {
                const buf = ptrBuf();
                const hr = (edit as any).GetCurrentPattern(PatternId.UIA_ValuePatternId, buf);
                const ptr = hr >= 0 ? readPtr(buf) : null;
                if (!ptr) throw new Error(`ValuePattern not available (hr=${hr})`);
                console.log(`  [1] ValuePattern ptr obtained`);

                // Check read-only
                const roBuf = intBuf();
                // read vtable slot for get_CurrentIsReadOnly
                const vpObj = { ptr, Release: () => {} }; // minimal
                // Actually let's use the class
                const { UIAValuePattern } = await import('../src/uia/interfaces.js');
                const vp = new UIAValuePattern(ptr);
                (vp as any).get_CurrentIsReadOnly(roBuf);
                const readOnly = readInt(roBuf);
                console.log(`  [1] ValuePattern readOnly=${readOnly}`);

                if (readOnly === 0) {
                    const bstr = createBSTR('BO-AXP-000947');
                    const setHr = (vp as any).SetValue(bstr);
                    freeBSTR(bstr);
                    console.log(`  [1] SetValue hr=${setHr} ${setHr === 0 ? '✓ SUCCESS' : '✗ FAILED'}`);
                } else {
                    console.log(`  [1] Field is READ-ONLY — SetValue skipped`);
                }
                vp.Release();
            } catch (e: any) {
                console.log(`  [1] ValuePattern FAILED: ${e.message}`);
            }

            // Check current value after attempt
            try {
                const currentVal = edit.getValue();
                console.log(`  Current value after attempt: "${currentVal}"`);
            } catch (e: any) {
                console.log(`  Could not read value: ${e.message}`);
            }

            // Method 2: LegacyIAccessible.SetValue
            try {
                const buf = ptrBuf();
                const hr = (edit as any).GetCurrentPattern(PatternId.UIA_LegacyIAccessiblePatternId, buf);
                const ptr = hr >= 0 ? readPtr(buf) : null;
                if (!ptr) throw new Error(`LegacyIAccessible not available (hr=${hr})`);

                const { UIALegacyIAccessiblePattern } = await import('../src/uia/interfaces.js');
                const lp = new UIALegacyIAccessiblePattern(ptr);
                const bstr = createBSTR('BO-AXP-000947');
                const setHr = (lp as any).SetValue(bstr);
                freeBSTR(bstr);
                console.log(`  [2] LegacyIAccessible SetValue hr=${setHr} ${setHr === 0 ? '✓ SUCCESS' : '✗ FAILED'}`);
                lp.Release();
            } catch (e: any) {
                console.log(`  [2] LegacyIAccessible FAILED: ${e.message}`);
            }

            // Check current value after attempt
            try {
                const currentVal = edit.getValue();
                console.log(`  Current value after legacy attempt: "${currentVal}"`);
            } catch {}

            // Method 3: typeKeyboard (SendKeys via PowerShell)
            console.log(`  [3] Trying typeKeyboard (SendKeys via PowerShell)...`);
            try {
                const pid = edit.getProcessId();
                console.log(`  [3] Process ID: ${pid}`);
                // Don't actually call typeKeyboard since it releases the element
                // Just report the PID for now
            } catch (e: any) {
                console.log(`  [3] typeKeyboard setup FAILED: ${e.message}`);
            }

            // Screenshot to see field state after all methods
            try {
                execSync(`powershell -WindowStyle Hidden -Command "Add-Type -AssemblyName System.Windows.Forms,System.Drawing;$s=[System.Windows.Forms.Screen]::PrimaryScreen.Bounds;$b=New-Object System.Drawing.Bitmap($s.Width,$s.Height);$g=[System.Drawing.Graphics]::FromImage($b);$g.CopyFromScreen($s.Location,[System.Drawing.Point]::Empty,$s.Size);$b.Save('C:\\\\temp\\\\debug_scan_state.png');$g.Dispose();$b.Dispose()"`, { timeout: 10000 });
                console.log(`  Screenshot saved: C:\\temp\\debug_scan_state.png`);
            } catch {}

            console.log(`\n  >>> RECOMMENDATION: Based on the above, try one of these fixes in the test:`);
            console.log(`      a) Use .typeKeyboard() instead of .typeValue() — for UWP scanner fields`);
            console.log(`      b) Use .clickInput() then .typeKeyboard() — activate + SendKeys`);
            console.log(`      c) Ensure the field is not read-only when the page loads\n`);
        }

        edit.Release();
    }

    // ─── Also check: is there a different element name after clicking? ─────
    console.log('\n=== CHECKING ALL DESCENDANTS WITH "scan" IN NAME ===');
    const allDescs = wats.findDescendants(appWindow);
    for (const el of allDescs) {
        const name = el.getName().toLowerCase();
        if (name.includes('scan') || name.includes('enter here') || name.includes('barcode')) {
            console.log(`  [${el.getControlTypeName()}] Name="${el.getName()}" AutoId="${el.getAutomationId()}" Enabled=${el.isEnabled()}`);
        }
        el.Release();
    }

    appWindow.Release();
    wats.close();
    console.log('\nDiagnostic complete.');
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
