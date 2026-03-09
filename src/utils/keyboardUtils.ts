/**
 * Utility functions for keyboard shortcuts
 */

/**
 * Parses a shortcut string and checks if it matches a KeyboardEvent
 * @param shortcutString - String like 'ctrl+e', 'alt+shift+e'
 * @param event - KeyboardEvent to check against
 * @returns boolean indicating if the event matches the shortcut
 */
export function matchesShortcut(shortcutString: string, event: KeyboardEvent): boolean {
  if (!shortcutString) return false;

  const keys = shortcutString.toLowerCase().split('+').map(k => k.trim());

  const modifiers = {
    ctrl: event.ctrlKey || event.metaKey, // metaKey for Mac Cmd
    alt: event.altKey,
    shift: event.shiftKey,
  };

  // Check if all modifiers in the shortcut are pressed
  const requiredModifiers = keys.filter(key => key in modifiers);

  for (const mod of requiredModifiers) {
    if (!modifiers[mod as keyof typeof modifiers]) {
      return false;
    }
  }

  // Check if the main key matches
  const mainKey = keys.find(key => !(key in modifiers));
  if (!mainKey) return false;

  // Handle special keys
  const specialKeys: Record<string, string> = {
    'escape': 'escape',
    'esc': 'escape',
    'enter': 'enter',
    'return': 'enter',
    'space': ' ',
    'spacebar': ' ',
    'tab': 'tab',
    'backspace': 'backspace',
    'delete': 'delete',
    'del': 'delete',
    'arrowup': 'arrowup',
    'arrowdown': 'arrowdown',
    'arrowleft': 'arrowleft',
    'arrowright': 'arrowright',
    'up': 'arrowup',
    'down': 'arrowdown',
    'left': 'arrowleft',
    'right': 'arrowright',
  };

  const normalizedEventKey = event.key.toLowerCase();
  const normalizedShortcutKey = specialKeys[mainKey] || mainKey;

  return normalizedEventKey === normalizedShortcutKey;
}

/**
 * Formats a shortcut string for display
 * @param shortcutString - String like 'ctrl+e'
 * @returns formatted string like 'Ctrl+E'
 */
export function formatShortcut(shortcutString: string): string {
  if (!shortcutString) return '';

  return shortcutString
    .split('+')
    .map(key => {
      switch (key.toLowerCase().trim()) {
        case 'ctrl':
          return 'Ctrl';
        case 'alt':
          return 'Alt';
        case 'shift':
          return 'Shift';
        case 'meta':
        case 'cmd':
          return 'Cmd';
        case 'esc':
        case 'escape':
          return 'Esc';
        case 'enter':
        case 'return':
          return 'Enter';
        case 'space':
        case 'spacebar':
          return 'Space';
        case 'tab':
          return 'Tab';
        case 'backspace':
          return 'Backspace';
        case 'delete':
        case 'del':
          return 'Del';
        case 'arrowup':
        case 'up':
          return '↑';
        case 'arrowdown':
        case 'down':
          return '↓';
        case 'arrowleft':
        case 'left':
          return '←';
        case 'arrowright':
        case 'right':
          return '→';
        default:
          return key.charAt(0).toUpperCase() + key.slice(1);
      }
    })
    .join(' + ');
}
