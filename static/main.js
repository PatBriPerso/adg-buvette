let cart = [];
const cashOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 40, 50];

function renderCart(){
  const cartEl = document.getElementById("cart");
  cartEl.innerHTML = "";
  let total = 0;
  if (cart.length === 0) {
      cartEl.innerHTML = '<li class="list-group-item text-muted">Panier vide. <br/><small><em>Cliquer sur les boutons des produits pour le remplir.</em></small></li>';
  } else {
    cart.forEach((it, idx) => {
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-baseline p-1";
      li.innerHTML = `
                      <div class="fs-4 me-auto"><b>${it.qty}x</b> ${it.name}</div>
                      <div class="m-2">${(it.price*it.qty).toFixed(2)}€</div>
                      <div><button class="btn btn-sm btn-outline-secondary me-1" onclick="dec(${idx})">-</button></div>
                      <div><button class="btn btn-sm btn-outline-secondary" onclick="inc(${idx})">+</button></div>
                      `;
      cartEl.appendChild(li);
      total += it.price * it.qty;
    });
  }
  document.getElementById("total").innerText = total.toFixed(2);

  if (total > 0) {
    document.getElementById("a_payer").innerText = `À payer : ${total.toFixed(2)}€`;
    document.getElementById("a_rendre").innerText = `À rendre :`;
    renderChange();
  } else if (total == 0) {
    document.getElementById("a_payer").innerText = `À payer : 0€`;
    document.getElementById("a_rendre").innerText = `À rendre : 0€`;
    document.getElementById("change-list").innerText = ``;
  } else { // total < 0
    let aRendre = -total;
    document.getElementById("a_payer").innerText = `À payer : 0€`;
    document.getElementById("a_rendre").innerText = `À rendre : ${aRendre.toFixed(2)}€`;
    document.getElementById("change-list").innerText = ``;
  }

}

function renderChange() {
    const changeList = document.getElementById("change-list");
    changeList.innerHTML = "";

    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    if (total === 0) {
        changeList.innerHTML = '<li class="list-group-item text-muted">Panier vide.</li>';
        return;
    }

    const filteredOptions = cashOptions.filter(amount => amount > total);
    if (filteredOptions.length === 0) {
        changeList.innerHTML = '<li class="list-group-item text-muted">Aucun rendu possible</li>';
        return;
    }

    filteredOptions.forEach(amount => {
        const change = (amount - total).toFixed(2);
        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between";
        li.innerHTML = `<span>Sur ${amount}€</span> <strong>${change}€</strong>`;
        changeList.appendChild(li);
    });
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

function messageConfirmationCommande(type) {
  let total = 0;
  let message = "";

  cart.forEach((it, idx) => {
    message += `${it.qty}x ${it.name} = ${(it.price*it.qty).toFixed(2)}€\n`;
    total += it.price * it.qty;
  });

  message = "Commande "+type.toUpperCase()+` pour un total de ${total.toFixed(2)}€\n\n` + message;
  message += "\n\n⚠️ Êtes-vous sûr de vouloir enregistrer cette commande ?";

  return message;
}

function confirmerCommande(type = "standard") {
  if (confirm(messageConfirmationCommande(type))) {
    return true;
  }
  return false;
}

async function enregistrerCommande(type) {
  if (cart.length === 0) {
    alert("Panier vide.");
    return;
  }

  if (! confirmerCommande(type)) {
    return;
  }  

  const boutons = document.querySelectorAll(".btn-commande");

  // Désactiver tous les boutons
  boutons.forEach(btn => {
    btn.disabled = true;
    btn.dataset.originalText = btn.textContent;
    btn.textContent = "Envoi...";
  });

  const payload = { items: cart, type: type };

  try {
    const resp = await fetch("/order", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });

    const j = await resp.json();

    if (resp.ok) {
      cart = [];
      renderCart();
      await loadLastOrders();
    } else {
      alert("⚠️ Erreur: " + (j.error || JSON.stringify(j)));
    }
  } catch (err) {
    alert("⚠️ Commande non enregistrée.\n\nVérifiez votre connexion et recommencez.\n\nMessage : " + err.message);
  } finally {
    // Réactiver tous les boutons quoi qu'il arrive
    boutons.forEach(btn => {
      btn.disabled = false;
      btn.textContent = btn.dataset.originalText;
    });
  }
}

document.getElementById("send_standard").addEventListener("click", () => {
  enregistrerCommande("standard");
});

document.getElementById("send_club").addEventListener("click", () => {
  enregistrerCommande("club");
});

document.getElementById("send_organisateur").addEventListener("click", () => {
  enregistrerCommande("organisateur");
});

async function loadLastOrders() {
  try {
    const resp = await fetch("/last_orders");
    const orders = await resp.json();
    const list = document.getElementById("last-orders");
    list.innerHTML = "";

    if (!orders.length) {
      list.innerHTML = `<li class="list-group-item text-muted">Aucune commande pour le moment.</li>`;
      return;
    }

    orders.forEach(o => {
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between";
      li.innerHTML = `<span>#${o.id} (${o.type})</span> <strong>${o.total.toFixed(2)}€</strong>`;
      list.appendChild(li);
    });
  } catch (err) {
    console.error(err);
  }
}

// Bouton rafraîchir
document.getElementById("refresh-orders").addEventListener("click", loadLastOrders);

loadLastOrders();
renderCart();
