/**
 * @fileoverview Sanitization utilities for security
 * 
 * Provides centralized sanitization functions to prevent XSS attacks
 * and other injection vulnerabilities.
 * 
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes a URL to prevent javascript: and other dangerous protocols
 * 
 * @param url - URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export const sanitizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') {
    return '';
  }

  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return DOMPurify.sanitize(url, { 
      ALLOWED_URI_REGEXP: /^https?:/ 
    });
  } catch {
    // Invalid URL
    return '';
  }
};

/**
 * Sanitizes text by removing all HTML tags
 * Use this for plain text that should never contain HTML
 * 
 * @param text - Text to sanitize
 * @returns Sanitized text without HTML tags
 */
export const sanitizeText = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};

/**
 * Sanitizes HTML content with optional allowed tags
 * 
 * @param html - HTML to sanitize
 * @param allowedTags - Array of allowed HTML tags (default: none)
 * @returns Sanitized HTML
 */
export const sanitizeHtml = (html: string, allowedTags: string[] = []): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: []
  });
};

/**
 * Validates if a URL is safe (http or https protocol only)
 * 
 * @param url - URL to validate
 * @returns True if URL is safe, false otherwise
 */
export const isValidUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

