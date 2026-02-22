'use client';

import { useState, useCallback } from 'react';

interface ZodIssue {
  path: PropertyKey[];
  message: string;
}

export function useFieldErrors() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const setFromZodIssues = useCallback((issues: ZodIssue[]) => {
    const errors: Record<string, string> = {};
    for (const issue of issues) {
      const key = String(issue.path[0]);
      if (!errors[key]) {
        errors[key] = issue.message;
      }
    }
    setFieldErrors(errors);
  }, []);

  const setFieldError = useCallback((field: string, message: string) => {
    setFieldErrors((prev) => ({ ...prev, [field]: message }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const clearErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  return { fieldErrors, setFromZodIssues, setFieldError, clearFieldError, clearErrors };
}
