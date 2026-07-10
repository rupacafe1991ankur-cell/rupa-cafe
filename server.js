
require("dotenv").config();

const cors = require("cors");
// const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcrypt");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { SitemapStream, streamToPromise } = require("sitemap");
const express = require("express");
const helmet = require("helmet");
const multer = require("multer");
const { CloudinaryStorage } =
require("multer-storage-cloudinary");

const cloudinary =
require("cloudinary").v2;
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const SibApiV3Sdk =
require("sib-api-v3-sdk");
const defaultClient =
SibApiV3Sdk.ApiClient.instance;

defaultClient.authentications["api-key"].apiKey =
process.env.BREVO_API_KEY;

const senderEmail =
process.env.SENDER_EMAIL;

const otpStore = {};
const verifiedOtpUsers = {};
// =======================================
// MongoDB Disabled
// Using Supabase Instead
// =======================================

// const mongoose = require("mongoose");

// mongoose.connect(process.env.MONGODB_URI)
// .then(() => {
//     console.log("✅ MongoDB Connected");
// })
// .catch((err) => {
//     console.error("❌ MongoDB Error:", err);
// });

const supabase = require("./config/supabase");

console.log("✅ Supabase Loaded");const app = express();
app.use(
helmet({
contentSecurityPolicy:false
})
);
const PORT =
process.env.PORT || 3000;
const razorpay = new Razorpay({

key_id:
process.env.RAZORPAY_KEY_ID,

key_secret:
process.env.RAZORPAY_KEY_SECRET

});
app.use(express.json());
const loginLimiter = rateLimit({
windowMs: 15 * 60 * 1000,
max: 10,
message: {
success: false,
message: "Too many login attempts. Try again later."
}
});
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/", express.static(path.join(__dirname, "public")));

