let menu = [];
let filteredCategory = "all";
let cart = [];
function addToCart(item){
  if(window.storeClosed){

alert(
"🚫 Store Closed. Come Back Tomorrow."
);

return;
}

const existing =
cart.find(
c => c.id === item.id
);

if(existing){

existing.qty =
(existing.qty || 1) + 1;

}else{

cart.push({
...item,
qty:1
});

}

renderCart();

}

let redeemedPoints = 0;
let appliedCoupon = "";
let currentCoupon = null;
let discount = 0;
let pointsDiscount = 0;
let subtotal = 0;
let selected = null;
let heroSlides = [];
let heroIndex = 0;
let heroInterval = null;

function placeholder(name){

return "data:image/svg+xml;utf8," +

encodeURIComponent(

`<svg xmlns='http://www.w3.org/2000/svg'

width='500'

height='300'>

<rect

width='100%'

height='100%'

fill='#ffcc00'/>

<text

x='50%'

y='50%'

font-size='32'

text-anchor='middle'

fill='#9b2b16'>

${name}

</text>

</svg>`

)

}
async function loadHeroSlides(){

try{

const res =
await fetch("/api/hero-slides");

const json =
await res.json();

if(
!json.success ||
!json.data ||
json.data.length===0
){

return false;

}

heroSlides = json.data;

heroIndex = 0;

updateHeroSlide();

if(heroInterval){

clearInterval(heroInterval);

}

heroInterval =
setInterval(()=>{

heroIndex++;

if(heroIndex>=heroSlides.length){

heroIndex=0;

}

updateHeroSlide();

},5000);

return true;

}catch(e){

console.log(e);

return false;

}

}

function updateHeroSlide(){

const slide =
heroSlides[heroIndex];

if(!slide) return;

const hero =
document.getElementById(
"heroSlider"
);

hero.style.backgroundImage =
`url('${slide.image}')`;

document.getElementById(
"sliderTitle"
).innerText =
slide.title || "";

document.getElementById(
"sliderText"
).innerText =
slide.subtitle || "";

const btn =
document.querySelector(
".hero-btn"
);

btn.innerText =
slide.button_text ||
"Explore Menu";

btn.href =
slide.button_link ||
"#menu";

}

async function loadSite(){

const site=
await fetch("/api/site")
.then(r=>r.json());
const heroLoaded =
await loadHeroSlides();
await fetch(

"/api/site"

)

.then(

r=>r.json()

)
window.storeClosed =
site.storeClosed === true;

if(window.storeClosed){

const overlay =
document.getElementById(
"storeClosedOverlay"
);

if(overlay){

overlay.style.display =
"flex";

}

}

const floatingWhatsapp =
document.getElementById(
"floatingWhatsapp"
);

if(
floatingWhatsapp &&
site.whatsapp
){

if(site.whatsapp.startsWith("http")){
  floatingWhatsapp.href = site.whatsapp;
}else{
  floatingWhatsapp.href =
  "https://wa.me/" +
  site.whatsapp.replace(/\D/g,"");
}

}

/*
heroTitle.innerText =
site.hero || "";

heroText.innerText =
site.heroText || "";
*/

offerText.innerText=

site.offer||

""

contactText.innerText=

site.contact||

""
if(heroLoaded){
    console.log("Hero Manager Loaded");
}else{
    console.log("Using Fallback Hero");
}
heroImages = [

site.heroImage1,

site.heroImage2,

site.heroImage3,

site.heroImage4

].filter(Boolean);

if(heroImages.length){

document.getElementById(
"heroSlider"
).style.backgroundImage =

`url('${heroImages[0]}')`;

}

copyrightText.innerText =
site.copyright || "© 2026 Rupa Cafe"
const insta =
document.getElementById(
"instagramLink"
);

if(
insta &&
site.instagram
){

insta.href =
site.instagram;

}

const fb =
document.getElementById(
"facebookLink"
);

if(
fb &&
site.facebook
){

fb.href =
site.facebook;

}
menu=

await fetch(

"/api/menu"

)

.then(

r=>r.json()

)

showMenu()
const searchBox =
document.getElementById(
"searchFood"
);

if(searchBox){

searchBox.addEventListener(
"input",
showMenu
);

}


}
document.addEventListener("DOMContentLoaded", () => {

const orderType =
document.getElementById("orderType");
const phoneInput =
document.getElementById(
"phone"
);

if(phoneInput){

phoneInput.addEventListener(
"input",
loadPoints
);

}

if(!orderType) return;

orderType.addEventListener("change", function(){

  const deliveryBox = document.getElementById("deliveryBox");
  const tableBox = document.getElementById("tableBox");
  const paymentSelect = document.getElementById("paymentMethod");

  if (this.value === "delivery") {

    paymentSelect.innerHTML = `
      <option value="cod">
      Cash On Delivery
      </option>
    `;

    paymentSelect.value = "cod";

    document.getElementById("deliveryETA").innerHTML =
    "🛵 Estimated Delivery: 30-40 Minutes";

    deliveryBox.style.display = "block";
    tableBox.style.display = "none";

  } else if (this.value === "takeaway") {

    paymentSelect.innerHTML = `
      <option value="counter">
      Pay At Counter
      </option>
    `;

    paymentSelect.value = "counter";

    deliveryBox.style.display = "none";
    tableBox.style.display = "none";

  } else {

    paymentSelect.innerHTML = `
      <option value="counter">
      Pay At Counter
      </option>
    `;

    paymentSelect.value = "counter";

    document.getElementById("deliveryETA").innerHTML =
    "🍽️ Serving Time: 10-15 Minutes";

    deliveryBox.style.display = "none";
    tableBox.style.display = "block";

}

});
renderCart();
orderType.dispatchEvent(
new Event("change")
);
/* =========================
   QR TABLE AUTO DETECT
========================= */

const params =
new URLSearchParams(
window.location.search
);

const tableFromQR =
params.get("table");

if(tableFromQR){

  const orderType =
  document.getElementById(
  "orderType"
  );

  const tableInput =
  document.getElementById(
  "tableNumber"
  );

  if(orderType){

    orderType.value =
    "dinein";

    orderType.dispatchEvent(
    new Event("change")
    );

  }

  if(tableInput){

    tableInput.value =
    tableFromQR;

    tableInput.readOnly =
    true;

    tableInput.style.background =
    "#f5f5f5";

  }

}
});

