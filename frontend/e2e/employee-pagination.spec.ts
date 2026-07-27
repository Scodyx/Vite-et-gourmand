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

test('admin manages employees and opens administration screens', async ({ page }) => {
  const email=process.env['E2E_ADMIN_EMAIL'];
  const password=process.env['E2E_ADMIN_PASSWORD'];
  const employeeEmail=process.env['E2E_ADMIN_EMPLOYEE_EMAIL'];
  const employeePassword=process.env['E2E_ADMIN_EMPLOYEE_PASSWORD'];
  if(!email||!password||!employeeEmail||!employeePassword)throw new Error('Temporary admin smoke credentials are required.');
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/connexion?returnUrl=%2Fadmin');
  await page.getByLabel('Adresse e-mail').fill(email);
  await page.getByLabel('Mot de passe').fill(password);
  await page.getByRole('button',{name:'Se connecter'}).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading',{name:'Tableau de bord'})).toBeVisible();
  await page.goto('/admin/employes');
  await page.locator('input[name="firstName"]').fill('Browser');
  await page.locator('input[name="lastName"]').fill('Employee');
  await page.locator('input[name="email"]').fill(employeeEmail);
  await page.locator('input[name="password"]').fill(employeePassword);
  await page.locator('input[name="confirmation"]').fill(employeePassword);
  await page.getByRole('button',{name:'Créer l’employé'}).click();
  await expect(page.getByText(employeeEmail)).toBeVisible();
  const card=page.locator('article.card').filter({hasText:employeeEmail});
  page.once('dialog',dialog=>dialog.accept());
  await card.getByRole('button',{name:'Désactiver'}).click();
  await expect(card.getByText('Désactivé')).toBeVisible();
  await page.goto('/admin/horaires');
  await expect(page.getByRole('heading',{name:/Horaires/})).toBeVisible();
  await expect(page.locator('fieldset')).toHaveCount(7);
  await page.goto('/admin/statistiques');
  await expect(page.getByRole('heading',{name:'Statistiques'})).toBeVisible();
  expect(errors).toEqual([]);
});
