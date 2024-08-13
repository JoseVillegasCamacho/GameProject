document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  updateCartCount();
  initializeCountdowns();

  if (document.getElementById("cart-items")) {
    loadCart();
  }

  // Inicializar tooltips de Bootstrap
  var tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Agregar event listeners para los filtros
  const genreFilter = document.getElementById("genre-filter");
  const platformFilter = document.getElementById("platform-filter");
  const priceFilter = document.getElementById("price-filter");

  if (genreFilter && platformFilter && priceFilter) {
    genreFilter.addEventListener("change", applyFilters);
    platformFilter.addEventListener("change", applyFilters);
    priceFilter.addEventListener("change", applyFilters);
  }

  // Agregar event listeners para las categorías en el navbar
  const categoryLinks = document.querySelectorAll(".dropdown-item");
  categoryLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const category = e.target.textContent;
      window.location.href = `products.html?category=${encodeURIComponent(
        category
      )}`;
    });
  });

  // Cargar productos filtrados si hay una categoría en la URL
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get("category");
  if (category) {
    loadProducts({ category });
  }
});

function loadProducts(filters = {}) {
  fetch("data/products.json")
    .then((response) => response.json())
    .then((data) => {
      const productList = document.getElementById("product-list");
      if (productList) {
        productList.innerHTML = ""; // Limpiar la lista de productos
        let filteredProducts = data;

        // Aplicar filtros
        if (filters.category) {
          filteredProducts = filteredProducts.filter(
            (product) => product.genre === filters.category
          );
        }
        if (filters.genre && filters.genre !== "Género") {
          filteredProducts = filteredProducts.filter(
            (product) => product.genre === filters.genre
          );
        }
        if (filters.platform && filters.platform !== "Plataforma") {
          filteredProducts = filteredProducts.filter((product) =>
            product.platform.includes(filters.platform.toLowerCase())
          );
        }
        if (filters.price && filters.price !== "Precio") {
          const [min, max] = filters.price.split("-").map(Number);
          filteredProducts = filteredProducts.filter((product) => {
            if (max) {
              return product.price >= min && product.price <= max;
            } else {
              return product.price >= min;
            }
          });
        }

        filteredProducts.forEach((product) => {
          const productCard = createProductCard(product);
          productList.appendChild(productCard);
        });
      }
    });
}

function applyFilters() {
  const genre = document.getElementById("genre-filter").value;
  const platform = document.getElementById("platform-filter").value;
  const price = document.getElementById("price-filter").value;

  loadProducts({ genre, platform, price });
}

function createProductCard(product) {
  const productCard = document.createElement("div");
  productCard.className = "col-md-4 mb-4";
  productCard.innerHTML = `
      <div class="card game-card h-100">
          <img src="${product.image}" class="card-img-top" alt="${
    product.name
  }">
          <div class="card-body d-flex flex-column">
              <h5 class="card-title">${product.name}</h5>
              <p class="card-text flex-grow-1">${product.description}</p>
              <div class="d-flex justify-content-between align-items-center">
                  <span class="price">$${product.price.toFixed(2)}</span>
                  <button class="btn btn-primary add-to-cart" data-id="${
                    product.id
                  }">Añadir al carrito</button>
              </div>
          </div>
      </div>
  `;
  productCard
    .querySelector(".add-to-cart")
    .addEventListener("click", addToCart);
  return productCard;
}