const cafeLat = 29.685183;
const cafeLng = 77.6743935;

function showMenu(){
const categoryFilters =
document.getElementById(
"categoryFilters"
);

if(categoryFilters){

const categories = [

...new Set(
menu.map(
item => item.category
)
)

];

categoryFilters.innerHTML =

`<button class="btn"
onclick="filterCategory('all')">
All
</button>`

+

categories.map(category =>

`<button class="btn"
onclick="filterCategory('${category}')">
${category}
</button>`

).join("");

}
let searchValue =
document
.getElementById("searchFood")
?.value
?.toLowerCase() || "";

let filteredMenu =
menu.filter(item => {

const searchMatch =
item.name
.toLowerCase()
.includes(searchValue);

const categoryMatch =
filteredCategory === "all"
||
item.category === filteredCategory;

return searchMatch && categoryMatch;

});
menuList.innerHTML=

filteredMenu.map(
(item)=>{
const ok=

item.available!==false

return`

<div class="card reveal">

<img

class="food-img"

src="${
item.image||

placeholder(
item.name
)
}">

<div
class="card-body">

<h3>
${item.name}

${item.bestSeller
?
'<span class="popular-badge">⭐ Best Seller</span>'
:
''}

</h3>

${item.popular
?
'<span class="popular-badge">🔥 Popular</span>'
:
''}

</h3>

<p>

${item.category}

</p>

<p>

₹${item.price}

</p>

<p>

${
ok

?

"Available"

:

"Not Available"

}

</p>

<button

class="btn"

onclick="openItem(${menu.indexOf(item)})">

View

</button>
<button
class="btn"
onclick="addFavorite(${item.id})">

❤️ Favorite

</button>

</div>

</div>

`

}

).join("")
const bestSellerList =
document.getElementById(
"bestSellerList"
);

if(bestSellerList){

bestSellerList.innerHTML =
menu
.filter(item =>
item.bestSeller === true ||
item.bestSeller === "true"
)
.map(item => `

<div class="card best-seller-card reveal">

<img
class="food-img"
src="${item.image || placeholder(item.name)}">

<div class="card-body">

<h3>

${item.name}

${item.popular
?
'<span class="popular-badge">🔥 Popular</span>'
:
''}

</h3>

<p>⭐ Best Seller</p>

<p>₹${item.price}</p>

<button
class="btn"
onclick="openItem(${menu.indexOf(item)})">

View

</button>

</div>

</div>

`).join("");

}
}
function filterCategory(category){

filteredCategory = category;

showMenu();

}
function openItem(index){

selected=

menu[index]

popupImg.src=

selected.image||

placeholder(

selected.name

)

popupName.innerText=

selected.name

popupCategory.innerText=

selected.category

popupDesc.innerText =
selected.desc ||
selected.description ||
"Fresh and delicious food.";

popupPrice.innerText=

"₹"+

selected.price

popupStatus.innerText=

selected.available

?

"Available"

:

"Not Available"

const popupBtn =
document.getElementById("popupBtn");

if(popupBtn){
popupBtn.disabled =
!selected.available;
}
const recommendations =

menu

.filter(item =>

item.id !== selected.id

&&

item.category === selected.category

)

.slice(0,3);

const recommendationBox =

document.getElementById(
"recommendations"
);

if(recommendationBox){

recommendationBox.innerHTML =

recommendations.map(item => `

<div class="card">

<img
class="food-img"
src="${
item.image ||
placeholder(item.name)
}">

<div class="card-body">

<h4>
${item.name}
</h4>

<p>
₹${item.price}
</p>

<button
class="btn small"
onclick="addRecommendation(${item.id})">

Add
</button>

</div>

</div>

`).join("");

}
popup.style.display=

"flex"
updatePopupQty();
}

