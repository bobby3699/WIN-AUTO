export const CLSID_CUIAutomation = '{ff48dba4-60ef-4201-aa87-54103eef594e}';
export const IID_IUIAutomation = '{30cbe57d-d9d0-452a-ab13-7ac5ac4825ee}';

// Tree Scope
export const TreeScope = {
    TreeScope_None: 0,
    TreeScope_Element: 1,
    TreeScope_Children: 2,
    TreeScope_Descendants: 4,
    TreeScope_Parent: 8,
    TreeScope_Ancestors: 16,
    TreeScope_Subtree: 7 // Element | Children | Descendants
};

// Control Types
export const ControlType = {
    UIA_ButtonControlTypeId: 50000,
    UIA_CalendarControlTypeId: 50001,
    UIA_CheckBoxControlTypeId: 50002,
    UIA_ComboBoxControlTypeId: 50003,
    UIA_EditControlTypeId: 50004,
    UIA_HyperlinkControlTypeId: 50005,
    UIA_ImageControlTypeId: 50006,
    UIA_ListItemControlTypeId: 50007,
    UIA_ListControlTypeId: 50008,
    UIA_MenuControlTypeId: 50009,
    UIA_MenuBarControlTypeId: 50010,
    UIA_MenuItemControlTypeId: 50011,
    UIA_ProgressBarControlTypeId: 50012,
    UIA_RadioButtonControlTypeId: 50013,
    UIA_ScrollBarControlTypeId: 50014,
    UIA_SliderControlTypeId: 50015,
    UIA_SpinnerControlTypeId: 50016,
    UIA_StatusBarControlTypeId: 50017,
    UIA_TabControlTypeId: 50018,
    UIA_TabItemControlTypeId: 50019,
    UIA_TextControlTypeId: 50020,
    UIA_ToolBarControlTypeId: 50021,
    UIA_ToolTipControlTypeId: 50022,
    UIA_TreeControlTypeId: 50023,
    UIA_TreeItemControlTypeId: 50024,
    UIA_CustomControlTypeId: 50025,
    UIA_GroupControlTypeId: 50026,
    UIA_ThumbControlTypeId: 50027,
    UIA_DataGridControlTypeId: 50028,
    UIA_DataItemControlTypeId: 50029,
    UIA_DocumentControlTypeId: 50030,
    UIA_SplitButtonControlTypeId: 50031,
    UIA_WindowControlTypeId: 50032,
    UIA_PaneControlTypeId: 50033,
    UIA_HeaderControlTypeId: 50034,
    UIA_HeaderItemControlTypeId: 50035,
    UIA_TableControlTypeId: 50036,
    UIA_TitleBarControlTypeId: 50037,
    UIA_SeparatorControlTypeId: 50038,
    UIA_SemanticZoomControlTypeId: 50039,
    UIA_AppBarControlTypeId: 50040
};

// Pattern IDs
export const PatternId = {
    UIA_InvokePatternId: 10000,
    UIA_SelectionPatternId: 10001,
    UIA_ValuePatternId: 10002,
    UIA_RangeValuePatternId: 10003,
    UIA_ScrollPatternId: 10004,
    UIA_ExpandCollapsePatternId: 10005,
    UIA_GridPatternId: 10006,
    UIA_GridItemPatternId: 10007,
    UIA_MultipleViewPatternId: 10008,
    UIA_WindowPatternId: 10009,
    UIA_SelectionItemPatternId: 10010,
    UIA_DockPatternId: 10011,
    UIA_TablePatternId: 10012,
    UIA_TableItemPatternId: 10013,
    UIA_TextPatternId: 10014,
    UIA_TogglePatternId: 10015,
    UIA_TransformPatternId: 10016,
    UIA_ScrollItemPatternId: 10017,
    UIA_LegacyIAccessiblePatternId: 10018,
    UIA_ItemContainerPatternId: 10019,
    UIA_VirtualizedItemPatternId: 10020,
    UIA_SynchronizedInputPatternId: 10021,
    UIA_ObjectModelPatternId: 10022,
    UIA_AnnotationPatternId: 10023,
    UIA_TextPattern2Id: 10024,
    UIA_StylesPatternId: 10025,
    UIA_SpreadsheetPatternId: 10026,
    UIA_SpreadsheetItemPatternId: 10027,
    UIA_TransformPattern2Id: 10028,
    UIA_TextChildPatternId: 10029,
    UIA_DragPatternId: 10030,
    UIA_DropTargetPatternId: 10031,
    UIA_TextEditPatternId: 10032,
    UIA_CustomNavigationPatternId: 10033
};

