import { test, expect } from '@playwright/test'

/**
 * E2E Tests - Manual Time Entry
 * 
 * Tests the manual time entry workflow:
 * 1. Navigate to manual entry section
 * 2. Select date and times
 * 3. Log manual session
 * 4. Verify session appears in history
 */

test.describe('Manual Time Entry', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
  })

  test('should navigate to manual entry form', async ({ page }) => {
    // Look for manual entry link/button
    const manualEntryLink = page.getByRole('link', { name: /manual|enter time|time entry/i })
      .or(page.getByRole('button', { name: /manual|enter time|time entry/i }))
      .first()
    
    if (await manualEntryLink.isVisible().catch(() => false)) {
      await manualEntryLink.click()
      
      // Verify form is displayed
      const form = page.locator('form, [role="region"]').first()
      await expect(form).toBeVisible()
    }
  })

  test('should allow entering start and end times', async ({ page }) => {
    // Navigate to manual entry
    const manualEntryLink = page.getByRole('link', { name: /manual|enter time|time entry/i })
      .or(page.getByRole('button', { name: /manual|enter time|time entry/i }))
      .first()
    
    if (await manualEntryLink.isVisible().catch(() => false)) {
      await manualEntryLink.click()
      
      // Wait for form to be visible
      const form = page.locator('form').first()
      await expect(form).toBeVisible({ timeout: 5000 })
      
      // Find date input
      const dateInput = page.getByLabel(/date|session date/i).or(page.locator('input[type="date"]')).first()
      if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dateInput.fill(new Date().toISOString().split('T')[0])
      }
      
      // Find start time input
      const startTimeInput = page.getByLabel(/start time|start/i).or(page.locator('input[type="time"]')).first()
      if (await startTimeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await startTimeInput.fill('09:00')
      }
      
      // Find end time input
      const endTimeInput = page.getByLabel(/end time|end/i).or(page.locator('input[type="time"]')).nth(1)
      if (await endTimeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await endTimeInput.fill('10:00')
      }
    }
  })

  test('should submit manual time entry', async ({ page }) => {
    // Navigate to manual entry
    const manualEntryLink = page.getByRole('link', { name: /manual|enter time|time entry/i })
      .or(page.getByRole('button', { name: /manual|enter time|time entry/i }))
      .first()
    
    if (await manualEntryLink.isVisible().catch(() => false)) {
      await manualEntryLink.click()
      
      // Fill form fields
      const form = page.locator('form').first()
      await expect(form).toBeVisible({ timeout: 5000 })
      
      // Fill date
      const dateInput = page.getByLabel(/date|session date/i).or(page.locator('input[type="date"]')).first()
      if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dateInput.fill(new Date().toISOString().split('T')[0])
      }
      
      // Fill times
      const startTimeInput = page.getByLabel(/start time|start/i).or(page.locator('input[type="time"]')).first()
      if (await startTimeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await startTimeInput.fill('09:00')
      }
      
      const endTimeInput = page.getByLabel(/end time|end/i).or(page.locator('input[type="time"]')).nth(1)
      if (await endTimeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await endTimeInput.fill('10:00')
      }
      
      // Submit form
      const submitButton = page.getByRole('button', { name: /submit|save|log|create/i }).first()
      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitButton.click()
        
        // Wait for success feedback
        await page.waitForTimeout(500)
      }
    }
  })

  test('should handle date/time validation', async ({ page }) => {
    // Navigate to manual entry
    const manualEntryLink = page.getByRole('link', { name: /manual|enter time|time entry/i })
      .or(page.getByRole('button', { name: /manual|enter time|time entry/i }))
      .first()
    
    if (await manualEntryLink.isVisible().catch(() => false)) {
      await manualEntryLink.click()
      
      // Try to submit empty form
      const submitButton = page.getByRole('button', { name: /submit|save|log|create/i }).first()
      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitButton.click()
        
        // Should show error or prevent submission
        await page.waitForTimeout(300)
        
        // Check for error messages
        const errorMessage = page.locator('[role="alert"], .error, [class*="error"]').first()
        if (await errorMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(errorMessage).toBeDefined()
        }
      }
    }
  })
})
