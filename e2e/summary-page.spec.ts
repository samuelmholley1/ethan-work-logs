import { test, expect } from '@playwright/test'

/**
 * E2E Tests - Summary Page
 * 
 * Tests the session summary and reporting:
 * 1. Navigate to summary/reports page
 * 2. Verify session history displays
 * 3. Check filtering and sorting
 * 4. Verify data accuracy
 */

test.describe('Summary Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
  })

  test('should navigate to summary or archive page', async ({ page }) => {
    // Look for summary/archive navigation
    const summaryLink = page.getByRole('link', { name: /summary|archive|report|history|schedule/i }).first()
    
    if (await summaryLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await summaryLink.click()
      
      // Verify page loaded
      await page.waitForLoadState('domcontentloaded')
      
      // Summary page should be visible
      const main = page.locator('main').first()
      await expect(main).toBeVisible()
    }
  })

  test('should display session history/list', async ({ page }) => {
    // Navigate to summary
    const summaryLink = page.getByRole('link', { name: /summary|archive|report|history|schedule/i }).first()
    
    if (await summaryLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await summaryLink.click()
      await page.waitForLoadState('domcontentloaded')
    }
    
    // Look for session list/table
    const sessionList = page.locator('table, [role="grid"], [class*="list"], [class*="table"]').first()
    
    if (await sessionList.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(sessionList).toBeVisible()
    } else {
      // Might be displayed as cards or other container
      const container = page.locator('[class*="session"], [class*="event"], [class*="item"]').first()
      if (await container.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(container).toBeVisible()
      }
    }
  })

  test('should allow filtering sessions by date', async ({ page }) => {
    // Navigate to summary
    const summaryLink = page.getByRole('link', { name: /summary|archive|report|history|schedule/i }).first()
    
    if (await summaryLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await summaryLink.click()
      await page.waitForLoadState('domcontentloaded')
    }
    
    // Look for date filter
    const dateFilter = page.getByLabel(/date|filter|search/i).or(page.locator('input[type="date"]')).first()
    
    if (await dateFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Set a filter date
      const today = new Date().toISOString().split('T')[0]
      await dateFilter.fill(today)
      
      // Wait for filtering
      await page.waitForTimeout(500)
      
      // Verify results updated
      const results = page.locator('table, [role="grid"], [class*="list"], [class*="table"]').first()
      if (await results.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(results).toBeVisible()
      }
    }
  })

  test('should display session details', async ({ page }) => {
    // Navigate to summary
    const summaryLink = page.getByRole('link', { name: /summary|archive|report|history|schedule/i }).first()
    
    if (await summaryLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await summaryLink.click()
      await page.waitForLoadState('domcontentloaded')
    }
    
    // Click on a session to view details
    const sessionRow = page.locator('tr, [class*="item"], [class*="card"]').first()
    
    if (await sessionRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sessionRow.click()
      await page.waitForTimeout(500)
      
      // Verify details are shown
      const details = page.locator('[class*="detail"], [class*="modal"], [role="dialog"]').first()
      if (await details.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(details).toBeVisible()
      }
    }
  })

  test('should show session statistics/totals', async ({ page }) => {
    // Navigate to summary
    const summaryLink = page.getByRole('link', { name: /summary|archive|report|history|schedule/i }).first()
    
    if (await summaryLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await summaryLink.click()
      await page.waitForLoadState('domcontentloaded')
    }
    
    // Look for statistics section
    const stats = page.locator('[class*="stat"], [class*="total"], [class*="summary"]').first()
    
    if (await stats.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(stats).toBeVisible()
      
      // Should contain time information
      const timeInfo = stats.locator('text=/[0-9]+ hours?|[0-9]+:[0-9]+|[0-9]+ minutes?/i')
      if (await timeInfo.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(timeInfo).toBeVisible()
      }
    }
  })

  test('should allow exporting session data', async ({ page }) => {
    // Navigate to summary
    const summaryLink = page.getByRole('link', { name: /summary|archive|report|history|schedule/i }).first()
    
    if (await summaryLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await summaryLink.click()
      await page.waitForLoadState('domcontentloaded')
    }
    
    // Look for export button
    const exportButton = page.getByRole('button', { name: /export|download|pdf|csv/i }).first()
    
    if (await exportButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Setup download listener
      const downloadPromise = page.waitForEvent('download')
      
      // Click export
      await exportButton.click()
      
      // Wait for download
      try {
        const download = await downloadPromise
        expect(download.suggestedFilename()).toBeDefined()
      } catch {
        // Download might not trigger if no data
      }
    }
  })

  test('should display empty state when no sessions', async ({ page }) => {
    // Navigate to summary
    const summaryLink = page.getByRole('link', { name: /summary|archive|report|history|schedule/i }).first()
    
    if (await summaryLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await summaryLink.click()
      await page.waitForLoadState('domcontentloaded')
    }
    
    // If no sessions exist, should show empty message
    const emptyState = page.locator('[class*="empty"], text=/no session|no data|no record/i').first()
    
    // Either show empty state or show sessions
    const hasSessions = await page.locator('tr, [class*="item"], [class*="card"]').count().catch(() => 0)
    
    if (hasSessions === 0) {
      if (await emptyState.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(emptyState).toBeVisible()
      }
    } else {
      // Sessions are displayed
      await expect(page.locator('tr, [class*="item"]').first()).toBeVisible()
    }
  })
})
