import { expect, test } from '@playwright/test';

test('employee uses the real paginated orders workflow', async ({ page }) => {
  const email = process.env['E2E_EMPLOYEE_EMAIL'];
  const password = process.env['E2E_EMPLOYEE_PASSWORD'];
  if (!email || !password) {
    throw new Error('Temporary employee credentials must be supplied through the process environment.');
  }

  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  const initialRequest = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname.endsWith('/employee/orders') && url.searchParams.get('page') === '0';
  });
  await page.goto('/connexion?returnUrl=%2Femploye%2Fcommandes');
  await page.getByLabel('Adresse e-mail').fill(email);
  await page.getByLabel('Mot de passe').fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL(/\/employe\/commandes/);

  const initialResponse = await initialRequest;
  expect(initialResponse.status()).toBe(200);
  const payload = await initialResponse.json();
  expect(payload).toEqual(
    expect.objectContaining({
      content: expect.any(Array),
      page: expect.any(Number),
      totalElements: expect.any(Number),
      totalPages: expect.any(Number),
    }),
  );
  await expect(page.getByRole('heading', { name: /Commandes/i })).toBeVisible();

  const filteredRequest = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname.endsWith('/employee/orders') && url.searchParams.get('status') === 'PENDING';
  });
  await page.locator('select[name="status"]').selectOption('PENDING');
  expect((await filteredRequest).status()).toBe(200);
  await expect(page).toHaveURL(/status=PENDING/);

  const next = page.getByRole('button', { name: /Suivante/i });
  if (await next.isEnabled()) {
    const nextRequest = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return url.pathname.endsWith('/employee/orders') && url.searchParams.get('page') === '1';
    });
    await next.click();
    expect((await nextRequest).status()).toBe(200);
    await expect(page).toHaveURL(/page=1/);
  } else {
    await expect(next).toBeDisabled();
  }

  const detail = page.getByRole('link', { name: /Détail/i }).first();
  if (await detail.count()) {
    await detail.click();
    await expect(page).toHaveURL(/\/employe\/commandes\/\d+/);
  }
  expect(pageErrors).toEqual([]);
});
