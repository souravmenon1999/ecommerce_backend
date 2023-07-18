import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import UserRagister from "./mongoDB/ragister.js";
import AddProduct from "./mongoDB/addProduct.js";
import CheckOutProduct from "./mongoDB/checkOutProduct.js";
import AddCartProduct from "./mongoDB/addCartProduct.js";
import  verifyToken  from "./jwtToken/verifyJwtToken.js";


dotenv.config();
const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected!"));

app.get("/", async (req, res) => {
  const filters = {};

  if (req.query.headPhoneType) {
    filters.productType = req.query.headPhoneType;
  }

  if (req.query.companyType) {
    filters.productBrand = req.query.companyType;
  }
  if (req.query.headPhoneColor) {
    filters.productColor = req.query.headPhoneColor;
  }
  if (req.query.inputSearch) {
    filters.productName = req.query.inputSearch;
    filters.productName = new RegExp(`^${req.query.inputSearch}`, "i");
  }
  if (req.query.headPhonePrice) {
    const priceRange = req.query.headPhonePrice.split("-");
    filters.productPrice = {
      $gte: priceRange[0],
      $lte: priceRange[1],
    };
  }
  const ProductDetails = await AddProduct.find(filters);
  res.status(200).send(ProductDetails);
});

app.post("/register", async (req, res) => {
  try {
    const { name, email, number, password } = req.body;
    const oldUser = await UserRagister.findOne({ email });

    if (name && email && number && password && !oldUser) {
      encryptedPassword = await bcrypt.hash(password, 10);

      const userRagister = await UserRagister.create({
        name,
        email: email.toLowerCase(),
        number,
        password: encryptedPassword,
      });

      const token = jwt.sign(
        { userRagister_id: userRagister._id, email },
        process.env.TOKEN_KEY
      );
      userRagister.token = token;

      res.status(201).json(userRagister);
    } else if (!(name && email && number && password)) {
      res.status(400).send("All input Field is required");
    } else if (oldUser) {
      return res.status(409).send("User Already Exist. Please Login");
    }
  } catch (error) {
    console.log(error);
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!(email && password)) {
      res.status(400).send("All input is required");
    }
    const user = await UserRagister.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        { user_id: user._id, email },
        process.env.TOKEN_KEY
      );

      user.token = token;

      res.status(200).json(user);
    }
    res.status(400).send("Invalid Credentials");
  } catch (error) {
    console.log(error);
  }
});

app.post("/addProduct", verifyToken, async (req, res) => {
  try {
    const {
      productImage,
      productDetailName,
      productName,
      productType,
      productPrice,
      productColor,
      productAbout,
      productStock,
      productBrand,
    } = req.body;

    const oldSameProduct = await AddProduct.findOne({ productAbout });
    if (
      productImage &&
      productDetailName &&
      productName &&
      productPrice &&
      productColor &&
      productAbout &&
      productAbout &&
      productType &&
      productStock &&
      productBrand &&
      !oldSameProduct
    ) {
      const addProduct = await AddProduct.create({
        productImage,
        productName,
        productDetailName,
        productPrice,
        productAbout,
        productColor,
        productStock,
        productBrand,
        productType,
      });
      res.status(201).json(addProduct);
    } else if (
      !(
        productImage &&
        productName &&
        productDetailName &&
        productPrice &&
        productColor &&
        productAbout &&
        productStock &&
        productBrand &&
        productType
      )
    ) {
      res.status(400).send("All input Field is required");
    } else if (oldSameProduct) {
      return res.status(409).send("Product Already Exist. Please Login");
    }
  } catch (error) {
    console.log(error);
  }
});

app.get("/productdetails/:id", async (req, res) => {
  try {
    const addProduct = await AddProduct.findById(req.params.id);
    res.status(200).json(addProduct);
  } catch (err) {
    console.error("Error infd Job Post:", err.message);
  }
});

