const fs = require("fs");
const path = require("path");

const cartPath = path.join(__dirname, "../data/cart.json");

// Get all cart items
exports.getCart = (req, res) => {
    fs.readFile(cartPath, "utf8", (err, data) => {
        if (err) {
            return res.status(500).json({ message: "Error reading cart" });
        }
        const cart = JSON.parse(data || "[]");
        res.json(cart);
    });
};

// Add item to cart
exports.addToCart = (req, res) => {
    const newItem = req.body;
    fs.readFile(cartPath, "utf8", (err, data) => {
        let cart = [];
        if (!err && data) {
            cart = JSON.parse(data);
        }
        // check if item already exists
        const existingItem = cart.find(
            item => item.name === newItem.name && item.price === newItem.price
        );
        if (existingItem) {
            // increase quantity
            existingItem.quantity = (existingItem.quantity || 1) + 1;
        } else {
            // add new item
            newItem.id = Date.now();
            newItem.quantity = 1;
            cart.push(newItem);
        }
        fs.writeFile(cartPath, JSON.stringify(cart, null, 2), err => {
            if (err) {
                return res.status(500).json({ message: "Error saving cart item" });
            }
            res.json({ message: "Cart updated", cart });
        });
    });
};

// Remove item
exports.removeFromCart = (req, res) => {
    const id = parseInt(req.params.id);
    fs.readFile(cartPath, "utf8", (err, data) => {
        let cart = JSON.parse(data || "[]");
        cart = cart.filter(item => item.id !== id);
        fs.writeFile(cartPath, JSON.stringify(cart, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ message: "Error removing item" });
            }
            res.json({ message: "Item removed" });
        });
    });
};

// Clear entire cart
exports.clearCart = (req, res) => {
    fs.writeFile(cartPath, JSON.stringify([], null, 2), (err) => {
        if (err) {
            return res.status(500).json({ message: "Error clearing cart" });
        }
        res.json({ message: "Cart cleared" });
    });
};

// Update item quantity
exports.updateQuantity = (req, res) => {
    const id = parseInt(req.params.id);
    const { quantity } = req.body;
    fs.readFile(cartPath, "utf8", (err, data) => {
        if (err) {
            return res.status(500).json({ message: "Error reading cart" });
        }
        let cart = JSON.parse(data || "[]");
        const item = cart.find(i => i.id === id);
        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }
        item.quantity = quantity;
        fs.writeFile(cartPath, JSON.stringify(cart, null, 2), err => {
            if (err) {
                return res.status(500).json({ message: "Error updating quantity" });
            }
            res.json({ message: "Quantity updated", cart });
        });
    });
};