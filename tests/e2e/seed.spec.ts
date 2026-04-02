import { expect, test } from "./fixtures";

test("seed", async ({ vulcanPage }) => {
  await vulcanPage.expectLoaded();

  const t = Date.now();
  await vulcanPage.addTask(`Seed task ${t}`, "Medium", "In progress", {
    category: "Work",
    priority: "High",
    subtaskTitles: [`Seed subtask A ${t}`, `Seed subtask B ${t}`],
  });

  await vulcanPage.setSort("manual");
  await vulcanPage.setFilter("all");
  await expect(vulcanPage.todoItems).toHaveCount(1);
});
