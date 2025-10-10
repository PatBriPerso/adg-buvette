let cart = [];

function renderCart(){
  const cartEl = document.getElementById("cart");
  cartEl.innerHTML = "";
  let total = 0;
  if (cart.length === 0) {
      cartEl.innerHTML = '<li class="list-group-item text-muted">Panier vide. <br/><small><em>Cliquer sur les boutons des produits pour le remplir.</em></small></li>';
  } else {
    cart.forEach((it, idx) => {
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `<div>${it.name} x${it.qty} <small>${(it.price*it.qty).toFixed(2)}€</small></div>
                      <div>
                        <button class="btn btn-sm btn-outline-secondary me-1" onclick="dec(${idx})">-</button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="inc(${idx})">+</button>
                      </div>`;
      cartEl.appendChild(li);
      total += it.price * it.qty;
    });
  }
  document.getElementById("total").innerText = total.toFixed(2);
}

function inc(i){ cart[i].qty++; renderCart(); }
function dec(i){ cart[i].qty--; if(cart[i].qty<=0) cart.splice(i,1); renderCart(); }

document.querySelectorAll(".product-btn").forEach(b => {
  b.addEventListener("click", () => {
    const id = b.dataset.id, name = b.dataset.name, price = parseFloat(b.dataset.price);
    const found = cart.find(x => x.id === id);
    if(found) found.qty++;
    else cart.push({id, name, price, qty: 1});
    renderCart();
  });
});

document.getElementById("clear").addEventListener("click", () => {
  cart = [];
  renderCart();
});

document.getElementById("send").addEventListener("click", async () => {
  if(cart.length === 0){ alert("Panier vide."); return; }
  const payload = { items: cart };
  const resp = await fetch("/order", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(payload)
  });
  const j = await resp.json();
  if(resp.ok){
    alert("Commande enregistrée — total: " + j.total.toFixed(2) + "€");
    cart = [];
    renderCart();
  } else {
    alert("Erreur: " + (j.error || JSON.stringify(j)));
  }
});

renderCart();