function closePopup(){

selected = null;

document.getElementById("popup").style.display =
"none";

}

function addSelected(){

if(selected.available===false){

alert("Food not available");
return;

}

addToCart(selected);

updatePopupQty();

}
function updatePopupQty(){
if(!selected){
return;
}
const item = cart.find(
c => c.id === selected.id
);

const box =
document.getElementById(
"popupQtyBox"
);

if(!item){

box.innerHTML = `

<button
id="popupBtn"
class="btn"
onclick="addSelected()">

ADD

</button>

`;

return;

}

box.innerHTML = `

<button
class="btn small"
onclick="popupDecrease()">

-

</button>

<span
style="
margin:0 10px;
font-weight:bold;
">

${item.qty}

</span>

<button
class="btn small"
onclick="popupIncrease()">

+

</button>

`;

}
function popupIncrease(){

const item =
cart.find(
c => c.id === selected.id
);

if(item){

item.qty++;

renderCart();

updatePopupQty();

}

}

function popupDecrease(){

const item =
cart.find(
c => c.id === selected.id
);

if(!item) return;

item.qty--;

if(item.qty <= 0){

cart =
cart.filter(
c => c.id !== selected.id
);

}

renderCart();

updatePopupQty();

}

function renderCart(){

if(cart.length === 0){

const cartItems =
document.getElementById("cartItems");

if(cartItems){
cartItems.innerHTML =
"<h3>Cart Empty</h3>";
}

subtotal = 0;
discount = 0;
pointsDiscount = 0;
currentCoupon = null;
appliedCoupon = "";

const couponInput =
document.getElementById("couponCode");

if(couponInput){
couponInput.value = "";
}

document.getElementById("subtotal").innerText = "0";
document.getElementById("discountAmount").innerText = "0";
document.getElementById("total").innerText = "0";

const discountText =
document.getElementById("discountText");

if(discountText){
discountText.innerText =
"Discount ₹0";
}

const pointsText =
document.getElementById("pointsDiscount");

if(pointsText){
pointsText.innerText =
"Points Discount ₹0";
}

return;

}

cartItems.innerHTML =

cart.map((item,index)=>`

<div
style="
display:flex;
justify-content:space-between;
align-items:center;
margin:10px 0;
padding:10px;
background:#f5f5f5;
border-radius:10px;
">

<div>

<b>${item.name}</b>

<br>

₹${item.price * item.qty}

</div>

<div>

<button
class="btn small"
onclick="decreaseQty(${index})">

-

</button>

<span
style="
margin:0 10px;
font-weight:bold;
">

${item.qty}

</span>

<button
class="btn small"
onclick="increaseQty(${index})">

+

</button>

</div>

</div>

`).join("");

subtotal =
cart.reduce(
(sum,item)=>
sum + Number(item.price) * item.qty,
0
);
if(currentCoupon){

if(
subtotal >=
(currentCoupon.minOrder || 0)
){

discount = Math.round(
subtotal *
(currentCoupon.discount / 100)
);

}else{

discount = 0;

}

}

const orderType =
document.getElementById(
"orderType"
)?.value || "dinein";

const delivery =

orderType === "delivery"

?

Number(
document.getElementById(
"deliveryCharge"
)?.innerText || 0
)

:

0;

const deliveryRow =
document.getElementById(
"summaryDeliveryRow"
);

if(deliveryRow){

if(orderType === "delivery"){

deliveryRow.style.display = "block";

}else{

deliveryRow.style.display = "none";

}

}

document.getElementById(
"subtotal"
).innerText =
subtotal;

document.getElementById(
"discountAmount"
).innerText =
discount;
const pointsSummary =
document.getElementById(
"summaryPointsDiscount"
);

if(pointsSummary){

pointsSummary.innerText =
pointsDiscount;

}
const discountText =
document.getElementById("discountText");

if(discountText){
discountText.innerText =
"Discount ₹" + discount;
}

document.getElementById(
"summaryDelivery"
).innerText =
delivery;

const finalTotal =
Math.max(
0,
subtotal +
delivery -
discount -
pointsDiscount
);

total.innerText =
finalTotal;

}

