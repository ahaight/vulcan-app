import { expect, test } from "./fixtures";

test("Today button resets date picker to current day", async ({
  vulcanPage,
  page,
}) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = tomorrow.toISOString().slice(0, 10);

  await vulcanPage.setDate(tomorrowKey);
  await expect(vulcanPage.datePicker).toHaveValue(tomorrowKey);

  await vulcanPage.goToToday();
  const todayKey = await page.evaluate(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });
  await expect(vulcanPage.datePicker).toHaveValue(todayKey);
});
