import {test,expect} from '@playwright/test';

test('family names remain inert through save, reload and export; workspace makes no external requests',async({page,baseURL})=>{
  const external:string[]=[];
  const errors:string[]=[];
  const dialogs:string[]=[];
  page.on('request',request=>{const url=new URL(request.url());if(['http:','https:','ws:','wss:'].includes(url.protocol)&&url.host!==new URL(baseURL!).host)external.push(url.origin);});
  page.on('pageerror',error=>errors.push(error.message));
  page.on('dialog',async dialog=>{dialogs.push(dialog.message());await dialog.dismiss();});
  await page.goto('/');
  await page.locator('.column-heading').first().click();
  const name='<img src=x onerror=alert(1)>';
  await page.getByLabel('Semantic name').fill(name);
  await page.getByRole('button',{name:'Apply colors',exact:true}).click();
  await expect(page.locator('.column-heading').first()).toContainText(name);
  await page.reload();
  await expect(page.locator('.column-heading').first()).toContainText(name);
  await expect(page.locator('.palette-column').first().locator('img')).toHaveCount(0);
  await page.getByRole('button',{name:'Show JSON',exact:true}).click();
 if(await page.getByRole('radio',{name:'Export without these colors',exact:true}).isVisible())await page.getByRole('radio',{name:'Export without these colors',exact:true}).click();
  expect(JSON.parse((await page.getByLabel('Palette JSON').textContent())!).columns[0].name).toBe(name);
  await expect(page.getByLabel('Palette JSON').locator('img')).toHaveCount(0);
  await page.getByRole('link',{name:'Guide',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Build a palette from your brand colors'})).toBeVisible();
  expect(dialogs).toEqual([]);
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
