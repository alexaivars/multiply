export async function choosePractice(page, mode = 'Series 1–9', table = 4) {
  await page.getByRole('button', { name: new RegExp(mode) }).click();
  if (mode !== 'Mixed all') await page.getByRole('button', { name: `Table ${table}`, exact: true }).click();
}
