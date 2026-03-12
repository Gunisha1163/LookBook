// Dynamically load navbar.html into every page
fetch("/navbar.html")
  .then(response => response.text())
  .then(data => {
    document.getElementById("navbar-placeholder").innerHTML = data;
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, 'text/html');
    const scriptElement = doc.querySelector('script');
    if (scriptElement) {
      const newScript = document.createElement('script');
      newScript.textContent = scriptElement.textContent;
      document.body.appendChild(newScript);
    }
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) {
      menuToggle.addEventListener('click', function() {
        document.querySelector('.nav-links').classList.toggle('active');
      });
    }
    updateAllCartBadges();
  });

// Helper function to convert price string to number 
function parsePrice(priceString) {
    if (!priceString) return 0;
    return parseFloat(priceString.replace(/[₹,]/g, ''));
}

// Helper function to format number as price
function formatPrice(amount) {
    return '₹' + amount.toFixed(0);
}

// Calculate item total price
function calculateItemTotal(item) {
    const price = parsePrice(item.price);
    return price * item.quantity;
}

// Calculate cart totals
async function calculateCartTotals() {
    const cartItems = await getCartFromBackend();
    let subtotal = 0;
    let itemCount = 0;
    cartItems.forEach(item => {
        const itemTotal = calculateItemTotal(item);
        subtotal += itemTotal;
        itemCount += item.quantity;
    });
    // Calculate tax
    const taxRate = 0.02;
    const tax = subtotal * taxRate;
    const grandTotal = subtotal + tax;
    return {
        subtotal: subtotal,
        tax: tax,
        grandTotal: grandTotal,
        itemCount: itemCount
    };
}

// Add Item with Quantity
async function addToCart(item) {
    const result = await addToCartBackend(item);
    if (result) {
        await updateAllCartUI();
    }
}

// Update Quantity
async function updateQuantity(itemId, change) {
    const cart = await getCartFromBackend();
    const item = cart.find(i => i.id === itemId);
    if (item) {
        const newQuantity = item.quantity + change;
        await updateQuantityBackend(itemId, newQuantity);
        await updateAllCartUI();
    }
}

// Remove Item
async function removeItem(itemId) {
    await removeFromCartBackend(itemId);
    await updateAllCartUI();
}

