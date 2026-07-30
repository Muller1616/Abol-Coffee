-- Performance indexes for public menu, dashboard max(updatedAt), and filtered lists.

CREATE INDEX IF NOT EXISTS "categories_isActive_displayOrder_idx" ON "categories"("isActive", "displayOrder");
CREATE INDEX IF NOT EXISTS "categories_updatedAt_idx" ON "categories"("updatedAt");

CREATE INDEX IF NOT EXISTS "menu_items_categoryId_isAvailable_displayOrder_idx" ON "menu_items"("categoryId", "isAvailable", "displayOrder");
CREATE INDEX IF NOT EXISTS "menu_items_updatedAt_idx" ON "menu_items"("updatedAt");

CREATE INDEX IF NOT EXISTS "restaurants_updatedAt_idx" ON "restaurants"("updatedAt");
