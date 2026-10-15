import { test, expect } from './fixtures';

test('animated project preview can pause, resume, and reveal the original screenshot', async ({ homePage, page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await homePage.goto();
  // Stabilize the decorative floating panel without disabling GIF playback.
  await page.addStyleTag({ content: ".adrift { animation: none !important; }" });
  const card = homePage.projectCard('Rubber Duckie Terminator');
  await card.scrollTo();
  const preview = card.root.locator('img').first();
  await expect(preview).toHaveAttribute('src', /duck\.gif$/);
  await card.root.getByRole('button', { name: /Pause animated/ }).click();
  await expect(preview).toHaveAttribute('src', /duck\.webp$/);
  await card.root.getByRole('button', { name: /Play animated/ }).click();
  await expect(preview).toHaveAttribute('src', /duck\.gif$/);
  await card.root.getByRole('button', { name: 'Next screenshot' }).click();
  await expect(preview).toHaveAttribute('src', /duck\.webp$/);
  await expect(card.root.getByRole('button', { name: /Pause animated/ })).toHaveCount(0);
});

test('reduced motion uses still posters for every project preview', async ({ homePage, page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await homePage.goto();
  await expect(page.locator('img[src*="animated/"]')).toHaveCount(7);
  await expect(page.locator('img[src$=".gif"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Pause animated/ })).toHaveCount(0);
});