// Render Cart Table with Quantity Controls and Totals
async function renderCartTable() {
    const items = await getCartFromBackend();
    const tableBody = document.getElementById("cart-table-body");    
    if (!tableBody) return;    
    tableBody.innerHTML = "";    
    if (items.length === 0) {
        const emptyRow = document.createElement("tr");
        emptyRow.innerHTML = `
            <td colspan="6" style="text-align: center; padding: 30px;">
                Your cart is empty
            </td>
        `;
        tableBody.appendChild(emptyRow);        
        const totalsSection = document.getElementById("cart-totals");
        if (totalsSection) {
            totalsSection.style.display = 'none';
        }
        return;
    }    
    const totalsSection = document.getElementById("cart-totals");
    if (totalsSection) {
        totalsSection.style.display = 'block';
    }    
    items.forEach(item => {
        const itemTotal = calculateItemTotal(item);
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><img src="${item.image}" alt="${item.name}" style="width:50px; height:50px; object-fit:cover;"></td>
            <td>${item.name}</td>
            <td>${item.price}</td>
            <td>
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
            </td>
            <td>${formatPrice(itemTotal)}</td>
            <td><button class="remove-btn" onclick="removeItem(${item.id})">Remove</button></td>
        `;
        tableBody.appendChild(row);
    });    
    updateCartTotalsDisplay();
}

// Update cart totals display
async function updateCartTotalsDisplay() {
    const totals = await calculateCartTotals();
    const subtotalElement = document.getElementById("cart-subtotal");
    const taxElement = document.getElementById("cart-tax");
    const grandTotalElement = document.getElementById("cart-grand-total");
    const itemCountElement = document.getElementById("cart-item-count");    
    if (subtotalElement) subtotalElement.textContent = formatPrice(totals.subtotal);
    if (taxElement) taxElement.textContent = formatPrice(totals.tax);
    if (grandTotalElement) grandTotalElement.textContent = formatPrice(totals.grandTotal);
    if (itemCountElement) itemCountElement.textContent = totals.itemCount + (totals.itemCount === 1 ? ' item' : ' items');
}

// More robust function to get price from item card
function getItemPrice(card) {
    let priceElement = card.querySelector('.price');    
    if (!priceElement) {
        const paragraphs = card.querySelectorAll('p');
        for (let p of paragraphs) {
            if (p.textContent.includes('₹')) {
                priceElement = p;
                p.classList.add('price');
                break;
            }
        }
    }    
    if (!priceElement) {
        const textNodes = card.querySelectorAll('*');
        for (let node of textNodes) {
            if (node.textContent && (node.textContent.includes('₹'))) {
                priceElement = node;
                break;
            }
        }
    }    
    return priceElement ? priceElement.textContent.trim() : '₹0';
}

// More robust function to get item name
function getItemName(card) {
    const nameElement = card.querySelector('h4');
    return nameElement ? nameElement.textContent.trim() : 'Unknown Item';
}

// More robust function to get item image
function getItemImage(card) {
    const imgElement = card.querySelector('img');
    return imgElement ? imgElement.src : '';
}

// Update cart buttons on outfit page to show quantity controls
async function updateCartButtons() {
    const cartItems = await getCartFromBackend();
    const itemCards = document.querySelectorAll('.item-card');    
    itemCards.forEach(card => {
        const itemName = getItemName(card);
        const itemPrice = getItemPrice(card);
        const itemImage = getItemImage(card);
        // Remove old buttons if they exist
        const oldButtons = card.querySelectorAll('button[onclick*="addToCart"], button[onclick*="addToWishlist"], .quantity-controls');
        oldButtons.forEach(button => button.remove());
        // Ensure we have item-actions container
        let cartButtonContainer = card.querySelector('.item-actions');
        if (!cartButtonContainer) {
            cartButtonContainer = document.createElement('div');
            cartButtonContainer.className = 'item-actions';
            // Find where to insert - after price, before any existing buttons
            const priceElement = card.querySelector('.price') || card.querySelector('p');
            if (priceElement) {
                priceElement.parentNode.insertBefore(cartButtonContainer, priceElement.nextSibling);
            } else {
                card.appendChild(cartButtonContainer);
            }
            // Add heart icon if not present
            if (!card.querySelector('.heart')) {
                const heart = document.createElement('span');
                heart.className = 'heart';
                heart.innerHTML = '&#10084;';
                cartButtonContainer.appendChild(heart);
            }
        }        
        const existingCartButton = cartButtonContainer.querySelector('.cart-btn, .quantity-controls');
        const existingItem = cartItems.find(item => item.name === itemName);        
        if (existingCartButton) {
            existingCartButton.remove();
        }        
        if (existingItem && existingItem.quantity > 0) {
            const quantityControls = document.createElement('div');
            quantityControls.className = 'quantity-controls';
            quantityControls.innerHTML = `
                <button class="quantity-btn" onclick="decreaseItemQuantity('${itemName.replace(/'/g, "\\'")}', '${itemPrice.replace(/'/g, "\\'")}', '${itemImage}')">-</button>
                <span class="quantity">${existingItem.quantity}</span>
                <button class="quantity-btn" onclick="increaseItemQuantity('${itemName.replace(/'/g, "\\'")}', '${itemPrice.replace(/'/g, "\\'")}', '${itemImage}')">+</button>
            `;
            const heartIcon = cartButtonContainer.querySelector('.heart');
            if (heartIcon) {
                cartButtonContainer.insertBefore(quantityControls, heartIcon);
            } else {
                cartButtonContainer.appendChild(quantityControls);
            }
        } else {
            const cartButton = document.createElement('button');
            cartButton.className = 'cart-btn';
            cartButton.textContent = 'Add to Cart';
            cartButton.onclick = function() {
                addToCart({
                    name: itemName,
                    price: itemPrice,
                    image: itemImage
                });
            };            
            const heartIcon = cartButtonContainer.querySelector('.heart');
            if (heartIcon) {
                cartButtonContainer.insertBefore(cartButton, heartIcon);
            } else {
                cartButtonContainer.appendChild(cartButton);
            }
        }
    });
}

// Helper functions for quantity controls
async function increaseItemQuantity(itemName, itemPrice, itemImage) {
    const cartItems = await getCartFromBackend();
    const existingItem = cartItems.find(item => item.name === itemName && item.price === itemPrice);
    if (existingItem) {
        await updateQuantityBackend(existingItem.id, existingItem.quantity + 1);
    } else {
        await addToCartBackend({
            name: itemName,
            price: itemPrice,
            image: itemImage
        });
    }
    await updateAllCartUI();
}

async function decreaseItemQuantity(itemName, itemPrice, itemImage) {
    const cartItems = await getCartFromBackend();
    const existingItem = cartItems.find(item => item.name === itemName && item.price === itemPrice);
    if (existingItem) {
        const newQuantity = existingItem.quantity - 1;
        if (newQuantity <= 0) {
            await removeFromCartBackend(existingItem.id);
        } else {
            await updateQuantityBackend(existingItem.id, newQuantity);
        }
    }
    await updateAllCartUI();
}

// Update all cart badges
async function updateAllCartBadges() {
    const cartItems = await getCartFromBackend();
    const count = cartItems.reduce((total, item) => total + item.quantity, 0);
    const badges = document.querySelectorAll(".cart-badge");
    // If navbar not loaded yet, retry after small delay
    if (badges.length === 0) {
        setTimeout(updateAllCartBadges, 100);
        return;
    }
    badges.forEach(badge => {
        badge.textContent = count;
    });
}

// Save cart totals to localStorage for other pages to use
function saveCartTotals() {
    const totals = calculateCartTotals();
    localStorage.setItem('cartTotals', JSON.stringify(totals));
}

// Get cart from backend
async function getCartFromBackend() {
    try {
        const response = await fetch('/cart');
        if (!response.ok) {
            throw new Error('Failed to fetch cart');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching cart:', error);
        return [];
    }
}

// Add item to cart (backend version)
async function addToCartBackend(item) {
    try {
        const response = await fetch('/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: item.name,
                price: item.price,
                image: item.image
            })
        });
        if (!response.ok) {
            throw new Error('Failed to add to cart');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error adding to cart:', error);
        return null;
    }
}

// Update quantity in backend
async function updateQuantityBackend(itemId, newQuantity) {
    try {
        if (newQuantity <= 0) {
            return await removeFromCartBackend(itemId);
        }
        const response = await fetch(`/cart/${itemId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                quantity: newQuantity
            })
        });
        if (!response.ok) {
            throw new Error("Failed to update quantity");
        }
        return await response.json();
    } catch (error) {
        console.error("Error updating quantity:", error);
        return null;
    }
}

