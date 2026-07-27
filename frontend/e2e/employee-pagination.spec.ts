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

test('admin creates, edits and disables a menu', async ({ page }) => {
  const email=process.env['E2E_ADMIN_EMAIL'];const password=process.env['E2E_ADMIN_PASSWORD'];const title=process.env['E2E_ADMIN_MENU_TITLE'];
  if(!email||!password||!title)throw new Error('Temporary admin menu smoke values are required.');
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/connexion?returnUrl=%2Fadmin%2Fmenus');
  await page.getByLabel('Adresse e-mail').fill(email);await page.getByLabel('Mot de passe').fill(password);await page.getByRole('button',{name:'Se connecter'}).click();
  await expect(page).toHaveURL(/\/admin\/menus$/);await page.getByRole('link',{name:'Nouveau menu'}).click();
  await page.locator('input[name="title"]').fill(title);await page.locator('input[name="price"]').fill('19.50');await page.locator('input[name="minimum"]').fill('4');
  await page.locator('input[name="stock"]').fill('40');await page.locator('input[name="theme"]').fill('Smoke');await page.locator('input[name="diet"]').fill('Classique');
  await page.locator('textarea[name="description"]').fill('Menu créé par le smoke Chromium');await page.locator('textarea[name="conditions"]').fill('Conditions de test');
  await page.getByRole('button',{name:'Enregistrer'}).click();await expect(page.getByRole('heading',{name:title})).toBeVisible();
  await page.getByRole('link',{name:'Modifier'}).click();const updated=`${title} Updated`;
  await expect(page.locator('input[name="title"]')).toHaveValue(title);
  await page.locator('input[name="title"]').fill(updated);await page.locator('input[name="price"]').fill('21.00');
  await page.getByRole('button',{name:'Enregistrer'}).click();await expect(page.getByRole('heading',{name:updated})).toBeVisible();
  page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Désactiver'}).click();await expect(page.locator('dl').getByText('Inactif',{exact:true})).toBeVisible();
  const publicResponse=await page.request.get(`http://127.0.0.1:8080/api/v1/public/menus?query=${encodeURIComponent(updated)}`);
  expect(publicResponse.status()).toBe(200);expect((await publicResponse.json()).content).toHaveLength(0);expect(errors).toEqual([]);
});

test('admin creates, edits and disables a dish', async ({ page }) => {
  const email=process.env['E2E_ADMIN_EMAIL'];const password=process.env['E2E_ADMIN_PASSWORD'];const name=process.env['E2E_ADMIN_DISH_NAME'];
  if(!email||!password||!name)throw new Error('Temporary admin dish smoke values are required.');
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/connexion?returnUrl=%2Fadmin%2Fplats');
  await page.getByLabel('Adresse e-mail').fill(email);await page.getByLabel('Mot de passe').fill(password);
  await page.getByRole('button',{name:'Se connecter'}).click();
  await expect(page).toHaveURL(/\/admin\/plats$/);
  await page.getByRole('link',{name:'Nouveau plat'}).click();
  await page.locator('input[name="name"]').fill(name);
  await page.locator('textarea[name="description"]').fill('Plat créé par le smoke Chromium');
  await page.locator('select[name="type"]').selectOption('MAIN_COURSE');
  await page.getByRole('button',{name:'Enregistrer'}).click();
  await expect(page.getByRole('heading',{name})).toBeVisible();
  await expect(page.getByText('0 menu(s) utilise(nt) ce plat.')).toBeVisible();
  await page.getByRole('link',{name:'Modifier'}).click();
  const updated=`${name} Updated`;
  await expect(page.locator('input[name="name"]')).toHaveValue(name);
  await page.locator('input[name="name"]').fill(updated);
  await page.locator('textarea[name="description"]').fill('Description mise à jour');
  await page.getByRole('button',{name:'Enregistrer'}).click();
  await expect(page.getByRole('heading',{name:updated})).toBeVisible();
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Désactiver'}).click();
  await expect(page.getByText('Inactif')).toBeVisible();
  expect(errors).toEqual([]);
});

