// Screen reader testing utilities
export class ScreenReaderTester {
  private readonly container: Element;

  constructor(container: Element = document.body) {
    this.container = container;
  }

  // Test semantic structure
  testSemanticStructure(): {
    success: boolean;
    errors: string[];
    structure: {
      headings: Element[];
      landmarks: Element[];
      lists: Element[];
      tables: Element[];
    };
  } {
    const errors: string[] = [];

    // Check heading hierarchy
    const headings = Array.from(this.container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const structure = {
      headings,
      landmarks: Array.from(
        this.container.querySelectorAll(
          [
            'main',
            'nav',
            'aside',
            'header',
            'footer',
            'section',
            'article',
            '[role="main"]',
            '[role="navigation"]',
            '[role="complementary"]',
            '[role="banner"]',
            '[role="contentinfo"]',
            '[role="region"]',
          ].join(', '),
        ),
      ),
      lists: Array.from(this.container.querySelectorAll('ul, ol, dl')),
      tables: Array.from(this.container.querySelectorAll('table')),
    };

    // Validate heading hierarchy
    if (headings.length > 0) {
      const h1Count = headings.filter((h) => h.tagName === 'H1').length;
      if (h1Count === 0) {
        errors.push('Page should have exactly one H1 heading');
      } else if (h1Count > 1) {
        errors.push('Page should have only one H1 heading');
      }

      // Check for heading level skips
      for (let i = 1; i < headings.length; i++) {
        const currentLevel = parseInt(headings[i].tagName.charAt(1));
        const previousLevel = parseInt(headings[i - 1].tagName.charAt(1));

        if (currentLevel > previousLevel + 1) {
          errors.push(
            `Heading level skip detected: ${headings[i - 1].tagName} followed by ${headings[i].tagName}`,
          );
        }
      }
    }

    // Check for main landmark
    const mainLandmarks = structure.landmarks.filter(
      (el) => el.tagName === 'MAIN' || el.getAttribute('role') === 'main',
    );
    if (mainLandmarks.length === 0) {
      errors.push('Page should have a main landmark');
    } else if (mainLandmarks.length > 1) {
      errors.push('Page should have only one main landmark');
    }

    return {
      success: errors.length === 0,
      errors,
      structure,
    };
  }

  // Test ARIA labels and descriptions
  testAriaLabels(): {
    success: boolean;
    errors: string[];
    elements: {
      element: Element;
      hasLabel: boolean;
      hasDescription: boolean;
      labelText?: string;
      descriptionText?: string;
    }[];
  } {
    const errors: string[] = [];
    const elements: {
      element: Element;
      hasLabel: boolean;
      hasDescription: boolean;
      labelText?: string;
      descriptionText?: string;
    }[] = [];

    // Find elements that should have labels
    const labelableElements = this.container.querySelectorAll(
      [
        'input:not([type="hidden"])',
        'select',
        'textarea',
        'button:not([aria-hidden="true"])',
        '[role="button"]',
        '[role="link"]',
        '[role="menuitem"]',
        '[role="tab"]',
        '[role="option"]',
        'img:not([alt=""])',
        'svg',
        '[role="img"]',
      ].join(', '),
    );

    labelableElements.forEach((element) => {
      const ariaLabel = element.getAttribute('aria-label');
      const ariaLabelledby = element.getAttribute('aria-labelledby');
      const ariaDescribedby = element.getAttribute('aria-describedby');

      let hasLabel = false;
      let labelText = '';

      // Check for aria-label
      if (ariaLabel) {
        hasLabel = true;
        labelText = ariaLabel;
      }

      // Check for aria-labelledby
      if (ariaLabelledby) {
        const labelElement = document.getElementById(ariaLabelledby);
        if (labelElement) {
          hasLabel = true;
          labelText = labelElement.textContent || '';
        } else {
          errors.push(`Element references non-existent label ID: ${ariaLabelledby}`);
        }
      }

      // Check for associated label element
      if (
        element.tagName === 'INPUT' ||
        element.tagName === 'SELECT' ||
        element.tagName === 'TEXTAREA'
      ) {
        const id = element.getAttribute('id');
        if (id) {
          const label = this.container.querySelector(`label[for="${id}"]`);
          if (label) {
            hasLabel = true;
            labelText = label.textContent || '';
          }
        }

        // Check for wrapping label
        const parentLabel = element.closest('label');
        if (parentLabel) {
          hasLabel = true;
          labelText = parentLabel.textContent || '';
        }
      }

      // Check for alt text on images
      if (element.tagName === 'IMG') {
        const alt = element.getAttribute('alt');
        if (alt !== null) {
          hasLabel = true;
          labelText = alt;
        }
      }

      // Check for button text content
      if (element.tagName === 'BUTTON' && !hasLabel) {
        const textContent = (element as HTMLElement).textContent?.trim();
        if (textContent) {
          hasLabel = true;
          labelText = textContent;
        }
      }

      let hasDescription = false;
      let descriptionText = '';

      if (ariaDescribedby) {
        const descElement = document.getElementById(ariaDescribedby);
        if (descElement) {
          hasDescription = true;
          descriptionText = descElement.textContent || '';
        } else {
          errors.push(`Element references non-existent description ID: ${ariaDescribedby}`);
        }
      }

      elements.push({
        element,
        hasLabel,
        hasDescription,
        labelText: labelText || undefined,
        descriptionText: descriptionText || undefined,
      });

      // Report missing labels for required elements
      if (!hasLabel) {
        const elementDesc = this.getElementDescription(element);
        if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(element.tagName)) {
          errors.push(`${elementDesc} is missing an accessible label`);
        }
        if (element.tagName === 'IMG' && element.getAttribute('alt') === null) {
          errors.push(`${elementDesc} is missing alt text`);
        }
      }
    });

    return {
      success: errors.length === 0,
      errors,
      elements,
    };
  }

