export interface UIIssue {
  id: number;
  category: string;
  description: string;
  severity: "high" | "medium" | "low";
}

export const COMMON_UI_ISSUES: UIIssue[] = [
  // Layout & Responsiveness
  { id: 1,  category: "layout",         severity: "high",   description: "Content overflows the viewport horizontally, causing a horizontal scrollbar" },
  { id: 2,  category: "layout",         severity: "high",   description: "Flex or grid children are side-by-side on a mobile-width screen when they should stack vertically" },
  { id: 3,  category: "layout",         severity: "high",   description: "An element is partially or fully hidden behind another element (z-index overlap)" },
  { id: 4,  category: "layout",         severity: "high",   description: "A fixed-width element is wider than the screen, breaking the layout" },
  { id: 5,  category: "layout",         severity: "medium", description: "Elements are misaligned — items that should be on the same baseline or axis are noticeably off" },
  { id: 6,  category: "layout",         severity: "medium", description: "A container has zero or missing padding, causing content to touch the very edge of the screen" },
  { id: 7,  category: "layout",         severity: "medium", description: "Inconsistent spacing — some items have large gaps while adjacent items are cramped" },
  { id: 8,  category: "layout",         severity: "low",    description: "An empty container or section is visible with no content and no intentional blank-state design" },

  // Typography
  { id: 9,  category: "typography",     severity: "high",   description: "Text is clipped or cut off mid-word at the edge of its container" },
  { id: 10, category: "typography",     severity: "high",   description: "Text overflows its bounding box and overlaps surrounding elements" },
  { id: 11, category: "typography",     severity: "medium", description: "Text is truncated with an ellipsis in a context where the full text should be visible" },
  { id: 12, category: "typography",     severity: "medium", description: "Font size appears extremely small (seemingly under 11px) making it unreadable" },
  { id: 13, category: "typography",     severity: "medium", description: "Line height is so tight that lines of text visually overlap each other" },
  { id: 14, category: "typography",     severity: "low",    description: "A heading and body text appear to be the same size with no visual hierarchy" },
  { id: 15, category: "typography",     severity: "low",    description: "Text alignment is inconsistent within the same block (mix of left, center, right)" },

  // Color & Contrast
  { id: 16, category: "contrast",       severity: "high",   description: "Text is nearly invisible due to very low contrast against the background (e.g. white text on light background)" },
  { id: 17, category: "contrast",       severity: "high",   description: "An icon or UI element is the same color as its background, making it invisible" },
  { id: 18, category: "contrast",       severity: "medium", description: "A button label is hard to read due to insufficient contrast between text and button color" },
  { id: 19, category: "contrast",       severity: "low",    description: "Placeholder text in an input is indistinguishable from filled-in text" },

  // Images & Media
  { id: 20, category: "images",         severity: "high",   description: "A broken image is shown (browser broken-image icon or alt text where an image should be)" },
  { id: 21, category: "images",         severity: "high",   description: "An image is stretched or squished out of its natural aspect ratio" },
  { id: 22, category: "images",         severity: "medium", description: "An image bleeds outside its container or is clipped in an unintended way" },
  { id: 23, category: "images",         severity: "low",    description: "A placeholder or lorem-ipsum image is visible (generic avatar, gray box, 'placeholder' watermark)" },

  // Buttons & Interactive Elements
  { id: 24, category: "interactive",    severity: "high",   description: "A button's label text is clipped or overflows the button boundary" },
  { id: 25, category: "interactive",    severity: "high",   description: "A button or tap target appears very small (under ~32px tall) making it hard to tap on mobile" },
  { id: 26, category: "interactive",    severity: "medium", description: "Two interactive elements (buttons, links) visually overlap each other" },
  { id: 27, category: "interactive",    severity: "medium", description: "An icon-only button has no visible label or tooltip indicator" },
  { id: 28, category: "interactive",    severity: "low",    description: "A disabled button is indistinguishable in appearance from an active button" },

  // Forms & Inputs
  { id: 29, category: "forms",          severity: "high",   description: "An input field is too narrow to display its placeholder or typed content" },
  { id: 30, category: "forms",          severity: "medium", description: "A form label is not visually associated with its input (far away or overlapping)" },
  { id: 31, category: "forms",          severity: "medium", description: "A form error message overlaps other content or is hidden behind an element" },
  { id: 32, category: "forms",          severity: "low",    description: "Form fields have inconsistent widths within the same form" },

  // Navigation
  { id: 33, category: "navigation",     severity: "high",   description: "Navigation links or menu items are cut off and not fully visible" },
  { id: 34, category: "navigation",     severity: "high",   description: "A navigation bar overlaps the main page content" },
  { id: 35, category: "navigation",     severity: "medium", description: "A breadcrumb or pagination component wraps awkwardly onto multiple lines unexpectedly" },
  { id: 36, category: "navigation",     severity: "low",    description: "Active or current-page navigation item is visually identical to inactive items" },

  // Cards & Lists
  { id: 37, category: "cards",          severity: "high",   description: "Card contents (image, title, text) overflow outside the card boundary" },
  { id: 38, category: "cards",          severity: "medium", description: "Cards in a grid have inconsistent heights making the grid look broken" },
  { id: 39, category: "cards",          severity: "medium", description: "A list item's content is vertically misaligned (e.g. icon and text on different vertical positions)" },
  { id: 40, category: "cards",          severity: "low",    description: "Card shadows or borders are cut off at the container edge" },

  // Modals & Overlays
  { id: 41, category: "modals",         severity: "high",   description: "Modal or dialog content is clipped by the screen edge and not scrollable" },
  { id: 42, category: "modals",         severity: "high",   description: "A modal's close button is not visible or is hidden behind the modal content" },
  { id: 43, category: "modals",         severity: "medium", description: "The overlay behind a modal is transparent or missing, making the modal hard to distinguish" },

  // Icons
  { id: 44, category: "icons",          severity: "high",   description: "An icon is missing and shows as a blank space or a square fallback glyph" },
  { id: 45, category: "icons",          severity: "medium", description: "An icon is disproportionately large or small relative to accompanying text" },
  { id: 46, category: "icons",          severity: "low",    description: "Multiple icons in the same row use noticeably different visual styles (outline vs filled)" },

  // Loading & Empty States
  { id: 47, category: "states",         severity: "high",   description: "Raw JSON, an error stack trace, or [object Object] is visible on the page" },
  { id: 48, category: "states",         severity: "high",   description: "A spinner or skeleton loader is frozen and overlapping real content that has already loaded" },
  { id: 49, category: "states",         severity: "medium", description: "An empty state shows no message or illustration, leaving a confusing blank area" },
  { id: 50, category: "states",         severity: "low",    description: "A loading skeleton has a different layout shape than the real content it replaces" },
];
