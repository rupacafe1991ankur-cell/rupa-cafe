require("dotenv").config();

const rateLimit = require("express-rate-limit");
const bcrypt = require("bcrypt");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const express = require("express");
const helmet = require("helmet");
const multer = require("multer");
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
const app = express();
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
const ordersFile = path.join(__dirname, "data", "orders.json");
const siteFile = path.join(__dirname, "data", "site.json");
const reviewsFile = path.join(__dirname, "data", "reviews.json");
const couponsFile = path.join(__dirname, "data", "coupons.json");
const pointsFile = path.join(__dirname, "data", "points.json");
const favoritesFile = path.join(__dirname, "data", "favorites.json");
const notificationsFile =
path.join(
__dirname,
"data",
"notifications.json"
);
const usersFile = path.join(__dirname, "data", "users.json");

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

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadPath = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, "-");
    cb(null, Date.now() + "-" + safeName);
  }
});
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
const upload = multer({

storage,

fileFilter,

limits:{
fileSize:
5 * 1024 * 1024
}

});

// Site settings
app.get("/api/site", (req, res) => {
  res.json(readJSON(siteFile, {}));
});

app.put(
"/api/site",
adminAuth,
(req,res)=>{
  writeJSON(siteFile, req.body);
  res.json({ success: true });
});

// Menu APIs
app.get("/api/menu", (req, res) => {
  res.json(readJSON(menuFile, []));
});

app.post("/api/menu", adminAuth,upload.single("image"), (req, res) => {
  const menu = readJSON(menuFile, []);
  const items = req.body.items || [];
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
  ? "/uploads/" + req.file.filename
  : ""
};
  menu.push(item);
  writeJSON(menuFile, menu);
  res.json({ success: true, item });
});

app.put("/api/menu/:id",adminAuth, upload.single("image"), (req, res) => {
  let menu = readJSON(menuFile, []);
  const id = Number(req.params.id);
  menu = menu.map(item => {
    if (item.id === id) {
      return {
        ...item,
        name: req.body.name || item.name,
        category: req.body.category || item.category,
        price: Number(req.body.price || item.price),
        desc: req.body.desc || item.desc,
        available: req.body.available === "true" || req.body.available === true,
        popular:
req.body.popular === "true",

bestSeller:
req.body.bestSeller === "true",
        image: req.file ? "/uploads/" + req.file.filename : item.image
      };
    }
    return item;
  });
  writeJSON(menuFile, menu);
  res.json({ success: true });
});

app.put("/api/menu/:id/availability",adminAuth, (req, res) => {
  let menu = readJSON(menuFile, []);
  const id = Number(req.params.id);
  menu = menu.map(item => item.id === id ? {
    ...item,
    available: req.body.available === true || req.body.available === "true"
  } : item);
  writeJSON(menuFile, menu);
  res.json({ success: true });
});

app.delete("/api/menu/:id",adminAuth, (req, res) => {
  let menu = readJSON(menuFile, []);
  const id = Number(req.params.id);
  menu = menu.filter(item => item.id !== id);
  writeJSON(menuFile, menu);
  res.json({ success: true });
});

