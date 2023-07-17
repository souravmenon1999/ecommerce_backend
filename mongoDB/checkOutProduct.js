import mongoose from "mongoose";

const checkOutProductSchema = new mongoose.Schema({
  checkOutProductId: { type: String },
  checkOutProductEmail: { type: String },
  checkOutPageChaker: { type: Boolean },
});

const CheckOutProduct = mongoose.model("checkOutProduct", checkOutProductSchema);

export default CheckOutProduct;
