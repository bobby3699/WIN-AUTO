# win-auto-ts Usage Guide

## Setup

```typescript
import { WinAutoTS } from './src/winauto.js';

const wats = new WinAutoTS();
wats.defaultTimeout = 5000; // default wait for all locators (ms)
// ... your automation code ...
wats.close(); // always call at the end
```

---

## Launch & Find Window

```typescript
const appWindow = await wats.launchAndFind('explorer.exe shell:AppsFolder\\App!App', 'App Title');
wats.maximizeWindow(appWindow);
```

---

## Discovering Elements

Before automating a page, print all available locators:

```typescript
wats.printControlIdentifiers({ appWindow });
```

Output example:
```
locator(appWindow, 'button', 'Sign in');
locator(appWindow, 'edit',   'User ID');
locator(appWindow, 'edit',   'Password');
locator(appWindow, 'menuitem', 'RAF and put away');
```

Use these lines directly in your code.

---

## Locators

`locator()` finds an element by type and name. It polls until the element appears (using `defaultTimeout`) or finds immediately if no timeout is set.

```typescript
// Immediate find (no timeout):
wats.locator(appWindow, 'button', 'Submit').click();

// With default timeout (set once):
wats.defaultTimeout = 5000;
await wats.locator(appWindow, 'button', 'Submit').click();

// Override timeout for a specific locator:
await wats.locator(appWindow, 'menuitem', 'My Page', 10000).click();
```

### `.exists()` — check without throwing

```typescript
const found = await wats.locator(appWindow, 'edit', 'Scan or enter here').exists();
console.log('exists:', found); // true or false
```

### Locator Types

| Type          | Element                        |
|---------------|-------------------------------|
| `button`      | Button                        |
| `edit`        | Text input / field            |
| `menuitem`    | Menu item                     |
| `checkbox`    | Checkbox                      |
| `combobox`    | Dropdown                      |
| `listitem`    | List item                     |
| `label`       | Static text / label           |
| `radiobutton` | Radio button                  |
| `tab`         | Tab item                      |
| `treeitem`    | Tree node                     |
| `datagrid`    | Data grid / table             |
| `dataitem`    | Row inside a data grid        |
| `hyperlink`   | Hyperlink                     |
| `slider`      | Slider                        |
| `spinner`     | Spinner / number input        |
| `progressbar` | Progress bar                  |
| `image`       | Image                         |

---

## Actions

All actions auto-release the element. Use `await` when `defaultTimeout` is set.

### `.click()`
UIA-based click. Works on buttons, menu items, hyperlinks.

```typescript
await wats.locator(appWindow, 'button',   'Submit').click();
await wats.locator(appWindow, 'menuitem', 'RAF and put away').click();
```

### `.clickInput()`
Physical mouse click at the element's screen center.
Use for edit fields, labels, or anything `.click()` doesn't support.

```typescript
await wats.locator(appWindow, 'edit', 'Scan or enter here').clickInput();
```

### `.typeValue(text)`
Type text into an edit field. Focuses the field automatically.

```typescript
await wats.locator(appWindow, 'edit', 'User ID').typeValue('sya');
await wats.locator(appWindow, 'edit', 'Password').typeValue('123456');
```

### `.scrollIntoView()`
Scrolls the element into the visible area of its container.

```typescript
await wats.locator(appWindow, 'listitem', 'Item 50').scrollIntoView();
```

### `.select()`
Select a list item, radio button, or tab.

```typescript
await wats.locator(appWindow, 'listitem',    'Option A').select();
await wats.locator(appWindow, 'radiobutton', 'Yes').select();
```

### `.toggle()`
Toggle a checkbox.

```typescript
await wats.locator(appWindow, 'checkbox', 'Remember me').toggle();
```

### `.expand()` / `.collapse()`
Open or close a dropdown or tree node.

```typescript
await wats.locator(appWindow, 'combobox', 'Country').expand();
await wats.locator(appWindow, 'combobox', 'Country').collapse();
```

### `.pressEnter()`
Press Enter on a focused field — use after `typeValue()` to submit.

```typescript
await wats.locator(appWindow, 'edit', 'Scan or enter here').typeValue('TEST123');
await wats.locator(appWindow, 'edit', 'Scan or enter here').pressEnter();
```

---

## Keyboard

Standalone key presses — no locator needed. Call after an action that focuses the field.

