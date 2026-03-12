const express = require("express");
const path = require("path");

const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const cartRoutes = require("./routes/cartRoutes");

const app = express();
app.use(express.json());

// Routes
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/cart", cartRoutes);

// Serve static files
app.use(express.static(path.join(__dirname, "../Front-end")));
app.use("/css", express.static(path.join(__dirname, "../Front-end/css")));
app.use("/js", express.static(path.join(__dirname, "../Front-end/js")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../Front-end/homepage.html"));
});

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, "../Front-end/404.html"));
});

app.listen(3000, () => {
  console.log(`Server running on port 3000`);

});