// Remove from cart backend
async function removeFromCartBackend(itemId) {
    try {
        const response = await fetch(`/cart/${itemId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to remove from cart');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error removing from cart:', error);
        return null;
    }
}

// New function to update all cart UI
async function updateAllCartUI() {
    await renderCartTable();
    await updateAllCartBadges();
    await updateCartButtons();
    await updateCartTotalsDisplay();
}

// Render Wishlist Table
function renderWishlistTable() {
    const items = getItems(WISHLIST_KEY);
    const tableBody = document.getElementById("wishlist-table-body");    
    if (!tableBody) return;    
    tableBody.innerHTML = "";    
    if (items.length === 0) {
        const emptyRow = document.createElement("tr");
        emptyRow.innerHTML = `
            <td colspan="4" style="text-align: center; padding: 30px;">
                Your wishlist is empty
            </td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }    
    items.forEach((item, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><img src="${item.image}" alt="${item.name}" style="width:50px; height:50px; object-fit:cover;"></td>
            <td>${item.name}</td>
            <td>${item.price}</td>
            <td><button class="remove-btn" onclick="removeItem('${WISHLIST_KEY}', ${index})">Remove</button></td>
        `;
        tableBody.appendChild(row);
    });
}

async function addToWishlistBackend(item) {
    try {
        const response = await fetch('/wishlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: item.name,
                price: item.price,
                image: item.image
            })
        });
        if (!response.ok) {
            throw new Error('Failed to add to wishlist');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        return null;
    }
}

async function removeFromWishlistBackend(id) {
    try {
        const response = await fetch(`/wishlist/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to remove from wishlist');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        return null;
    }
}

async function getWishlistFromBackend() {
    try {
        const response = await fetch('/wishlist');
        if (!response.ok) {
            throw new Error('Failed to fetch wishlist');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        return [];
    }
}

//Toggle Heart
async function toggleHeart(event, item) {
    const el = event.currentTarget;
    console.log('Toggling heart for item:', item);
    try {
        if (el.classList.contains("active")) {
            // If heart is active, remove from wishlist
            console.log('Removing from wishlist');
            // First get all wishlist items to find the ID
            const response = await fetch('/wishlist');
            const wishlist = await response.json();
            const existingItem = wishlist.find(wishlistItem => 
                wishlistItem.name === item.name && wishlistItem.price === item.price
            );
            if (existingItem) {
                const deleteResponse = await fetch(`/wishlist/${existingItem.id}`, {
                    method: 'DELETE',
                });
                if (deleteResponse.ok) {
                    el.classList.remove("active");
                    console.log('Item removed from wishlist');
                }
            }
        } else {
            // If heart is inactive, add to wishlist
            console.log('Adding to wishlist');
            const addResponse = await fetch('/wishlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: item.name,
                    price: item.price,
                    image: item.image
                })
            });
            if (addResponse.ok) {
                el.classList.add("active");
                console.log('Item added to wishlist');
            }
        }
    } catch (error) {
        console.error('Error in toggleHeart:', error);
        alert('Error updating wishlist. Please try again.');
    }
}