// Orders APIs
app.post("/api/order", async (req, res) => {
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
  const orders = readJSON(ordersFile, []);
  const menu = readJSON(menuFile, []);
  const items = req.body.items || [];
  
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

  items: items,

  total:

calculatedTotal

-

couponDiscount

+

(Number(req.body.deliveryCharge) || 0),

coupon:
appliedCoupon,

couponDiscount:
couponDiscount,

paymentMethod:
req.body.paymentMethod || "online",

paymentStatus:
req.body.paymentMethod === "counter"
?
"Pay At Counter"
:
"Pending",

paymentId: "",  
  status:
  req.body.status || "Pending",

  time:
  new Date().toLocaleString()
};

  orders.push(order);
  let points =
readJSON(pointsFile,[]);

const earnedPoints =
Math.floor(
Number(order.total) / 10
);

const existingUser =
points.find(
p => p.phone === order.phone
);

if(existingUser){

existingUser.points +=
earnedPoints;
let notifications =
readJSON(
notificationsFile,
[]
);

notifications.unshift({

id:Date.now(),

phone:order.phone,

message:
`🎁 You earned ${earnedPoints} loyalty points`,

time:
new Date()
.toLocaleString()

});

writeJSON(
notificationsFile,
notifications
);
}else{

points.push({

phone:
order.phone,

points:
earnedPoints

});

}

writeJSON(
pointsFile,
points
);
  writeJSON(ordersFile, orders);
  try{

const api =
new SibApiV3Sdk.TransactionalEmailsApi();

const users =
readJSON(usersFile,[]);

const user =
users.find(
u => u.phone === order.phone
);

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
(req,res)=>{

res.json(
readJSON(ordersFile,[])
);

});

app.put("/api/orders/:id/status", adminAuth,async (req, res) => {
  let orders = readJSON(ordersFile, []);
  const id = Number(req.params.id);
  orders = orders.map(order => order.id === id ? { ...order, status: req.body.status || order.status } : order);
  const updatedOrder =
orders.find(
o => o.id === id
);

if(
updatedOrder &&
updatedOrder.status ===
"Delivered"
){

try{

const api =
new SibApiV3Sdk.TransactionalEmailsApi();

const users =
readJSON(usersFile,[]);

const user =
users.find(
u =>
u.phone ===
updatedOrder.phone
);

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

let notifications =
readJSON(
notificationsFile,
[]
);

notifications.unshift({

id: Date.now(),

phone:
updatedOrder.phone,

message:

updatedOrder.status === "Preparing"

? `🍳 Your order is being prepared`

:

updatedOrder.status === "Ready"

? `✅ Your order is ready`

:

updatedOrder.status === "Delivered"

? `🎉 Order delivered successfully`

:

`📦 Order status:
${updatedOrder.status}`,

time:
new Date()
.toLocaleString()

});

writeJSON(
notificationsFile,
notifications
);

}
  writeJSON(ordersFile, orders);
  res.json({ success: true });
});
app.put(
"/api/orders/:id/payment",adminAuth,
(req,res)=>{

const orders =
readJSON(
ordersFile,
[]
);

const order =
orders.find(
o =>
String(o.id) ===
String(req.params.id)
);

if(!order){

return res.status(404).json({
success:false
});

}

order.paymentStatus =
"Paid";

writeJSON(
ordersFile,
orders
);

res.json({
success:true
});

});
app.delete("/api/orders/:id",adminAuth, (req, res) => {
  let orders = readJSON(ordersFile, []);
  const id = Number(req.params.id);
  orders = orders.filter(order => order.id !== id);
  writeJSON(ordersFile, orders);
  res.json({ success: true });
});
app.get("/api/order/:id",(req,res)=>{

const orders=
readJSON(
ordersFile,
[]
)

const order=
orders.find(
x=>x.id==req.params.id
)

if(!order){

return res.json({
success:false
})

}

res.json({

success:true,

order

});

});

app.get("/api/my-orders/:phone",(req,res)=>{

const orders =
readJSON(ordersFile,[]);

const myOrders =
orders.filter(
o => o.phone === req.params.phone
);

res.json(myOrders);

});


app.get(
"/api/invoice/:id",
(req,res)=>{

const orders =
readJSON(
ordersFile,
[]
);

const site =
readJSON(
siteFile,
{}
);

const order =
orders.find(
o =>
String(o.id) ===
String(req.params.id)
);

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

app.get("/api/reviews", (req, res) => {
  res.json(readJSON(reviewsFile, []));
});

app.post("/api/reviews", (req, res) => {

  const reviews = readJSON(reviewsFile, []);

  const review = {
    id: Date.now(),
    name: req.body.name || "",
    rating: req.body.rating || "⭐⭐⭐⭐⭐",
    review: req.body.review || "",
    time:
new Date()
.toLocaleDateString(),
    approved: false
  };

  reviews.push(review);

  writeJSON(reviewsFile, reviews);

  res.json({
    success: true
  });

});

app.delete("/api/reviews/:id", adminAuth, (req, res) => {

  let reviews = readJSON(reviewsFile, []);

  reviews = reviews.filter(
    r => r.id !== Number(req.params.id)
  );

  writeJSON(reviewsFile, reviews);

  res.json({
    success: true
  });

});

app.put("/api/reviews/:id/approve", adminAuth, (req,res)=>{

  let reviews =
  readJSON(reviewsFile, []);

  reviews =
  reviews.map(r =>
  r.id === Number(req.params.id)
  ? {
      ...r,
      approved:true
    }
  : r
  );

  writeJSON(
    reviewsFile,
    reviews
  );

  res.json({
    success:true
  });

});
// Coupons APIs

app.get("/api/coupons", (req,res)=>{

  res.json(
    readJSON(couponsFile, [])
  );

});

app.post("/api/coupons", adminAuth, (req,res)=>{

  const coupons =
  readJSON(couponsFile, []);
  const exists =
coupons.find(
c =>
c.code ===
(req.body.code || "")
.toUpperCase()
);

if(exists){

return res.json({

success:false,

message:
"Coupon already exists"

});

}

  coupons.push({

code:
(req.body.code || "")
.toUpperCase(),

discount:
Number(req.body.discount) || 0,

minOrder:
Number(req.body.minOrder) || 0,

expiry:
req.body.expiry || "",

active:
req.body.active === true ||
req.body.active === "true"

});
  writeJSON(
    couponsFile,
    coupons
  );

  res.json({
    success:true
  });

});

app.delete("/api/coupons/:code", adminAuth, (req,res)=>{

  let coupons =
  readJSON(couponsFile, []);

  coupons =
  coupons.filter(
    c =>
    c.code !==
    req.params.code
  );

  writeJSON(
    couponsFile,
    coupons
  );

  res.json({
    success:true
  });

});
app.post("/api/register", async (req,res)=>{

if(
!req.body.email ||
!req.body.phone ||
!req.body.password
){
return res.json({
success:false,
message:"All fields required"
});
}

const users =
readJSON(usersFile,[]);

const existing =
users.find(
u =>
u.phone === req.body.phone
);

if(existing){

return res.json({

success:false,

message:
"Phone already registered"

});


}

const user = {

id: Date.now(),

name:
req.body.name || "",

phone:
req.body.phone || "",

email:
req.body.email || "",

password:
await bcrypt.hash(
req.body.password,
10
)

};
const notifications =
readJSON(
notificationsFile,
[]
);

notifications.unshift({

id:Date.now(),

phone:user.phone,

message:
"Welcome to Rupa Cafe ❤️",

time:
new Date()
.toLocaleString()

});

writeJSON(
notificationsFile,
notifications
);
users.push(user);

writeJSON(
usersFile,
users
);

try{

const api =
new SibApiV3Sdk.TransactionalEmailsApi();

await api.sendTransacEmail({

sender:{
email:senderEmail
},

to:[
{
email:user.email
}
],

subject:"Welcome to Rupa Cafe ❤️",

htmlContent:`

<h2>Welcome ${user.name}</h2>

<p>Your account has been created successfully.</p>

<p>We're excited to serve you ☕</p>

`

});

}catch(err){

console.log(
"Welcome Email Error:",
err.message
);

}
res.json({

success:true

});

});
app.post("/api/login", loginLimiter, async (req, res) => {

    const users = readJSON(usersFile, []);

    const user = users.find(
        u => u.email === req.body.email
    );

    if(!user){
        return res.json({
            success:false,
            message:"Invalid Credentials"
        });
    }

    let match = false;

    if(user.password.startsWith("$2")){
         match = await bcrypt.compare(
            req.body.password,
            user.password
        );
    } else {
        match = req.body.password === user.password;
    }

    if(!match){
        return res.json({
            success:false,
            message:"Invalid Credentials"
        });
    }

    res.json({
        success:true,
        user
    });

});


// GOOGLE LOGIN ROUTE
app.post("/api/google-login", (req,res)=>{

let users = readJSON(usersFile,[]);

let user = users.find(
u => u.email === req.body.email
);

if(!user){

user = {

id: Date.now(),

name: req.body.name || "",

email: req.body.email || "",

phone: req.body.email,

password: ""

};

users.push(user);

writeJSON(usersFile, users);

}

res.json({
success:true,
user
});

});
app.post(
"/api/reset-password",
async (req,res)=>{

let users =
readJSON(
usersFile,
[]
);

const user =
users.find(
u =>
u.email ===
req.body.email
);

if(!user){

return res.json({
success:false,
message:"Email Not Found"
});

}

user.password =
await bcrypt.hash(
req.body.password,
10
);

writeJSON(
usersFile,
users
);

res.json({
success:true
});

});

app.get("/api/favorites/:phone",(req,res)=>{

const favorites = readJSON(favoritesFile,[]);
const menu = readJSON(menuFile,[]);

const userFavs = favorites
.filter(f => f.phone === req.params.phone)
.map(f => {

const item = menu.find(
m => m.id == f.itemId
);

return item || null;

})
.filter(Boolean);

res.json(userFavs);

});

app.post("/api/favorites",(req,res)=>{

const favorites =
readJSON(
favoritesFile,
[]
);

const exists =
favorites.find(

f =>
f.phone === req.body.phone
&&
f.itemId == req.body.itemId

);

if(exists){

return res.json({

success:false,

message:
"Already Favorite"

});

}

favorites.push({

phone:
req.body.phone,

itemId:
req.body.itemId

});

writeJSON(
favoritesFile,
favorites
);

res.json({

success:true

});

});

app.delete(
"/api/favorites/:phone/:itemId",
(req,res)=>{

let favorites =
readJSON(
favoritesFile,
[]
);

favorites =
favorites.filter(

f =>

!(

f.phone ===
req.params.phone

&&

String(f.itemId) ===
String(req.params.itemId)

)

);

writeJSON(
favoritesFile,
favorites
);

res.json({

success:true

});

});
app.get(
"/api/notifications/:phone",
(req,res)=>{

const notifications =
readJSON(
notificationsFile,
[]
);

res.json(

notifications.filter(
n =>
n.phone ===
req.params.phone
)

);

});
app.delete(
"/api/notifications/:phone",
(req,res)=>{

let notifications =
readJSON(
notificationsFile,
[]
);

notifications =
notifications.filter(
n =>
String(n.phone) !==
String(req.params.phone)
);

writeJSON(
notificationsFile,
notifications
);

res.json({
success:true
});

});

app.post(
"/api/notifications",
adminAuth,
(req,res)=>{

const notifications =
readJSON(
notificationsFile,
[]
);

notifications.unshift({

id:Date.now(),

phone:
req.body.phone,

message:
req.body.message,

time:
new Date()
.toLocaleString()

});

writeJSON(
notificationsFile,
notifications
);

res.json({
success:true
});

});
// Loyalty Points APIs
app.get("/api/all-points",(req,res)=>{

res.json(
readJSON(
pointsFile,
[]
)
);

});
app.get("/api/points/:phone",(req,res)=>{

const points =
readJSON(pointsFile,[]);

const user =
points.find(
p => p.phone === req.params.phone
);

res.json({
points:
user
?
user.points
:
0
});

});
app.get("/api/loyalty-leaderboard",(req,res)=>{

const points =
readJSON(pointsFile,[]);

const leaderboard =

points
.sort((a,b)=>
(b.points||0) -
(a.points||0)
)
.slice(0,10)
.map(p=>({

phone:p.phone,

points:p.points||0

}));

res.json(leaderboard);

});
app.post("/api/redeem-points",(req,res)=>{

let points =
readJSON(pointsFile,[]);

const phone =
req.body.phone || "";

const usedPoints =
Number(req.body.points) || 0;

const user =
points.find(
p => p.phone === phone
);

if(!user){

return res.json({
success:false
});

}

if(user.points < usedPoints){

return res.json({
success:false
});

}

user.points -= usedPoints;

writeJSON(
pointsFile,
points
);

res.json({
success:true,
remaining:user.points
});

});
app.get("/api/top-customers",(req,res)=>{
    

const orders =
readJSON(ordersFile,[]);

const customerTotals = {};

orders.forEach(order=>{

const phone =
order.phone || "Unknown";

customerTotals[phone] =

(customerTotals[phone] || 0)

+

Number(order.total || 0);

});

const topCustomers =

Object.entries(customerTotals)

.map(([phone,total])=>({

phone,
total

}))

.sort(
(a,b)=>
b.total - a.total
)

.slice(0,10);

res.json(topCustomers);

});
app.get("/api/dashboard-stats",(req,res)=>{
  

const orders =
readJSON(ordersFile,[]);

const points =
readJSON(pointsFile,[]);

const totalRevenue =

orders.reduce(
(sum,o)=>
sum + Number(o.total || 0),
0
);

const totalCustomers =
points.length;

const totalPointsIssued =

points.reduce(
(sum,p)=>
sum + Number(p.points || 0),
0
);

let topCustomer =
"-";

let maxPoints = 0;

points.forEach(p=>{

if(p.points > maxPoints){

maxPoints =
p.points;

topCustomer =
p.phone;

}

});

res.json({

totalRevenue,

totalCustomers,

totalPointsIssued,

topCustomer

});

});
app.get("/api/download-report",async (req,res)=>{

const orders =
readJSON(
ordersFile,
[]
);

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

readJSON(pointsFile,[])
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
orders.length
]);

summarySheet.addRow([
"Revenue",
orders.reduce(
(s,o)=>
s+Number(o.total||0),
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

orders.forEach(order=>{

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
order.paymentMethod,

paymentStatus:
order.paymentStatus,

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
app.get("/api/coupon-analytics",(req,res)=>{

const orders =
readJSON(
ordersFile,
[]
);

const usage = {};

orders.forEach(order=>{

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

const users =
readJSON(usersFile,[]);

const user =
users.find(
u =>
u.email === req.body.email
);

if(!user){

return res.json({
success:false,
message:"Email not found"
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

res.json({
success:true
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
let orders = readJSON(ordersFile,[]);

const order = orders.find(
o => String(o.id) === String(req.body.orderId)
);

if(!order){
return res.json({success:false});
}

order.paymentStatus = "Paid";
order.paymentId = req.body.paymentId;

try{

const api =
new SibApiV3Sdk.TransactionalEmailsApi();

const users =
readJSON(usersFile,[]);

const user =
users.find(
u => u.phone === order.phone
);

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

writeJSON(ordersFile,orders);

res.json({success:true});

});

app.listen(PORT, () => {
  console.log("======================================");
  console.log("Rupa Cafe server running");
  console.log("Frontend: http://localhost:" + PORT);
  console.log("Admin:    http://localhost:" + PORT + "/admin/login.html");
  console.log("Login:    admin / admin123");
  console.log("======================================");
});