// Properties
export const PropertyId = {
    UIA_RuntimeIdPropertyId: 30000,
    UIA_BoundingRectanglePropertyId: 30001,
    UIA_ProcessIdPropertyId: 30002,
    UIA_ControlTypePropertyId: 30003,
    UIA_LocalizedControlTypePropertyId: 30004,
    UIA_NamePropertyId: 30005,
    UIA_AcceleratorKeyPropertyId: 30006,
    UIA_AccessKeyPropertyId: 30007,
    UIA_HasKeyboardFocusPropertyId: 30008,
    UIA_IsKeyboardFocusablePropertyId: 30009,
    UIA_IsEnabledPropertyId: 30010,
    UIA_AutomationIdPropertyId: 30011,
    UIA_ClassNamePropertyId: 30012,
    UIA_HelpTextPropertyId: 30013,
    UIA_ClickablePointPropertyId: 30014,
    UIA_CulturePropertyId: 30015,
    UIA_IsControlElementPropertyId: 30016,
    UIA_IsContentElementPropertyId: 30017,
    UIA_LabeledByPropertyId: 30018,
    UIA_IsPasswordPropertyId: 30019,
    UIA_NativeWindowHandlePropertyId: 30020,
    UIA_ItemTypePropertyId: 30021,
    UIA_IsOffscreenPropertyId: 30022,
    UIA_OrientationPropertyId: 30023,
    UIA_FrameworkIdPropertyId: 30024,
    UIA_IsRequiredForFormPropertyId: 30025,
    UIA_ItemStatusPropertyId: 30026,
    UIA_IsDockPatternAvailablePropertyId: 30027,
    UIA_IsExpandCollapsePatternAvailablePropertyId: 30028,
    UIA_IsGridItemPatternAvailablePropertyId: 30029,
    UIA_IsGridPatternAvailablePropertyId: 30030,
    UIA_IsInvokePatternAvailablePropertyId: 30031,
    UIA_IsMultipleViewPatternAvailablePropertyId: 30032,
    UIA_IsRangeValuePatternAvailablePropertyId: 30033,
    UIA_IsScrollPatternAvailablePropertyId: 30034,
    UIA_IsScrollItemPatternAvailablePropertyId: 30035,
    UIA_IsSelectionItemPatternAvailablePropertyId: 30036,
    UIA_IsSelectionPatternAvailablePropertyId: 30037,
    UIA_IsTablePatternAvailablePropertyId: 30038,
    UIA_IsTableItemPatternAvailablePropertyId: 30039,
    UIA_IsTextPatternAvailablePropertyId: 30040,
    UIA_IsTogglePatternAvailablePropertyId: 30041,
    UIA_IsTransformPatternAvailablePropertyId: 30042,
    UIA_IsValuePatternAvailablePropertyId: 30043,
    UIA_IsWindowPatternAvailablePropertyId: 30044,
    UIA_ValueValuePropertyId: 30045,
    UIA_ValueIsReadOnlyPropertyId: 30046
};

// Window visual states
export const WindowVisualState = {
    WindowVisualState_Normal: 0,
    WindowVisualState_Maximized: 1,
    WindowVisualState_Minimized: 2
};

// Toggle states
export const ToggleState = {
    ToggleState_Off: 0,
    ToggleState_On: 1,
    ToggleState_Indeterminate: 2
};

// ExpandCollapse states
export const ExpandCollapseState = {
    ExpandCollapseState_Collapsed: 0,
    ExpandCollapseState_Expanded: 1,
    ExpandCollapseState_PartiallyExpanded: 2,
    ExpandCollapseState_LeafNode: 3
};

// Structures
export interface tagRECT {
    left: number;
    top: number;
    right: number;
    bottom: number;
}
