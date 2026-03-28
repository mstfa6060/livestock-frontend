// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Params = Record<string, any>;

export const queryKeys = {
  products: {
    all: ["products"] as const,
    lists: () => [...queryKeys.products.all, "list"] as const,
    list: (filters: Params) =>
      [...queryKeys.products.lists(), filters] as const,
    search: (params: Params) =>
      [...queryKeys.products.all, "search", params] as const,
    details: () => [...queryKeys.products.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
    reviews: (productId: string) =>
      [...queryKeys.products.detail(productId), "reviews"] as const,
    variants: (productId: string) =>
      [...queryKeys.products.detail(productId), "variants"] as const,
    prices: (productId: string) =>
      [...queryKeys.products.detail(productId), "prices"] as const,
    animalInfo: (productId: string) =>
      [...queryKeys.products.detail(productId), "animalInfo"] as const,
    vetInfo: (productId: string) =>
      [...queryKeys.products.detail(productId), "vetInfo"] as const,
  },

  categories: {
    all: ["categories"] as const,
    list: (locale: string) =>
      [...queryKeys.categories.all, "list", locale] as const,
    pick: (locale: string) =>
      [...queryKeys.categories.all, "pick", locale] as const,
    detail: (id: string, locale: string) =>
      [...queryKeys.categories.all, "detail", id, locale] as const,
  },

  sellers: {
    all: ["sellers"] as const,
    lists: () => [...queryKeys.sellers.all, "list"] as const,
    list: (params: Params) =>
      [...queryKeys.sellers.lists(), params] as const,
    details: () => [...queryKeys.sellers.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.sellers.details(), id] as const,
    byUserId: (userId: string) =>
      [...queryKeys.sellers.all, "byUser", userId] as const,
    reviews: (sellerId: string) =>
      [...queryKeys.sellers.detail(sellerId), "reviews"] as const,
  },

  dashboard: {
    all: ["dashboard"] as const,
    myStats: () => [...queryKeys.dashboard.all, "myStats"] as const,
    stats: () => [...queryKeys.dashboard.all, "stats"] as const,
  },

  offers: {
    all: ["offers"] as const,
    sent: (params?: Params) =>
      [...queryKeys.offers.all, "sent", params] as const,
    received: (params?: Params) =>
      [...queryKeys.offers.all, "received", params] as const,
  },

  conversations: {
    all: ["conversations"] as const,
    lists: () => [...queryKeys.conversations.all, "list"] as const,
    list: (params?: Params) =>
      [...queryKeys.conversations.lists(), params] as const,
    detail: (id: string) =>
      [...queryKeys.conversations.all, "detail", id] as const,
  },

  messages: {
    all: ["messages"] as const,
    list: (conversationId: string) =>
      [...queryKeys.messages.all, "list", conversationId] as const,
    unreadCount: () => [...queryKeys.messages.all, "unreadCount"] as const,
  },

  transporters: {
    all: ["transporters"] as const,
    lists: () => [...queryKeys.transporters.all, "list"] as const,
    list: (params: Params) =>
      [...queryKeys.transporters.lists(), params] as const,
    details: () => [...queryKeys.transporters.all, "detail"] as const,
    detail: (id: string) =>
      [...queryKeys.transporters.details(), id] as const,
    byUserId: (userId: string) =>
      [...queryKeys.transporters.all, "byUser", userId] as const,
    requests: (params?: Params) =>
      [...queryKeys.transporters.all, "requests", params] as const,
    transportOffers: (params?: Params) =>
      [...queryKeys.transporters.all, "transportOffers", params] as const,
    reviews: (transporterId: string) =>
      [...queryKeys.transporters.detail(transporterId), "reviews"] as const,
  },

  farms: {
    all: ["farms"] as const,
    lists: () => [...queryKeys.farms.all, "list"] as const,
    list: (params?: Params) =>
      [...queryKeys.farms.lists(), params] as const,
    detail: (id: string) => [...queryKeys.farms.all, "detail", id] as const,
  },

  locations: {
    all: ["locations"] as const,
    lists: () => [...queryKeys.locations.all, "list"] as const,
    list: (params?: Params) =>
      [...queryKeys.locations.lists(), params] as const,
    detail: (id: string) =>
      [...queryKeys.locations.all, "detail", id] as const,
  },

  brands: {
    all: ["brands"] as const,
    lists: () => [...queryKeys.brands.all, "list"] as const,
    list: (params?: Params) =>
      [...queryKeys.brands.lists(), params] as const,
    detail: (id: string) => [...queryKeys.brands.all, "detail", id] as const,
  },

  faqs: {
    all: ["faqs"] as const,
    list: (locale: string) => [...queryKeys.faqs.all, "list", locale] as const,
  },

  banners: {
    all: ["banners"] as const,
    list: () => [...queryKeys.banners.all, "list"] as const,
  },

  countries: {
    all: ["countries"] as const,
    list: () => [...queryKeys.countries.all, "list"] as const,
    byCode: (code: string) =>
      [...queryKeys.countries.all, "byCode", code] as const,
  },

  provinces: {
    all: ["provinces"] as const,
    byCountry: (countryId: number) =>
      [...queryKeys.provinces.all, "byCountry", countryId] as const,
  },

  districts: {
    all: ["districts"] as const,
    byProvince: (provinceId: number) =>
      [...queryKeys.districts.all, "byProvince", provinceId] as const,
  },

  geoIp: {
    all: ["geoIp"] as const,
    detect: () => [...queryKeys.geoIp.all, "detect"] as const,
  },

  users: {
    all: ["users"] as const,
    detail: (id: string) => [...queryKeys.users.all, "detail", id] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (params?: Params) =>
      [...queryKeys.users.lists(), params] as const,
  },

  systemSettings: {
    all: ["systemSettings"] as const,
    currencies: () =>
      [...queryKeys.systemSettings.all, "currencies"] as const,
    languages: () => [...queryKeys.systemSettings.all, "languages"] as const,
    paymentMethods: () =>
      [...queryKeys.systemSettings.all, "paymentMethods"] as const,
  },

  fileBuckets: {
    all: ["fileBuckets"] as const,
    detail: (id: string) =>
      [...queryKeys.fileBuckets.all, "detail", id] as const,
  },

  searchHistories: {
    all: ["searchHistories"] as const,
    list: () => [...queryKeys.searchHistories.all, "list"] as const,
  },

  deals: {
    all: ["deals"] as const,
    lists: () => [...queryKeys.deals.all, "list"] as const,
    list: (params?: Params) =>
      [...queryKeys.deals.lists(), params] as const,
  },

  favorites: {
    all: ["favorites"] as const,
    list: (userId: string) =>
      [...queryKeys.favorites.all, "list", userId] as const,
  },

  healthRecords: {
    all: ["healthRecords"] as const,
    lists: () => [...queryKeys.healthRecords.all, "list"] as const,
    list: (params?: Params) =>
      [...queryKeys.healthRecords.lists(), params] as const,
  },

  vaccinations: {
    all: ["vaccinations"] as const,
    lists: () => [...queryKeys.vaccinations.all, "list"] as const,
    list: (params?: Params) =>
      [...queryKeys.vaccinations.lists(), params] as const,
  },

  shippingCarriers: {
    all: ["shippingCarriers"] as const,
    lists: () => [...queryKeys.shippingCarriers.all, "list"] as const,
    list: (params?: Params) =>
      [...queryKeys.shippingCarriers.lists(), params] as const,
  },

  shippingZones: {
    all: ["shippingZones"] as const,
    lists: () => [...queryKeys.shippingZones.all, "list"] as const,
    list: (params?: Params) =>
      [...queryKeys.shippingZones.lists(), params] as const,
  },

  shippingRates: {
    all: ["shippingRates"] as const,
    lists: () => [...queryKeys.shippingRates.all, "list"] as const,
    list: (params?: Params) =>
      [...queryKeys.shippingRates.lists(), params] as const,
  },

  notifications: {
    all: ["notifications"] as const,
    list: (userId: string) =>
      [...queryKeys.notifications.all, "list", userId] as const,
  },

  preferences: {
    all: ["preferences"] as const,
    my: (userId: string) =>
      [...queryKeys.preferences.all, "my", userId] as const,
  },

  recentlyViewed: {
    all: ["recentlyViewed"] as const,
    list: (userId: string) =>
      [...queryKeys.recentlyViewed.all, "list", userId] as const,
  },

  transportTrackings: {
    all: ["transportTrackings"] as const,
    list: (transportRequestId: string) =>
      [...queryKeys.transportTrackings.all, "list", transportRequestId] as const,
  },

  currencies: {
    all: ["currencies"] as const,
    lists: () => [...queryKeys.currencies.all, "list"] as const,
    list: (params?: Params) =>
      [...queryKeys.currencies.lists(), params] as const,
  },
} as const;