```typescript
await wats.locator(appWindow, 'edit', 'Scan or enter here').typeValue('TEST123');
wats.pressEnter();         // press Enter
wats.pressTab();           // move focus to next field
wats.pressEscape();        // dismiss / cancel
wats.pressKey('F5');       // named key
wats.pressKey('Delete');   // named key
wats.pressKey('PageDown'); // named key
wats.pressKey(0x41);       // raw VK code (e.g. 0x41 = 'A')

// Supported names (case-insensitive):
// Enter, Tab, Escape/Esc, Backspace, Delete/Del, Space
// Home, End, PageUp, PageDown, Left, Up, Right, Down
// F1 – F12
```

---

## Wait for Element to Disappear

Poll until an element vanishes — useful for loading spinners or progress bars.

```typescript
// Uses defaultTimeout (5000ms fallback):
await wats.locator(appWindow, 'progressbar', 'Loading').waitForAbsent();

// Custom timeout:
await wats.locator(appWindow, 'progressbar', 'Loading').waitForAbsent(15000);
```

Throws if the element is still present after the timeout.

---

## Assertions

Polls with timeout and throws a clear error if the condition is not met.

```typescript
await wats.locator(appWindow, 'edit',     'Scan or enter here').toBePresent();
await wats.locator(appWindow, 'button',   'Delete').toBeAbsent();
await wats.locator(appWindow, 'button',   'Submit').toBeEnabled();
await wats.locator(appWindow, 'button',   'Submit').toBeDisabled();
await wats.locator(appWindow, 'edit',     'Order').toHaveValue('12345');
await wats.locator(appWindow, 'checkbox', 'Active').toBeChecked();
await wats.locator(appWindow, 'checkbox', 'Active').toBeUnchecked();
```

---

## Reading Values

Read directly through the locator — no manual `Release()` needed.

```typescript
// Through locator (auto-releases):
const text  = await wats.locator(appWindow, 'edit', 'Order').getValue(); // current field value
const label = await wats.locator(appWindow, 'label', 'Status').getText(); // element display name
console.log('Order:', text);
console.log('Status:', label);
```

### Raw element (manual Release required)

Use `findByName()` or `findEditByName()` when you need low-level properties not exposed by the locator.

```typescript
const el = wats.findByName(appWindow, 'Scan or enter here');
if (el) {
    console.log(el.getName());         // element name
    console.log(el.getAutomationId()); // automation ID
    console.log(el.isEnabled());       // true / false
    console.log(el.isSelected());      // true / false
    el.Release();                      // always release manually
}
```

---

## Memory Management

```typescript
// No Release needed — locator actions auto-release:
await wats.locator(appWindow, 'button', 'Submit').click();
await wats.locator(appWindow, 'edit', 'Field').typeValue('value');
await wats.locator(appWindow, 'edit', 'Field').getValue(); // also auto-releases

// Release required only for raw elements from find* methods:
const el = wats.findEditByName(appWindow, 'Field');
if (el) {
    console.log(el.getName());
    el.Release();
}

// Always release the app window at the end:
appWindow.Release();
wats.close();
```

---

## Full Example

```typescript
import { execSync } from 'child_process';
import { WinAutoTS } from './src/winauto.js';

async function main() {
    try { execSync('taskkill /F /FI "WINDOWTITLE eq My App*"'); } catch {}

    const wats = new WinAutoTS();
    wats.defaultTimeout = 5000;

    const appWindow = await wats.launchAndFind('explorer.exe shell:AppsFolder\\MyApp!App', 'My App');
    wats.maximizeWindow(appWindow);

    // Login
    await wats.locator(appWindow, 'edit',   'User ID').typeValue('myuser');
    await wats.locator(appWindow, 'edit',   'Password').typeValue('mypass');
    await wats.locator(appWindow, 'button', 'Sign in').click();

    // Navigate
    await wats.locator(appWindow, 'menuitem', 'My Page', 10000).click();

    // Assert page loaded
    await wats.locator(appWindow, 'edit', 'Scan or enter here').toBePresent();

    // Interact
    await wats.locator(appWindow, 'edit',   'Scan or enter here').typeValue('12345');
    wats.pressEnter();
    await wats.locator(appWindow, 'button', 'Submit').click();

    appWindow.Release();
    wats.close();
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
```