function removeCart(index){

cart.splice(

index,

1

)

renderCart()

}
async function applyCoupon(){
discount = 0;
currentCoupon = null;
const code =
document.getElementById(
"couponCode"
).value
.trim()
.toUpperCase();

if(!code){

alert("Enter Coupon Code");

return;

}

const coupons =
await fetch("/api/coupons")
.then(r=>r.json());

const coupon =
coupons.find(
c => c.code === code
);

if(!coupon){

alert(
"Invalid Coupon"
);

return;

}
appliedCoupon =
coupon.code;
currentCoupon = coupon;
if(!coupon.active){

alert(
"Coupon is inactive"
);

return;

}

if(
coupon.expiry &&
new Date(coupon.expiry) <
new Date()
){

alert(
"Coupon expired"
);

return;

}
if(!coupon){

alert("Invalid Coupon");

return;

}

const subtotal =
cart.reduce(
  
  (sum, item) =>
    sum + (Number(item.price) * item.qty),
  0
);

if(currentCoupon){

  if(
    subtotal >=
    (currentCoupon.minOrder || 0)
  ){

    discount = Math.round(
      subtotal *
      (currentCoupon.discount / 100)
    );

  } else {

    discount = 0;

  }

}

if(
  subtotal <
  (coupon.minOrder || 0)
){

alert(

"Minimum order ₹" +

coupon.minOrder +

" required"

);

return;

}

discount =
Math.round(
subtotal *
(coupon.discount / 100)
);

document.getElementById(
"discountText"
).innerText =
`Discount ₹${discount}`;

renderCart();

alert(
"🎉 Coupon Applied Successfully"
);

}function getLocation(){

if(!navigator.geolocation){

alert("Location not supported");

return;

}

navigator.geolocation.getCurrentPosition(pos => {

const lat = pos.coords.latitude;
const lng = pos.coords.longitude;

document.getElementById("latitude").value = lat;
document.getElementById("longitude").value = lng;

document.getElementById("mapLink").innerHTML =

`<a target="_blank"
href="https://maps.google.com/?q=${lat},${lng}">
View Selected Location
</a>`;

calculateDelivery(lat,lng);

});

}


function calculateDelivery(lat,lng){

const distance =
getDistanceFromLatLonInKm(
cafeLat,
cafeLng,
lat,
lng
);

let charge = 0;

if(distance <= 1){

    charge = 20;

}
else if(distance <= 2){

    charge = 30;

}
else{

    document.getElementById(
    "deliveryCharge"
    ).innerText = 0;

    renderCart();

    alert(
    "🚫 Delivery available only within 2 KM of Rupa Cafe."
    );

    return;
}

document.getElementById(
"deliveryCharge"
).innerText = charge;

renderCart();

}

function getDistanceFromLatLonInKm(
lat1,
lon1,
lat2,
lon2
){

const R = 6371;

const dLat =
deg2rad(lat2-lat1);

const dLon =
deg2rad(lon2-lon1);

const a =
Math.sin(dLat/2) *
Math.sin(dLat/2) +
Math.cos(deg2rad(lat1)) *
Math.cos(deg2rad(lat2)) *
Math.sin(dLon/2) *
Math.sin(dLon/2);

const c =
2 * Math.atan2(
Math.sqrt(a),
Math.sqrt(1-a)
);

return R * c;

}

function deg2rad(deg){

return deg * (Math.PI/180);

}
async function placeOrder(){

  const site =
await fetch("/api/site")
.then(r=>r.json());

if(site.storeClosed){

  alert(
    "🚫 Store Closed. Come Back Tomorrow."
  );

  return;
}
const user =
JSON.parse(
localStorage.getItem(
"rupaUser"
)
);

if(!user){

if(
confirm(
"You need to login before placing an order. Login now?"
)
){

location.href =
"/login.html";

}

return;

}
const customerVal=

customer.value.trim()

const phoneVal=

phone.value.trim()

const addressVal=

address.value.trim()

const tableNumberVal =
document.getElementById("tableNumber")?.value.trim() || "";

const orderTypeVal =
document.getElementById("orderType").value;

const paymentMethod =
document.getElementById("paymentMethod").value;

const landmarkVal =
document.getElementById("landmark")?.value || "";

const latitudeVal =
document.getElementById("latitude")?.value || "";

const longitudeVal =
document.getElementById("longitude")?.value || "";

const deliveryChargeVal =

orderTypeVal === "delivery"

?

Number(
document.getElementById("deliveryCharge")?.innerText || 0
)

:

0;

if(

customerVal===""

||

phoneVal===""

||

cart.length===0

){

alert(

"Fill details"

)

return

}

if(orderTypeVal === "delivery"){

const deliveryAddress =
document.getElementById("manualLocation").value.trim();

const lat =
document.getElementById("latitude").value.trim();

const lng =
document.getElementById("longitude").value.trim();

if(
deliveryAddress === "" ||
lat === "" ||
lng === ""
){

alert(
"📍 Please select your delivery location before placing the order."
);

return;
}

}

const foodTotal =

cart.reduce(
(sum,item)=>
sum +
(Number(item.price) * item.qty),
0
);

const totalVal =

foodTotal +

deliveryChargeVal -

discount -

pointsDiscount;
const res=

await fetch(

"/api/order",

{

method:"POST",

headers:{

"Content-Type":

"application/json"

},

body:

JSON.stringify({

tableNumber:

tableNumberVal,

customer:

customerVal,

phone:

phoneVal,

address:

addressVal +

(

document.getElementById(
"manualLocation"
).value

?

"\n\nDelivery Address:\n" +

document.getElementById(
"manualLocation"
).value

:

""

),

orderType:

orderTypeVal,

landmark:

landmarkVal,

latitude:

latitudeVal,

longitude:

longitudeVal,

deliveryCharge:

deliveryChargeVal,

items:

cart,

total:
totalVal,
paymentMethod:
paymentMethod,

coupon:
appliedCoupon,
couponDiscount:
discount,
loyaltyDiscount:
pointsDiscount,
status:

"Pending"

})
}

)

const data=

await res.json()

if(data.success){

  if(
paymentMethod === "counter" ||
paymentMethod === "cod"
){

if(redeemedPoints > 0){

await fetch(
"/api/redeem-points",
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
phone: phoneVal,
points: redeemedPoints
})
}
);

}

