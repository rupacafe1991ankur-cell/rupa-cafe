
const ADMIN_KEY =
localStorage.getItem("adminKey");

if(
  !ADMIN_KEY &&
  !location.pathname.includes("login.html")
){
  location.href="/admin/login.html";
}

function getAdminHeaders(){
  return {
    "Content-Type":"application/json",
    "x-admin-key": ADMIN_KEY
  };
}

function logout(){
  localStorage.removeItem("adminKey");
  location.href="/admin/login.html";
}


async function loadStoreStatus(){

  const site =
  await fetch("/api/site")
  .then(r=>r.json());

  const btn =
  document.getElementById(
    "storeToggleBtn"
  );

  const text =
  document.getElementById(
    "storeStatusText"
  );

  if(!btn || !text) return;

  const closed =
  site.storeClosed === true;

  btn.innerText =
  closed
  ?
  "🟢 Open Store"
  :
  "🔴 Close Store";

  text.innerHTML =
  closed
  ?
  "<b style='color:red'>Store Closed</b>"
  :
  "<b style='color:green'>Store Open</b>";
}

async function toggleStoreStatus(){

  const site =
  await fetch("/api/site")
  .then(r=>r.json());

  site.storeClosed =
  !site.storeClosed;

  await fetch(
  "/api/site",
  {
    method:"PUT",
    headers:getAdminHeaders(),
    body:JSON.stringify(site)
  }
);
  loadStoreStatus();
}

window.addEventListener(
  "load",
  loadStoreStatus
);