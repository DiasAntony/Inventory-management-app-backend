const express = require("express");
const router = express.Router();

const {
  createProduct,
  updateProduct,
  getProduct,
  getProducts,
  deleteProduct,
} = require("../controllers/poduct");
const protect = require("../middleware/auth");
const { upload } = require("../utils/uploadFile");

// if we want multiple file array instead of single

router.post("/", protect, upload.single("image"), createProduct);
router.patch("/:productId", protect, upload.single("image"), updateProduct);
router.get("/", protect, getProducts);
router.get("/:productId", protect, getProduct);
router.delete("/:productId", protect, deleteProduct);

module.exports = router;
