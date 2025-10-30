import { test as base, expect, Page } from '@playwright/test'

/**
 * Custom test fixtures for E2E testing
 * Provides helper functions for common operations and cleanup
 */

export const test = base.extend<{
  clockedInPage: Page
}>({
  // Custom fixture for better timer testing
  clockedInPage: async ({ page }, use) => {
    // Navigate to home
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Clock in
    const clockInButton = page.getByRole('button', { name: /clock in/i })
    await clockInButton.waitFor({ timeout: 5000 })
    await clockInButton.click()

    // Wait for state change
    const clockOutButton = page.getByRole('button', { name: /clock out/i })
    await clockOutButton.waitFor({ timeout: 5000 })

    // Use the page
    await use(page)

    // Cleanup: Clock out
    try {
      const clockOutButtonCleanup = page.getByRole('button', { name: /clock out/i })
      if (await clockOutButtonCleanup.isVisible({ timeout: 2000 }).catch(() => false)) {
        await clockOutButtonCleanup.click()

        // Confirm if modal appears
        const confirmButton = page
          .locator('button')
          .filter({ hasText: /confirm|yes|clock out/i })
          .first()
        if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmButton.click()
        }
      }
    } catch {
      // Cleanup failure is acceptable
    }
  },
})

/**
 * Helper: Find clock out button in modal context
 * Avoids brittle nth() selectors by using context
 */
export async function findClockOutButtonInModal(page: Page) {
  // Look for modal/dialog container
  const modal = page.locator('[role="dialog"], .modal, [class*="modal"]').first()

  if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
    // Within modal, find clock out button
    return modal.getByRole('button', { name: /clock out|confirm/i })
  }

  // Fallback
  return page.getByRole('button', { name: /clock out/i }).last()
}

/**
 * Helper: Wait for element with retry logic
 */
export async function waitForElement(
  page: Page,
  selector: string | ReturnType<typeof page.getByRole>,
  timeout = 5000
) {
  let attempts = 0
  const maxAttempts = 3

  while (attempts < maxAttempts) {
    try {
      if (typeof selector === 'string') {
        await page.locator(selector).waitFor({ timeout })
      } else {
        await selector.waitFor({ timeout })
      }
      return
    } catch (e) {
      attempts++
      if (attempts === maxAttempts) throw e
      await page.waitForTimeout(200)
    }
  }
}

/**
 * Helper: Verify element has specific text content
 */
export async function expectElementContainsText(
  page: Page,
  selector: ReturnType<typeof page.getByRole> | ReturnType<typeof page.locator>,
  text: string,
  timeout = 5000
) {
  await selector.waitFor({ timeout })
  const content = await selector.textContent()
  if (!content || !content.includes(text)) {
    throw new Error(`Expected element to contain "${text}" but got "${content}"`)
  }
}

/**
 * Helper: Fill form with error handling
 */
export async function fillFormField(
  page: Page,
  label: string | RegExp,
  value: string,
  timeout = 5000
) {
  const input = page.getByLabel(label).or(page.locator(`input[placeholder*="${label}"]`)).first()

  await input.waitFor({ timeout })
  await input.clear()
  await input.fill(value)

  // Verify fill succeeded
  const actualValue = await input.inputValue()
  if (actualValue !== value) {
    throw new Error(`Failed to fill field "${label}": expected "${value}" but got "${actualValue}"`)
  }
}

/**
 * Helper: Wait for navigation or state change
 */
export async function waitForStateChange(page: Page, timeout = 5000) {
  // Wait for any navigation or state update
  await Promise.race([page.waitForNavigation({ timeout }).catch(() => {}), page.waitForTimeout(timeout)])
}

/**
 * Helper: Get all visible items from a list
 */
export async function getVisibleListItems(
  page: Page,
  listSelector: string = 'tr, [role="option"], [class*="item"], [class*="card"]'
) {
  const items = page.locator(listSelector)
  const count = await items.count()
  const visible = []

  for (let i = 0; i < count; i++) {
    const item = items.nth(i)
    if (await item.isVisible().catch(() => false)) {
      visible.push(item)
    }
  }

  return visible
}

/**
 * Helper: Verify download occurred
 */
export async function verifyFileDownload(
  page: Page,
  triggerFn: () => Promise<void>,
  expectedExtension: string
) {
  const downloadPromise = page.waitForEvent('download')
  await triggerFn()

  try {
    const download = await downloadPromise
    const filename = download.suggestedFilename()

    if (!filename.endsWith(expectedExtension)) {
      throw new Error(
        `Expected download with extension "${expectedExtension}" but got "${filename}"`
      )
    }

    return download
  } catch (e) {
    throw new Error(`Failed to verify file download: ${e}`)
  }
}

/**
 * Helper: Retry operation on failure
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 200
): Promise<T> {
  let lastError: Error | null = null

  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await operation()
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e))
      if (i < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }

  throw lastError || new Error('Operation failed after retries')
}
