const asyncHandler = require("express-async-handler");
const Product = require("../models/product");
const { fileSizeFormatter } = require("../utils/uploadFile");
const cloudinary = require("cloudinary").v2;

// create the products
exports.createProduct = asyncHandler(async (req, res) => {
  const { name, sku, category, quantity, price, description } = req.body;

  //   Validation
  if (!name || !category || !quantity || !price || !description) {
    res.status(400);
    throw new Error("Please fill in all fields");
  }

  // Handle Image upload
  let fileData = {};
  if (req.file) {
    // Save image to cloudinary
    let uploadedFile;

    cloudinary.config({
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.CLOUD_API_KEY,
      api_secret: process.env.CLOUD_API_SECRET,
    });

    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        folder: "Inventory App",
        resource_type: "image",
      });
    } catch (error) {
      res.status(500);
      throw new Error("Image could not be uploaded");
    }

    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }

  // Create Product
  const product = await Product.create({
    // req.user._id from middleware here we use id instead of _id
    user: req.user.id,
    name,
    sku,
    category,
    quantity,
    price,
    description,
    image: fileData,
  });

  res.status(201).json(product);
});

// Get all Products
exports.getProducts = asyncHandler(async (req, res) => {
  // -createAt brings revers order we want leatest product(in db stored data in order format)
  // req.user._id why becouse we want just a current user created products dont want every user products.... not a e-commerce
  const products = await Product.find({ user: req.user._id }).sort(
    "-createdAt"
  );
  res.status(200).json(products);
});

// Get single product
exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);
  // if product doesnt exist
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  // Match product to its user
  // tostring convert to normal json=>normal
  // below line check if the product really the current user product or not!!
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("Its not current User product");
  }
  res.status(200).json(product);
});

// Delete Product
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);
  // if product doesnt exist
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  // Match product to its user
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error(" Its not User product");
  }
  await product.deleteOne();

  res.status(200).json({ message: "Product deleted." });
});

// Update Product
exports.updateProduct = asyncHandler(async (req, res) => {
  const { name, category, quantity, price, description } = req.body;
  const { productId } = req.params;

  const product = await Product.findById(productId);

  // if product doesnt exist
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  // Match product to its user
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("its not User product!!");
  }

  // Handle Image upload
  let fileData = {};
  if (req.file) {
    // Save image to cloudinary
    let uploadedFile;
    cloudinary.config({
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.CLOUD_API_KEY,
      api_secret: process.env.CLOUD_API_SECRET,
    });
    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        folder: "Inventory App",
        resource_type: "image",
      });
    } catch (error) {
      res.status(500);
      throw new Error("Image could not be uploaded");
    }

    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }

  // Update Product
  const updatedProduct = await Product.findByIdAndUpdate(
    { _id: productId },
    {
      name,
      category,
      quantity,
      price,
      description,
      image: Object.keys(fileData).length === 0 ? product?.image : fileData,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json(updatedProduct);
});