localStorage.setItem(
"lastOrderId",
data.order.id
);

alert(
"Order Placed Successfully. Pay At Counter Selected."
);

location.href =
"/order-success.html";

return;
}
const rpOrder =
await fetch(
"/api/create-razorpay-order",
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
amount: totalVal
})
}
).then(r=>r.json());

const razorpayConfig =
await fetch("/api/razorpay-key")
.then(r=>r.json());

const options = {

key: razorpayConfig.key,

amount: rpOrder.amount,

currency: "INR",

order_id: rpOrder.id,

name: "Rupa Cafe",

description: "Food Order",

prefill: {
  name: customerVal,
  contact: phoneVal
},

method: {
  upi: true,
  card: true,
  netbanking: true,
  wallet: true
},

modal: {
  ondismiss: function(){

    alert(
      "Payment cancelled. Order saved with Pending Payment status."
    );

  }
},

handler: async function(response){

await fetch(
"/api/payment-success",

{
  
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({

orderId:data.order.id,

paymentId:
response.razorpay_payment_id,

razorpayOrderId:
response.razorpay_order_id,

razorpaySignature:
response.razorpay_signature

})
}
);

if(redeemedPoints > 0){

await fetch(
"/api/redeem-points",
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
phone: phoneVal,
points: redeemedPoints
})
}
);

}

localStorage.setItem(
"lastOrderId",
data.order.id
);

window.location.href =
"/order-success.html";

},

theme:{
color:"#e31b23"
}

};

const rzp =
new Razorpay(options);
rzp.on(
"payment.failed",
function(response){

alert(
"Payment Failed. Order saved as Pending Payment."
);

console.log(
response.error
);

}
);
rzp.open();

return;

}
const msg =

`🍽️ New Order

Order ID: ${data.order.id}

Customer: ${customerVal}

Phone: ${phoneVal}

Type: ${orderTypeVal}

Total: ₹${totalVal}`;

const whatsappBtn =
document.getElementById(
"whatsappOrder"
);

if(whatsappBtn){

whatsappBtn.href =
"https://wa.me/918445089869?text="
+
encodeURIComponent(msg);

whatsappBtn.style.display =
"inline-block";

}

cart=[];
appliedCoupon = "";
discount = 0;

pointsDiscount = 0;
redeemedPoints = 0;

document.getElementById(
"pointsDiscount"
).innerText =
"Points Discount ₹0";

document.getElementById(
"discountText"
).innerText =
"Discount ₹0";

document.getElementById(
"discountText"
).innerText =
"Discount ₹0";

document.getElementById(
"couponCode"
).value = "";
renderCart();

customer.value="";
phone.value="";
address.value="";
tableNumber.value="";
document.getElementById("landmark").value = "";

document.getElementById("latitude").value = "";

document.getElementById("longitude").value = "";

document.getElementById("deliveryCharge").innerText = "0";

document.getElementById("mapLink").innerHTML = "";

}

window.addEventListener(

"load",

function(){

const btn=

document.getElementById(

"trackBtn"

)

if(btn){

btn.addEventListener(

"click",

async function(){

const id=

trackId.value.trim()

if(id===""){

alert(

"Enter Order ID"

)

return

}

const res=

await fetch(

"/api/order/"+id

)

const data=

await res.json()

if(

!data.success

){

document.getElementById("trackResult").innerHTML=

"Order Not Found"

return

}

const currentStatus =
data.order.status;

const statuses = [
"Pending",
"Accepted",
"Preparing",
"Ready",
"Delivered"
];

let html =
'<div class="tracking-bar">';

statuses.forEach(status=>{

const active =
statuses.indexOf(status)
<=
statuses.indexOf(currentStatus);

html += `
<div class="step ${active ? "active" : ""}">
${status}
</div>
`;

});

html += `
</div>

<h3>
Order #${data.order.id}
</h3>

<p>
Current Status:
<b>${currentStatus}</b>
</p>
${
data.order.status === "Pending"
?

`
<button
class="btn cancel-order-btn"
onclick="cancelOrder('${data.order.id}')">

❌ Cancel Order

</button>
`

:

""
}
`;

document.getElementById(
"trackResult"
).innerHTML = html;
}

)

}

}

)

