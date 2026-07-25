import type { PublicCategory, PublicMenuItem } from '@/features/public-menu/api'

export function filterMenuCategories(
  categories: PublicCategory[],
  options: { search: string; categoryId: string | null },
): PublicCategory[] {
  const search = options.search.trim().toLowerCase()

  return categories
    .map((category) => {
      if (options.categoryId && category.id !== options.categoryId) {
        return { ...category, items: [] as PublicMenuItem[] }
      }

      const items = category.items.filter((item) => {
        if (!search) return true
        const haystack = `${item.name} ${item.description}`.toLowerCase()
        return haystack.includes(search)
      })

      return { ...category, items }
    })
    .filter((category) => {
      if (search || options.categoryId) {
        return category.items.length > 0
      }
      return true
    })
}