app.post("/getCartProduct", async function (req, res) {
  const email = req.body.email;
  const AlreadyAddToCartProductId = await AddCartProduct.findOne({
    id: { $elemMatch: { cartId: req.body.AddToCartproductId } },
  });

  const AlreadyAddToCartProductEmail = await AddCartProduct.findOne({
    email,
  });

  const AlreadyAddToCartProduct = await AddCartProduct.findOne({
    email: req.body.email,
    id: { $elemMatch: { cartId: req.body.AddToCartproductId } },
  });

  if (req.body.cartUpdateId && req.body.productQuantity && req.body.userEmail) {
    try {
      const cartItem = await AddCartProduct.findOneAndUpdate(
        {
          email: req.body.userEmail,
          "id.cartId": req.body.cartUpdateId,
        },
        { $set: { "id.$.productQuantity": req.body.productQuantity } },
        { new: true }
      );

      if (cartItem) {
        res.status(200).json("Cart item updated successfully");
      } else {
        res.status(404).json("Cart item not found");
      }
    } catch (error) {
    
      res.status(500).json("Server error");
    }
  } else if (AlreadyAddToCartProduct) {
    res.status(200).json("Product already added in Your Cart");
  } else if (
    AlreadyAddToCartProductEmail !== null &&
    AlreadyAddToCartProductId !== req.body.AddToCartproductId
  ) {
    AddCartProduct.updateOne(
      { email: req.body.email },
      {
        $push: {
          id: {
            cartId: req.body.AddToCartproductId,
            productQuantity: 1,
          },
        },
      },
      { upsert: true }
    )
      .then((result) => {})
      .catch((error) => {
        console.log(error);
      });
    res.status(200).json("Product added Successfully");
  } else if (
    AlreadyAddToCartProductEmail === null &&
    req.body.AddToCartproductId
  ) {
    await AddCartProduct.create({
      email: req.body.email,
      id: [{ cartId: req.body.AddToCartproductId, productQuantity: 1 }],
    });
    res.status(200).json("Product added Successfully");
  }
});
app.get("/getCartProduct", async function (req, res) {
  const email = req.query.email;
  const cartItem = await AddCartProduct.find({ email });
  res.status(200).json(cartItem);
});
app.post("/removeCartProduct", async function (req, res) {
  try {
    if (req.body.productId && req.body.email) {
      await AddCartProduct.updateOne(
        { email: req.body.email },
        { $pull: { id: { cartId: req.body.productId } } }
      );
      res.status(200).json("Card Item deleted successfully");
    } else if (req.body.email) {
      await AddCartProduct.findOneAndDelete({ email: req.body.email });
      res.status(200).json("All Cart Items Deleted Successfully");
    }
  } catch (error) {
    console.log(error);
    res.status(500).json("Server Error");
  }
});
app.post("/checkOutProduct", async function (req, res) {
  const alreadyCheckOutProductEmail = await CheckOutProduct.findOne({
    checkOutProductEmail: req.body.checkOutProductEmail,
  });
  const forCheckOutPageChaker = await CheckOutProduct.findOne({
    checkOutProductEmail: req.body.forCheckOutPageChaker,
  });

  try {
    if (alreadyCheckOutProductEmail && req.body.checkOutProductId) {
      await CheckOutProduct.updateOne(
        { checkOutProductEmail: req.body.checkOutProductEmail },
        {
          $set: {
            checkOutProductId: req.body.checkOutProductId,
            checkOutPageChaker: true,
          },
        }
      );
      console.log("update chala");
      res.status(200).json("This Product has Added  in Your CheckOutList");
    } else if (
      alreadyCheckOutProductEmail === null &&
      req.body.checkOutProductEmail
    ) {
      console.log(2);
      await CheckOutProduct.create({
        checkOutProductId: req.body.checkOutProductId,
        checkOutProductEmail: req.body.checkOutProductEmail,
        checkOutPageChaker: true,
      });
      res.status(200).json("This Product has Added  in Your CheckOutList");
    } else if (forCheckOutPageChaker) {
      console.log(1);
      await CheckOutProduct.updateOne(
        { checkOutProductEmail: req.body.forCheckOutPageChaker },
        {
          $set: {
            checkOutPageChaker: false,
          },
        }
      );
      const findEmail = await CheckOutProduct.findOne({
        checkOutProductEmail: req.body.forCheckOutPageChaker,
      });
      res.status(200).json("False");

      console.log(false);
      console.log(findEmail);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json("Server Error");
  }
});
app.get("/checkOutProduct", async function (req, res) {
  const checkOutProduct = await CheckOutProduct.find();
  res.status(200).json(checkOutProduct);
});


export default app;
