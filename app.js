const client = contentful.createClient({
  space: "jl9g9yf94ob5",
  environment: "master", // defaults to 'master' if not set
  accessToken: "-HJJ5gzqKhMC_v9e-ckUXWrKbRdYBS45IW1jwYKZiAM",
});

const getElement = (selector) => {
  const element = document.querySelector(selector);
  if (element) return element;
  else {
    throw new Error("element does not exist");
  }
};

const cartBtn = getElement(".cart-btn");
const closeCartBtn = getElement(".close-cart");
const clearCartBtn = getElement(".clear-cart");
const cartDOM = getElement(".cart");
const cartOverlay = getElement(".cart-overlay");
const cartItems = getElement(".cart-items");
const cartTotal = getElement(".cart-total");
const cartContent = getElement(".cart-content");
const productsDOM = getElement(".products-center");

// cart
let cart = [];
// buttons
let buttonsDOM = [];

// getting products
class Products {
  async getProducts() {
    try {
      let contentful = await client.getEntries({
        content_type: "comfyHouse",
      });

      // const response = await fetch("products.json");
      // const data = await response.json();
      // let products = data.items;

      let products = contentful.items;
      products = products.map((product) => {
        const { id } = product.sys;
        const { title, price } = product.fields;
        const image = product.fields.image.fields.file.url;
        return { id, title, price, image };
      });

      return products;
    } catch (error) {
      console.log(error);
    }
  }
}

// display products
class UI {
  displayProducts(products) {
    let result = "";
    products.forEach((product) => {
      result += `
      <!-- single product -->
        <article class="product">
          <div class="img-container">
            <img
              src=${product.image}
              alt=${product.title}
              class="product-img"
            />
             <button class="bag-btn" data-id=${product.id}>
              <i class="fas fa-shopping-cart"></i>
              add to bag
            </button>
          </div>
          <h3>${product.title}</h3>
          <h4>$${product.price}</h4>
        </article>
        <!--end single product -->
      `;
    });

    productsDOM.innerHTML = result;
  }

  getBagButton() {
    const buttons = [...productsDOM.querySelectorAll(".bag-btn")];
    buttonsDOM = buttons;
    buttons.forEach((btn) => {
      let id = btn.dataset.id;
      let inCart = cart.find((item) => {
        // return item.dataset.id === id;
        return item.id === id;
      });

      if (inCart) {
        btn.textContent = "in cart";
        btn.disabled = true;
      }
      btn.addEventListener("click", (e) => {
        e.target.textContent = "in cart";
        btn.disabled = true;
        // get product from products
        let cartItem = { ...Storage.getProduct(id), amount: 1 };

        // add products to the cart
        cart = [...cart, cartItem];
        // save cart in local storage
        Storage.saveCart(cart);
        // set cart values
        this.setCartValues(cart);
        // display cart items
        this.displayCartItems(cartItem);
        // show the cart
        this.showCart();
      });
    });
  }

  setCartValues(cart) {
    let tempTotal = 0;
    let itemTotal = 0;

    cart.map((item) => {
      tempTotal += item.price * item.amount;
      itemTotal += item.amount;
    });

    cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
    cartItems.innerText = itemTotal;
  }

  displayCartItems(item) {
    let div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = ` <img src=${item.image} alt=${item.title} />
            <div>
              <h4>${item.title}</h4>
              <h5>$${item.price}</h5>
              <span class="remove-item" data-id=${item.id}>remove</span>
            </div>
            <div>
              <i class="fas fa-chevron-up" data-id=${item.id}></i>
              <p class="item-amount">${item.amount}</p>
              <i class="fas fa-chevron-down" data-id=${item.id}></i>
            </div>`;
    cartContent.appendChild(div);
  }

  showCart() {
    cartOverlay.classList.add("transparentBcg");
    cartDOM.classList.add("showCart");
  }
  setupAPP() {
    cart = Storage.getCart();
    this.setCartValues(cart);
    this.populateCart();
    cartBtn.addEventListener("click", () => this.showCart());
    closeCartBtn.addEventListener("click", () => this.hideCart());
  }

  populateCart() {
    cart.forEach((item) => this.displayCartItems(item));
  }

  hideCart() {
    cartOverlay.classList.remove("transparentBcg");
    cartDOM.classList.remove("showCart");
  }

  cartLogic() {
    clearCartBtn.addEventListener("click", () => {
      this.clearCart();
    });

    // remove item
    cartContent.addEventListener("click", (e) => {
      if (e.target.classList.contains("remove-item")) {
        let item = e.target;
        let id = item.dataset.id;
        cartContent.removeChild(item.parentElement.parentElement);

        this.removeItem(id);
      } else if (e.target.classList.contains("fa-chevron-up")) {
        let addAmount = e.target;
        let id = addAmount.dataset.id;

        let tempItem = cart.find((item) => item.id === id);
        tempItem.amount = tempItem.amount + 1;
        Storage.saveCart(cart);
        this.setCartValues(cart);
        addAmount.nextElementSibling.innerText = tempItem.amount;
      } else if (e.target.classList.contains("fa-chevron-down")) {
        let subtractAmount = e.target;
        let id = subtractAmount.dataset.id;

        let tempItem = cart.find((item) => item.id === id);
        tempItem.amount = tempItem.amount - 1;
        if (tempItem.amount > 0) {
          Storage.saveCart(cart);
          this.setCartValues(cart);

          subtractAmount.previousElementSibling.innerText = tempItem.amount;
          console.log(cart);
        } else {
          this.removeItem(id);
          cartContent.removeChild(subtractAmount.parentElement.parentElement);
        }
      }
    });
  }

  clearCart() {
    let cartItems = cart.map((item) => item.id);
    cartItems.forEach((id) => this.removeItem(id));

    while (cartContent.children.length > 0) {
      cartContent.removeChild(cartContent.children[0]);
    }
    this.hideCart();
  }

  removeItem(id) {
    cart = cart.filter((item) => item.id !== id);
    this.setCartValues(cart);
    Storage.saveCart(cart);
    let button = this.getSingleButton(id);
    button.disabled = false;
    button.innerHTML = `<i class = "fas fa-shopping-cart"></i> add to bag`;
  }

  getSingleButton(id) {
    return buttonsDOM.find((button) => button.dataset.id === id);
  }
}

// for local storage
class Storage {
  static setLocalStorage(products) {
    localStorage.setItem("products", JSON.stringify(products));
  }
  static getProduct(id) {
    const products = JSON.parse(localStorage.getItem("products"));
    return products.find((product) => product.id === id);
  }

  static saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  static getCart() {
    return localStorage.getItem("cart")
      ? JSON.parse(localStorage.getItem("cart"))
      : [];
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const ui = new UI();
  const product = new Products();
  ui.setupAPP();
  product
    .getProducts()
    .then((products) => {
      ui.displayProducts(products);
      Storage.setLocalStorage(products);
    })
    .then(() => {
      ui.getBagButton();
      ui.cartLogic();
    });
});