function addToCart(event) {
  const id = parseInt(event.target.dataset.id);
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const productIndex = cart.findIndex((product) => product.id === id);

  if (productIndex === -1) {
    cart.push({ id: id, quantity: 1 });
  } else {
    cart[productIndex].quantity += 1;
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  showToast("Producto añadido al carrito");
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartCountElement = document.querySelector(".cart-count");
  if (cartCountElement) {
    cartCountElement.textContent = cartCount;
  }
}

function loadCart() {
  const cartItems = document.getElementById("cart-items");
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  if (cart.length === 0) {
    cartItems.innerHTML = "<p>Tu carrito está vacío.</p>";
    return;
  }

  fetch("data/products.json")
    .then((response) => response.json())
    .then((products) => {
      let total = 0;
      cartItems.innerHTML = "";

      cart.forEach((item) => {
        const product = products.find((p) => p.id === item.id);
        if (product) {
          const cartItem = createCartItem(product, item.quantity);
          cartItems.appendChild(cartItem);
          total += product.price * item.quantity;
        }
      });

      const orderSummary = createOrderSummary(total);
      cartItems.appendChild(orderSummary);
    });
}

function createCartItem(product, quantity) {
  const cartItem = document.createElement("div");
  cartItem.className = "cart-item mb-3";
  cartItem.innerHTML = `
      <div class="row align-items-center">
          <div class="col-md-2">
              <img src="${product.image}" alt="${
    product.name
  }" class="img-fluid">
          </div>
          <div class="col-md-4">
              <h5>${product.name}</h5>
          </div>
          <div class="col-md-2">
              <span class="price">$${product.price.toFixed(2)}</span>
          </div>
          <div class="col-md-2">
              <div class="input-group">
                  <button class="btn btn-outline-secondary decrease-quantity" type="button">-</button>
                  <input type="text" class="form-control text-center quantity-input" value="${quantity}" readonly>
                  <button class="btn btn-outline-secondary increase-quantity" type="button">+</button>
              </div>
          </div>
          <div class="col-md-2">
              <button class="btn btn-danger remove-item">Eliminar</button>
          </div>
      </div>
  `;

  cartItem
    .querySelector(".decrease-quantity")
    .addEventListener("click", () => updateQuantity(product.id, -1));
  cartItem
    .querySelector(".increase-quantity")
    .addEventListener("click", () => updateQuantity(product.id, 1));
  cartItem
    .querySelector(".remove-item")
    .addEventListener("click", () => removeItem(product.id));

  return cartItem;
}

function createOrderSummary(total) {
  const orderSummary = document.createElement("div");
  orderSummary.className = "order-summary mt-4";
  orderSummary.innerHTML = `
      <h4>Resumen del pedido</h4>
      <div class="d-flex justify-content-between">
          <span>Subtotal:</span>
          <span>$${total.toFixed(2)}</span>
      </div>
      <div class="d-flex justify-content-between">
          <span>Impuestos (10%):</span>
          <span>$${(total * 0.1).toFixed(2)}</span>
      </div>
      <div class="d-flex justify-content-between mt-2">
          <strong>Total:</strong>
          <strong>$${(total * 1.1).toFixed(2)}</strong>
      </div>
      <button class="btn btn-primary btn-block mt-3" id="proceedToPayment">Proceder al pago</button>
  `;

  orderSummary
    .querySelector("#proceedToPayment")
    .addEventListener("click", showOrderConfirmation);

  return orderSummary;
}

function showOrderConfirmation() {
  const confirmationModal = document.createElement("div");
  confirmationModal.className = "modal fade";
  confirmationModal.id = "orderConfirmationModal";
  confirmationModal.setAttribute("tabindex", "-1");
  confirmationModal.setAttribute(
    "aria-labelledby",
    "orderConfirmationModalLabel"
  );
  confirmationModal.setAttribute("aria-hidden", "true");

  confirmationModal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="orderConfirmationModalLabel">¡Pedido Confirmado!</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <p>Tu pedido ha sido realizado con éxito. El pago queda pendiente.</p>
          <p>Gracias por comprar en GameStore.</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Cerrar</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(confirmationModal);

  const modal = new bootstrap.Modal(confirmationModal);
  modal.show();
}

function updateQuantity(productId, change) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const productIndex = cart.findIndex((item) => item.id === productId);

  if (productIndex !== -1) {
    cart[productIndex].quantity += change;
    if (cart[productIndex].quantity <= 0) {
      cart.splice(productIndex, 1);
    }
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  loadCart();
  updateCartCount();
}

function removeItem(productId) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart = cart.filter((item) => item.id !== productId);
  localStorage.setItem("cart", JSON.stringify(cart));
  loadCart();
  updateCartCount();
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast position-fixed bottom-0 end-0 m-3";
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");
  toast.setAttribute("aria-atomic", "true");
  toast.innerHTML = `
      <div class="toast-header">
          <strong class="me-auto">GameStore</strong>
          <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">
          ${message}
      </div>
  `;
  document.body.appendChild(toast);
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();
}

function initializeCountdowns() {
  const countdownElements = document.querySelectorAll(".countdown");
  countdownElements.forEach((element) => {
    const targetDate = new Date(element.dataset.date).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      element.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      if (distance < 0) {
        clearInterval(interval);
        element.innerHTML = "¡Ya disponible!";
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
  });
}

// Inicializar el botón de soporte
document.getElementById("supportBtn").addEventListener("click", () => {
  alert("Función de chat en vivo no implementada en este ejemplo.");
});
