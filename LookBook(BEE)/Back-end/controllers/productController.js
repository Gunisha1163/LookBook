const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../data/products.json");

exports.getProducts = (req, res) => {
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ message: "Error reading products" });
    }
    res.json(JSON.parse(data));
  });
};

exports.getProductById = (req, res) => {
  const id = parseInt(req.params.id);
  fs.readFile(filePath, "utf8", (err, data) => {
    const products = JSON.parse(data);
    const product = products.find(p => p.id === id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  });
};

exports.addProduct = (req, res) => {
  const { category, title, mainImage, items } = req.body;
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ message: "Error reading products" });
    }
    const products = JSON.parse(data);
    if (!products[category]) {
      return res.status(400).json({ message: "Invalid category" });
    }
    const newId = products[category].length > 0 ? products[category][products[category].length - 1].id + 1 : 1;
    const newProduct = {
      id: newId,
      title,
      mainImage,
      items
    };
    products[category].push(newProduct);
    fs.writeFile(filePath, JSON.stringify(products, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ message: "Error saving product" });
      }
      res.status(201).json({
        message: "Product added successfully",
        product: newProduct
      });
    });
  });
};