  // Test form accessibility
  testFormAccessibility(): {
    success: boolean;
    errors: string[];
    forms: {
      form: Element;
      fields: {
        field: Element;
        hasLabel: boolean;
        hasRequiredIndicator: boolean;
        hasErrorMessage: boolean;
        hasHelpText: boolean;
      }[];
    }[];
  } {
    const errors: string[] = [];
    const forms: {
      form: Element;
      fields: {
        field: Element;
        hasLabel: boolean;
        hasRequiredIndicator: boolean;
        hasErrorMessage: boolean;
        hasHelpText: boolean;
      }[];
    }[] = [];

    const formElements = this.container.querySelectorAll('form');

    formElements.forEach((form) => {
      const fields = form.querySelectorAll('input:not([type="hidden"]), select, textarea');
      const formData = {
        form,
        fields: [] as {
          field: Element;
          hasLabel: boolean;
          hasRequiredIndicator: boolean;
          hasErrorMessage: boolean;
          hasHelpText: boolean;
        }[],
      };

      fields.forEach((field) => {
        const fieldId = field.getAttribute('id');
        const isRequired =
          field.hasAttribute('required') || field.getAttribute('aria-required') === 'true';

        // Check for label
        let hasLabel = false;
        if (fieldId) {
          const label = form.querySelector(`label[for="${fieldId}"]`);
          hasLabel = Boolean(label);
        }
        if (!hasLabel) {
          hasLabel = Boolean(field.closest('label'));
        }
        if (!hasLabel) {
          hasLabel = Boolean(
            field.getAttribute('aria-label') || field.getAttribute('aria-labelledby'),
          );
        }

        // Check for required indicator
        let hasRequiredIndicator = false;
        if (isRequired) {
          if (fieldId) {
            const label = form.querySelector(`label[for="${fieldId}"]`);
            hasRequiredIndicator = Boolean(
              label?.textContent?.includes('*') ||
                label?.querySelector('.required') ||
                field.getAttribute('aria-required') === 'true',
            );
          }
        }

        // Check for error messages
        const hasErrorMessage =
          Boolean(
            field.getAttribute('aria-describedby') &&
              document
                .getElementById(field.getAttribute('aria-describedby')!)
                ?.textContent?.includes('error'),
          ) || field.getAttribute('aria-invalid') === 'true';

        // Check for help text
        const hasHelpText = Boolean(
          field.getAttribute('aria-describedby') &&
            document.getElementById(field.getAttribute('aria-describedby')!),
        );

        formData.fields.push({
          field,
          hasLabel,
          hasRequiredIndicator,
          hasErrorMessage,
          hasHelpText,
        });

        // Report errors
        if (!hasLabel) {
          errors.push(`Form field ${this.getElementDescription(field)} is missing a label`);
        }
        if (isRequired && !hasRequiredIndicator) {
          errors.push(
            `Required field ${this.getElementDescription(field)} is missing required indicator`,
          );
        }
      });

      forms.push(formData);
    });

    return {
      success: errors.length === 0,
      errors,
      forms,
    };
  }

