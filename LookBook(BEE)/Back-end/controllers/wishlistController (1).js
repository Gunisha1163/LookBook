const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../data/wishlist.json");

// GET wishlist
const getWishlist = (req, res) => {
  const data = fs.readFileSync(filePath);
  const wishlist = JSON.parse(data);
  res.json(wishlist);
};

// ADD item
const addToWishlist = (req, res) => {
  const { name, price, image } = req.body;
  const data = fs.readFileSync(filePath);
  const wishlist = JSON.parse(data);
  const item = {
    id: Date.now(),
    name,
    price,
    image
  };
  wishlist.push(item);
  fs.writeFileSync(filePath, JSON.stringify(wishlist, null, 2));
  res.json(item);
};

// DELETE item
const deleteItem = (req, res) => {
  const id = parseInt(req.params.id);
  const data = fs.readFileSync(filePath);
  let wishlist = JSON.parse(data);
  wishlist = wishlist.filter(item => item.id !== id);
  fs.writeFileSync(filePath, JSON.stringify(wishlist, null, 2));
  res.json({ message: "Item removed" });
};

module.exports = {
  getWishlist,
  addToWishlist,
  deleteItem
};