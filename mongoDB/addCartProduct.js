import mongoose from "mongoose";

const cartId = new mongoose.Schema({
  cartId: { type: String },
  productQuantity: { type: Number },
});

const addCartProductSchema = new mongoose.Schema({
  email: { type: String },
  id: [cartId],
});

const AddCartProduct = mongoose.model("addCartProduct", addCartProductSchema);

export default AddCartProduct;
