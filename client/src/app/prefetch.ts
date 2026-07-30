/** Warm commonly visited admin chunks without coupling the router module. */
export function prefetchAdminRoutes() {
  void import('@/pages/admin/DashboardPage')
  void import('@/pages/admin/CategoriesPage')
  void import('@/pages/admin/MenuItemsPage')
  void import('@/pages/admin/RestaurantPage')
}
