import { test, expect } from '@playwright/test'

/**
 * Smoke Tests — Family Meal Planner
 *
 * 验证核心流程不崩溃。
 * 运行：npx playwright test tests/smoke/
 */

test.describe('Smoke Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  // ── 页面加载 ─────────────────────────────────────────────

  test('S01 首页正常加载，显示 App 标题', async ({ page }) => {
    await expect(page).toHaveTitle(/Family Meal Planner|饮食管理/)
    await expect(page.getByText('饮食管理中心')).toBeVisible()
  })

  test('S02 显示家庭成员标签（Mia、Marcus、Michelle）', async ({ page }) => {
    await expect(page.getByText('Michelle')).toBeVisible()
    await expect(page.getByText(/Mia/)).toBeVisible()
    await expect(page.getByText(/Marcus/)).toBeVisible()
  })

  test('S03 底部 Tab 导航全部可见', async ({ page }) => {
    await expect(page.getByRole('button', { name: /食材库/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /拍照更新/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /补货建议/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /菜谱/ })).toBeVisible()
  })

  // ── 食材库 ───────────────────────────────────────────────

  test('S04 食材库 Tab：默认显示食材列表', async ({ page }) => {
    // pantry tab is default active
    await expect(page.locator('[data-testid="pantry-item"]').first()).toBeVisible()
  })

  test('S05 食材库 Tab：可以增加食材数量', async ({ page }) => {
    const firstItem = page.locator('[data-testid="pantry-item"]').first()
    const increaseBtn = firstItem.getByRole('button', { name: '+' })
    await increaseBtn.click()
    await expect(firstItem).toBeVisible()
  })

  test('S06 食材库 Tab：可以减少食材数量，不崩溃', async ({ page }) => {
    const firstItem = page.locator('[data-testid="pantry-item"]').first()
    const decreaseBtn = firstItem.getByRole('button', { name: '-' })
    await decreaseBtn.click()
    await decreaseBtn.click()
    await decreaseBtn.click()
    await expect(firstItem).toBeVisible()
  })

  test('S07 食材库 Tab：可以打开手动添加表单', async ({ page }) => {
    await page.getByRole('button', { name: /手动添加/ }).click()
    await expect(page.getByPlaceholder(/食材名称/)).toBeVisible()
  })

  test('S08 食材库 Tab：低库存提醒显示', async ({ page }) => {
    // 初始数据中面包qty=1, 大米qty=1, 韭菜饺子皮qty=1 → 有低库存
    await expect(page.getByText(/低库存提醒/)).toBeVisible()
  })

  // ── 拍照识别 ─────────────────────────────────────────────

  test('S09 拍照 Tab：显示上传区域', async ({ page }) => {
    await page.getByRole('button', { name: /拍照更新/ }).click()
    await expect(page.getByText(/点击拍照/)).toBeVisible()
  })

  // ── 补货建议 ─────────────────────────────────────────────

  test('S10 补货建议 Tab：显示分析按钮', async ({ page }) => {
    await page.getByRole('button', { name: /补货建议/ }).click()
    await expect(page.getByRole('button', { name: /分析库存/ })).toBeVisible()
  })

  // ── 菜谱 ─────────────────────────────────────────────────

  test('S11 菜谱 Tab：显示菜谱列表', async ({ page }) => {
    await page.getByRole('button', { name: /菜谱/ }).click()
    await expect(page.locator('[data-testid="recipe-card"]').first()).toBeVisible()
  })

  test('S12 菜谱 Tab：标签筛选可点击不崩溃', async ({ page }) => {
    await page.getByRole('button', { name: /菜谱/ }).click()
    // 点击一个标签筛选按钮
    const tagButton = page.getByRole('button', { name: /Marcus最爱/ })
    await tagButton.click()
    // 筛选后仍有菜谱显示
    await expect(page.locator('[data-testid="recipe-card"]').first()).toBeVisible()
  })

  test('S13 菜谱 Tab：点击菜谱卡片展开详情', async ({ page }) => {
    await page.getByRole('button', { name: /菜谱/ }).click()
    const firstCard = page.locator('[data-testid="recipe-card"]').first()
    await firstCard.getByRole('button').click()
    // 展开后显示步骤
    await expect(page.getByText(/步骤/)).toBeVisible()
  })

  // ── Tab 切换 ──────────────────────────────────────────────

  test('S14 Tab 之间可以自由切换', async ({ page }) => {
    await page.getByRole('button', { name: /菜谱/ }).click()
    await expect(page.locator('[data-testid="recipe-card"]').first()).toBeVisible()

    await page.getByRole('button', { name: /拍照更新/ }).click()
    await expect(page.getByText(/点击拍照/)).toBeVisible()

    await page.getByRole('button', { name: /食材库/ }).click()
    await expect(page.locator('[data-testid="pantry-item"]').first()).toBeVisible()
  })

  // ── API 健康检查 ──────────────────────────────────────────

  test('S15 GET /api/pantry 返回 200', async ({ request }) => {
    const response = await request.get('/api/pantry')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body).toHaveProperty('data')
    expect(Array.isArray(body.data)).toBe(true)
  })

  test('S16 POST /api/scan 没有图片时返回 400', async ({ request }) => {
    const response = await request.post('/api/scan', {
      data: {}
    })
    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body).toHaveProperty('code', 'MISSING_IMAGE')
  })

})
