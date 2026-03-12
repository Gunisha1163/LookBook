const express = require("express");
const router = express.Router();

const {
  getWishlist,
  addToWishlist,
  deleteItem
} = require("../controllers/wishlistController");

router.get("/", getWishlist);
router.post("/", addToWishlist);
router.delete("/:id", deleteItem);

module.exports = router;