//Initialize Hearts
async function initializeHearts() {
    console.log('Initializing hearts...');
    try {
        // Fetch wishlist from backend
        const response = await fetch('/wishlist');
        const wishlist = await response.json();
        console.log('Wishlist from backend:', wishlist);
        const hearts = document.querySelectorAll('.heart');    
        console.log('Found hearts:', hearts.length);
        hearts.forEach(heart => {
            const itemCard = heart.closest('.item-card');
            if (!itemCard) return;
            const itemName = getItemName(itemCard);
            const itemPrice = getItemPrice(itemCard);
            const itemImage = getItemImage(itemCard);
            console.log('Item details:', { itemName, itemPrice, itemImage });
            const isInWishlist = wishlist.some(item => 
                item.name === itemName && item.price === itemPrice
            );
            if (isInWishlist) {
                heart.classList.add('active');
                console.log('Heart activated for:', itemName);
            } else {
                heart.classList.remove('active');
            }
            const newHeart = heart.cloneNode(true);
            heart.parentNode.replaceChild(newHeart, heart);
            newHeart.addEventListener('click', function(event) {
                toggleHeart(event, {
                    name: itemName,
                    price: itemPrice,
                    image: itemImage
                });
            });
        });
    } catch (error) {
        console.error('Error initializing hearts:', error);
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    await updateAllCartBadges();    
    if (document.getElementById('cart-table-body')) {
        await renderCartTable();
    }    
    if (document.getElementById('wishlist-table-body')) {
        renderWishlistTable(); // This one stays the same
    }    
    if (document.querySelector('.items-grid')) {
        await initializeHearts();
        await updateCartButtons();
    }
});