import axios from "axios";

let productListOverviewCache = null;

export async function getProductListOverview() {
  if (productListOverviewCache === null) {
    const response = await axios.post(`${frontendLocalizer.apiUrl}/foodcoop/v1/getProductListOverview`)
    if (response.data) {
      productListOverviewCache = JSON.parse(response.data)
    }
  }

  const res = productListOverviewCache;
  const products = res[0]
  const categories = res[1]
  const currency = res[2]
  let productsByCategory = {}
  res[1].map(category => {
    productsByCategory[category.name] = []
  })

  products.map(p => {
    let productToDo = p;
    productToDo.unit = p._einheit
    productToDo.lot = p._gebinde
    productsByCategory[p.category_name].push(productToDo)
  })

  return {
    products: products,
    categories: categories,
    currency: currency,
    productsByCategory: productsByCategory
  };
}

export async function getProduct(id) {
  if (productListOverviewCache === null) {
    const response = await axios.post(`${frontendLocalizer.apiUrl}/foodcoop/v1/getProductListOverview`)
    if (response.data) {
      productListOverviewCache = JSON.parse(response.data)
    }
  }
  const res = productListOverviewCache;
  let product = res[0].find(product => product.id == id)

  const currency = res[2]
  return {product, currency}
}

export async function getStockManagement() {
  const response = await axios.get(`${frontendLocalizer.apiUrl}/foodcoop/v1/getOption?option=woocommerce_manage_stock`)
  if (response.data) {
    return response.data === '"yes"'
  } else {
    return false
  }
}

export async function getSelfCheckoutProducts() {
  const response = await axios.get(`${frontendLocalizer.apiUrl}/foodcoop/v1/getOption?option=fc_self_checkout_products`)
  if (response.data) {
    // WTF
    return JSON.parse(JSON.parse(response.data)).map(Number)
  }
}
