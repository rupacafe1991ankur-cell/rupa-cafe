const user =
JSON.parse(
localStorage.getItem(
"rupaUser"
)
);

if(!user){

location.href =
"/login.html";

}

document.getElementById(
"userName"
).innerText =
user.name;

document.getElementById(
"userPhone"
).innerText =
user.phone;

document.getElementById(
"userEmail"
).innerText =
user.email;
async function loadFavorites(){

const favorites =
await fetch(

"/api/favorites/" +

user.phone

)

.then(r=>r.json());

const menu =
await fetch(
"/api/menu"
)
.then(r=>r.json());

const favItems =

favorites.map(f =>

menu.find(
m =>
String(m.id) ===
String(f.itemId)
)

).filter(Boolean);

document.getElementById(
"favoriteCount"
).innerText =
favItems.length;

document.getElementById(
"favoriteFoods"
).innerHTML =

favItems.length

?

favItems.map(item=>`

<div class="card">
<div style="font-size:24px;">
❤️
</div>
<h3>

${item.name}

</h3>

<p>

${item.category}

</p>

<p>

₹${item.price}

</p>

<button
class="btn"
onclick="removeFavorite(${item.id})">

❌ Remove

</button>

</div>

`).join("")

:

`
<div style="
text-align:center;
padding:20px;
color:#666;
">

<h3>❤️ No Favorite Foods Yet</h3>

<p>
Start exploring the menu and save your favorite dishes.
</p>

</div>
`;
}

loadOrders();
loadPoints();
loadFavorites();
loadNotifications();
async function loadPoints(){

const data =
await fetch(
"/api/points/" +
user.phone
)
.then(r=>r.json());

document.getElementById(
"accountPoints"
).innerText =
data.points || 0;

const points =
data.points || 0;

let tier = "Bronze";

if(points >= 100){
tier = "Silver";
}

if(points >= 500){
tier = "Gold";
}

document.getElementById(
"memberTier"
).innerText =
tier;
}

async function loadOrders(){

const orders =
await fetch(
"/api/orders"
)
.then(r=>r.json());

const myOrders =
orders.filter(
o =>
o.phone === user.phone
);
document.getElementById(
"orderCount"
).innerText =
myOrders.length;
document.getElementById(
"orderHistory"
).innerHTML =

myOrders.map(order=>`

<div class="card">

<h3>

Order #${order.id}

</h3>

<p>

₹${order.total}

</p>

<p class="order-status ${order.status.replace(/\s/g,'')}">

${order.status}

</p>
<button
class="btn"
onclick="downloadInvoice(${order.id})">

📥 Download Invoice

</button>
<button
class="btn"
onclick="reorder(${order.id})">

🔄 Reorder

</button>

</div>

`).join("");

}

async function reorder(id){

const orders =
await fetch(
"/api/orders"
)
.then(r=>r.json());

const order =
orders.find(
o=>o.id===id
);

if(!order){

return;

}

localStorage.setItem(
"reorderCart",
JSON.stringify(
order.items
)
);

alert(
"Items added for reorder"
);

location.href="/";

}
function downloadInvoice(id){

window.open(

"/api/invoice/" + id,

"_blank"

);

}
async function loadNotifications(){

const notifications =
await fetch(

"/api/notifications/" +

user.phone

)

.then(r=>r.json());

document.getElementById(
"notificationCount"
).innerText =
notifications.length;

document.getElementById(
"notificationList"
).innerHTML =

notifications.length

?

notifications.map(n => `

<div class="card">

<p>

${n.message}

</p>

<small>

${n.time}

</small>

</div>

`).join("")

:

"<p>No notifications yet</p>";

}

async function loadCouponCount(){

const coupons =
await fetch(
"/api/coupons"
).then(r=>r.json());

const activeCoupons =

coupons.filter(
c => c.active === true
);

const couponBox =
document.getElementById(
"couponCount"
);

if(couponBox){

couponBox.innerText =
activeCoupons.length;

}

}

loadCouponCount();
async function loadRecentOrders(){

const orders =
await fetch(
"/api/orders"
)
.then(r=>r.json());

const myOrders =

orders

.filter(
o =>
o.phone === user.phone
)

.sort(
(a,b)=>
Number(b.id) -
Number(a.id)
)

.slice(0,3);

const box =
document.getElementById(
"recentOrders"
);

if(!box) return;

if(myOrders.length === 0){

box.innerHTML =
"<p>No recent orders</p>";

return;

}

box.innerHTML =

myOrders.map(order=>`

<div class="card">

<div class="card-body">

<h3>
Order #${String(order.id).slice(-5)}
</h3>

<p>
₹${order.total}
</p>

<p>
${order.status}
</p>

<button
class="btn"
onclick="reorder(${order.id})">

🔄 Order Again

</button>

</div>

</div>

`).join("");

}
loadRecentOrders();
function logoutUser(){

localStorage.removeItem(
"rupaUser"
);

location.href =
"/login.html";

}