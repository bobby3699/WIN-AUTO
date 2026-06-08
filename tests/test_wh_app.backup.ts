import { execSync } from 'child_process';
import { WinAutoTS } from '../src/winauto.js';

const APP_CMD   = 'explorer.exe shell:AppsFolder\\Microsoft.WarehouseManagement_8wekyb3d8bbwe!App';
const APP_TITLE = 'Warehouse Management';
const LOGIN_USER  = 'sya';
const LOGIN_PASS  = '123456';
const PO_NUMBER   = 'BO-AXP-000947';

async function main() {
    try { execSync('taskkill /F /FI "WINDOWTITLE eq Warehouse Management*"'); } catch { }
    const wats = new WinAutoTS();
    wats.defaultTimeout = 5000;

    const appWindow = await wats.launchAndFind(APP_CMD, APP_TITLE);
    wats.maximizeWindow(appWindow);

    await wats.locator(appWindow, 'edit', 'User ID').typeValue(LOGIN_USER);
    await wats.locator(appWindow, 'edit', 'Password').typeValue(LOGIN_PASS);
    await wats.locator(appWindow, 'button', 'Sign in').click();
    await wats.locator(appWindow, 'menuitem', 'RAF and put away', 15000).click();

    // Step 1: Scan PO number — findEdits loop (sets value on all 134 matching edits across SPA DOM)
    await wats.locator(appWindow, 'label', 'Scan or enter here', 10000).clickInput();
    await new Promise(r => setTimeout(r, 1000));
    const allEdits = wats.findEdits(appWindow);
    let matchCount = 0;
    for (const edit of allEdits) {
        if (edit.getName() === 'Scan or enter here') {
            matchCount++;
            console.log(`  [${matchCount}] edit matched: class="${edit.getClassName()}" enabled=${edit.isEnabled()}`);
            edit.setValue(PO_NUMBER);
        } else {
            edit.Release();
        }
    }
    console.log(`Total edits named 'Scan or enter here': ${matchCount}`);
    await wats.pressEnter();
    execSync(`powershell -WindowStyle Hidden -Command "Add-Type -AssemblyName System.Windows.Forms,System.Drawing;$s=[System.Windows.Forms.Screen]::PrimaryScreen.Bounds;$b=New-Object System.Drawing.Bitmap($s.Width,$s.Height);$g=[System.Drawing.Graphics]::FromImage($b);$g.CopyFromScreen($s.Location,[System.Drawing.Point]::Empty,$s.Size);$b.Save('C:\\\\temp\\\\step1_after_enter.png');$g.Dispose();$b.Dispose()"`, { timeout: 10000 });
    console.log('Screenshot: C:\\temp\\step1_after_enter.png');

    appWindow.Release();
    wats.close();
    console.log('Done.');
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
