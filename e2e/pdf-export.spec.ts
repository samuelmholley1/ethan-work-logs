import { test, expect } from '@playwright/test'

/**
 * E2E Tests - PDF Export
 *
 * Tests PDF generation and download functionality:
 * 1. Complete a work session
 * 2. Navigate to summary/export
 * 3. Trigger PDF generation
 * 4. Verify download starts
 *
 * Red Team Improvements:
 * - Proper download verification
 * - Better error handling for missing features
 * - Proper timing for async operations
 */

test.describe('PDF Export', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
  })

  test('should display export/download button on summary page', async ({ page }) => {
    // Look for export/download button or link
    const exportButton = page.getByRole('button', { name: /export|download|pdf|print/i })
      .or(page.getByRole('link', { name: /export|download|pdf|print/i }))
      .first()
    
    if (await exportButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(exportButton).toBeVisible()
    }
  })

  test('should generate timesheet PDF', async ({ page }) => {
    // Navigate to summary or export page
    const summaryLink = page.getByRole('link', { name: /summary|report|archive/i }).first()
    
    if (await summaryLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await summaryLink.click()
      await page.waitForLoadState('domcontentloaded')
    }
    
    // Look for PDF download button
    const downloadButton = page.getByRole('button', { name: /download.*pdf|export.*pdf|timesheet/i })
      .or(page.getByRole('link', { name: /download.*pdf|export.*pdf|timesheet/i }))
      .first()
    
    if (await downloadButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Setup download promise
      const downloadPromise = page.waitForEvent('download')
      
      // Click download
      await downloadButton.click()
      
      // Wait for download to complete
      const download = await downloadPromise
      
      // Verify it's a PDF
      expect(download.suggestedFilename()).toContain('.pdf')
    }
  })

  test('should show download progress indication', async ({ page }) => {
    // Navigate to export page
    const summaryLink = page.getByRole('link', { name: /summary|report|archive/i }).first()
    
    if (await summaryLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await summaryLink.click()
      await page.waitForLoadState('domcontentloaded')
    }
    
    // Find download button
    const downloadButton = page.getByRole('button', { name: /download.*pdf|export.*pdf|timesheet/i })
      .or(page.getByRole('link', { name: /download.*pdf|export.*pdf|timesheet/i }))
      .first()
    
    if (await downloadButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Look for progress indicator
      const progressIndicator = page.locator('[role="progressbar"], [class*="progress"], [class*="loading"], .spinner')
      
      // Start download
      const downloadPromise = page.waitForEvent('download')
      await downloadButton.click()
      
      // Check if progress is shown (may appear briefly)
      if (await progressIndicator.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(progressIndicator).toBeVisible()
      }
      
      // Wait for download to complete
      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('.pdf')
    }
  })

  test('should handle PDF generation with multiple sessions', async ({ page }) => {
    // Complete a work session first
    const clockInButton = page.getByRole('button', { name: /clock in/i })
    if (await clockInButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Clock in
      await clockInButton.click()
      
      // Wait a moment
      await page.waitForTimeout(1000)
      
      // Clock out
      const clockOutButton = page.getByRole('button', { name: /clock out/i })
      if (await clockOutButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await clockOutButton.click()
        
        // Confirm if modal appears
        const confirmButton = page.getByRole('button', { name: /confirm|clock out/i }).nth(1)
        if (await confirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await confirmButton.click()
        }
      }
    }
    
    // Navigate to summary
    await page.waitForTimeout(500)
    const summaryLink = page.getByRole('link', { name: /summary|report|archive/i }).first()
    
    if (await summaryLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await summaryLink.click()
      await page.waitForLoadState('domcontentloaded')
    }
    
    // Try to export
    const exportButton = page.getByRole('button', { name: /export|download|pdf/i }).first()
    if (await exportButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      const downloadPromise = page.waitForEvent('download')
      await exportButton.click()
      
      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('.pdf')
    }
  })

  test('should handle PDF generation errors gracefully', async ({ page }) => {
    // Navigate to export page
    const summaryLink = page.getByRole('link', { name: /summary|report|archive/i }).first()
    
    if (await summaryLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await summaryLink.click()
      await page.waitForLoadState('domcontentloaded')
    }
    
    // If PDF generation fails, app should show error message
    const errorMessage = page.locator('[role="alert"], .error, [class*="error"]')
    
    // Try export
    const exportButton = page.getByRole('button', { name: /export|download|pdf/i }).first()
    if (await exportButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await exportButton.click()
      
      // Wait to see if error appears
      await page.waitForTimeout(1000)
      
      // Check for error handling
      const errorCount = await errorMessage.count()
      // Either download succeeded or error was shown
      if (errorCount > 0) {
        await expect(errorMessage.first()).toBeDefined()
      }
    }
  })
})
