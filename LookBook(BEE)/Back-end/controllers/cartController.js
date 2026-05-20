const Cart = require("../models/cart");

// GET user's cart
exports.getCart = async (req, res) => {
  const userId = req.user.id;
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  res.json(cart.items);
};

// ADD item
exports.addToCart = async (req, res) => {
  const userId = req.user.id;
  const { name, price, image } = req.body;
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  const existingItem = cart.items.find(
    item => item.name === name && item.price === price
  );
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.items.push({ name, price, image, quantity: 1 });
  }
  await cart.save();
  res.json(cart.items);
};

// UPDATE quantity
exports.updateQuantity = async (req, res) => {
  const userId = req.user.id;
  const { quantity } = req.body;
  const cart = await Cart.findOne({ user: userId });
  const item = cart.items.id(req.params.id);
  if (!item) return res.status(404).json({ message: "Item not found" });
  item.quantity = quantity;
  await cart.save();
  res.json(cart.items);
};

// DELETE item
exports.removeFromCart = async (req, res) => {
  const userId = req.user.id;
  const cart = await Cart.findOne({ user: userId });
  cart.items = cart.items.filter(item => item._id != req.params.id);
  await cart.save();
  res.json(cart.items);
};
