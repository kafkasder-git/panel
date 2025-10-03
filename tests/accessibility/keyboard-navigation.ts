import userEvent from '@testing-library/user-event';

// Keyboard navigation testing utilities
export class KeyboardNavigationTester {
  private readonly user: ReturnType<typeof userEvent.setup>;
  private focusableElements: Element[] = [];

  constructor() {
    this.user = userEvent.setup();
  }

  // Get all focusable elements in the container
  getFocusableElements(container: Element = document.body): Element[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
      'audio[controls]',
      'video[controls]',
      'iframe',
      'object',
      'embed',
      'area[href]',
      'summary',
    ].join(', ');

    this.focusableElements = Array.from(container.querySelectorAll(focusableSelectors)).filter(
      (element) => {
        // Filter out hidden elements
        const style = window.getComputedStyle(element);
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          !element.hasAttribute('hidden')
        );
      },
    );

    return this.focusableElements;
  }

  // Test tab navigation through all focusable elements
  async testTabNavigation(container: Element = document.body): Promise<{
    success: boolean;
    errors: string[];
    focusOrder: Element[];
  }> {
    const errors: string[] = [];
    const focusOrder: Element[] = [];
    const focusableElements = this.getFocusableElements(container);

    if (focusableElements.length === 0) {
      return {
        success: false,
        errors: ['No focusable elements found'],
        focusOrder: [],
      };
    }

    // Start from the first focusable element
    focusableElements[0]?.focus();

    for (let i = 0; i < focusableElements.length; i++) {
      await this.user.tab();
      const { activeElement } = document;

      if (activeElement) {
        focusOrder.push(activeElement);

        // Check if focus is visible
        const style = window.getComputedStyle(activeElement);
        if (!this.hasFocusIndicator(activeElement, style)) {
          errors.push(
            `Element ${this.getElementDescription(activeElement)} lacks visible focus indicator`,
          );
        }

        // Check if element is properly labeled
        if (!this.hasAccessibleName(activeElement)) {
          errors.push(`Element ${this.getElementDescription(activeElement)} lacks accessible name`);
        }
      } else {
        errors.push(`Tab ${i + 1}: No element received focus`);
      }
    }

    return {
      success: errors.length === 0,
      errors,
      focusOrder,
    };
  }

  // Test reverse tab navigation
  async testShiftTabNavigation(container: Element = document.body): Promise<{
    success: boolean;
    errors: string[];
    focusOrder: Element[];
  }> {
    const errors: string[] = [];
    const focusOrder: Element[] = [];
    const focusableElements = this.getFocusableElements(container);

    if (focusableElements.length === 0) {
      return {
        success: false,
        errors: ['No focusable elements found'],
        focusOrder: [],
      };
    }

    // Start from the last focusable element
    focusableElements[focusableElements.length - 1]?.focus();

    for (let i = focusableElements.length - 1; i >= 0; i--) {
      await this.user.tab({ shift: true });
      const { activeElement } = document;

      if (activeElement) {
        focusOrder.push(activeElement);
      } else {
        errors.push(`Shift+Tab ${i}: No element received focus`);
      }
    }

    return {
      success: errors.length === 0,
      errors,
      focusOrder,
    };
  }

  // Test keyboard activation of interactive elements
  async testKeyboardActivation(container: Element = document.body): Promise<{
    success: boolean;
    errors: string[];
    results: { element: Element; activated: boolean }[];
  }> {
    const errors: string[] = [];
    const results: { element: Element; activated: boolean }[] = [];
    const interactiveElements = this.getFocusableElements(container).filter((el) =>
      ['BUTTON', 'A', 'INPUT'].includes(el.tagName),
    );

    for (const element of interactiveElements) {
      element.focus();

      let activated = false;

      // Use event listener instead of overriding click method
      const clickHandler = () => {
        activated = true;
      };
      element.addEventListener('click', clickHandler);

      // Test Enter key activation
      if (['BUTTON', 'A'].includes(element.tagName)) {
        await this.user.keyboard('{Enter}');
        if (!activated) {
          errors.push(`Element ${this.getElementDescription(element)} not activated by Enter key`);
        }
      }

      // Test Space key activation for buttons
      if (element.tagName === 'BUTTON') {
        activated = false;
        await this.user.keyboard(' ');
        if (!activated) {
          errors.push(`Button ${this.getElementDescription(element)} not activated by Space key`);
        }
      }

      results.push({ element, activated });

      // Clean up event listener
      element.removeEventListener('click', clickHandler);
    }

    return {
      success: errors.length === 0,
      errors,
      results,
    };
  }

  // Test arrow key navigation for composite widgets
  async testArrowKeyNavigation(container: Element): Promise<{
    success: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Find composite widgets (menus, tabs, grids, etc.)
    const compositeWidgets = container.querySelectorAll(
      [
        '[role="menu"]',
        '[role="menubar"]',
        '[role="tablist"]',
        '[role="grid"]',
        '[role="listbox"]',
        '[role="tree"]',
        '[role="radiogroup"]',
      ].join(', '),
    );

    for (const widget of compositeWidgets) {
      const role = widget.getAttribute('role');
      const items = widget.querySelectorAll(
        [
          '[role="menuitem"]',
          '[role="tab"]',
          '[role="gridcell"]',
          '[role="option"]',
          '[role="treeitem"]',
          '[role="radio"]',
        ].join(', '),
      );

      if (items.length > 1) {
        // Focus first item
        (items[0] as HTMLElement).focus();

        // Test arrow key navigation
        await this.user.keyboard('{ArrowDown}');
        if (document.activeElement !== items[1]) {
          errors.push(`Arrow key navigation failed in ${role} widget`);
        }
      }
    }

    return {
      success: errors.length === 0,
      errors,
    };
  }

  // Test escape key functionality
  async testEscapeKey(container: Element): Promise<{
    success: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Find modal dialogs and popups
    const modals = container.querySelectorAll(
      ['[role="dialog"]', '[role="alertdialog"]', '.modal', '.popup', '.dropdown-menu'].join(', '),
    );

    for (const modal of modals) {
      if (modal.getAttribute('aria-hidden') !== 'true') {
        // Focus an element inside the modal
        const focusableInModal = modal.querySelector('button, input, [tabindex]')!;
        focusableInModal?.focus();

        // Press Escape
        await this.user.keyboard('{Escape}');

        // Check if modal was closed (implementation dependent)
        // This would need to be customized based on your modal implementation
        if (modal.getAttribute('aria-hidden') !== 'true' && !modal.classList.contains('hidden')) {
          errors.push(`Modal ${this.getElementDescription(modal)} did not close on Escape key`);
        }
      }
    }

    return {
      success: errors.length === 0,
      errors,
    };
  }

  // Helper methods
  private hasFocusIndicator(element: Element, style: CSSStyleDeclaration): boolean {
    // Check for visible focus indicators
    return (
      style.outline !== 'none' ||
      style.outlineWidth !== '0px' ||
      style.boxShadow !== 'none' ||
      element.classList.contains('focus:') || // Tailwind focus classes
      element.classList.contains('focus-visible:')
    );
  }

  private hasAccessibleName(element: Element): boolean {
    // Check various ways an element can have an accessible name
    return Boolean(
      element.getAttribute('aria-label') ||
        element.getAttribute('aria-labelledby') ||
        element.getAttribute('title') ||
        (element as HTMLElement).innerText?.trim() ||
        element.querySelector('img')?.getAttribute('alt'),
    );
  }

  private getElementDescription(element: Element): string {
    const tag = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const className = element.className ? `.${element.className.split(' ')[0]}` : '';
    const role = element.getAttribute('role') ? `[role="${element.getAttribute('role')}"]` : '';

    return `${tag}${id}${className}${role}`;
  }
}

// Convenience functions for common keyboard tests
export const testKeyboardNavigation = async (container: Element = document.body) => {
  const tester = new KeyboardNavigationTester();

  const tabTest = await tester.testTabNavigation(container);
  const shiftTabTest = await tester.testShiftTabNavigation(container);
  const activationTest = await tester.testKeyboardActivation(container);
  const arrowKeyTest = await tester.testArrowKeyNavigation(container);
  const escapeTest = await tester.testEscapeKey(container);

  return {
    tabNavigation: tabTest,
    shiftTabNavigation: shiftTabTest,
    keyboardActivation: activationTest,
    arrowKeyNavigation: arrowKeyTest,
    escapeKey: escapeTest,
    overall: {
      success:
        tabTest.success &&
        shiftTabTest.success &&
        activationTest.success &&
        arrowKeyTest.success &&
        escapeTest.success,
      errors: [
        ...tabTest.errors,
        ...shiftTabTest.errors,
        ...activationTest.errors,
        ...arrowKeyTest.errors,
        ...escapeTest.errors,
      ],
    },
  };
};

// Export already declared above