loadSite()
loadFeaturedCoupon();
loadDeals();
loadReviews();
const locationInput =
document.getElementById(
"manualLocation"
);

if(locationInput){

locationInput.addEventListener(
"input",
searchLocation
);

}
async function submitReview(){

const name =
document.getElementById("reviewName").value;

const rating =
document.getElementById("reviewRating").value;

const review =
document.getElementById("reviewText").value;

if(!name || !review){

alert("Fill all fields");

return;

}

const res = await fetch("/api/reviews",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

name:name,
rating:rating,
review:review

})

});

const data = await res.json();

if(data.success){

alert("Thank you for your review ❤️");

document.getElementById("reviewName").value = "";

document.getElementById("reviewText").value = "";

}

}
async function loadReviews(){

const reviews =
await fetch("/api/reviews")
.then(r => r.json());

const box =
document.getElementById(
"reviewsList"
);

if(!box) return;

const approvedReviews =
  reviews.filter(r => r.approved === true);

const avg =

approvedReviews.length

?

(
approvedReviews.reduce(
(sum,r)=>
sum +
(r.rating.match(/⭐/g)?.length || 0),
0
)
/
approvedReviews.length
).toFixed(1)

:

0;

const stats =
document.getElementById(
"reviewStats"
);

if(stats){

stats.innerHTML =

`
<h2>
⭐ ${avg}/5
</h2>

<p>
${approvedReviews.length}
Customer Reviews
</p>
`;

}
box.innerHTML =

reviews
.filter(r => r.approved === true)
.map(r => `

<div class="card">

<h3>${r.rating}</h3>

<p>${r.review}</p>

<div
style="
margin-top:10px;
font-weight:bold;
color:#168a3a;
">

👤 ${r.name}

<span
style="
background:#168a3a;
color:white;
padding:4px 8px;
border-radius:20px;
font-size:11px;
margin-left:8px;
display:inline-block;
">

✔ Verified Customer

</span>

<br>

<small
style="
color:#666;
">

🕒 ${r.time || ""}

</small>

</div>

</div>

`).join("");
}
function toggleMenu(){

const nav =
document.querySelector(".nav");

const header =
document.querySelector(".header");

if(!nav) return;

/* header ko force visible rakho */
if(header){
header.classList.remove(
"header-hidden"
);
}

nav.classList.toggle("show");

}
// Hero Slider
const USE_LEGACY_HERO = false;
let heroImages = [];

const heroTexts = [

{
title:"Welcome to Rupa Cafe",
text:"Fresh Coffee • Delicious Food • Memorable Moments"
},

{
title:"Authentic Indian Taste",
text:"Sweets • Snacks • Chaat • Thali"
},

{
title:"Best Seller Specials",
text:"Most Loved Dishes By Customers"
},

{
title:"Fast Delivery",
text:"Hot & Fresh Food At Your Doorstep"
}

];

//let heroIndex = 0;

function changeHero(){
   if(!USE_LEGACY_HERO){
        return;
    }
if(heroImages.length === 0){
return;
}
const hero =
document.getElementById("heroSlider");

if(!hero) return;

heroIndex =
(heroIndex + 1)
%
heroImages.length;

hero.style.backgroundImage =
`url('${heroImages[heroIndex]}')`;

const title =
document.getElementById("sliderTitle");

const text =
document.getElementById("sliderText");

if(title)
title.innerText =
heroTexts[heroIndex].title;

if(text)
text.innerText =
heroTexts[heroIndex].text;

}

setInterval(
changeHero,
4000
);
// Scroll Reveal Animation

function revealOnScroll(){

const reveals =
document.querySelectorAll(".reveal");

reveals.forEach(item=>{

const windowHeight =
window.innerHeight;

const elementTop =
item.getBoundingClientRect().top;

const revealPoint = 100;

if(
elementTop <
windowHeight - revealPoint
){

item.classList.add("active");

}

});

}

window.addEventListener(
"scroll",
revealOnScroll
);

revealOnScroll();
async function loadPoints(){

const phoneVal =
document.getElementById(
"phone"
).value.trim();

if(phoneVal.length < 10)
return;

const data =
await fetch(
"/api/points/" +
phoneVal
)
.then(r=>r.json());

document.getElementById(
"userPoints"
).innerText =
data.points || 0;

}
async function redeemPoints(){

const points = Number(
document.getElementById(
"userPoints"
).innerText
);

if(points < 100){

alert(
"Minimum 100 points required"
);

return;

}

redeemedPoints =
Math.floor(points / 100) * 100;

pointsDiscount =
redeemedPoints / 10;

document.getElementById(
"pointsDiscount"
).innerText =
"Points Discount ₹" +
pointsDiscount;

document.getElementById(
"userPoints"
).innerText =
points - redeemedPoints;

renderCart();

alert(
"Points redeemed successfully"
);

}
window.addEventListener(
"load",
()=>{

const user =
JSON.parse(

localStorage.getItem(
"rupaUser"
)

);

if(!user) return;

const customerInput =
document.getElementById(
"customer"
);

const phoneInput =
document.getElementById(
"phone"
);

if(customerInput){

customerInput.value =
user.name;

}

if(phoneInput){

phoneInput.value =
user.phone;

loadPoints();

}

});
const reorderCart =
JSON.parse(

localStorage.getItem(
"reorderCart"
)

);