  // Test table accessibility
  testTableAccessibility(): {
    success: boolean;
    errors: string[];
    tables: {
      table: Element;
      hasCaption: boolean;
      hasHeaders: boolean;
      headersAssociated: boolean;
    }[];
  } {
    const errors: string[] = [];
    const tables: {
      table: Element;
      hasCaption: boolean;
      hasHeaders: boolean;
      headersAssociated: boolean;
    }[] = [];

    const tableElements = this.container.querySelectorAll('table');

    tableElements.forEach((table) => {
      const caption = table.querySelector('caption');
      const headers = table.querySelectorAll('th');
      const cells = table.querySelectorAll('td');

      const hasCaption = Boolean(caption);
      const hasHeaders = headers.length > 0;

      // Check if headers are properly associated with cells
      let headersAssociated = true;
      cells.forEach((cell) => {
        const headersAttr = cell.getAttribute('headers');
        if (!headersAttr && headers.length > 0) {
          // Check if cell is in a simple table structure
          const row = cell.closest('tr');
          const cellIndex = Array.from(row?.children || []).indexOf(cell);
          const headerRow = table.querySelector('thead tr, tr:first-child');
          const correspondingHeader = headerRow?.children[cellIndex];

          if (correspondingHeader?.tagName !== 'TH') {
            headersAssociated = false;
          }
        }
      });

      tables.push({
        table,
        hasCaption,
        hasHeaders,
        headersAssociated,
      });

      // Report errors
      if (!hasCaption) {
        errors.push(`Table ${this.getElementDescription(table)} is missing a caption`);
      }
      if (!hasHeaders) {
        errors.push(`Table ${this.getElementDescription(table)} is missing header cells`);
      }
      if (!headersAssociated) {
        errors.push(
          `Table ${this.getElementDescription(table)} has cells not properly associated with headers`,
        );
      }
    });

    return {
      success: errors.length === 0,
      errors,
      tables,
    };
  }

  // Test live regions
  testLiveRegions(): {
    success: boolean;
    errors: string[];
    liveRegions: Element[];
  } {
    const errors: string[] = [];
    const liveRegions = Array.from(
      this.container.querySelectorAll(
        [
          '[aria-live]',
          '[role="status"]',
          '[role="alert"]',
          '[role="log"]',
          '[role="marquee"]',
          '[role="timer"]',
        ].join(', '),
      ),
    );

    liveRegions.forEach((region) => {
      const ariaLive = region.getAttribute('aria-live');
      const role = region.getAttribute('role');

      // Check for appropriate aria-live values
      if (ariaLive && !['polite', 'assertive', 'off'].includes(ariaLive)) {
        errors.push(
          `Live region ${this.getElementDescription(region)} has invalid aria-live value: ${ariaLive}`,
        );
      }

      // Check for aria-atomic when appropriate
      if (role === 'status' || role === 'alert') {
        const ariaAtomic = region.getAttribute('aria-atomic');
        if (!ariaAtomic) {
          // This is a warning rather than an error
          console.warn(
            `Live region ${this.getElementDescription(region)} might benefit from aria-atomic attribute`,
          );
        }
      }
    });

    return {
      success: errors.length === 0,
      errors,
      liveRegions,
    };
  }

  // Comprehensive screen reader test
  runAllTests(): {
    success: boolean;
    errors: string[];
    results: {
      semanticStructure: ReturnType<ScreenReaderTester['testSemanticStructure']>;
      ariaLabels: ReturnType<ScreenReaderTester['testAriaLabels']>;
      formAccessibility: ReturnType<ScreenReaderTester['testFormAccessibility']>;
      tableAccessibility: ReturnType<ScreenReaderTester['testTableAccessibility']>;
      liveRegions: ReturnType<ScreenReaderTester['testLiveRegions']>;
    };
  } {
    const results = {
      semanticStructure: this.testSemanticStructure(),
      ariaLabels: this.testAriaLabels(),
      formAccessibility: this.testFormAccessibility(),
      tableAccessibility: this.testTableAccessibility(),
      liveRegions: this.testLiveRegions(),
    };

    const allErrors = [
      ...results.semanticStructure.errors,
      ...results.ariaLabels.errors,
      ...results.formAccessibility.errors,
      ...results.tableAccessibility.errors,
      ...results.liveRegions.errors,
    ];

    return {
      success: allErrors.length === 0,
      errors: allErrors,
      results,
    };
  }

  private getElementDescription(element: Element): string {
    const tag = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const className =
      typeof element.className === 'string' ? `.${element.className.split(' ')[0]}` : '';
    const role = element.getAttribute('role') ? `[role="${element.getAttribute('role')}"]` : '';

    return `${tag}${id}${className}${role}`;
  }
}

// Convenience function for screen reader testing
export const testScreenReaderAccessibility = (container: Element = document.body) => {
  const tester = new ScreenReaderTester(container);
  return tester.runAllTests();
};

// Export already declared above
