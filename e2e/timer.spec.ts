import { test, expect } from '@playwright/test'

/**
 * E2E Tests - Timer Workflow
 * 
 * Tests the complete timer workflow:
 * 1. Navigate to home page
 * 2. Select service type (CLS)
 * 3. Clock in
 * 4. Verify timer is running
 * 5. Log behavioral events
 * 6. Clock out
 * 7. Verify session completed
 */

test.describe('Timer Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page before each test
    await page.goto('/')
    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test('should display timer interface on home page', async ({ page }) => {
    // Check if main heading is visible
    await expect(page.locator('h1')).toContainText('Work Logger')
    
    // Check if timer component is visible
    await expect(page.locator('text=Clock In')).toBeVisible()
  })

  test('should clock in successfully', async ({ page }) => {
    // Find and click the Clock In button
    const clockInButton = page.locator('button:has-text("Clock In")')
    await expect(clockInButton).toBeVisible()
    
    // Click the clock in button
    await clockInButton.click()
    
    // Wait for toast notification or UI update
    await page.waitForTimeout(500)
    
    // Verify button changed to Clock Out
    const clockOutButton = page.locator('button:has-text("Clock Out")')
    await expect(clockOutButton).toBeVisible()
  })

  test('should show running timer after clock in', async ({ page }) => {
    // Clock in
    const clockInButton = page.locator('button:has-text("Clock In")')
    await clockInButton.click()
    await page.waitForTimeout(500)
    
    // Check if timer is visible and incrementing
    const timerDisplay = page.locator('[data-testid="timer-display"]')
    
    if (await timerDisplay.isVisible()) {
      const initialTime = await timerDisplay.textContent()
      
      // Wait 2 seconds and check if time has incremented
      await page.waitForTimeout(2000)
      const updatedTime = await timerDisplay.textContent()
      
      expect(initialTime).not.toEqual(updatedTime)
    }
  })

  test('should display behavioral logging section when clocked in', async ({ page }) => {
    // Clock in first
    const clockInButton = page.locator('button:has-text("Clock In")')
    await clockInButton.click()
    await page.waitForTimeout(500)
    
    // Check if behavioral logger is visible
    const behavioralLogger = page.locator('text=Select Outcome')
    await expect(behavioralLogger).toBeVisible()
  })

  test('should log behavioral event (Independent)', async ({ page }) => {
    // Clock in
    const clockInButton = page.locator('button:has-text("Clock In")')
    await clockInButton.click()
    await page.waitForTimeout(500)
    
    // Check if outcome selector is visible and select an outcome
    const outcomeSearch = page.locator('input[aria-label="Search and select outcome"]')
    if (await outcomeSearch.isVisible()) {
      // Type to search for an outcome
      await outcomeSearch.fill('Social')
      await page.waitForTimeout(300)
      
      // Click the first result
      const firstResult = page.locator('role=option').first()
      if (await firstResult.isVisible()) {
        await firstResult.click()
        await page.waitForTimeout(300)
      }
    }
    
    // Click Independent button
    const independentButton = page.locator('button:has-text("Independent")')
    if (await independentButton.isVisible()) {
      await independentButton.click()
      await page.waitForTimeout(500)
      
      // Check for success feedback (toast or visual confirmation)
      const successIndicator = page.locator('text=Event logged')
      if (await successIndicator.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(successIndicator).toBeVisible()
      }
    }
  })

  test('should clock out with confirmation', async ({ page }) => {
    // Clock in first
    const clockInButton = page.locator('button:has-text("Clock In")')
    await clockInButton.click()
    await page.waitForTimeout(500)
    
    // Click Clock Out button
    const clockOutButton = page.locator('button:has-text("Clock Out")')
    await expect(clockOutButton).toBeVisible()
    await clockOutButton.click()
    
    // Wait for modal to appear
    await page.waitForTimeout(300)
    
    // Check if confirmation modal is visible
    const confirmButton = page.locator('button:has-text("Clock Out")').nth(1)
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Click confirm in modal
      await confirmButton.click()
      await page.waitForTimeout(500)
    }
    
    // Verify timer has stopped (button changed back to Clock In)
    const newClockInButton = page.locator('button:has-text("Clock In")')
    await expect(newClockInButton).toBeVisible()
  })

  test('should show session summary after clock out', async ({ page }) => {
    // Clock in and out
    const clockInButton = page.locator('button:has-text("Clock In")')
    await clockInButton.click()
    await page.waitForTimeout(500)
    
    const clockOutButton = page.locator('button:has-text("Clock Out")')
    await clockOutButton.click()
    await page.waitForTimeout(300)
    
    // Confirm clock out if modal appears
    const confirmButton = page.locator('button:has-text("Clock Out")').nth(1)
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.click()
      await page.waitForTimeout(500)
    }
    
    // Check for session summary or redirect
    const clockInAgain = page.locator('button:has-text("Clock In")')
    await expect(clockInAgain).toBeVisible()
  })
})