test('admin explicitly manages menu dish associations', async ({ page }) => {
  const email=process.env['E2E_ADMIN_EMAIL'];const password=process.env['E2E_ADMIN_PASSWORD'];
  const menuId=process.env['E2E_ASSOC_MENU_ID'];const slug=process.env['E2E_ASSOC_MENU_SLUG'];
  const firstName=process.env['E2E_ASSOC_DISH_ONE_NAME'];const secondName=process.env['E2E_ASSOC_DISH_TWO_NAME'];
  const secondId=process.env['E2E_ASSOC_DISH_TWO_ID'];
  if(!email||!password||!menuId||!slug||!firstName||!secondName||!secondId)throw new Error('Temporary association smoke values are required.');
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`/connexion?returnUrl=${encodeURIComponent(`/admin/menus/${menuId}`)}`);
  await page.getByLabel('Adresse e-mail').fill(email);await page.getByLabel('Mot de passe').fill(password);
  await page.getByRole('button',{name:'Se connecter'}).click();
  await expect(page).toHaveURL(new RegExp(`/admin/menus/${menuId}$`));
  const first=page.locator('label.card').filter({hasText:firstName});
  const second=page.locator('label.card').filter({hasText:secondName});
  await first.locator('input').check();await second.locator('input').check();
  await page.getByRole('button',{name:'Enregistrer la composition'}).click();
  await expect(page.getByRole('heading',{name:/Composition · 2 plat/})).toBeVisible();
  page.once('dialog',dialog=>dialog.accept());await first.locator('input').uncheck();
  const removal=page.waitForResponse(r=>r.request().method()==='PUT'&&r.url().endsWith(`/admin/menus/${menuId}/dishes`));
  await page.getByRole('button',{name:'Enregistrer la composition'}).click();
  expect((await removal).status()).toBe(200);
  await expect(page.getByRole('heading',{name:/Composition · 1 plat/})).toBeVisible();
  const publicDetail=await page.request.get(`http://127.0.0.1:8080/api/v1/public/menus/${slug}`);
  expect(publicDetail.status()).toBe(200);const publicPayload=await publicDetail.json();
  expect(publicPayload.dishes.map((d:{name:string})=>d.name)).not.toContain(firstName);
  expect(publicPayload.dishes.map((d:{name:string})=>d.name)).toContain(secondName);
  await page.goto(`/admin/plats/${secondId}`);
  const deactivation=page.waitForResponse(r=>r.request().method()==='PATCH'&&r.url().includes(`/admin/dishes/${secondId}/enabled`));
  page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Désactiver'}).click();
  expect((await deactivation).status()).toBe(200);
  await expect(page.getByText('Inactif',{exact:true})).toBeVisible();
  const inactiveDetail=await page.request.get(`http://127.0.0.1:8080/api/v1/public/menus/${slug}`);
  expect((await inactiveDetail.json()).dishes.map((d:{name:string})=>d.name)).not.toContain(secondName);
  expect(errors).toEqual([]);
});

test('admin explicitly manages dish allergen associations', async ({ page }) => {
  const email=process.env['E2E_ADMIN_EMAIL'];const password=process.env['E2E_ADMIN_PASSWORD'];
  const dishId=process.env['E2E_ALLERGEN_DISH_ID'];const firstName=process.env['E2E_ALLERGEN_ONE_NAME'];const secondName=process.env['E2E_ALLERGEN_TWO_NAME'];
  if(!email||!password||!dishId||!firstName||!secondName)throw new Error('Temporary allergen smoke values are required.');
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`/connexion?returnUrl=${encodeURIComponent(`/admin/plats/${dishId}`)}`);
  await page.getByLabel('Adresse e-mail').fill(email);await page.getByLabel('Mot de passe').fill(password);await page.getByRole('button',{name:'Se connecter'}).click();
  await expect(page).toHaveURL(new RegExp(`/admin/plats/${dishId}$`));
  const first=page.locator('label.card').filter({hasText:firstName});const second=page.locator('label.card').filter({hasText:secondName});
  await first.locator('input').check();await second.locator('input').check();
  const replace=page.waitForResponse(r=>r.request().method()==='PUT'&&r.url().endsWith(`/admin/dishes/${dishId}/allergens`));
  await page.getByRole('button',{name:'Enregistrer les allergènes'}).click();expect((await replace).status()).toBe(200);
  await expect(page.getByRole('heading',{name:/Allergènes · 2/})).toBeVisible();
  page.once('dialog',dialog=>dialog.accept());await first.locator('input').uncheck();
  const remove=page.waitForResponse(r=>r.request().method()==='PUT'&&r.url().endsWith(`/admin/dishes/${dishId}/allergens`));
  await page.getByRole('button',{name:'Enregistrer les allergènes'}).click();expect((await remove).status()).toBe(200);
  await expect(page.getByRole('heading',{name:/Allergènes · 1/})).toBeVisible();expect(errors).toEqual([]);
});