if(reorderCart){

cart =
reorderCart;

renderCart();

localStorage.removeItem(
"reorderCart"
);

}
function logoutUser(){

localStorage.removeItem(
"rupaUser"
);

alert(
"Logged Out"
);

location.reload();

}
async function addFavorite(itemId){

const user =
JSON.parse(
localStorage.getItem(
"rupaUser"
)
);

if(!user){

alert(
"Please login first"
);

location.href =
"/login.html";

return;

}

const res =
await fetch(
"/api/favorites",
{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

phone:user.phone,

itemId:itemId

})

});

const data =
await res.json();

if(data.success){

alert(
"Added to Favorites ❤️"
);

}else{

alert(
data.message
);

}

}
function addRecommendation(id){

const item =

menu.find(
m => m.id === id
);

if(!item){
return;
}

addToCart(item);

alert(
item.name +
" added to cart"
);

}
async function loadDeals(){

const coupons =
await fetch(
"/api/coupons"
)
.then(r=>r.json());

const activeCoupons =

coupons.filter(
c => c.active === true
);

const box =
document.getElementById(
"couponDeals"
);

if(!box) return;

box.innerHTML =

activeCoupons.map(c=>`

<div class="card">

<h3>
🎟 ${c.code}
</h3>

<p>
${c.discount}% OFF
</p>

<p>
Min Order ₹${c.minOrder || 0}
</p>

<button
class="btn"
onclick="applyDealCoupon('${c.code}')">

🎟 Apply Coupon

</button>

</div>

`).join("");

}
function copyCoupon(code){

navigator.clipboard
.writeText(code);

alert(
code +
" copied"
);

}
function applyDealCoupon(code){

const couponInput =
document.getElementById(
"couponCode"
);

if(!couponInput){
return;
}

couponInput.value = code;

applyCoupon();

}
async function loadFeaturedCoupon(){

const coupons =
await fetch("/api/coupons")
.then(r=>r.json());

const coupon =

coupons.find(
c => c.active === true
);

const box =
document.getElementById(
"featuredCoupon"
);

if(!box) return;

if(!coupon){

box.style.display = "none";
return;

}

box.innerHTML = `

<h2>
🔥 ${coupon.code}
</h2>

<p>
${coupon.discount}% OFF
</p>

<p>
Minimum Order ₹${coupon.minOrder || 0}
</p>

<button
class="btn"
onclick="applyDealCoupon('${coupon.code}')">

🎟 Apply Coupon

</button>

`;

}
function increaseQty(index){

cart[index].qty++;

renderCart();

updatePopupQty();

}

function decreaseQty(index){

if(!cart[index]){
return;
}

cart[index].qty--;

if(cart[index].qty <= 0){
cart.splice(index,1);
}

renderCart();
updatePopupQty();

}

function goDelivery() {

    const orderType = document.getElementById("orderType");

    if (orderType) {

        orderType.value = "delivery";

        orderType.dispatchEvent(
            new Event("change")
        );

    }

    setTimeout(() => {

        document.getElementById("menu")
            ?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

    }, 100);

}


async function openCouponPopup(){

const popup =
document.getElementById(
"couponPopup"
);

popup.style.display =
"flex";

const coupons =
await fetch(
"/api/coupons"
).then(r=>r.json());

document.getElementById(
"couponPopupList"
).innerHTML =

coupons.map(c=>`

<div
style="
padding:15px;
border:1px solid #ddd;
margin-bottom:10px;
border-radius:10px;
">

<h3>
${c.code}
</h3>

<p>
${c.discount}% OFF
</p>

<button
class="btn"
onclick="
applyDealCoupon('${c.code}');
closeCouponPopup();
">

Apply

</button>

</div>

`).join("");

}
function closeCouponPopup(){

document.getElementById(
"couponPopup"
).style.display =
"none";

}

let locationTimer;

async function searchLocation(){

clearTimeout(locationTimer);

locationTimer = setTimeout(
async ()=>{

const query =

document.getElementById(
"manualLocation"
).value.trim();

if(query.length < 3){

document.getElementById(
"locationSuggestions"
).style.display = "none";

return;

}

const results =
await fetch(

`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`

).then(r=>r.json());

const box =
document.getElementById(
"locationSuggestions"
);

box.innerHTML =

results.slice(0,5).map(place=>`

<div
class="location-item"
onclick="selectLocation(
'${place.display_name.replace(/'/g,"")}',
'${place.lat}',
'${place.lon}'
)">

${place.display_name}

</div>

`).join("");

box.style.display =

results.length
?
"block"
:
"none";

},
400
);

}

