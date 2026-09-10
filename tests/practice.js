export async function choosePractice(page, mode = 'One table, in order', table = 4) {
  await page.getByRole('button', { name: new RegExp(mode) }).click();
  if (mode !== 'All nine tables, shuffled') await page.getByRole('button', { name: `Table ${table}`, exact: true }).click();
}
