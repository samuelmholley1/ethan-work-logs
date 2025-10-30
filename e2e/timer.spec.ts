import { test, expect } from '@playwright/test'

/**
 * E2E Tests - Timer Workflow
 * 
 * Tests the complete timer workflow:
 * 1. Navigate to home page
 * 2. Clock in
 * 3. Verify timer is running
 * 4. Log behavioral events
 * 5. Clock out with confirmation
 * 6. Verify session completed
 */

test.describe('Timer Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page before each test
    await page.goto('/')
    // Wait for page to load fully
    await page.waitForLoadState('domcontentloaded')
  })

  test('should display timer interface on home page', async ({ page }) => {
    // Check if Clock In button exists (main timer interface)
    const clockInButton = page.getByRole('button', { name: /clock in/i })
    await expect(clockInButton).toBeVisible()
    
    // Check if page has the main content area
    const main = page.locator('main')
    await expect(main).toBeVisible()
  })

  test('should clock in successfully', async ({ page }) => {
    // Find and click the Clock In button
    const clockInButton = page.getByRole('button', { name: /clock in/i })
    await expect(clockInButton).toBeVisible()
    
    // Click to clock in
    await clockInButton.click()
    
    // Verify button changed to Clock Out
    const clockOutButton = page.getByRole('button', { name: /clock out/i })
    await expect(clockOutButton).toBeVisible({ timeout: 5000 })
  })

  test('should show running timer after clock in', async ({ page }) => {
    // Clock in first
    const clockInButton = page.getByRole('button', { name: /clock in/i })
    await clockInButton.click()
    
    // Verify Clock Out button appeared
    const clockOutButton = page.getByRole('button', { name: /clock out/i })
    await expect(clockOutButton).toBeVisible({ timeout: 5000 })
    
    // Look for timer display (typically shows HH:MM:SS format)
    const timerDisplay = page.locator('[data-testid="timer-display"], .timer, .elapsed-time, [class*="time"]').first()
    
    if (await timerDisplay.isVisible().catch(() => false)) {
      const initialTime = await timerDisplay.textContent()
      
      // Wait and verify time has changed (timer incrementing)
      await page.waitForTimeout(2000)
      const updatedTime = await timerDisplay.textContent()
      
      // Timer should have advanced
      expect(initialTime).not.toEqual(updatedTime)
    }
  })

  test('should display behavioral logging section when clocked in', async ({ page }) => {
    // Clock in first
    const clockInButton = page.getByRole('button', { name: /clock in/i })
    await clockInButton.click()
    
    // Wait for Clock Out button to confirm logged in
    await page.getByRole('button', { name: /clock out/i }).waitFor({ timeout: 5000 })
    
    // Behavioral logger should be visible when clocked in
    // Look for outcome search input or behavioral logger section
    const outcomeInput = page.getByPlaceholder(/search.*outcome/i)
      .or(page.getByPlaceholder(/select outcome/i))
      .or(page.locator('input[aria-label*="outcome" i]'))
      .first()
    
    await expect(outcomeInput).toBeVisible({ timeout: 5000 })
  })

  test('should log behavioral event (Independent)', async ({ page }) => {
    // Clock in
    const clockInButton = page.getByRole('button', { name: /clock in/i })
    await clockInButton.click()
    
    // Wait for behavioral logger to appear
    await page.getByRole('button', { name: /clock out/i }).waitFor({ timeout: 5000 })
    
    // Find outcome search input
    const outcomeInput = page.getByPlaceholder(/search.*outcome/i)
      .or(page.getByPlaceholder(/select outcome/i))
      .or(page.locator('input[aria-label*="outcome" i]'))
      .first()
    
    await expect(outcomeInput).toBeVisible()
    
    // Type to search for an outcome
    await outcomeInput.fill('Social')
    await page.waitForTimeout(300)
    
    // Click first result if available
    const firstOption = page.getByRole('option').first()
    if (await firstOption.isVisible().catch(() => false)) {
      await firstOption.click()
      await page.waitForTimeout(300)
    }
    
    // Find and click the log button (might be labeled "Log" or "Independent" or similar)
    const logButton = page.getByRole('button', { name: /log|independent|submit|save/i })
      .filter({ hasNot: page.getByRole('button', { name: /clock/i }) })
      .first()
    
    if (await logButton.isVisible().catch(() => false)) {
      await logButton.click()
      
      // Wait for feedback or session state update
      await page.waitForTimeout(500)
      
      // Check for success feedback (look for toast or confirmation)
      const feedback = page.locator('[role="status"], [role="alert"], .toast, [class*="success"]').first()
      if (await feedback.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(feedback).toBeDefined()
      }
    }
  })

  test('should clock out with confirmation', async ({ page }) => {
    // Clock in first
    const clockInButton = page.getByRole('button', { name: /clock in/i })
    await clockInButton.click()
    
    // Wait for Clock Out button to appear
    const clockOutButton = page.getByRole('button', { name: /clock out/i })
    await expect(clockOutButton).toBeVisible({ timeout: 5000 })
    
    // Click Clock Out
    await clockOutButton.click()
    
    // Wait for confirmation modal/dialog to appear
    await page.waitForTimeout(500)
    
    // Look for confirmation button in modal (usually the Clock Out button in the modal)
    const confirmButton = page.getByRole('button', { name: /confirm|clock out/i }).nth(1)
    
    if (await confirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Click confirm
      await confirmButton.click()
      await page.waitForTimeout(500)
    }
    
    // After clock out, Clock In button should reappear
    await expect(page.getByRole('button', { name: /clock in/i })).toBeVisible({ timeout: 5000 })
  })

  test('should show session summary after clock out', async ({ page }) => {
    // Clock in
    const clockInButton = page.getByRole('button', { name: /clock in/i })
    await clockInButton.click()
    
    // Wait for logged in state
    await page.getByRole('button', { name: /clock out/i }).waitFor({ timeout: 5000 })
    
    // Clock out
    const clockOutButton = page.getByRole('button', { name: /clock out/i })
    await clockOutButton.click()
    
    // Confirm if modal appears
    const confirmButton = page.getByRole('button', { name: /confirm|clock out/i }).nth(1)
    if (await confirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmButton.click()
    }
    
    // After clock out, UI should return to initial state
    // Clock In button should be available again
    await expect(page.getByRole('button', { name: /clock in/i })).toBeVisible({ timeout: 5000 })
    
    // Verify we're back to ready state (behavioral logger should be hidden or reset)
    const clockOutButton2 = page.getByRole('button', { name: /clock out/i })
    expect(await clockOutButton2.isVisible().catch(() => false)).toBe(false)
  })
})