function selectLocation(
address,
lat,
lon
){

document.getElementById(
"manualLocation"
).value =
address;

document.getElementById(
"locationSuggestions"
).style.display =
"none";

document.getElementById(
"latitude"
).value =
lat;

document.getElementById(
"longitude"
).value =
lon;

document.getElementById(
"mapLink"
).innerHTML =

`
<b>📍 Delivery Address</b>
<br>
${address}
`;

calculateDelivery(
Number(lat),
Number(lon)
);

}
function goDineIn() {

    const orderType = document.getElementById("orderType");

    if (orderType) {

        orderType.value = "dinein";

        orderType.dispatchEvent(
            new Event("change")
        );

    }

    setTimeout(() => {

        document.getElementById("menu")
            ?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

    }, 100);

}
document.addEventListener(
"DOMContentLoaded",
function(){

if(window.innerWidth > 768){
return;
}

document.body.classList.add(
"social-hidden"
);

const toggleBtn =
document.getElementById(
"socialToggleBtn"
);

if(!toggleBtn){
return;
}

toggleBtn.addEventListener(
"click",
function(){

document.body.classList.toggle(
"social-hidden"
);

}
);

}
);

document.addEventListener("click", function(e){

const nav = document.querySelector(".nav");

const menuBtn =
document.querySelector(".menu-toggle");

if(
window.innerWidth <= 768 &&
nav.classList.contains("show") &&
!nav.contains(e.target) &&
!menuBtn.contains(e.target)
){

nav.classList.remove("show");

document.body.style.overflow = "";
document.body.style.height = "";

}

});

/* AUTO CLOSE MOBILE MENU */

let touchStartY = 0;

document.addEventListener("touchstart", function(e){

    touchStartY = e.touches[0].clientY;

});

document.addEventListener("touchmove", function(e){

    const nav = document.querySelector(".nav");

    if(
        window.innerWidth <= 768 &&
        nav &&
        nav.classList.contains("show")
    ){

        const touchEndY = e.touches[0].clientY;

        const swipeDown = touchEndY - touchStartY > 50;

        if(swipeDown){

            nav.classList.remove("show");

            document.body.style.overflow = "";
            document.body.style.height = "";

        }

    }

});

document.addEventListener(
"DOMContentLoaded",
function(){

const filterBtn =
document.getElementById(
"filterToggleBtn"
);

const wrapper =
document.getElementById(
"categoryFiltersWrapper"
);

if(
!filterBtn ||
!wrapper
){
return;
}

filterBtn.addEventListener(
"click",
function(){

const isOpen =
wrapper.style.display === "block";

if(isOpen){

wrapper.style.display = "none";

filterBtn.innerHTML =
"🔍 Browse Categories";

}else{

wrapper.style.display = "block";

filterBtn.innerHTML =
"🔼 Hide Categories";

}

});

});

/* =========================
   MOBILE HEADER SHOW/HIDE
========================= */

if(window.innerWidth <= 768){

let lastScrollTop = 0;

window.addEventListener(
"scroll",
function(){

const header =
document.querySelector(".header");

if(!header) return;

const currentScroll =
window.pageYOffset ||
document.documentElement.scrollTop;

if(window.innerWidth <= 768){

let lastScrollTop = 0;

window.addEventListener(
"scroll",
function(){

const header =
document.querySelector(".header");

const nav =
document.querySelector(".nav");

if(!header) return;

/* menu open ho to header hamesha visible */
if(
nav &&
nav.classList.contains("show")
){
header.classList.remove(
"header-hidden"
);
return;
}

const currentScroll =
window.pageYOffset ||
document.documentElement.scrollTop;

/* UP = HEADER SHOW */

if(currentScroll < lastScrollTop - 10){

header.classList.remove(
"header-hidden"
);

}

/* DOWN = HEADER HIDE */

else if(currentScroll > lastScrollTop + 10){

header.classList.add(
"header-hidden"
);

}

lastScrollTop =
currentScroll <= 0
? 0
: currentScroll;

},
{ passive:true }
);

}

lastScrollTop =
currentScroll <= 0
? 0
: currentScroll;

},
{ passive:true }
);

}

async function cancelOrder(orderId){

const ok = confirm(
"Are you sure you want to cancel this order?"
);

if(!ok) return;

const res = await fetch(
"/api/order/" + orderId + "/cancel",
{
method:"PUT"
}
);

const data = await res.json();

if(data.success){

alert(
"✅ Order Cancelled Successfully"
);

document.getElementById(
"trackBtn"
).click();

}else{

alert(
data.message ||
"Unable to cancel order"
);

}

}