function adminAuth(req,res,next){

const token = req.headers["x-admin-key"];

if(token !== process.env.ADMIN_KEY){

return res.status(401).json({
success:false,
message:"Unauthorized"
});

}

next();

}
app.use("/admin", express.static(path.join(__dirname, "admin")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const menuFile = path.join(__dirname, "data", "menu.json");
const siteFile = path.join(__dirname, "data", "site.json");
const reviewsFile = path.join(__dirname, "data", "reviews.json");
const couponsFile = path.join(__dirname, "data", "coupons.json");

function readJSON(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    return fallback;
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}


const fileFilter = (req,file,cb)=>{

const allowedTypes = [

"image/jpeg",
"image/jpg",
"image/png",
"image/webp"

];

if(
allowedTypes.includes(
file.mimetype
)
){

cb(null,true);

}else{

cb(
new Error(
"Only JPG, PNG and WEBP images are allowed"
),
false
);

}

};

cloudinary.config({
cloud_name:
process.env.CLOUDINARY_CLOUD_NAME,

api_key:
process.env.CLOUDINARY_API_KEY,

api_secret:
process.env.CLOUDINARY_API_SECRET
});

const storage =
new CloudinaryStorage({

cloudinary,

params: {

folder: "rupa-cafe",

allowed_formats: [
"jpg",
"jpeg",
"png",
"webp"
]

}

});

const upload = multer({

storage,

fileFilter,

limits:{
fileSize:
5 * 1024 * 1024
}

});
app.post(
"/api/upload-hero",
adminAuth,
upload.single("image"),
async (req,res)=>{

if(!req.file){

return res.status(400).json({
success:false
});

}

res.json({
success:true,
url:req.file.path
});

});
// Site settings
app.get("/api/site", async (req,res)=>{

const { data,error } =
await supabase
.from("site_settings")
.select("*")
.eq("id",1)
.single();

if(error){
return res.json({});
}

res.json(data.data || {});

});

app.put(
"/api/site",
adminAuth,
async (req,res)=>{

const { error } =
await supabase
.from("site_settings")
.update({
data:req.body
})
.eq("id",1);

if(error){

return res.json({
success:false
});

}

res.json({
success:true
});

});

// ================= HERO SLIDES =================

// Get Hero Slides

app.get("/api/hero-slides", async (req, res) => {

  try {

    const { data, error } = await supabase
      .from("hero_slides")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {

      console.log("Hero Slides Error:", error);

      return res.status(500).json({
        success: false,
        message: error.message
      });

    }

    res.json({
      success: true,
      data: data || []
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

});

// Menu APIs
app.get("/api/menu", async (req,res)=>{

const { data,error } =
await supabase
.from("menu")
.select("*")
.order("id");

if(error){
return res.json([]);
}

res.json(data || []);

});

app.post("/api/menu", adminAuth,upload.single("image"), async(req, res) => {
  
  const item = {
  id: Date.now(),

  name: req.body.name || "",

  category: req.body.category || "",

  price: Number(req.body.price) || 0,

  desc: req.body.desc || "",

  available:
  req.body.available === "true" ||
  req.body.available === true,

  popular:
  req.body.popular === "true",

  bestSeller:
  req.body.bestSeller === "true",

  image:
req.file
? req.file.path
: ""
};
  const { error } =
await supabase
.from("menu")
.insert({
id:item.id,
name:item.name,
category:item.category,
price:item.price,
description:item.desc,
available:item.available,
popular:item.popular,
best_seller:item.bestSeller,
image:item.image
});

if(error){
console.log("MENU ERROR:", error);

return res.json({
success:false,
message:error.message,
error
});
}

res.json({
success:true,
item
});

});

app.put("/api/menu/:id", adminAuth, upload.single("image"), async (req,res)=>{

const updateData = {
name:req.body.name,
category:req.body.category,
price:Number(req.body.price),
description:req.body.desc,
available:req.body.available === "true",
popular:req.body.popular === "true",
best_seller:req.body.bestSeller === "true"
};

if(req.file){

updateData.image =
req.file.path;

}
const { error } =
await supabase
.from("menu")
.update(updateData)
.eq("id", Number(req.params.id));

if(error){

return res.json({
success:false,
message:error.message
});

}

res.json({
success:true
});

});

app.put("/api/menu/:id/availability", adminAuth, async (req,res)=>{

const { error } =
await supabase
.from("menu")
.update({
available:
req.body.available === true ||
req.body.available === "true"
})
.eq("id", Number(req.params.id));

if(error){

return res.json({
success:false
});

}

res.json({
success:true
});

});

app.delete("/api/menu/:id", adminAuth, async (req, res) => {

  try {

    const { error } = await supabase
      .from("menu")
      .delete()
      .eq("id", Number(req.params.id));

    if (error) {
      console.log("DELETE MENU ERROR:", error);

      return res.status(500).json({
        success: false,
        message: error.message
      });
    }

    return res.json({
      success: true
    });

  } catch (err) {

    console.log(err);

    return res.status(500).json({
      success: false,
      message: err.message
    });

  }

});

// Orders APIs
app.post("/api/order", async (req, res) => {
  const items = req.body.items || [];

const { data: menu, error: menuError } =
await supabase
.from("menu")
.select("*");

if(menuError){

return res.status(500).json({
success:false,
message:"Menu load failed"
});

}
  const site =
readJSON(siteFile,{});

if(

req.body.orderType === "delivery"

&&

site.deliveryEnabled === false

){

return res.status(400).json({

success:false,

message:
"Home Delivery is currently unavailable"

});

}

    
  let calculatedTotal = 0;

for(const cartItem of items){

const originalItem = menu.find(
m => Number(m.id) === Number(cartItem.id)
);

if(!originalItem){

return res.status(400).json({
success:false,
message:"Invalid food item"
});

}

const qty =
Number(cartItem.qty) || 1;

calculatedTotal +=
Number(originalItem.price) * qty;

}
const coupons =
readJSON(couponsFile, []);

let couponDiscount = 0;
let appliedCoupon = "";

if(req.body.coupon){

const coupon =
coupons.find(c =>

c.code ===
String(req.body.coupon)
.toUpperCase()

&&

c.active === true
);

if(coupon){

if(
calculatedTotal >=
Number(coupon.minOrder || 0)
){

couponDiscount =

Math.floor(

calculatedTotal *

(Number(coupon.discount || 0) / 100)

);

appliedCoupon =
coupon.code;

}

}

}
// Payment validation

if (
req.body.orderType === "delivery"
&&
req.body.paymentMethod !== "cod"
){

return res.status(400).json({
success:false,
message:
"Delivery orders must use Cash On Delivery."
});

}

if (
req.body.orderType === "takeaway"
&&
req.body.paymentMethod !== "counter"
){

return res.status(400).json({
success:false,
message:
"Take Away orders must use Pay At Counter."
});

}
if (
req.body.orderType === "dinein"
&&
req.body.paymentMethod !== "counter"
){

return res.status(400).json({
success:false,
message:
"Dine In orders must use Pay At Counter."
});

}
  const order = {
id: Date.now(),

tableNumber:
req.body.tableNumber || "",

customer:
req.body.customer || "",

phone:
req.body.phone || "",

address:
req.body.address || "",

orderType:
req.body.orderType || "dinein",

landmark:
req.body.landmark || "",

latitude:
req.body.latitude || "",

longitude:
req.body.longitude || "",

deliveryCharge:
Number(req.body.deliveryCharge) || 0,

items,

total:
calculatedTotal -
couponDiscount +
(Number(req.body.deliveryCharge) || 0),

coupon:
appliedCoupon,

couponDiscount:
couponDiscount,
loyaltyDiscount:
Number(
req.body.loyaltyDiscount || 0
),

paymentMethod:
req.body.paymentMethod || "online",

paymentStatus:
req.body.paymentMethod === "counter"
? "Pay At Counter"
: "Pending",

paymentId: "",

status:
req.body.status || "Pending",

time:
new Date().toLocaleString()
};
  const unavailableItem = items.find(cartItem => {
    const original = menu.find(m => m.id === cartItem.id);
    return original && original.available === false;
  });

  if (unavailableItem) {
    return res.status(400).json({
      success: false,
      message: unavailableItem.name + " is currently not available."
    });
  }

  const { error: orderInsertError } =
await supabase
.from("orders")
.insert({
id: order.id,
table_number: order.tableNumber,
customer: order.customer,
phone: order.phone,
address: order.address,
order_type: order.orderType,
landmark: order.landmark,
latitude: String(order.latitude),
longitude: String(order.longitude),
delivery_charge: order.deliveryCharge,
items: order.items,
total: order.total,
coupon: order.coupon,
coupon_discount: order.couponDiscount,
loyalty_discount:
order.loyaltyDiscount,
payment_method: order.paymentMethod,
payment_status: order.paymentStatus,
payment_id: order.paymentId,
status: order.status,
time: order.time
});

if(orderInsertError){

console.log(orderInsertError);

return res.status(500).json({
success:false,
message:orderInsertError.message
});

}

const earnedPoints =
Math.floor(Number(order.total) / 10);

const { data: existingPointUser } =
await supabase
.from("points")
.select("*")
.eq("phone", order.phone)
.single();

if(existingPointUser){

await supabase
.from("points")
.update({
points:
(existingPointUser.points || 0)
+ earnedPoints
})
.eq("phone", order.phone);

}else{

await supabase
.from("points")
.insert({
phone: order.phone,
points: earnedPoints
});

}


  
  try{

const api =
new SibApiV3Sdk.TransactionalEmailsApi();


const { data:user } =
await supabase
.from("users")
.select("*")
.eq("phone",order.phone) // ya updatedOrder.phone
.single();

if(user && user.email){

await api.sendTransacEmail({

sender:{
email:senderEmail
},

to:[
{
email:user.email
}
],

subject:`Order #${order.id} Confirmed ☕`,

htmlContent:`

<h2>Order Confirmed</h2>

<p>Order ID:
${order.id}</p>

<p>Total:
₹${order.total}</p>

<p>Status:
${order.status}</p>

<p>Thank you for ordering from Rupa Cafe ❤️</p>

`

});

}

}catch(err){

console.log(
"Order Email Error",
err
);

}
  res.json({ success: true, order });
});

app.get(
"/api/orders",
adminAuth,
async (req,res)=>{

const { data, error } =
await supabase
.from("orders")
.select("*")
.order("id",{ascending:false});

if(error){

return res.status(500).json({
success:false,
message:error.message
});

}

res.json(data || []);

});

app.put("/api/orders/:id/status", adminAuth,async (req, res) => {
  const { data: updatedOrder, error } =
await supabase
.from("orders")
.update({
status: req.body.status
})
.eq("id", req.params.id)
.select()
.single();

if(error){

return res.status(500).json({
success:false,
message:error.message
});

}

if(
updatedOrder &&
updatedOrder.status ===
"Delivered"
){

try{

const api =
new SibApiV3Sdk.TransactionalEmailsApi();

const { data:user } =
await supabase
.from("users")
.select("*")
.eq("phone", updatedOrder.phone)
.single();

if(user && user.email){

await api.sendTransacEmail({

sender:{
email:senderEmail
},

to:[
{
email:user.email
}
],

subject:"Order Delivered 🎉",

htmlContent:`

<h2>Your Order Has Been Delivered</h2>

<p>Order ID:
${updatedOrder.id}</p>

<p>Thank you for choosing Rupa Cafe ❤️</p>

`

});
}

}catch(err){

console.log(
"Delivery Email Error",
err
);

}

}

if(updatedOrder){

await supabase
.from("notifications")
.insert({
id: Date.now(),
phone: updatedOrder.phone,

message:

updatedOrder.status === "Preparing"
? "🍳 Your order is being prepared"

: updatedOrder.status === "Ready"
? "✅ Your order is ready"

: updatedOrder.status === "Delivered"
? "🎉 Order delivered successfully"

: `📦 Order status: ${updatedOrder.status}`,

time: new Date().toLocaleString()
});



}
  res.json({ success: true });
});
app.put(
"/api/orders/:id/payment",
adminAuth,
async (req,res)=>{

const { error } =
await supabase
.from("orders")
.update({
payment_status:"Paid"
})
.eq("id", req.params.id);

if(error){

return res.status(500).json({
success:false,
message:error.message
});

}

res.json({
success:true
});

});app.delete("/api/orders/:id", adminAuth, async (req,res)=>{

const id =
Number(req.params.id);

const { error } =
await supabase
.from("orders")
.delete()
.eq("id", id);

if(error){

return res.json({
success:false,
message:error.message
});

}

res.json({
success:true
});

});
app.get("/api/order/:id", async (req,res)=>{

const { data:order, error } =
await supabase
.from("orders")
.select("*")
.eq("id", req.params.id)
.single();

if(error || !order){

return res.json({
success:false
});

}


res.json({
success:true,
order
});

});

app.put(
"/api/order/:id/cancel",
async (req,res)=>{

const { data:order } =
await supabase
.from("orders")
.select("*")
.eq("id", req.params.id)
.single();

if(!order){

return res.json({
success:false
});

}

if(order.status !== "Pending"){

return res.json({

success:false,

message:
"Order can no longer be cancelled"

});

}

const { error } =
await supabase
.from("orders")
.update({
status:"Cancelled"
})
.eq("id", req.params.id);

if(error){

return res.json({
success:false
});

}

res.json({
success:true
});

});

app.get("/api/my-orders/:phone", async (req,res)=>{

const { data, error } =
await supabase
.from("orders")
.select("*")
.eq("phone", req.params.phone)
.order("id",{ascending:false});

if(error){

return res.json([]);
}

res.json(data || []);

});
app.get(
"/api/invoice/:id",
async (req,res)=>{

const site =
readJSON(
siteFile,
{}
);

const { data: order, error } =
await supabase
.from("orders")
.select("*")
.eq("id", req.params.id)
.single();

if(error || !order){

return res
.status(404)
.send("Order not found");

}

if(!order){

return res
.status(404)
.send(
"Order not found"
);

}

const doc =
new PDFDocument();
doc.pipe(res);
res.setHeader(
"Content-Type",
"application/pdf"
);

res.setHeader(
"Content-Disposition",
`attachment; filename=invoice-${order.id}.pdf`
);

// ===== HEADER =====

doc.rect(0,0,612,100)
.fill("#8B0000");

doc.fillColor("white")
.fontSize(30)
.font("Helvetica-Bold")
.text("RUPA CAFE",0,25,{
align:"center"
});

doc.fontSize(12)
.font("Helvetica")
.text(
"Premium Dining Experience",
0,
65,
{
align:"center"
}
);

doc.fillColor("black");

// ===== CUSTOMER BOX =====

doc.roundedRect(
50,
140,
500,
110,
10
).stroke("#8B0000");

doc.fontSize(12)
.font("Helvetica-Bold")
.text("CUSTOMER DETAILS",70,155);

doc.font("Helvetica");

doc.text(`Invoice No : ${order.id}`,70,180);
doc.text(`Customer : ${order.customer}`,70,200);
doc.text(`Phone : ${order.phone}`,70,220);

doc.text(`Status : ${order.status}`,320,180);
doc.text(`Order Type : ${order.orderType || "Dine In"}`,320,200);
doc.text(`Date : ${order.time}`,320,220);

let y = 280;

// ===== TABLE HEADER =====

doc.rect(50,y,500,30)
.fill("#8B0000");

doc.fillColor("white")
.font("Helvetica-Bold");

doc.text("ITEM",60,y+8);
doc.text("QTY",320,y+8);
doc.text("PRICE",400,y+8);
doc.text("TOTAL",480,y+8);

doc.fillColor("black");

y += 45;

// ===== ITEMS =====

let subtotal = 0;

order.items.forEach(item=>{

const qty = item.qty || 1;

const total =
Number(item.price) * qty;

subtotal += total;

doc.rect(
50,
y-5,
500,
22
).stroke("#dddddd");

doc.font("Helvetica");

doc.text(item.name,60,y);

doc.text(String(qty),320,y);

doc.text(`Rs ${item.price}`,400,y);

doc.text(`Rs ${total}`,480,y);

y += 25;

});

// ===== TOTAL CARD =====

const discount =
subtotal - Number(order.total || 0);
if(order.coupon){

doc.text(
`Coupon : ${order.coupon}`,
340,
y+35
);

doc.text(
`Coupon Discount : Rs ${order.couponDiscount || 0}`,
340,
y+50
);

}

y += 20;

doc.roundedRect(
320,
y,
220,
100,
8
)
.fillAndStroke(
"#FFF5E6",
"#8B0000"
);

doc.fillColor("black")
.fontSize(12);

doc.text(
`Subtotal : Rs ${subtotal}`,
340,
y+15
);

if(discount > 0){

doc.text(
`Discount : Rs ${discount}`,
340,
y+35
);

}

doc.fontSize(22)
.font("Helvetica-Bold")
.fillColor("#8B0000");

doc.text(
`Rs ${order.total}`,
340,
y+60
);

doc.fillColor("black");

y += 130;

// ===== PAYMENT =====

doc.fontSize(12)
.font("Helvetica");

doc.text(
`Payment Method : ${order.paymentMethod || "Counter"}`,
50,
y
);

if(
(order.paymentStatus || "")
.toLowerCase()
.includes("paid")
){

doc.fill("#2ECC71");

}else{

doc.fill("#E74C3C");

}

doc.roundedRect(
420,
y-5,
100,
25,
5
).fill();

doc.fillColor("white")
.font("Helvetica-Bold")
.text(
(order.paymentStatus || "Pending")
.toUpperCase(),
430,
y+2
);

doc.fillColor("black");

// ===== FOOTER =====

y += 60;

doc.moveTo(50,y)
.lineTo(550,y)
.stroke("#8B0000");

doc.fontSize(18)
.font("Helvetica-Bold")
.fillColor("#8B0000")
.text(
"THANK YOU FOR VISITING",
50,
y+20,
{
align:"center"
}
);

doc.fontSize(11)
.fillColor("black")
.text(
"Visit Again Soon",
{
align:"center"
}
);

doc.text(
"Rupa Cafe • Deoband • Uttar Pradesh",
{
align:"center"
}
);

doc.text(
"www.rupacafe.in",
{
align:"center"
}
);

doc.end();});
// Reviews APIs

app.get("/api/reviews", async (req,res)=>{

const { data,error } =
await supabase
.from("reviews")
.select("*")
.order("id",{ascending:false});

if(error){
return res.json([]);
}

res.json(data || []);

});

app.post("/api/reviews", async (req,res)=>{

const review = {
id: Date.now(),
name:req.body.name || "",
rating:req.body.rating || "⭐⭐⭐⭐⭐",
review:req.body.review || "",
time:new Date().toLocaleDateString(),
approved:false
};

const { error } =
await supabase
.from("reviews")
.insert(review);

if(error){

return res.json({
success:false
});

}

res.json({
success:true
});

});

app.delete("/api/reviews/:id", adminAuth, async (req,res)=>{

const { error } =
await supabase
.from("reviews")
.delete()
.eq("id", Number(req.params.id));

res.json({
success:!error
});

});
app.put("/api/reviews/:id/approve", adminAuth, async (req,res)=>{

const { error } =
await supabase
.from("reviews")
.update({
approved:true
})
.eq("id", Number(req.params.id));

res.json({
success:!error
});

});// Coupons APIs

app.get("/api/coupons", async (req,res)=>{

const { data,error } =
await supabase
.from("coupons")
.select("*");

if(error){
return res.json([]);
}

res.json(data || []);

});

app.post("/api/coupons", adminAuth, async (req,res)=>{

const { error } =
await supabase
.from("coupons")
.insert({
code:(req.body.code || "").toUpperCase(),
discount:Number(req.body.discount),
min_order:Number(req.body.minOrder),
expiry:req.body.expiry,
active:req.body.active === true ||
req.body.active === "true"
});

if(error){

return res.json({
success:false,
message:error.message
});

}

res.json({
success:true
});

});
app.delete("/api/coupons/:code", adminAuth, async (req,res)=>{

const { error } =
await supabase
.from("coupons")
.delete()
.eq("code", req.params.code);

res.json({
success:!error
});

});

app.post("/api/register", async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    if (!email || !phone || !password) {
      return res.json({
        success: false,
        message: "All fields required"
      });
    }

    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("phone", phone)
      .single();

    if (existingUser) {
      return res.json({
        success: false,
        message: "Phone already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { error } = await supabase
      .from("users")
      .insert({
        name,
        phone,
        email,
        password: hashedPassword
      });

    if (error) {
      return res.json({
        success: false,
        message: error.message
      });
    }

    res.json({
      success: true
    });

  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: err.message
    });
  }

});
app.post("/api/login", loginLimiter, async (req, res) => {
  try {

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("email", req.body.email)
      .single();

    if (!user) {
      return res.json({
        success: false,
        message: "Invalid Credentials"
      });
    }

    const match = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (!match) {
      return res.json({
        success: false,
        message: "Invalid Credentials"
      });
    }

    delete user.password;

    res.json({
      success: true,
      user
    });

  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: err.message
    });
  }
});
app.post("/api/admin-login", (req,res)=>{

const username =
(req.body.username || "").trim();

const password =
(req.body.password || "").trim();

if(
username === process.env.ADMIN_USERNAME &&
password === process.env.ADMIN_PASSWORD
){

return res.json({
success:true,
adminKey: process.env.ADMIN_KEY
});

}

return res.json({
success:false,
message:"Invalid Admin Credentials"
});

});
app.post(
"/api/reset-password",
async (req,res)=>{

try{
if(!verifiedOtpUsers[req.body.email]){

return res.json({
success:false,
message:"OTP Verification Required"
});

}
const hashedPassword =
await bcrypt.hash(
req.body.password,
10
);

const { data:user } =
await supabase
.from("users")
.select("*")
.eq(
"email",
req.body.email
)
.single();

if(!user){

return res.json({
success:false,
message:"Email Not Found"
});

}

const { error } =
await supabase
.from("users")
.update({
password:
hashedPassword
})
.eq(
"email",
req.body.email
);

if(error){

return res.json({
success:false,
message:error.message
});

}
delete verifiedOtpUsers[req.body.email];
res.json({
success:true
});

}catch(err){

console.log(err);

res.json({
success:false,
message:err.message
});

}

});
app.get("/api/favorites/:phone", async (req,res)=>{

const { data:favorites } =
await supabase
.from("favorites")
.select("*")
.eq("phone", req.params.phone);


const userFavs =
(favorites || [])
.map(f => {

const item =
menu.find(
m => String(m.id) === String(f.item_id)
);

return item || null;

})
.filter(Boolean);

res.json(userFavs);

});
app.post("/api/favorites", async (req,res)=>{

const { data:exists } =
await supabase
.from("favorites")
.select("*")
.eq("phone", req.body.phone)
.eq("item_id", req.body.itemId)
.single();

if(exists){

return res.json({
success:false,
message:"Already Favorite"
});

}

const { error } =
await supabase
.from("favorites")
.insert({
phone:req.body.phone,
item_id:req.body.itemId
});

if(error){

return res.json({
success:false,
message:error.message
});

}

res.json({
success:true
});

});
app.delete(
"/api/favorites/:phone/:itemId",
async (req,res)=>{

const { error } =
await supabase
.from("favorites")
.delete()
.eq("phone", req.params.phone)
.eq("item_id", req.params.itemId);

if(error){

return res.json({
success:false
});

}

res.json({
success:true
});

});

app.get(
"/api/notifications/:phone",
async (req,res)=>{

const { data, error } =
await supabase
.from("notifications")
.select("*")
.eq("phone", req.params.phone)
.order("id",{ascending:false});

if(error){

console.log(error);

return res.json([]);

}

res.json(data || []);

});app.delete(
"/api/notifications/:phone",
async (req,res)=>{

const { error } =
await supabase
.from("notifications")
.delete()
.eq("phone", req.params.phone);

if(error){

return res.json({
success:false
});

}

res.json({
success:true
});

});
app.post(
"/api/notifications",
adminAuth,
async (req,res)=>{

const { error } =
await supabase
.from("notifications")
.insert({
id: Date.now(),
phone: req.body.phone,
message: req.body.message,
time: new Date().toLocaleString()
});

if(error){

return res.json({
success:false,
message:error.message
});

}

res.json({
success:true
});

});// Loyalty Points APIs
app.get("/api/all-points",adminAuth, async (req,res)=>{

const { data } =
await supabase
.from("points")
.select("*");

res.json(data || []);

});

app.get("/api/points/:phone", async (req,res)=>{

const { data:user } =
await supabase
.from("points")
.select("*")
.eq("phone", req.params.phone)
.single();

res.json({
points:
user
?
user.points
:
0
});

});

app.put("/api/points/:phone", async (req,res)=>{

const newPoints =
Number(req.body.points) || 0;

const { error } =
await supabase
.from("points")
.update({
points:newPoints
})
.eq("phone", req.params.phone);

if(error){

return res.status(500).json({
success:false,
message:error.message
});

}

res.json({
success:true
});

});

app.get("/api/loyalty-leaderboard", async (req,res)=>{

const { data } =
await supabase
.from("points")
.select("*")
.order("points",{ascending:false})
.limit(10);

res.json(data || []);

});
app.post("/api/redeem-points", async (req,res)=>{

const phone =
req.body.phone || "";

const usedPoints =
Number(req.body.points) || 0;

const { data:user, error } =
await supabase
.from("points")
.select("*")
.eq("phone", phone)
.single();

if(error || !user){

return res.json({
success:false
});

}

if(Number(user.points) < usedPoints){

return res.json({
success:false
});

}

const remaining =
Number(user.points) - usedPoints;

const { error:updateError } =
await supabase
.from("points")
.update({
points: remaining
})
.eq("phone", phone);

if(updateError){

return res.json({
success:false
});

}

res.json({
success:true,
remaining
});

});
app.get("/api/top-customers",adminAuth, async (req,res)=>{

const { data:points, error } =
await supabase
.from("points")
.select("*")
.order("points",{ascending:false})
.limit(10);

if(error){

return res.json([]);

}

res.json(points || []);

});
app.get("/api/dashboard-stats",adminAuth, async (req,res)=>{

const { data:orders } =
await supabase
.from("orders")
.select("*");

const { data:points } =
await supabase
.from("points")
.select("*");

const totalRevenue =
(orders || [])
.reduce(
(sum,o)=>
sum + Number(o.total || 0),
0
);

const totalCustomers =
(points || []).length;

const totalPointsIssued =
(points || [])
.reduce(
(sum,p)=>
sum + Number(p.points || 0),
0
);

let topCustomer = "-";
let maxPoints = 0;

(points || []).forEach(p=>{

if(p.points > maxPoints){

maxPoints = p.points;
topCustomer = p.phone;

}

});

res.json({

totalRevenue,
totalCustomers,
totalPointsIssued,
topCustomer

});

});
app.get("/api/download-report",adminAuth,async (req,res)=>{

const { data:orders } =
await supabase
.from("orders")
.select("*");

const workbook =
new ExcelJS.Workbook();

const sheet =
workbook.addWorksheet(
"Orders"
);
const loyaltySheet =
workbook.addWorksheet(
"Loyalty"
);

loyaltySheet.columns = [

{
header:"Phone",
key:"phone",
width:20
},

{
header:"Points",
key:"points",
width:15
}

];

const { data:points } =
await supabase
.from("points")
.select("*");

(points || [])
.forEach(p=>{

loyaltySheet.addRow(p);

});
const couponSheet =
workbook.addWorksheet(
"Coupons"
);

couponSheet.columns = [

{
header:"Code",
key:"code",
width:20
},

{
header:"Discount",
key:"discount",
width:15
}

];

readJSON(couponsFile,[])
.forEach(c=>{

couponSheet.addRow(c);

});
const summarySheet =
workbook.addWorksheet(
"Summary"
);

summarySheet.addRow([
"Total Orders",
(orders || []).length
]);

summarySheet.addRow([
"Revenue",
(orders || []).reduce(
(s,o)=>
s + Number(o.total || 0),
0
)
]);

sheet.columns = [

{
header:"Order ID",
key:"id",
width:20
},

{
header:"Customer",
key:"customer",
width:25
},

{
header:"Phone",
key:"phone",
width:20
},

{
header:"Total",
key:"total",
width:15
},

{
header:"Status",
key:"status",
width:20
},
{
header:"Payment Method",
key:"paymentMethod",
width:20
},

{
header:"Payment Status",
key:"paymentStatus",
width:20
},
{
header:"Date",
key:"time",
width:30
}

];

(orders || []).forEach(order=>{

sheet.addRow({

id:order.id,

customer:
order.customer,

phone:
order.phone,

total:
order.total,

status:
order.status,

paymentMethod:
order.payment_method,

paymentStatus:
order.payment_status,

time:
order.time

});

});

res.setHeader(
"Content-Type",
"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
);

res.setHeader(
"Content-Disposition",
'attachment; filename="sales-report.xlsx"'
);

await workbook.xlsx.write(res);

res.end();

});
app.get("/api/coupon-analytics", adminAuth, async (req,res)=>{

const { data:orders, error } =
await supabase
.from("orders")
.select("coupon");

if(error){

return res.json({});
}

const usage = {};

(orders || []).forEach(order=>{

if(order.coupon){

usage[order.coupon] =

(usage[order.coupon] || 0)

+ 1;

}

});

res.json(usage);

});
app.post(
"/api/send-otp",
async (req,res)=>{

try{

const { data: user } = await supabase
  .from("users")
  .select("*")
  .eq("email", req.body.email)
  .single();

if (!user) {
  return res.json({
    success: false,
    message: "Email not found"
  });
}

const otp =
Math.floor(
100000 +
Math.random()*900000
).toString();

otpStore[
req.body.email
] = otp;

console.log(
"OTP FOR",
req.body.email,
":",
otp
);

const api =
new SibApiV3Sdk.TransactionalEmailsApi();

await api.sendTransacEmail({

sender:{
email:senderEmail
},

to:[
{
email:req.body.email
}
],

subject:
"Rupa Cafe Password Reset OTP",

htmlContent:

`<h2>Your OTP is ${otp}</h2>
<p>Valid for 10 minutes.</p>`

});

res.json({
success:true
});

}catch(err){

console.log(err);

res.json({
success:false
});

}

});

app.post("/api/verify-otp",(req,res)=>{

const email =
(req.body.email || "").trim();

const enteredOtp =
(req.body.otp || "").trim();

const storedOtp =
String(
otpStore[email] || ""
).trim();

console.log("EMAIL:",email);
console.log("ENTERED:",enteredOtp);
console.log("STORED:",storedOtp);

if(storedOtp !== enteredOtp){

return res.json({
success:false,
message:"Invalid OTP"
});

}

delete otpStore[email];
verifiedOtpUsers[email] = true;
res.json({
success:true
});

});

app.get("/api/razorpay-key",(req,res)=>{

res.json({
key: process.env.RAZORPAY_KEY_ID
});

});

app.post(
"/api/create-razorpay-order",
async (req,res)=>{

try{

const options = {

amount:
Number(req.body.amount) * 100,

currency:"INR",

receipt:
"rc_" + Date.now()

};

const order =
await razorpay.orders.create(
options
);

res.json(order);

}catch(err){

console.log(err);

res.status(500).json({
success:false
});

}

});

app.post("/api/payment-success", async (req,res)=>{
const generatedSignature =
crypto
.createHmac(
"sha256",
process.env.RAZORPAY_KEY_SECRET
)
.update(
req.body.razorpayOrderId +
"|" +
req.body.paymentId
)
.digest("hex");

if(
generatedSignature !==
req.body.razorpaySignature
){

return res.status(400).json({

success:false,

message:"Invalid payment signature"

});

}
const { data:order, error:orderError } =
await supabase
.from("orders")
.select("*")
.eq("id", Number(req.body.orderId))
.single();

if(orderError || !order){

return res.json({
success:false
});

}

await supabase
.from("orders")
.update({
payment_status: "Paid",
payment_id: req.body.paymentId
})
.eq("id", Number(req.body.orderId));

order.paymentStatus = "Paid";
order.paymentId = req.body.paymentId;

try{

const api =
new SibApiV3Sdk.TransactionalEmailsApi();

const { data:user } =
await supabase
.from("users")
.select("*")
.eq("phone", order.phone) // ya updatedOrder.phone
.single();

if(user && user.email){

await api.sendTransacEmail({

sender:{
email:senderEmail
},

to:[
{
email:user.email
}
],

subject:"Payment Received ✅",

htmlContent:`

<h2>Payment Successful</h2>

<p>
Order ID:
${order.id}
</p>

<p>
Amount:
₹${order.total}
</p>

<p>
Payment ID:
${order.paymentId}
</p>

<p>
Thank you for ordering from Rupa Cafe ❤️
</p>

`

});

}

}catch(err){

console.log(
"Payment Email Error",
err
);

}
await supabase
.from("notifications")
.insert({
  id: Date.now(),
  phone: order.phone,
  message: "💳 Payment received successfully",
  time: new Date().toLocaleString()
});
res.json({
success:true
});

});

app.get("/sitemap.xml", async (req, res) => {

try {

const smStream = new SitemapStream({
hostname: "https://rupacafe.in"
});

smStream.write({
url: "/",
changefreq: "daily",
priority: 1.0
});

smStream.write({
url: "/menu.html",
changefreq: "daily",
priority: 0.9
});

smStream.write({
url: "/contact.html",
changefreq: "monthly",
priority: 0.8
});

smStream.write({
url: "/about.html",
changefreq: "monthly",
priority: 0.8
});

smStream.write({
url: "/gallery.html",
changefreq: "weekly",
priority: 0.7
});

smStream.end();

const sitemap =
await streamToPromise(smStream);

res.header(
"Content-Type",
"application/xml"
);

res.send(
sitemap.toString()
);

} catch(err){

console.log(err);

res.status(500).end();

}

});

app.listen(PORT, () => {
  console.log("======================================");
  console.log("✅ Rupa Cafe server running");
  console.log("🌐 Environment:", process.env.NODE_ENV || "development");
  console.log("🚀 Port:", PORT);
  console.log("======================================");
});  console.log("======================================");
