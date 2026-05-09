import { execSync } from 'child_process';
import { WinAutoTS } from '../src/winauto.js';

const APP_CMD   = 'explorer.exe shell:AppsFolder\\Microsoft.WarehouseManagement_8wekyb3d8bbwe!App';
const APP_TITLE = 'Warehouse Management';
const LOGIN_USER  = 'sya';
const LOGIN_PASS  = '123456';
const PO_NUMBER   = 'BO-AXP-000947';
const LP_NUMBER   = 'LP-63877870';

async function main() {
    try { execSync('taskkill /F /FI "WINDOWTITLE eq Warehouse Management*"'); } catch { }
    const wats = new WinAutoTS();
    wats.defaultTimeout = 3000;

    const appWindow = await wats.launchAndFind(APP_CMD, APP_TITLE);
    wats.maximizeWindow(appWindow);

    // Count login page elements
    const loginEdits   = wats.findEdits(appWindow);
    const loginButtons = wats.findButtons(appWindow);
    const userIdCount   = loginEdits.filter(el => el.getName() === 'User ID').length;
    const passwordCount = loginEdits.filter(el => el.getName() === 'Password').length;
    const signInCount   = loginButtons.filter(el => el.getName() === 'Sign in').length;
    loginEdits.forEach(el => el.Release());
    loginButtons.forEach(el => el.Release());
    console.log(`User ID edits  : ${userIdCount}`);
    console.log(`Password edits : ${passwordCount}`);
    console.log(`Sign in buttons: ${signInCount}`);

    await wats.locator(appWindow, 'edit', 'User ID').typeValue(LOGIN_USER);
    await wats.locator(appWindow, 'edit', 'Password').typeValue(LOGIN_PASS);
    await wats.locator(appWindow, 'button', 'Sign in').click();
    await wats.locator(appWindow, 'menuitem', 'RAF and put away', 15000).click();

    // Step 1: Scan PO number
    await wats.locator(appWindow, 'label', 'Scan or enter here', 10000).clickInput();
    await wats.setTimeOut(1000);
    function findAndSetPONumber(poNumber: string) {
        const allEdits = wats.findEdits(appWindow);
        for (const edit of allEdits) {
            if (edit.getName() === 'Scan or enter here' && edit.isEnabled() && !edit.isOffscreen()) {
                edit.setValue(poNumber);
                const stuck = edit.getValue() === poNumber;
                edit.Release();
                if (stuck) break;
            } else {
                edit.Release();
            }
        }
    }
    findAndSetPONumber(PO_NUMBER);

    await wats.pressEnter();

    await wats.locator(appWindow, 'label', 'Select quantity').clickInput();

    // for (let i = 0; i < 3; i++) {
    //     await wats.locator(appWindow, 'button', 'Backspace').click();
    // }
    await wats.locator(appWindow, 'button', '1').click();
    await wats.locator(appWindow, 'button', '0').click();

    const submitButtons = wats.findButtons(appWindow);
    const submitCount = submitButtons.filter(el => el.getName() === 'Submit').length;
    console.log(`Submit buttons: ${submitCount}`);
    for (const el of submitButtons) {
        if (el.getName() === 'Submit' && el.isEnabled() && !el.isOffscreen()) {
            el.click();
        }
        el.Release();
    }

    await wats.setTimeOut(5000);

    wats.printControlIdentifiers({ appWindow });

    execSync(`powershell -WindowStyle Hidden -Command "Add-Type -AssemblyName System.Windows.Forms,System.Drawing;$s=[System.Windows.Forms.Screen]::PrimaryScreen.Bounds;$b=New-Object System.Drawing.Bitmap($s.Width,$s.Height);$g=[System.Drawing.Graphics]::FromImage($b);$g.CopyFromScreen($s.Location,[System.Drawing.Point]::Empty,$s.Size);$b.Save('C:\\\\temp\\\\step1_po_scan.png');$g.Dispose();$b.Dispose()"`, { timeout: 10000 });
    console.log('Screenshot: C:\\temp\\step1_po_scan.png');



    // findAndSetPONumber(LP_NUMBER);
    
    // await wats.pressEnter();

    // await wats.locator(appWindow, 'button', 'COMM').click();

    // await wats.locator(appWindow, 'button', ' Create sub batch numbers').click();

    // await wats.locator(appWindow, 'label', 'Enter quantity per sub batch');

    // await wats.locator(appWindow, 'button', '5').click();

    // await wats.locator(appWindow, 'button', 'Submit').click();

    // await wats.setTimeOut(5000);


    // // await wats.locator(appWindow, 'label', 'Scan a license plate').clickInput();
    
    // wats.printControlIdentifiers({ appWindow });
    

    appWindow.Release();
    wats.close();
    console.log('Done.');
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
