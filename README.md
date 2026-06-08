# win-auto-ts

**win-auto-ts** is a TypeScript library for Windows Desktop Automation. It bridges directly to Microsoft's **UI Automation (UIA) COM API** using [Koffi](https://koffi.dev/) FFI — no C++ compilation, no native addons.

> **Windows only.** Requires Node.js >= 18.

---

## Installation

```bash
npm install win-auto-ts
```

---

## Quick Start

```typescript
import { execSync } from 'child_process';
import { WinAutoTS } from 'win-auto-ts';

async function main() {
    try { execSync('taskkill /F /FI "WINDOWTITLE eq My App*"'); } catch {}

    const wats = new WinAutoTS();
    wats.defaultTimeout = 5000; // global poll timeout for all locators

    const appWindow = await wats.launchAndFind('explorer.exe shell:AppsFolder\\MyApp!App', 'My App');
    wats.maximizeWindow(appWindow);

    // Login
    await wats.locator(appWindow, 'edit',   'User ID').typeValue('myuser');
    await wats.locator(appWindow, 'edit',   'Password').typeValue('mypass');
    await wats.locator(appWindow, 'button', 'Sign in').click();

    // Navigate and assert
    await wats.locator(appWindow, 'menuitem', 'Dashboard', 10000).click();
    await wats.locator(appWindow, 'edit', 'Search').toBePresent();

    // Interact
    await wats.locator(appWindow, 'edit', 'Search').typeValue('12345');
    wats.pressEnter();

    appWindow.Release();
    wats.close();
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
```

---

## Discovering Elements

Before automating a page, print all available locators:

```typescript
wats.printControlIdentifiers({ appWindow });
```

Output:
```
locator(appWindow, 'button', 'Sign in');
locator(appWindow, 'edit',   'User ID');
locator(appWindow, 'edit',   'Password');
locator(appWindow, 'menuitem', 'Dashboard');
```

Use these lines directly in your code.

---

## Locators

`locator()` finds an element by type and name.

```typescript
// Immediate (no timeout):
wats.locator(appWindow, 'button', 'Submit').click();

// With global timeout:
wats.defaultTimeout = 5000;
await wats.locator(appWindow, 'button', 'Submit').click();

// Override timeout for one locator:
await wats.locator(appWindow, 'menuitem', 'Dashboard', 10000).click();
```

### Locator Types

| Type          | Element                   |
|---------------|---------------------------|
| `button`      | Button                    |
| `edit`        | Text input / field        |
| `menuitem`    | Menu item                 |
| `checkbox`    | Checkbox                  |
| `combobox`    | Dropdown                  |
| `listitem`    | List item                 |
| `label`       | Static text / label       |
| `radiobutton` | Radio button              |
| `tab`         | Tab item                  |
| `treeitem`    | Tree node                 |
| `datagrid`    | Data grid / table         |
| `dataitem`    | Row inside a data grid    |
| `hyperlink`   | Hyperlink                 |
| `slider`      | Slider                    |
| `spinner`     | Spinner / number input    |
| `progressbar` | Progress bar              |
| `image`       | Image                     |

---

## Actions

All actions auto-release the element. Use `await` when a timeout is set.

| Method | Description |
|---|---|
| `.click()` | UIA invoke — buttons, menu items, hyperlinks |
| `.clickInput()` | Physical mouse click — edit fields, labels |
| `.typeValue(text)` | Type text into an edit field |
| `.pressEnter()` | Focus the field and press Enter |
| `.select()` | Select a list item, radio button, or tab |
| `.toggle()` | Toggle a checkbox |
| `.expand()` | Open a dropdown or tree node |
| `.collapse()` | Close a dropdown or tree node |
| `.scrollIntoView()` | Scroll element into the visible area |

---

## Keyboard

```typescript
wats.pressEnter();         // Enter
wats.pressTab();           // Tab
wats.pressEscape();        // Escape
wats.pressKey('F5');       // named key
wats.pressKey('Delete');
wats.pressKey('PageDown');
wats.pressKey(0x41);       // raw VK code

// Supported names (case-insensitive):
// Enter, Tab, Escape/Esc, Backspace, Delete/Del, Space
// Home, End, PageUp, PageDown, Left, Up, Right, Down, F1–F12
```

---

## Assertions

Polls with timeout and throws a clear error if the condition is not met.

```typescript
await wats.locator(appWindow, 'edit',     'Search').toBePresent();
await wats.locator(appWindow, 'button',   'Delete').toBeAbsent();
await wats.locator(appWindow, 'button',   'Submit').toBeEnabled();
await wats.locator(appWindow, 'button',   'Submit').toBeDisabled();
await wats.locator(appWindow, 'edit',     'Order').toHaveValue('12345');
await wats.locator(appWindow, 'checkbox', 'Active').toBeChecked();
await wats.locator(appWindow, 'checkbox', 'Active').toBeUnchecked();
```

---

## Reading Values

```typescript
const value = await wats.locator(appWindow, 'edit',  'Order').getValue();
const text  = await wats.locator(appWindow, 'label', 'Status').getText();
```

---

## Existence Check

```typescript
const found = await wats.locator(appWindow, 'edit', 'Search').exists();
console.log('exists:', found); // true or false
```

---

## Wait for Element to Disappear

```typescript
// Wait for a loading spinner to vanish:
await wats.locator(appWindow, 'progressbar', 'Loading').waitForAbsent(15000);
```

---

## Memory Management

Locator actions auto-release — no manual cleanup needed:

```typescript
await wats.locator(appWindow, 'button', 'Submit').click();     // auto-released
await wats.locator(appWindow, 'edit',   'Order').getValue();   // auto-released
```

Always release the app window and call `close()` at the end:

```typescript
appWindow.Release();
wats.close();
```

---

## Architecture

```
src/
├── core/
│   ├── com.ts        — COM init, CoCreateInstance, GUID/BSTR helpers
│   ├── bstr.ts       — SysAllocString / SysFreeString (oleaut32.dll)
│   └── vtable.ts     — COMObject base: decodes vtable, binds methods via koffi
├── uia/
│   ├── constants.ts  — IID/CLSID GUIDs, TreeScope, ControlType, PatternId
│   └── interfaces.ts — CUIAutomation, UIAElement, UIALocatorResult, UIALocatorPromise
└── winauto.ts        — WinAutoTS facade
```

---

## License

ISC © Babul Reddy Korimella
