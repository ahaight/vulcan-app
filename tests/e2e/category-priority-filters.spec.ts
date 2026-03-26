import { expect, test } from "./fixtures";

test("category filter shows only matching tasks", async ({ vulcanPage }) => {
  const t = Date.now();
  const workTitle = `Cat work ${t}`;
  const personalTitle = `Cat personal ${t}`;

  await vulcanPage.addTask(workTitle, 1, "Not started", { category: "Work" });
  await vulcanPage.addTask(personalTitle, 1, "Not started", {
    category: "Personal",
  });

  await vulcanPage.setCategoryFilter("Work");
  await vulcanPage.expectTaskVisible(workTitle);
  await vulcanPage.expectTaskNotVisible(personalTitle);
  await vulcanPage.expectTodoItemCount(1);

  await vulcanPage.setCategoryFilter("Personal");
  await vulcanPage.expectTaskVisible(personalTitle);
  await vulcanPage.expectTaskNotVisible(workTitle);

  await vulcanPage.setCategoryFilter("all");
  await vulcanPage.expectTodoItemCount(2);
});

test("priority filter shows only matching tasks", async ({ vulcanPage }) => {
  const t = Date.now();
  const highTitle = `Pri high ${t}`;
  const lowTitle = `Pri low ${t}`;

  await vulcanPage.addTask(highTitle, 1, "Not started", { priority: "High" });
  await vulcanPage.addTask(lowTitle, 1, "Not started", { priority: "Low" });

  await vulcanPage.setPriorityFilter("High");
  await vulcanPage.expectTaskVisible(highTitle);
  await vulcanPage.expectTaskNotVisible(lowTitle);
  await vulcanPage.expectTodoItemCount(1);

  await vulcanPage.setPriorityFilter("Low");
  await vulcanPage.expectTaskVisible(lowTitle);
  await vulcanPage.expectTaskNotVisible(highTitle);

  await vulcanPage.setPriorityFilter("all");
  await vulcanPage.expectTodoItemCount(2);
});

test("edit modal updates category and priority", async ({ vulcanPage }) => {
  const title = `Edit cat pri ${Date.now()}`;
  await vulcanPage.addTask(title, 2, "Not started", {
    category: "Other",
    priority: "Medium",
  });
  await vulcanPage.expectTaskShowsCategoryAndPriority(title, "Other", "Medium");

  await vulcanPage.clickEditTask(title);
  await vulcanPage.expectEditModalVisible();
  await vulcanPage.saveEditTask({
    category: "Housework",
    priority: "High",
  });

  await vulcanPage.expectTaskShowsCategoryAndPriority(title, "Housework", "High");
});

test("combined status, category, and priority filters", async ({
  vulcanPage,
}) => {
  const t = Date.now();
  const match = `Triple match ${t}`;
  const wrongCat = `Wrong cat ${t}`;
  const wrongPri = `Wrong pri ${t}`;
  const wrongStat = `Wrong stat ${t}`;

  await vulcanPage.addTask(match, 1, "Not started", {
    category: "Work",
    priority: "High",
  });
  await vulcanPage.addTask(wrongCat, 1, "Not started", {
    category: "Personal",
    priority: "High",
  });
  await vulcanPage.addTask(wrongPri, 1, "Not started", {
    category: "Work",
    priority: "Low",
  });
  await vulcanPage.addTask(wrongStat, 1, "Done", {
    category: "Work",
    priority: "High",
  });

  await vulcanPage.setFilter("Not started");
  await vulcanPage.setCategoryFilter("Work");
  await vulcanPage.setPriorityFilter("High");

  await vulcanPage.expectTaskVisible(match);
  await vulcanPage.expectTaskNotVisible(wrongCat);
  await vulcanPage.expectTaskNotVisible(wrongPri);
  await vulcanPage.expectTaskNotVisible(wrongStat);
  await vulcanPage.expectTodoItemCount(1);
});

test("new task form includes category and priority in meta line", async ({
  vulcanPage,
}) => {
  const title = `Meta line ${Date.now()}`;
  await vulcanPage.addTask(title, 3, "Not started", {
    category: "Health",
    priority: "Low",
  });
  await expect(vulcanPage.todoItemByTitle(title).locator(".todo-meta")).toContainText(
    "Health",
  );
  await expect(vulcanPage.todoItemByTitle(title).locator(".todo-meta")).toContainText(
    "Low",
  );
});
