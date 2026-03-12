async function loadProduct() {
const params = new URLSearchParams(window.location.search);
const category = params.get("category");
const id = Number(params.get("id"));
try{
const res = await fetch("/api/products");
const data = await res.json();
const outfit = data?.[category]?.find(o => Number(o.id) === id);
if(!outfit){
document.querySelector("#outfitTitle").textContent = "Outfit not found";
return;
}
document.querySelector("#outfitTitle").textContent = outfit.title;
document.getElementById("mainImage").src = outfit.mainImage;
const container = document.getElementById("itemsContainer");
container.innerHTML = "";
outfit.items.forEach(item => {
const card = document.createElement("div");
card.className = "item-card";
card.innerHTML = `
<img src="${item.image}">
<h4>${item.name}</h4>
<p class="price">₹${item.price}</p>
<div class="item-actions">
<button class="cart-btn">Add to Cart</button>
<span class="heart">&#10084;</span>
</div>
`;
container.appendChild(card);
});
initializeHearts();
updateCartButtons();
}catch(err){
console.error(err);
document.querySelector("#outfitTitle").textContent = "Error loading outfit";
}
}
document.addEventListener("DOMContentLoaded", loadProduct);