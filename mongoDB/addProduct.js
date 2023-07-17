import mongoose from "mongoose";

const addProductSchema = new mongoose.Schema({
  productImage: { type: Array },
  productDetailName: { type: String },
  productName: { type: String },
  productPrice: { type: String },
  productColor: { type: String },
  productAbout: { type: String },
  productStock: { type: Boolean },
  productBrand: { type: String },
  productType: { type: String },
});

const AddProduct = mongoose.model("addProduct", addProductSchema);

export default AddProduct;
