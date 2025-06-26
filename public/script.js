// Classe para gerenciar os produtos da cantina
class CantinaManager {
    constructor() {
        this.products = JSON.parse(localStorage.getItem('cantinaProducts')) || [];
        this.sales = JSON.parse(localStorage.getItem('cantinaSales')) || [];
        this.fiados = JSON.parse(localStorage.getItem('cantinaFiados')) || [];
        this.cash = JSON.parse(localStorage.getItem('cantinaCash')) || { money: 0, pix: 0 };
        this.currentSale = null;
        this.currentFiado = null;
        this.currentFilter = 'all';
        this.currentFiadoFilter = 'all';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderProducts();
        this.renderSalesHistory();
        this.renderFiados();
        this.updateStats();
        this.updateFiadoProductOptions();
        this.setDefaultFiadoDate();
    }

    setupEventListeners() {
        const form = document.getElementById('productForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addProduct();
        });

        const fiadoForm = document.getElementById('fiadoForm');
        fiadoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addFiado();
        });

        // Event listener para o botão de toggle dos fiados
        document.getElementById('toggleFiadosBtn').addEventListener('click', () => {
            this.toggleFiadosSection();
        });

        // Event listeners para botões de controle
        document.getElementById('clearHistoryBtn').addEventListener('click', () => {
            this.clearSalesHistory();
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('clearFiadosBtn').addEventListener('click', () => {
            this.clearFiados();
        });

        document.getElementById('exportFiadosBtn').addEventListener('click', () => {
            this.exportFiados();
        });

        // Modal event listeners
        const paymentModal = document.getElementById('paymentModal');
        const payFiadoModal = document.getElementById('payFiadoModal');
        const closeBtns = document.querySelectorAll('.close');
        
        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.closePaymentModal();
                this.closePayFiadoModal();
            });
        });

        window.addEventListener('click', (e) => {
            if (e.target === paymentModal) {
                this.closePaymentModal();
            }
            if (e.target === payFiadoModal) {
                this.closePayFiadoModal();
            }
        });

        // Event listeners para fiados
        document.getElementById('fiadoProduct').addEventListener('change', () => {
            this.updateFiadoTotal();
        });

        document.getElementById('fiadoQuantity').addEventListener('input', () => {
            this.updateFiadoTotal();
        });

        // Toggle do formulário de produto
        const toggleProductFormBtn = document.getElementById('toggleProductFormBtn');
        const productFormSection = document.getElementById('productFormSection');
        toggleProductFormBtn.addEventListener('click', () => {
            const isHidden = productFormSection.style.display === 'none';
            productFormSection.style.display = isHidden ? 'block' : 'none';
            toggleProductFormBtn.classList.toggle('active', isHidden);
            toggleProductFormBtn.querySelector('.toggle-text').textContent = isHidden ? 'Ocultar Formulário' : 'Adicionar Produto';
            toggleProductFormBtn.querySelector('.toggle-arrow').textContent = isHidden ? '▲' : '▼';
        });
    }

    toggleFiadosSection() {
        const fiadosSection = document.getElementById('fiadosSection');
        const toggleBtn = document.getElementById('toggleFiadosBtn');
        const toggleText = toggleBtn.querySelector('.toggle-text');
        const toggleArrow = toggleBtn.querySelector('.toggle-arrow');
        
        if (fiadosSection.style.display === 'none') {
            // Mostrar seção
            fiadosSection.style.display = 'block';
            toggleBtn.classList.add('active');
            toggleText.textContent = 'Ocultar Fiados';
            toggleArrow.textContent = '▲';
            
            // Atualizar dados dos fiados quando mostrar
            this.renderFiados();
            this.updateStats();
        } else {
            // Ocultar seção
            fiadosSection.style.display = 'none';
            toggleBtn.classList.remove('active');
            toggleText.textContent = 'Gerenciar Fiados';
            toggleArrow.textContent = '▼';
        }
    }

    setDefaultFiadoDate() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        document.getElementById('fiadoDate').value = tomorrowStr;
    }

    updateFiadoProductOptions() {
        const select = document.getElementById('fiadoProduct');
        select.innerHTML = '<option value="">Selecione um produto</option>';
        
        this.products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} - R$ ${product.price.toFixed(2)}`;
            select.appendChild(option);
        });
    }

    updateFiadoTotal() {
        const productId = document.getElementById('fiadoProduct').value;
        const quantity = parseInt(document.getElementById('fiadoQuantity').value) || 0;
        
        if (productId && quantity > 0) {
            const product = this.products.find(p => p.id == productId);
            if (product) {
                const total = product.price * quantity;
                document.getElementById('fiadoTotal').value = total.toFixed(2);
            }
        } else {
            document.getElementById('fiadoTotal').value = '0.00';
        }
    }

    addProduct() {
        const name = document.getElementById('productName').value.trim();
        const price = parseFloat(document.getElementById('productPrice').value);
        const quantity = parseInt(document.getElementById('productQuantity').value);

        if (!name || isNaN(price) || isNaN(quantity) || price < 0 || quantity < 0) {
            alert('Por favor, preencha todos os campos corretamente!');
            return;
        }

        // Verificar se o produto já existe
        const existingProduct = this.products.find(p => p.name.toLowerCase() === name.toLowerCase());
        if (existingProduct) {
            if (confirm('Este produto já existe! Deseja adicionar a quantidade ao estoque existente?')) {
                existingProduct.quantity += quantity;
                this.saveProducts();
                this.renderProducts();
                this.updateStats();
                this.updateFiadoProductOptions();
                document.getElementById('productForm').reset();
                return;
            } else {
                return;
            }
        }

        const product = {
            id: Date.now(),
            name: name,
            price: price,
            quantity: quantity
        };

        this.products.push(product);
        this.saveProducts();
        this.renderProducts();
        this.updateStats();
        this.updateFiadoProductOptions();
        document.getElementById('productForm').reset();
    }

    addFiado() {
        const name = document.getElementById('fiadoName').value.trim();
        const turma = document.getElementById('fiadoTurma').value.trim();
        const productId = document.getElementById('fiadoProduct').value;
        const quantity = parseInt(document.getElementById('fiadoQuantity').value);
        const total = parseFloat(document.getElementById('fiadoTotal').value);
        const date = document.getElementById('fiadoDate').value;

        if (!name || !turma || !productId || !quantity || !total || !date) {
            alert('Por favor, preencha todos os campos corretamente!');
            return;
        }

        const product = this.products.find(p => p.id == productId);
        if (!product) {
            alert('Produto não encontrado!');
            return;
        }

        if (quantity > product.quantity) {
            alert('Quantidade solicitada maior que o estoque disponível!');
            return;
        }

        // Diminuir estoque
        product.quantity -= quantity;

        const fiado = {
            id: Date.now(),
            name: name,
            turma: turma,
            productId: productId,
            productName: product.name,
            quantity: quantity,
            total: total,
            date: date,
            status: 'pending',
            createdAt: new Date().toLocaleString('pt-BR'),
            timestamp: Date.now()
        };

        this.fiados.unshift(fiado);
        this.saveProducts();
        this.saveFiados();
        this.renderProducts();
        this.renderFiados();
        this.updateStats();
        this.updateFiadoProductOptions();
        document.getElementById('fiadoForm').reset();
        this.setDefaultFiadoDate();

        // Feedback visual
        this.showFiadoNotification(name, total);
    }

    showFiadoNotification(name, total) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ffc107;
            color: #212529;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        notification.innerHTML = `
            <div style="font-weight: 600;"><i class='fa-solid fa-clipboard-list'></i> Fiado adicionado!</div>
            <div style="font-size: 0.9em;">${name} - R$ ${total.toFixed(2)}</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    sellProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product && product.quantity > 0) {
            this.currentSale = {
                productId: productId,
                product: product
            };
            this.showPaymentModal(product);
        }
    }

    showPaymentModal(product) {
        const modal = document.getElementById('paymentModal');
        const productName = document.getElementById('modalProductName');
        const productPrice = document.getElementById('modalProductPrice');
        const saleQuantity = document.getElementById('saleQuantity');

        productName.textContent = product.name;
        productPrice.textContent = `R$ ${product.price.toFixed(2)} por unidade`;
        
        // Resetar quantidade para 1 e atualizar total
        saleQuantity.value = 1;
        saleQuantity.max = product.quantity;
        this.updateSaleTotal();
        
        modal.style.display = 'block';
    }

    closePaymentModal() {
        const modal = document.getElementById('paymentModal');
        modal.style.display = 'none';
        this.currentSale = null;
    }

    closePayFiadoModal() {
        const modal = document.getElementById('payFiadoModal');
        modal.style.display = 'none';
        this.currentFiado = null;
    }

    changeSaleQuantity(change) {
        const saleQuantity = document.getElementById('saleQuantity');
        const currentQuantity = parseInt(saleQuantity.value) || 1;
        const newQuantity = currentQuantity + change;
        
        if (newQuantity >= 1 && newQuantity <= this.currentSale.product.quantity) {
            saleQuantity.value = newQuantity;
            this.updateSaleTotal();
        }
    }

    updateSaleTotal() {
        if (!this.currentSale) return;
        
        const saleQuantity = document.getElementById('saleQuantity');
        const quantity = parseInt(saleQuantity.value) || 1;
        const totalPrice = this.currentSale.product.price * quantity;
        
        document.getElementById('modalTotalPrice').textContent = `R$ ${totalPrice.toFixed(2)}`;
    }

    confirmSale(paymentMethod) {
        if (!this.currentSale) return;

        const product = this.currentSale.product;
        const saleQuantity = document.getElementById('saleQuantity');
        const quantity = parseInt(saleQuantity.value) || 1;
        
        // Verificar se há estoque suficiente
        if (quantity > product.quantity) {
            alert('Quantidade solicitada maior que o estoque disponível!');
            return;
        }
        
        // Diminuir quantidade
        product.quantity -= quantity;
        
        // Adicionar ao caixa baseado no método de pagamento
        const totalValue = product.price * quantity;
        if (paymentMethod === 'money') {
            this.cash.money += totalValue;
        } else if (paymentMethod === 'pix') {
            this.cash.pix += totalValue;
        }
        
        // Registrar venda
        const sale = {
            id: Date.now(),
            productName: product.name,
            price: product.price,
            quantity: quantity,
            totalValue: totalValue,
            paymentMethod: paymentMethod,
            date: new Date().toLocaleString('pt-BR'),
            timestamp: Date.now()
        };
        
        this.sales.unshift(sale); // Adicionar no início da lista
        
        // Salvar dados
        this.saveProducts();
        this.saveSales();
        this.saveCash();
        
        // Atualizar interface
        this.renderProducts();
        this.renderSalesHistory();
        this.updateStats();
        
        // Fechar modal
        this.closePaymentModal();
        
        // Feedback visual
        this.showSaleNotification(product.name, totalValue, paymentMethod, quantity);
    }

    showSaleNotification(productName, totalValue, paymentMethod, quantity) {
        const paymentIcon = paymentMethod === 'money' ? "<i class='fa-solid fa-money-bill-wave'></i>" : "<i class='fa-solid fa-mobile-alt'></i>";
        const paymentText = paymentMethod === 'money' ? 'Dinheiro' : 'PIX';
        const quantityText = quantity > 1 ? ` (${quantity}x)` : '';
        
        // Criar notificação temporária
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${paymentMethod === 'money' ? '#28a745' : '#17a2b8'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        notification.innerHTML = `
            <div style="font-weight: 600;"><i class='fa-solid fa-circle-check'></i> Venda realizada!</div>
            <div style="font-size: 0.9em;">${productName}${quantityText} - R$ ${totalValue.toFixed(2)}</div>
            <div style="font-size: 0.8em; margin-top: 5px;">${paymentIcon} ${paymentText}</div>
        `;
        
        document.body.appendChild(notification);
        
        // Remover após 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    payFiado(fiadoId) {
        const fiado = this.fiados.find(f => f.id === fiadoId);
        if (fiado && fiado.status === 'pending') {
            this.currentFiado = fiado;
            this.showPayFiadoModal(fiado);
        }
    }

    showPayFiadoModal(fiado) {
        const modal = document.getElementById('payFiadoModal');
        const fiadoName = document.getElementById('modalFiadoName');
        const fiadoDetails = document.getElementById('modalFiadoDetails');
        const fiadoTotal = document.getElementById('modalFiadoTotal');

        fiadoName.textContent = fiado.name;
        fiadoDetails.textContent = `${fiado.productName} (${fiado.quantity}x) - ${fiado.turma}`;
        fiadoTotal.textContent = `R$ ${fiado.total.toFixed(2)}`;

        modal.style.display = 'block';
    }

    confirmFiadoPayment(paymentMethod) {
        if (!this.currentFiado) return;

        const fiado = this.currentFiado;
        
        // Adicionar ao caixa baseado no método de pagamento
        if (paymentMethod === 'money') {
            this.cash.money += fiado.total;
        } else if (paymentMethod === 'pix') {
            this.cash.pix += fiado.total;
        }
        
        // Marcar fiado como pago
        fiado.status = 'paid';
        fiado.paymentMethod = paymentMethod;
        fiado.paidAt = new Date().toLocaleString('pt-BR');
        
        // Registrar venda
        const sale = {
            id: Date.now(),
            productName: fiado.productName,
            price: fiado.total / fiado.quantity,
            quantity: fiado.quantity,
            totalValue: fiado.total,
            paymentMethod: paymentMethod,
            date: new Date().toLocaleString('pt-BR'),
            timestamp: Date.now(),
            isFiado: true,
            fiadoName: fiado.name
        };
        
        this.sales.unshift(sale);
        
        // Salvar dados
        this.saveFiados();
        this.saveSales();
        this.saveCash();
        
        // Atualizar interface
        this.renderFiados();
        this.renderSalesHistory();
        this.updateStats();
        
        // Fechar modal
        this.closePayFiadoModal();
        
        // Feedback visual
        this.showFiadoPaymentNotification(fiado.name, fiado.total, paymentMethod);
    }

    showFiadoPaymentNotification(name, total, paymentMethod) {
        const paymentIcon = paymentMethod === 'money' ? "<i class='fa-solid fa-money-bill-wave'></i>" : "<i class='fa-solid fa-mobile-alt'></i>";
        const paymentText = paymentMethod === 'money' ? 'Dinheiro' : 'PIX';
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        notification.innerHTML = `
            <div style="font-weight: 600;"><i class='fa-solid fa-circle-check'></i> Fiado pago!</div>
            <div style="font-size: 0.9em;">${name} - R$ ${total.toFixed(2)}</div>
            <div style="font-size: 0.8em; margin-top: 5px;">${paymentIcon} ${paymentText}</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    deleteFiado(fiadoId) {
        const fiado = this.fiados.find(f => f.id === fiadoId);
        if (fiado && confirm(`Tem certeza que deseja remover o fiado de ${fiado.name}?`)) {
            // Restaurar estoque se ainda não foi pago
            if (fiado.status === 'pending') {
                const product = this.products.find(p => p.id == fiado.productId);
                if (product) {
                    product.quantity += fiado.quantity;
                    this.saveProducts();
                    this.renderProducts();
                    this.updateFiadoProductOptions();
                }
            }
            
            this.fiados = this.fiados.filter(f => f.id !== fiadoId);
            this.saveFiados();
            this.renderFiados();
            this.updateStats();
        }
    }

    filterSales(filterType) {
        this.currentFilter = filterType;
        
        // Atualizar botões ativos
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`filter${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`).classList.add('active');
        
        // Renderizar histórico filtrado
        this.renderSalesHistory();
    }

    filterFiados(filterType) {
        this.currentFiadoFilter = filterType;
        
        // Atualizar botões ativos
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`filterFiados${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`).classList.add('active');
        
        // Renderizar fiados filtrados
        this.renderFiados();
    }

    getFilteredSales() {
        if (this.currentFilter === 'all') {
            return this.sales;
        } else {
            return this.sales.filter(sale => sale.paymentMethod === this.currentFilter);
        }
    }

    getFilteredFiados() {
        if (this.currentFiadoFilter === 'all') {
            return this.fiados;
        } else {
            return this.fiados.filter(fiado => fiado.status === this.currentFiadoFilter);
        }
    }

    updateQuantity(productId, change) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            const newQuantity = product.quantity + change;
            if (newQuantity >= 0) {
                product.quantity = newQuantity;
                this.saveProducts();
                this.renderProducts();
                this.updateStats();
                this.updateFiadoProductOptions();
            } else {
                alert('A quantidade não pode ser menor que zero!');
            }
        }
    }

    deleteProduct(productId) {
        if (confirm('Tem certeza que deseja remover este produto?')) {
            this.products = this.products.filter(p => p.id !== productId);
            this.saveProducts();
            this.renderProducts();
            this.updateStats();
            this.updateFiadoProductOptions();
        }
    }

    clearSalesHistory() {
        if (confirm('Tem certeza que deseja limpar todo o histórico de vendas? Esta ação não pode ser desfeita.')) {
            this.sales = [];
            this.cash = { money: 0, pix: 0 };
            this.saveSales();
            this.saveCash();
            this.renderSalesHistory();
            this.updateStats();
        }
    }

    clearFiados() {
        if (confirm('Tem certeza que deseja limpar todos os fiados? Esta ação não pode ser desfeita.')) {
            // Restaurar estoque de fiados pendentes
            this.fiados.forEach(fiado => {
                if (fiado.status === 'pending') {
                    const product = this.products.find(p => p.id == fiado.productId);
                    if (product) {
                        product.quantity += fiado.quantity;
                    }
                }
            });
            
            this.fiados = [];
            this.saveFiados();
            this.saveProducts();
            this.renderFiados();
            this.renderProducts();
            this.updateStats();
            this.updateFiadoProductOptions();
        }
    }

    exportData() {
        const data = {
            products: this.products,
            sales: this.sales,
            fiados: this.fiados,
            cash: this.cash,
            exportDate: new Date().toLocaleString('pt-BR')
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cantina-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    exportFiados() {
        const data = {
            fiados: this.fiados,
            exportDate: new Date().toLocaleString('pt-BR')
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cantina-fiados-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    getTodaySales() {
        const today = new Date().toDateString();
        return this.sales.filter(sale => {
            const saleDate = new Date(sale.timestamp).toDateString();
            return saleDate === today;
        }).length;
    }

    getPendingFiados() {
        return this.fiados.filter(fiado => fiado.status === 'pending').length;
    }

    updateStats() {
        const stats = this.getStats();
        const totalCash = this.cash.money + this.cash.pix;
        
        document.getElementById('totalCash').textContent = `R$ ${totalCash.toFixed(2)}`;
        document.getElementById('cashMoney').textContent = `R$ ${this.cash.money.toFixed(2)}`;
        document.getElementById('cashPix').textContent = `R$ ${this.cash.pix.toFixed(2)}`;
        document.getElementById('totalProducts').textContent = stats.totalItems;
        document.getElementById('todaySales').textContent = this.getTodaySales();
        document.getElementById('pendingFiados').textContent = this.getPendingFiados();
    }

    saveProducts() {
        localStorage.setItem('cantinaProducts', JSON.stringify(this.products));
    }

    saveSales() {
        localStorage.setItem('cantinaSales', JSON.stringify(this.sales));
    }

    saveFiados() {
        localStorage.setItem('cantinaFiados', JSON.stringify(this.fiados));
    }

    saveCash() {
        localStorage.setItem('cantinaCash', JSON.stringify(this.cash));
    }

    renderProducts() {
        const productsList = document.getElementById('productsList');
        
        if (this.products.length === 0) {
            productsList.innerHTML = '<div class="empty-message">Nenhum produto cadastrado ainda. Adicione seu primeiro produto!</div>';
            return;
        }

        productsList.innerHTML = this.products.map(product => `
            <div class="product-card">
                <div class="product-name">${product.name}</div>
                <div class="product-price">R$ ${product.price.toFixed(2)}</div>
                <div class="product-quantity">Quantidade: ${product.quantity} unidades</div>
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="cantinaManager.updateQuantity(${product.id}, -1)">-</button>
                    <span class="quantity-display">${product.quantity}</span>
                    <button class="quantity-btn" onclick="cantinaManager.updateQuantity(${product.id}, 1)">+</button>
                </div>
                <button class="sell-btn" onclick="cantinaManager.sellProduct(${product.id})" ${product.quantity === 0 ? 'disabled' : ''}>
                    ${product.quantity === 0 ? 'Sem estoque' : 'Vender Produto'}
                </button>
                <button class="delete-btn" onclick="cantinaManager.deleteProduct(${product.id})" style="margin-top: 16px;"><i class='fa-solid fa-trash'></i></button>
                <div style="font-size: 0.9em; color: #666; margin-top: 10px;">
                    Valor total em estoque: R$ ${(product.price * product.quantity).toFixed(2)}
                </div>
            </div>
        `).join('');
    }

    renderFiados() {
        const fiadosList = document.getElementById('fiadosList');
        const filteredFiados = this.getFilteredFiados();
        
        // Atualizar resumo dos fiados filtrados
        this.updateFiadosSummary(filteredFiados);
        
        if (filteredFiados.length === 0) {
            const filterText = this.currentFiadoFilter === 'all' ? 'fiados registrados' : 
                             this.currentFiadoFilter === 'pending' ? 'fiados pendentes' : 'fiados pagos';
            fiadosList.innerHTML = `<div class="empty-fiados">Nenhum ${filterText} ainda.</div>`;
            return;
        }

        fiadosList.innerHTML = filteredFiados.map(fiado => {
            const today = new Date();
            const dueDate = new Date(fiado.date);
            const isOverdue = dueDate < today && fiado.status === 'pending';
            const statusClass = fiado.status === 'paid' ? 'paid' : isOverdue ? 'overdue' : '';
            const statusText = fiado.status === 'paid' ? '<i class="fa-solid fa-circle-check"></i> Pago' : isOverdue ? '<i class="fa-regular fa-clock"></i> Atrasado' : '<i class="fa-regular fa-hourglass-half"></i> Pendente';
            const statusClassText = fiado.status === 'paid' ? 'paid' : isOverdue ? 'overdue' : 'pending';
            
            return `
                <div class="fiado-item ${statusClass}">
                    <div class="fiado-info">
                        <div class="fiado-name">
                            ${fiado.name}
                            <span class="fiado-status ${statusClassText}">${statusText}</span>
                        </div>
                        <div class="fiado-turma">${fiado.turma}</div>
                        <div class="fiado-product">${fiado.productName} (${fiado.quantity}x)</div>
                        <div class="fiado-date">Data para pagar: ${new Date(fiado.date).toLocaleDateString('pt-BR')}</div>
                    </div>
                    <div class="fiado-price">R$ ${fiado.total.toFixed(2)}</div>
                    <div class="fiado-actions">
                        ${fiado.status === 'pending' ? 
                            `<button class="pay-btn" onclick="cantinaManager.payFiado(${fiado.id})">Pagar</button>` : 
                            ''
                        }
                        <button class="delete-fiado-btn" onclick="cantinaManager.deleteFiado(${fiado.id})"><i class='fa-solid fa-trash'></i></button>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateFiadosSummary(fiados) {
        const totalCount = fiados.length;
        const pendingValue = fiados.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.total, 0);
        const paidValue = fiados.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.total, 0);
        
        document.getElementById('totalFiadosCount').textContent = totalCount;
        document.getElementById('pendingFiadosValue').textContent = `R$ ${pendingValue.toFixed(2)}`;
        document.getElementById('paidFiadosValue').textContent = `R$ ${paidValue.toFixed(2)}`;
    }

    renderSalesHistory() {
        const salesHistory = document.getElementById('salesHistory');
        const filteredSales = this.getFilteredSales();
        
        // Atualizar resumo das vendas filtradas
        this.updateSalesSummary(filteredSales);
        
        if (filteredSales.length === 0) {
            const filterText = this.currentFilter === 'all' ? 'vendas registradas' : 
                             this.currentFilter === 'money' ? 'vendas em dinheiro' : 'vendas em PIX';
            salesHistory.innerHTML = `<div class="empty-sales">Nenhuma ${filterText} ainda.</div>`;
            return;
        }

        salesHistory.innerHTML = filteredSales.map(sale => {
            const quantityText = sale.quantity > 1 ? ` (${sale.quantity}x)` : '';
            const fiadoText = sale.isFiado ? ` - Fiado: ${sale.fiadoName}` : '';
            const paymentIcon = sale.paymentMethod === 'money' ? '<i class="fa-solid fa-money-bill-wave"></i>' : '<i class="fa-solid fa-mobile-alt"></i>';
            return `
                <div class="sale-item">
                    <div class="sale-info">
                        <div class="sale-product">
                            ${sale.productName}${quantityText}${fiadoText}
                            <span class="sale-payment ${sale.paymentMethod}">
                                ${paymentIcon} ${sale.paymentMethod === 'money' ? 'Dinheiro' : 'PIX'}
                            </span>
                        </div>
                        <div class="sale-details">Vendido em: ${sale.date}</div>
                    </div>
                    <div class="sale-price">R$ ${sale.totalValue ? sale.totalValue.toFixed(2) : sale.price.toFixed(2)}</div>
                </div>
            `;
        }).join('');
    }

    updateSalesSummary(sales) {
        const totalCount = sales.length;
        const totalValue = sales.reduce((sum, sale) => sum + (sale.totalValue || sale.price), 0);
        
        document.getElementById('totalSalesCount').textContent = totalCount;
        document.getElementById('totalSalesValue').textContent = `R$ ${totalValue.toFixed(2)}`;
    }

    // Método para obter estatísticas gerais
    getStats() {
        const totalProducts = this.products.length;
        const totalItems = this.products.reduce((sum, product) => sum + product.quantity, 0);
        const totalValue = this.products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
        
        return {
            totalProducts,
            totalItems,
            totalValue
        };
    }
}

// Adicionar estilos CSS para animações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Inicializar o gerenciador quando a página carregar
let cantinaManager;
document.addEventListener('DOMContentLoaded', () => {
    cantinaManager = new CantinaManager();
    
    // Adicionar alguns produtos de exemplo se não houver nenhum
    if (cantinaManager.products.length === 0) {
        const sampleProducts = [
            { name: 'Coca-Cola 350ml', price: 4.50, quantity: 20 },
            { name: 'Salgadinho Doritos', price: 3.80, quantity: 15 },
            { name: 'Chocolate KitKat', price: 2.50, quantity: 25 }
        ];
        
        sampleProducts.forEach(product => {
            product.id = Date.now() + Math.random();
            cantinaManager.products.push(product);
        });
        
        cantinaManager.saveProducts();
        cantinaManager.renderProducts();
        cantinaManager.updateStats();
    }
});
