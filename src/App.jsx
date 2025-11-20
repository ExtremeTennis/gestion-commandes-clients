import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check, Package, Users, CreditCard, Send, Download, Edit, X, MapPin, Star } from 'lucide-react';
import { supabase } from './supabaseClient';
import jsPDF from 'jspdf';

function App() {
  // États
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // État pour gérer le mode (commande ou paiement)
  const [activeMode, setActiveMode] = useState('commande'); // 'commande' ou 'paiement'

  // États pour le système de paiement indépendant
  const [paymentClients, setPaymentClients] = useState([]);
  const [paymentOrders, setPaymentOrders] = useState([]);
  const [paymentTransactions, setPaymentTransactions] = useState([]);
  const [selectedPaymentClient, setSelectedPaymentClient] = useState(null);
  const [showNewPaymentClient, setShowNewPaymentClient] = useState(false);
  const [newPaymentClient, setNewPaymentClient] = useState({ name: '' });
  const [showNewPaymentOrder, setShowNewPaymentOrder] = useState(false);
  const [newPaymentOrder, setNewPaymentOrder] = useState({
    clientId: '',
    reference: '',
    orderNumber: '',
    amount: '',
    shipped: false,
    date: new Date().toISOString().split('T')[0]
  });
  const [showNewPaymentTransaction, setShowNewPaymentTransaction] = useState(false);
  const [newPaymentTransaction, setNewPaymentTransaction] = useState({
    clientId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  // États pour l'édition des commandes et paiements du système de paiement
  const [editingPaymentOrder, setEditingPaymentOrder] = useState(null);
  const [editPaymentOrderForm, setEditPaymentOrderForm] = useState({
    reference: '',
    orderNumber: '',
    amount: '',
    shipped: false,
    date: ''
  });
  const [editingPaymentTransaction, setEditingPaymentTransaction] = useState(null);
  const [editPaymentTransactionForm, setEditPaymentTransactionForm] = useState({
    amount: '',
    date: '',
    note: ''
  });

  // États pour le dashboard
  const [dashboardPeriod, setDashboardPeriod] = useState('all'); // all, year, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // États pour le formulaire de nouvelle commande
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState('');

  // États pour l'édition d'adresse
  const [editingAddress, setEditingAddress] = useState(null);
  const [editAddressForm, setEditAddressForm] = useState({ label: '', address: '' });

  // États pour nouveau client
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '' });

  // États pour nouveau produit
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '' });
  const [productVariants, setProductVariants] = useState([{ name: '', priceAdjustment: 0 }]);
  const [hasVariants, setHasVariants] = useState(false);

  // États pour nouveau paiement
  const [showNewPaymentForm, setShowNewPaymentForm] = useState(false);
  const [newPayment, setNewPayment] = useState({ clientId: '', amount: '', date: new Date().toISOString().split('T')[0], note: '' });

  // États pour la fusion de commandes
  const [selectedPackedOrders, setSelectedPackedOrders] = useState({});
  const [selectedPendingOrders, setSelectedPendingOrders] = useState({});

  // État pour l'autocomplétion produits
  const [productSearch, setProductSearch] = useState('');
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState('');

  // États pour création rapide de produit dans nouvelle commande
  const [showQuickProductForm, setShowQuickProductForm] = useState(false);
  const [quickProduct, setQuickProduct] = useState({ name: '', price: '' });
  const [quickProductVariants, setQuickProductVariants] = useState([{ name: '', priceAdjustment: 0 }]);
  const [quickHasVariants, setQuickHasVariants] = useState(false);

  // États pour l'édition de produits dans les commandes
  const [editingOrderItem, setEditingOrderItem] = useState(null);
  const [editItemForm, setEditItemForm] = useState({ quantity: 0, price: 0 });

  // États pour l'ajout de produit à une commande existante
  const [addingProductToOrder, setAddingProductToOrder] = useState(null);
  const [addProductForm, setAddProductForm] = useState({ productSearch: '', selectedProduct: '', selectedVariant: '', quantity: 1, customPrice: '' });
  const [showAddProductSuggestions, setShowAddProductSuggestions] = useState(false);

  // États pour l'expédition avec transporteur et suivi
  const [shippingForm, setShippingForm] = useState({ orderId: null, carrier: '', trackingNumbers: [''] });
  const [showShippingForm, setShowShippingForm] = useState(false);

  // États pour le changement d'adresse dans packed orders
  const [changingPackedAddress, setChangingPackedAddress] = useState(null);

  // États pour l'édition d'adresse client
  const [editingClientAddress, setEditingClientAddress] = useState(null);
  const [editClientAddressForm, setEditClientAddressForm] = useState({ label: '', address: '' });

  // États pour la modale de sélection rapide des déclinaisons
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [variantsModalProduct, setVariantsModalProduct] = useState(null);
  const [variantsQuantities, setVariantsQuantities] = useState({});

  // Charger toutes les données au démarrage
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadProducts(),
        loadClients(),
        loadOrders(),
        loadPayments(),
        loadPaymentClients(),
        loadPaymentOrders(),
        loadPaymentTransactions()
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    }
  };

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    }
  };

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
    }
  };

  const loadPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Erreur chargement paiements:', error);
    }
  };

  // ========== GESTION DU SYSTÈME DE PAIEMENT INDÉPENDANT ==========

  const loadPaymentClients = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_clients')
        .select('*')
        .order('name');

      if (error) throw error;
      setPaymentClients(data || []);
    } catch (error) {
      console.error('Erreur chargement clients paiement:', error);
    }
  };

  const loadPaymentOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_orders')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setPaymentOrders(data || []);
    } catch (error) {
      console.error('Erreur chargement commandes paiement:', error);
    }
  };

  const loadPaymentTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setPaymentTransactions(data || []);
    } catch (error) {
      console.error('Erreur chargement transactions paiement:', error);
    }
  };

  const addPaymentClient = async () => {
    if (!newPaymentClient.name) {
      alert('Veuillez renseigner le nom du client');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('payment_clients')
        .insert([{ name: newPaymentClient.name }])
        .select();

      if (error) throw error;

      await loadPaymentClients();
      setNewPaymentClient({ name: '' });
      setShowNewPaymentClient(false);
    } catch (error) {
      console.error('Erreur ajout client paiement:', error);
      alert('Erreur lors de l\'ajout du client: ' + error.message);
    }
  };

  const addPaymentOrder = async () => {
    if (!newPaymentOrder.clientId || !newPaymentOrder.reference || !newPaymentOrder.orderNumber || !newPaymentOrder.amount) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const { error } = await supabase
        .from('payment_orders')
        .insert([{
          client_id: parseInt(newPaymentOrder.clientId),
          reference: newPaymentOrder.reference,
          order_number: newPaymentOrder.orderNumber,
          amount: parseFloat(newPaymentOrder.amount),
          shipped: newPaymentOrder.shipped,
          date: newPaymentOrder.date
        }]);

      if (error) throw error;

      await loadPaymentOrders();
      setNewPaymentOrder({
        clientId: '',
        reference: '',
        orderNumber: '',
        amount: '',
        shipped: false,
        date: new Date().toISOString().split('T')[0]
      });
      setShowNewPaymentOrder(false);
    } catch (error) {
      console.error('Erreur ajout commande paiement:', error);
      alert('Erreur lors de l\'ajout de la commande');
    }
  };

  const addPaymentTransaction = async () => {
    if (!newPaymentTransaction.clientId || !newPaymentTransaction.amount || !newPaymentTransaction.date) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const { error } = await supabase
        .from('payment_transactions')
        .insert([{
          client_id: parseInt(newPaymentTransaction.clientId),
          amount: parseFloat(newPaymentTransaction.amount),
          date: newPaymentTransaction.date,
          note: newPaymentTransaction.note
        }]);

      if (error) throw error;

      await loadPaymentTransactions();
      setNewPaymentTransaction({
        clientId: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        note: ''
      });
      setShowNewPaymentTransaction(false);
    } catch (error) {
      console.error('Erreur ajout transaction paiement:', error);
      alert('Erreur lors de l\'ajout du paiement');
    }
  };

  const deletePaymentClient = async (id) => {
    if (!confirm('Supprimer ce client ? Toutes ses commandes et paiements seront également supprimés.')) return;

    try {
      const { error } = await supabase
        .from('payment_clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await Promise.all([
        loadPaymentClients(),
        loadPaymentOrders(),
        loadPaymentTransactions()
      ]);
      setSelectedPaymentClient(null);
    } catch (error) {
      console.error('Erreur suppression client:', error);
    }
  };

  const deletePaymentOrder = async (id) => {
    if (!confirm('Supprimer cette commande ?')) return;

    try {
      const { error } = await supabase
        .from('payment_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadPaymentOrders();
    } catch (error) {
      console.error('Erreur suppression commande:', error);
    }
  };

  const deletePaymentTransaction = async (id) => {
    if (!confirm('Supprimer ce paiement ?')) return;

    try {
      const { error } = await supabase
        .from('payment_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadPaymentTransactions();
    } catch (error) {
      console.error('Erreur suppression paiement:', error);
    }
  };

  const updatePaymentOrder = async () => {
    if (!editPaymentOrderForm.reference || !editPaymentOrderForm.orderNumber || !editPaymentOrderForm.amount) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const { error } = await supabase
        .from('payment_orders')
        .update({
          reference: editPaymentOrderForm.reference,
          order_number: editPaymentOrderForm.orderNumber,
          amount: parseFloat(editPaymentOrderForm.amount),
          shipped: editPaymentOrderForm.shipped,
          date: editPaymentOrderForm.date
        })
        .eq('id', editingPaymentOrder);

      if (error) throw error;

      await loadPaymentOrders();
      setEditingPaymentOrder(null);
      setEditPaymentOrderForm({
        reference: '',
        orderNumber: '',
        amount: '',
        shipped: false,
        date: ''
      });
    } catch (error) {
      console.error('Erreur mise à jour commande:', error);
      alert('Erreur lors de la mise à jour de la commande');
    }
  };

  const updatePaymentTransaction = async () => {
    if (!editPaymentTransactionForm.amount || !editPaymentTransactionForm.date) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const { error } = await supabase
        .from('payment_transactions')
        .update({
          amount: parseFloat(editPaymentTransactionForm.amount),
          date: editPaymentTransactionForm.date,
          note: editPaymentTransactionForm.note
        })
        .eq('id', editingPaymentTransaction);

      if (error) throw error;

      await loadPaymentTransactions();
      setEditingPaymentTransaction(null);
      setEditPaymentTransactionForm({
        amount: '',
        date: '',
        note: ''
      });
    } catch (error) {
      console.error('Erreur mise à jour transaction:', error);
      alert('Erreur lors de la mise à jour du paiement');
    }
  };

  const startEditingPaymentOrder = (order) => {
    setEditingPaymentOrder(order.id);
    setEditPaymentOrderForm({
      reference: order.reference,
      orderNumber: order.order_number,
      amount: order.amount.toString(),
      shipped: order.shipped,
      date: order.date
    });
  };

  const cancelEditingPaymentOrder = () => {
    setEditingPaymentOrder(null);
    setEditPaymentOrderForm({
      reference: '',
      orderNumber: '',
      amount: '',
      shipped: false,
      date: ''
    });
  };

  const startEditingPaymentTransaction = (transaction) => {
    setEditingPaymentTransaction(transaction.id);
    setEditPaymentTransactionForm({
      amount: transaction.amount.toString(),
      date: transaction.date,
      note: transaction.note || ''
    });
  };

  const cancelEditingPaymentTransaction = () => {
    setEditingPaymentTransaction(null);
    setEditPaymentTransactionForm({
      amount: '',
      date: '',
      note: ''
    });
  };

  const getPaymentClientBalance = (clientId) => {
    const clientOrders = paymentOrders.filter(o => o.client_id === clientId);
    const totalOrders = clientOrders.reduce((sum, o) => sum + parseFloat(o.amount), 0);
    const clientTransactions = paymentTransactions.filter(t => t.client_id === clientId);
    const totalPayments = clientTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    return totalPayments - totalOrders;
  };

  // ========== GESTION DES PRODUITS ==========

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    // Validation des déclinaisons
    if (hasVariants) {
      const validVariants = productVariants.filter(v => v.name.trim() !== '');
      if (validVariants.length === 0) {
        alert('Veuillez ajouter au moins une déclinaison ou décocher l\'option');
        return;
      }
    }

    try {
      const productData = {
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        variants: hasVariants ? productVariants.filter(v => v.name.trim() !== '') : null
      };

      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select();

      if (error) throw error;

      await loadProducts();
      setNewProduct({ name: '', price: '' });
      setProductVariants([{ name: '', priceAdjustment: 0 }]);
      setHasVariants(false);
      setShowNewProductForm(false);
    } catch (error) {
      console.error('Erreur ajout produit:', error);
      alert('Erreur lors de l\'ajout du produit');
    }
  };

  const addVariantField = () => {
    setProductVariants([...productVariants, { name: '', priceAdjustment: 0 }]);
  };

  const updateVariant = (index, field, value) => {
    const newVariants = [...productVariants];
    newVariants[index][field] = field === 'priceAdjustment' ? parseFloat(value) || 0 : value;
    setProductVariants(newVariants);
  };

  const removeVariant = (index) => {
    const newVariants = productVariants.filter((_, i) => i !== index);
    setProductVariants(newVariants.length > 0 ? newVariants : [{ name: '', priceAdjustment: 0 }]);
  };

  const deleteProduct = async (id) => {
    if (!confirm('Voulez-vous vraiment supprimer ce produit ?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadProducts();
    } catch (error) {
      console.error('Erreur suppression produit:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const addQuickProduct = async () => {
    if (!quickProduct.name || !quickProduct.price) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    // Validation des déclinaisons
    if (quickHasVariants) {
      const validVariants = quickProductVariants.filter(v => v.name.trim() !== '');
      if (validVariants.length === 0) {
        alert('Veuillez ajouter au moins une déclinaison ou décocher l\'option');
        return;
      }
    }

    try {
      const productData = {
        name: quickProduct.name,
        price: parseFloat(quickProduct.price),
        variants: quickHasVariants ? quickProductVariants.filter(v => v.name.trim() !== '') : null
      };

      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select();

      if (error) throw error;

      await loadProducts();

      // Sélectionner automatiquement le produit créé
      const newProduct = data[0];
      setSelectedProduct(newProduct.id.toString());
      setProductSearch(newProduct.name);
      setCustomPrice(newProduct.price.toString());

      // Réinitialiser le formulaire
      setQuickProduct({ name: '', price: '' });
      setQuickProductVariants([{ name: '', priceAdjustment: 0 }]);
      setQuickHasVariants(false);
      setShowQuickProductForm(false);

      alert('Produit créé avec succès !');
    } catch (error) {
      console.error('Erreur ajout produit:', error);
      alert('Erreur lors de l\'ajout du produit');
    }
  };

  const addQuickVariantField = () => {
    setQuickProductVariants([...quickProductVariants, { name: '', priceAdjustment: 0 }]);
  };

  const updateQuickVariant = (index, field, value) => {
    const newVariants = [...quickProductVariants];
    newVariants[index][field] = field === 'priceAdjustment' ? parseFloat(value) || 0 : value;
    setQuickProductVariants(newVariants);
  };

  const removeQuickVariant = (index) => {
    const newVariants = quickProductVariants.filter((_, i) => i !== index);
    setQuickProductVariants(newVariants.length > 0 ? newVariants : [{ name: '', priceAdjustment: 0 }]);
  };

  // ========== GESTION DES CLIENTS ==========

  const addClient = async () => {
    if (!newClient.name || !newClient.email) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([{ name: newClient.name, email: newClient.email, addresses: [] }])
        .select();

      if (error) throw error;

      await loadClients();
      setNewClient({ name: '', email: '' });
      setShowNewClientForm(false);
    } catch (error) {
      console.error('Erreur ajout client:', error);
      alert('Erreur lors de l\'ajout du client');
    }
  };

  const addClientAddress = async (clientId, label, address) => {
    try {
      const client = clients.find(c => c.id === clientId);
      const updatedAddresses = [...(client.addresses || []), { label, address, favorite: false }];

      const { error } = await supabase
        .from('clients')
        .update({ addresses: updatedAddresses })
        .eq('id', clientId);

      if (error) throw error;

      await loadClients();
    } catch (error) {
      console.error('Erreur ajout adresse:', error);
      alert('Erreur lors de l\'ajout de l\'adresse');
    }
  };

  const deleteClientAddress = async (clientId, addressIndex) => {
    if (!confirm('Supprimer cette adresse ?')) return;

    try {
      const client = clients.find(c => c.id === clientId);
      const updatedAddresses = client.addresses.filter((_, i) => i !== addressIndex);

      const { error } = await supabase
        .from('clients')
        .update({ addresses: updatedAddresses })
        .eq('id', clientId);

      if (error) throw error;

      await loadClients();
    } catch (error) {
      console.error('Erreur suppression adresse:', error);
    }
  };

  const toggleFavoriteAddress = async (clientId, addressIndex) => {
    try {
      const client = clients.find(c => c.id === clientId);
      const updatedAddresses = client.addresses.map((addr, idx) =>
        idx === addressIndex ? { ...addr, favorite: !addr.favorite } : addr
      );

      const { error } = await supabase
        .from('clients')
        .update({ addresses: updatedAddresses })
        .eq('id', clientId);

      if (error) throw error;

      await loadClients();
    } catch (error) {
      console.error('Erreur modification favori:', error);
    }
  };

  const getFavoriteAddresses = () => {
    const favorites = [];
    clients.forEach(client => {
      if (client.addresses) {
        client.addresses.forEach((addr, index) => {
          if (addr.favorite) {
            favorites.push({
              clientId: client.id,
              clientName: client.name,
              clientEmail: client.email,
              addressIndex: index,
              label: addr.label,
              address: addr.address
            });
          }
        });
      }
    });
    return favorites;
  };

  // ========== GESTION DES COMMANDES ==========

  // Ouvrir la modale de sélection rapide des déclinaisons
  const openVariantsModal = (productId) => {
    const product = products.find(p => p.id === parseInt(productId));
    if (!product) return;

    // Si le produit n'a pas de déclinaisons, ajouter directement
    if (!product.variants || product.variants.length === 0) {
      setSelectedProduct(productId);
      return;
    }

    // Initialiser les quantités à 0 pour chaque déclinaison
    const initialQuantities = {};
    product.variants.forEach((variant, index) => {
      initialQuantities[index] = 0;
    });

    setVariantsModalProduct(product);
    setVariantsQuantities(initialQuantities);
    setShowVariantsModal(true);
  };

  // Ajouter toutes les déclinaisons sélectionnées à la commande
  const addVariantsToOrder = () => {
    if (!variantsModalProduct) return;

    let itemsAdded = 0;
    const newItems = [];

    Object.entries(variantsQuantities).forEach(([variantIndex, quantity]) => {
      const qty = parseInt(quantity);
      if (qty > 0) {
        const variant = variantsModalProduct.variants[parseInt(variantIndex)];
        const finalPrice = variantsModalProduct.price + (variant.priceAdjustment || 0);

        const newItem = {
          id: Date.now() + parseInt(variantIndex), // Assurer l'unicité des IDs
          productId: variantsModalProduct.id,
          name: variantsModalProduct.name,
          variant: variant.name,
          quantity: qty,
          price: finalPrice
        };

        newItems.push(newItem);
        itemsAdded++;
      }
    });

    if (itemsAdded === 0) {
      alert('Veuillez sélectionner au moins une quantité pour une déclinaison');
      return;
    }

    setOrderItems([...orderItems, ...newItems]);

    // Réinitialiser et fermer la modale
    setShowVariantsModal(false);
    setVariantsModalProduct(null);
    setVariantsQuantities({});
    setSelectedProduct('');
    setProductSearch('');
  };

  // Mettre à jour la quantité d'une déclinaison dans la modale
  const updateVariantQuantity = (variantIndex, value) => {
    setVariantsQuantities({
      ...variantsQuantities,
      [variantIndex]: value
    });
  };

  const addItemToOrder = () => {
    if (!selectedProduct) {
      alert('Sélectionnez un produit');
      return;
    }

    const product = products.find(p => p.id === parseInt(selectedProduct));

    // Si le produit a des déclinaisons, ouvrir la modale
    if (product.variants && product.variants.length > 0) {
      openVariantsModal(selectedProduct);
      return;
    }

    // Produit sans déclinaison : ajout direct
    let finalPrice = customPrice ? parseFloat(customPrice) : product.price;

    const newItem = {
      id: Date.now(),
      productId: product.id,
      name: product.name,
      variant: '',
      quantity: parseInt(quantity),
      price: finalPrice
    };

    setOrderItems([...orderItems, newItem]);
    setSelectedProduct('');
    setSelectedVariant('');
    setProductSearch('');
    setQuantity(1);
    setCustomPrice('');
  };

  const removeItemFromOrder = (itemId) => {
    setOrderItems(orderItems.filter(item => item.id !== itemId));
  };

  const createOrder = async () => {
    if (!selectedClient || selectedAddress === null || orderItems.length === 0) {
      alert('Veuillez sélectionner un client, une adresse et ajouter des produits');
      return;
    }

    const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const client = clients.find(c => c.id === selectedClient);
    const address = client.addresses[selectedAddress];

    try {
      const { error } = await supabase
        .from('orders')
        .insert([{
          client_id: client.id,
          client_name: client.name,
          client_email: client.email,
          address_label: address.label,
          client_address: address.address,
          items: orderItems,
          total: total,
          status: 'pending',
          date: new Date().toISOString()
        }]);

      if (error) throw error;

      await loadOrders();
      setSelectedClient(null);
      setSelectedAddress(null);
      setOrderItems([]);
      setActiveTab('orders');
    } catch (error) {
      console.error('Erreur création commande:', error);
      alert('Erreur lors de la création de la commande');
    }
  };

  // Fonction pour regrouper les variantes d'un même produit
  const groupItemsByProduct = (items) => {
    const grouped = {};

    items.forEach(item => {
      const key = `${item.productId}-${item.price}`;

      if (!grouped[key]) {
        grouped[key] = {
          id: item.id,
          productId: item.productId,
          name: item.name,
          price: item.price,
          variants: [],
          totalQuantity: 0,
          totalPrice: 0,
          picked: item.picked
        };
      }

      grouped[key].variants.push({
        id: item.id,
        variant: item.variant || 'Standard',
        quantity: item.quantity,
        picked: item.picked
      });
      grouped[key].totalQuantity += item.quantity;
      grouped[key].totalPrice += item.price * item.quantity;
      // Un produit est "picked" si toutes ses variantes sont picked
      grouped[key].picked = grouped[key].picked && item.picked;
    });

    return Object.values(grouped);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const updateData = { status: newStatus };
      if (newStatus === 'shipped') {
        updateData.shipped_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      await loadOrders();

      if (newStatus === 'packed') {
        setActiveTab('packed');
      } else if (newStatus === 'shipped') {
        setActiveTab('shipped');
      }
    } catch (error) {
      console.error('Erreur mise à jour commande:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const toggleOrderPicked = async (orderId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ product_picked: !currentStatus })
        .eq('id', orderId);

      if (error) throw error;

      await loadOrders();
    } catch (error) {
      console.error('Erreur mise à jour produit saisi:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const toggleItemPicked = async (orderId, itemId) => {
    try {
      const order = orders.find(o => o.id === orderId);
      const updatedItems = order.items.map(item =>
        item.id === itemId
          ? { ...item, picked: !item.picked }
          : item
      );

      const { error } = await supabase
        .from('orders')
        .update({ items: updatedItems })
        .eq('id', orderId);

      if (error) throw error;

      await loadOrders();
    } catch (error) {
      console.error('Erreur mise à jour produit saisi:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const shipOrderWithTracking = async () => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'shipped',
          shipped_date: new Date().toISOString()
        })
        .eq('id', shippingForm.orderId);

      if (error) throw error;

      await loadOrders();
      setShowShippingForm(false);
      setShippingForm({ orderId: null, carrier: '', trackingNumbers: [''] });
      setActiveTab('shipped');
    } catch (error) {
      console.error('Erreur expédition commande:', error);
      alert('Erreur lors de l\'expédition');
    }
  };

  const deleteOrder = async (orderId) => {
    if (!confirm('Voulez-vous vraiment supprimer cette commande ?')) return;

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      await loadOrders();
    } catch (error) {
      console.error('Erreur suppression commande:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const updateOrderAddress = async (orderId, label, address) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ address_label: label, client_address: address })
        .eq('id', orderId);

      if (error) throw error;

      await loadOrders();
      setEditingAddress(null);
      setChangingPackedAddress(null);
    } catch (error) {
      console.error('Erreur mise à jour adresse:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const changePackedOrderAddress = async (orderId, addressIndex) => {
    const order = orders.find(o => o.id === orderId);
    const client = clients.find(c => c.id === order.client_id);
    const newAddress = client.addresses[addressIndex];

    await updateOrderAddress(orderId, newAddress.label, newAddress.address);
  };

  const updateClientAddress = async (clientId, addressIndex, label, address) => {
    try {
      const client = clients.find(c => c.id === clientId);
      const updatedAddresses = client.addresses.map((addr, idx) =>
        idx === addressIndex ? { ...addr, label, address } : addr
      );

      const { error } = await supabase
        .from('clients')
        .update({ addresses: updatedAddresses })
        .eq('id', clientId);

      if (error) throw error;

      await loadClients();
      setEditingClientAddress(null);
    } catch (error) {
      console.error('Erreur modification adresse:', error);
      alert('Erreur lors de la modification');
    }
  };

  const removeItemFromExistingOrder = async (orderId, itemId) => {
    if (!confirm('Voulez-vous vraiment supprimer ce produit de la commande ?')) return;

    try {
      const order = orders.find(o => o.id === orderId);
      const updatedItems = order.items.filter(item => item.id !== itemId);

      if (updatedItems.length === 0) {
        alert('Impossible de supprimer le dernier produit. Supprimez plutôt la commande entière.');
        return;
      }

      const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const { error } = await supabase
        .from('orders')
        .update({ items: updatedItems, total: newTotal })
        .eq('id', orderId);

      if (error) throw error;

      await loadOrders();
    } catch (error) {
      console.error('Erreur suppression produit:', error);
      alert('Erreur lors de la suppression du produit');
    }
  };

  const updateOrderItem = async (orderId, itemId) => {
    try {
      const order = orders.find(o => o.id === orderId);
      const updatedItems = order.items.map(item =>
        item.id === itemId
          ? { ...item, quantity: parseInt(editItemForm.quantity), price: parseFloat(editItemForm.price) }
          : item
      );

      const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const { error } = await supabase
        .from('orders')
        .update({ items: updatedItems, total: newTotal })
        .eq('id', orderId);

      if (error) throw error;

      await loadOrders();
      setEditingOrderItem(null);
    } catch (error) {
      console.error('Erreur modification produit:', error);
      alert('Erreur lors de la modification');
    }
  };

  const addProductToExistingOrder = async (orderId) => {
    if (!addProductForm.selectedProduct) {
      alert('Sélectionnez un produit');
      return;
    }

    const product = products.find(p => p.id === parseInt(addProductForm.selectedProduct));

    if (product.variants && product.variants.length > 0 && !addProductForm.selectedVariant) {
      alert('Veuillez sélectionner une déclinaison');
      return;
    }

    let finalPrice = addProductForm.customPrice ? parseFloat(addProductForm.customPrice) : product.price;
    let variantName = '';

    if (addProductForm.selectedVariant && product.variants) {
      const variant = product.variants.find(v => v.name === addProductForm.selectedVariant);
      if (variant) {
        variantName = variant.name;
        if (!addProductForm.customPrice) {
          finalPrice = product.price + (variant.priceAdjustment || 0);
        }
      }
    }

    try {
      const order = orders.find(o => o.id === orderId);
      const newItem = {
        id: Date.now(),
        productId: product.id,
        name: product.name,
        variant: variantName,
        quantity: parseInt(addProductForm.quantity),
        price: finalPrice
      };

      const updatedItems = [...order.items, newItem];
      const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const { error } = await supabase
        .from('orders')
        .update({ items: updatedItems, total: newTotal })
        .eq('id', orderId);

      if (error) throw error;

      await loadOrders();
      setAddingProductToOrder(null);
      setAddProductForm({ productSearch: '', selectedProduct: '', selectedVariant: '', quantity: 1, customPrice: '' });
    } catch (error) {
      console.error('Erreur ajout produit:', error);
      alert('Erreur lors de l\'ajout du produit');
    }
  };

  // ========== GESTION DES PAIEMENTS ==========

  const addPayment = async () => {
    if (!newPayment.clientId || !newPayment.amount || !newPayment.date) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const { error } = await supabase
        .from('payments')
        .insert([{
          client_id: parseInt(newPayment.clientId),
          amount: parseFloat(newPayment.amount),
          date: newPayment.date,
          note: newPayment.note
        }]);

      if (error) throw error;

      await loadPayments();
      setNewPayment({ clientId: '', amount: '', date: new Date().toISOString().split('T')[0], note: '' });
      setShowNewPaymentForm(false);
    } catch (error) {
      console.error('Erreur ajout paiement:', error);
      alert('Erreur lors de l\'enregistrement du paiement');
    }
  };

  const deletePayment = async (paymentId) => {
    if (!confirm('Supprimer ce paiement ?')) return;

    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId);

      if (error) throw error;

      await loadPayments();
    } catch (error) {
      console.error('Erreur suppression paiement:', error);
    }
  };

  // ========== FUSION DES PRODUITS DANS UNE COMMANDE ==========

  const mergeOrderProducts = async (orderId) => {
    if (!confirm('Fusionner les produits identiques dans cette commande ?')) return;

    try {
      const order = orders.find(o => o.id === orderId);
      const mergedItems = [];

      order.items.forEach(item => {
        const existingItem = mergedItems.find(i =>
          i.productId === item.productId && i.price === item.price
        );

        if (existingItem) {
          existingItem.quantity += item.quantity;
        } else {
          mergedItems.push({ ...item });
        }
      });

      const newTotal = mergedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const { error } = await supabase
        .from('orders')
        .update({ items: mergedItems, total: newTotal })
        .eq('id', orderId);

      if (error) throw error;

      await loadOrders();
      alert('Produits fusionnés avec succès !');
    } catch (error) {
      console.error('Erreur fusion produits:', error);
      alert('Erreur lors de la fusion');
    }
  };

  // ========== FUSION DES COMMANDES EN ATTENTE ==========

  const togglePendingOrderSelection = (orderId) => {
    setSelectedPendingOrders({
      ...selectedPendingOrders,
      [orderId]: !selectedPendingOrders[orderId]
    });
  };

  const getSelectedPendingOrdersArray = () => {
    return pendingOrders.filter(order => selectedPendingOrders[order.id]);
  };

  const canMergePendingOrders = () => {
    const selected = getSelectedPendingOrdersArray();
    if (selected.length < 2) return false;

    const firstClientId = selected[0].client_id;
    return selected.every(order => order.client_id === firstClientId);
  };

  const mergePendingOrders = async () => {
    const selected = getSelectedPendingOrdersArray();

    if (selected.length < 2) {
      alert('Sélectionnez au moins 2 commandes à fusionner');
      return;
    }

    if (!canMergePendingOrders()) {
      alert('Vous ne pouvez fusionner que des commandes du même client');
      return;
    }

    if (!confirm(`Fusionner ${selected.length} commandes en une seule ?`)) return;

    try {
      const firstOrder = selected[0];

      const mergedItems = [];
      selected.forEach(order => {
        order.items.forEach(item => {
          const existingItem = mergedItems.find(i => i.productId === item.productId && i.price === item.price);
          if (existingItem) {
            existingItem.quantity += item.quantity;
          } else {
            mergedItems.push({ ...item });
          }
        });
      });

      const newTotal = mergedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const { error: insertError } = await supabase
        .from('orders')
        .insert([{
          client_id: firstOrder.client_id,
          client_name: firstOrder.client_name,
          client_email: firstOrder.client_email,
          address_label: firstOrder.address_label,
          client_address: firstOrder.client_address,
          items: mergedItems,
          total: newTotal,
          status: 'pending',
          date: new Date().toISOString()
        }]);

      if (insertError) throw insertError;

      const orderIdsToDelete = selected.map(o => o.id);
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .in('id', orderIdsToDelete);

      if (deleteError) throw deleteError;

      setSelectedPendingOrders({});
      await loadOrders();
    } catch (error) {
      console.error('Erreur fusion commandes:', error);
      alert('Erreur lors de la fusion des commandes');
    }
  };

  // ========== FUSION DES COMMANDES EN CARTON ==========

  const togglePackedOrderSelection = (orderId) => {
    setSelectedPackedOrders({
      ...selectedPackedOrders,
      [orderId]: !selectedPackedOrders[orderId]
    });
  };

  const getSelectedPackedOrdersArray = () => {
    return packedOrders.filter(order => selectedPackedOrders[order.id]);
  };

  const canMergeOrders = () => {
    const selected = getSelectedPackedOrdersArray();
    if (selected.length < 2) return false;

    const firstClientId = selected[0].client_id;
    return selected.every(order => order.client_id === firstClientId);
  };

  const mergePackedOrders = async () => {
    const selected = getSelectedPackedOrdersArray();

    if (selected.length < 2) {
      alert('Sélectionnez au moins 2 commandes à fusionner');
      return;
    }

    if (!canMergeOrders()) {
      alert('Vous ne pouvez fusionner que des commandes du même client');
      return;
    }

    if (!confirm(`Fusionner ${selected.length} commandes en une seule ?`)) return;

    try {
      const firstOrder = selected[0];

      const mergedItems = [];
      selected.forEach(order => {
        order.items.forEach(item => {
          const existingItem = mergedItems.find(i => i.productId === item.productId && i.price === item.price);
          if (existingItem) {
            existingItem.quantity += item.quantity;
          } else {
            mergedItems.push({ ...item });
          }
        });
      });

      const newTotal = mergedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const { error: insertError } = await supabase
        .from('orders')
        .insert([{
          client_id: firstOrder.client_id,
          client_name: firstOrder.client_name,
          client_email: firstOrder.client_email,
          address_label: firstOrder.address_label,
          client_address: firstOrder.client_address,
          items: mergedItems,
          total: newTotal,
          status: 'packed',
          date: new Date().toISOString()
        }]);

      if (insertError) throw insertError;

      const orderIdsToDelete = selected.map(o => o.id);
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .in('id', orderIdsToDelete);

      if (deleteError) throw deleteError;

      setSelectedPackedOrders({});
      await loadOrders();
    } catch (error) {
      console.error('Erreur fusion commandes:', error);
      alert('Erreur lors de la fusion des commandes');
    }
  };

  // ========== STATISTIQUES DASHBOARD ==========

  const getFilteredOrders = () => {
    let filtered = [...orders];
    const now = new Date();

    if (dashboardPeriod === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      filtered = filtered.filter(o => new Date(o.date) >= startOfYear);
    } else if (dashboardPeriod === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59);
      filtered = filtered.filter(o => {
        const orderDate = new Date(o.date);
        return orderDate >= start && orderDate <= end;
      });
    }

    return filtered;
  };

  const getDashboardStats = () => {
    const filtered = getFilteredOrders();
    const shipped = filtered.filter(o => o.status === 'shipped');

    const totalRevenue = shipped.reduce((sum, o) => sum + parseFloat(o.total), 0);
    const totalOrders = shipped.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Statistiques année précédente
    const now = new Date();
    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
    const lastYearOrders = orders.filter(o => {
      const orderDate = new Date(o.date);
      return o.status === 'shipped' && orderDate >= lastYearStart && orderDate <= lastYearEnd;
    });
    const lastYearRevenue = lastYearOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);

    // Produits les plus vendus
    const productSales = {};
    shipped.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.name]) {
          productSales[item.name] = { quantity: 0, revenue: 0 };
        }
        productSales[item.name].quantity += item.quantity;
        productSales[item.name].revenue += item.quantity * item.price;
      });
    });

    const topProducts = Object.entries(productSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Ventes par mois (12 derniers mois)
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const monthOrders = orders.filter(o => {
        const orderDate = new Date(o.date);
        return o.status === 'shipped' && orderDate >= monthStart && orderDate <= monthEnd;
      });

      const monthRevenue = monthOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);

      monthlyData.push({
        month: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue,
        orders: monthOrders.length
      });
    }

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      lastYearRevenue,
      topProducts,
      monthlyData,
      pendingCount: orders.filter(o => o.status === 'pending').length,
      packedCount: orders.filter(o => o.status === 'packed').length
    };
  };

  // ========== UTILITAIRES ==========

  const sendShippingEmail = (order) => {
    const subject = `Commande #${order.id} expédiée`;
    const body = `Bonjour,\n\nVotre commande #${order.id} a été expédiée.\n\nCordialement`;
    window.location.href = `mailto:${order.client_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const exportOrderToPDF = (order) => {
    alert('Fonction PDF à implémenter avec une librairie comme jsPDF');
  };

  const getClientBalance = (clientId) => {
    const clientOrders = orders.filter(o => o.client_id === clientId);
    const totalOrders = clientOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);
    const clientPayments = payments.filter(p => p.client_id === clientId);
    const totalPayments = clientPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    return totalPayments - totalOrders;
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const packedOrders = orders.filter(o => o.status === 'packed');
  const shippedOrders = orders.filter(o => o.status === 'shipped');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-2xl font-bold text-blue-600">Chargement...</div>
      </div>
    );
  }

  // ========== RENDU DES ONGLETS ==========

  const renderDashboardTab = () => {
    const stats = getDashboardStats();
    const revenueGrowth = stats.lastYearRevenue > 0
      ? ((stats.totalRevenue - stats.lastYearRevenue) / stats.lastYearRevenue * 100).toFixed(1)
      : 0;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-blue-600">📊 Dashboard</h2>

          <div className="flex gap-3 items-center">
            <select
              value={dashboardPeriod}
              onChange={(e) => setDashboardPeriod(e.target.value)}
              className="p-2 border rounded-lg"
            >
              <option value="all">Toute la période</option>
              <option value="year">Cette année</option>
              <option value="custom">Période personnalisée</option>
            </select>

            {dashboardPeriod === 'custom' && (
              <>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="p-2 border rounded-lg"
                />
                <span>→</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="p-2 border rounded-lg"
                />
              </>
            )}
          </div>
        </div>

        {/* Cartes principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold opacity-90">Chiffre d'affaires</h3>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-3xl font-bold">{stats.totalRevenue.toFixed(2)} €</p>
            {dashboardPeriod === 'year' && (
              <p className={`text-sm mt-2 ${revenueGrowth >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                {revenueGrowth >= 0 ? '↗' : '↘'} {Math.abs(revenueGrowth)}% vs année dernière
              </p>
            )}
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold opacity-90">Commandes expédiées</h3>
              <span className="text-2xl">📦</span>
            </div>
            <p className="text-3xl font-bold">{stats.totalOrders}</p>
            <p className="text-sm mt-2 opacity-80">Commandes livrées</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold opacity-90">Panier moyen</h3>
              <span className="text-2xl">🛒</span>
            </div>
            <p className="text-3xl font-bold">{stats.averageOrderValue.toFixed(2)} €</p>
            <p className="text-sm mt-2 opacity-80">Par commande</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold opacity-90">En cours</h3>
              <span className="text-2xl">⏳</span>
            </div>
            <p className="text-3xl font-bold">{stats.pendingCount + stats.packedCount}</p>
            <p className="text-sm mt-2 opacity-80">{stats.pendingCount} en attente, {stats.packedCount} en carton</p>
          </div>
        </div>

        {/* Graphique des ventes mensuelles */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">📈 Ventes des 12 derniers mois</h3>
          <div className="space-y-2">
            {stats.monthlyData.map((month, idx) => {
              const maxRevenue = Math.max(...stats.monthlyData.map(m => m.revenue));
              const widthPercent = maxRevenue > 0 ? (month.revenue / maxRevenue * 100) : 0;

              return (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-20 text-sm text-gray-600 font-medium">{month.month}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                      style={{ width: `${widthPercent}%` }}
                    >
                      {month.revenue > 0 && (
                        <span className="text-white text-sm font-bold">{month.revenue.toFixed(0)} €</span>
                      )}
                    </div>
                  </div>
                  <div className="w-16 text-sm text-gray-600 text-right">{month.orders} cmd</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 produits */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">🏆 Top 5 des produits</h3>
          <div className="space-y-3">
            {stats.topProducts.map((product, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-yellow-600">#{idx + 1}</span>
                  <div>
                    <p className="font-bold">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.quantity} unités vendues</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-green-600">{product.revenue.toFixed(2)} €</p>
              </div>
            ))}
            {stats.topProducts.length === 0 && (
              <p className="text-gray-500 text-center py-4">Aucune vente pour le moment</p>
            )}
          </div>
        </div>

        {/* Soldes clients */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">💳 Soldes clients</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map(client => {
              const balance = getClientBalance(client.id);
              return (
                <div key={client.id} className={`p-4 rounded-lg border-2 ${balance < 0 ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`}>
                  <p className="font-bold">{client.name}</p>
                  <p className={`text-2xl font-bold ${balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {balance.toFixed(2)} €
                  </p>
                  <p className="text-sm text-gray-600">
                    {orders.filter(o => o.client_id === client.id).length} commandes
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderNewOrderTab = () => {
    const filteredProducts = products.filter(p =>
      p.name.toLowerCase().includes(productSearch.toLowerCase())
    );

    const handleProductSelect = (product) => {
      setSelectedProduct(product.id.toString());
      setProductSearch(product.name);
      setShowProductSuggestions(false);
      setCustomPrice(product.price.toString());
      setSelectedVariant('');
    };

    const favoriteAddresses = getFavoriteAddresses();
    const currentProduct = selectedProduct ? products.find(p => p.id === parseInt(selectedProduct)) : null;
    const hasProductVariants = currentProduct?.variants && currentProduct.variants.length > 0;

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-blue-600">➕ Nouvelle Commande</h2>

        {/* Adresses favorites */}
        {favoriteAddresses.length > 0 && (
          <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Star size={20} className="text-yellow-500" fill="currentColor" />
              Adresses favorites
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {favoriteAddresses.map((fav, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedClient(fav.clientId);
                    setSelectedAddress(fav.addressIndex);
                  }}
                  className="bg-white p-3 rounded-lg border-2 border-yellow-400 hover:border-yellow-600 text-left transition-all hover:shadow-md"
                >
                  <div className="flex items-start gap-2">
                    <Star size={16} className="text-yellow-500 mt-1" fill="currentColor" />
                    <div>
                      <p className="font-bold text-sm">{fav.clientName}</p>
                      <p className="text-xs text-gray-600">{fav.label}</p>
                      <p className="text-xs text-gray-500 mt-1">{fav.address.substring(0, 50)}...</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sélection du client ET adresse sur la même ligne */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-4">1️⃣ Sélectionner un client et une adresse</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Client</label>
              <select
                value={selectedClient || ''}
                onChange={(e) => { setSelectedClient(parseInt(e.target.value)); setSelectedAddress(null); }}
                className="w-full p-3 border rounded-lg"
              >
                <option value="">-- Choisir un client --</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name} ({client.email})</option>
                ))}
              </select>
              <button onClick={() => setShowNewClientForm(!showNewClientForm)} className="mt-3 text-blue-600 hover:text-blue-800 flex items-center gap-2">
                <Plus size={18} />Nouveau client
              </button>

              {showNewClientForm && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg space-y-3">
                  <input type="text" placeholder="Nom du client" value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} className="w-full p-2 border rounded" />
                  <input type="email" placeholder="Email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} className="w-full p-2 border rounded" />
                  <button onClick={addClient} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Ajouter</button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Adresse de livraison</label>
              {selectedClient ? (
                clients.find(c => c.id === selectedClient)?.addresses?.length > 0 ? (
                  <div className="space-y-2">
                    {clients.find(c => c.id === selectedClient).addresses.map((addr, index) => (
                      <div key={index} onClick={() => setSelectedAddress(index)} className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${selectedAddress === index ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                        <div className="flex items-start gap-2">
                          {addr.favorite && <Star size={14} className="text-yellow-500 mt-0.5" fill="currentColor" />}
                          <div>
                            <p className="font-bold text-sm">{addr.label}</p>
                            <p className="text-xs text-gray-600 whitespace-pre-line">{addr.address}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Aucune adresse enregistrée pour ce client</p>
                )
              ) : (
                <p className="text-gray-400 text-sm">Sélectionnez d'abord un client</p>
              )}
            </div>
          </div>
        </div>

        {/* Ajout de produits avec autocomplétion et déclinaisons */}
        {selectedClient && selectedAddress !== null && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-bold mb-4">2️⃣ Ajouter des produits</h3>

            {/* Bouton pour créer un nouveau produit */}
            {!showQuickProductForm && (
              <button
                onClick={() => setShowQuickProductForm(true)}
                className="mb-4 bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 flex items-center gap-2 font-semibold"
              >
                <Plus size={18} />Créer un nouveau produit rapidement
              </button>
            )}

            {/* Formulaire de création rapide de produit */}
            {showQuickProductForm && (
              <div className="mb-6 p-4 bg-green-50 rounded-lg border-2 border-green-300">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-green-800">✨ Créer un nouveau produit</h4>
                  <button
                    onClick={() => {
                      setShowQuickProductForm(false);
                      setQuickProduct({ name: '', price: '' });
                      setQuickProductVariants([{ name: '', priceAdjustment: 0 }]);
                      setQuickHasVariants(false);
                    }}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nom du produit"
                    value={quickProduct.name}
                    onChange={(e) => setQuickProduct({ ...quickProduct, name: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Prix de base"
                    value={quickProduct.price}
                    onChange={(e) => setQuickProduct({ ...quickProduct, price: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                  />

                  {/* Option déclinaisons */}
                  <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
                    <input
                      type="checkbox"
                      id="quickHasVariants"
                      checked={quickHasVariants}
                      onChange={(e) => {
                        setQuickHasVariants(e.target.checked);
                        if (!e.target.checked) {
                          setQuickProductVariants([{ name: '', priceAdjustment: 0 }]);
                        }
                      }}
                      className="w-5 h-5 cursor-pointer"
                    />
                    <label htmlFor="quickHasVariants" className="font-semibold cursor-pointer text-sm">
                      Ce produit a des déclinaisons
                    </label>
                  </div>

                  {quickHasVariants && (
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                      <p className="text-xs text-gray-600 mb-2">Déclinaisons (tailles, couleurs, etc.)</p>
                      <div className="space-y-2">
                        {quickProductVariants.map((variant, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={variant.name}
                              onChange={(e) => updateQuickVariant(index, 'name', e.target.value)}
                              placeholder="Nom (ex: M, Rouge...)"
                              className="flex-1 p-2 border rounded-lg text-sm"
                            />
                            <input
                              type="number"
                              step="0.01"
                              value={variant.priceAdjustment}
                              onChange={(e) => updateQuickVariant(index, 'priceAdjustment', e.target.value)}
                              placeholder="±Prix"
                              className="w-24 p-2 border rounded-lg text-sm"
                            />
                            {quickProductVariants.length > 1 && (
                              <button
                                onClick={() => removeQuickVariant(index)}
                                className="bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                            {index === quickProductVariants.length - 1 && (
                              <button
                                onClick={addQuickVariantField}
                                className="bg-purple-100 text-purple-600 px-2 py-1 rounded hover:bg-purple-200"
                              >
                                <Plus size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={addQuickProduct}
                    className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 font-bold"
                  >
                    ✅ Créer et utiliser ce produit
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowProductSuggestions(true);
                      setSelectedProduct('');
                      setSelectedVariant('');
                    }}
                    onFocus={() => setShowProductSuggestions(true)}
                    placeholder="Rechercher un produit..."
                    className="w-full p-3 border rounded-lg"
                  />
                  {showProductSuggestions && productSearch && filteredProducts.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredProducts.map(product => (
                        <div
                          key={product.id}
                          onClick={() => handleProductSelect(product)}
                          className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                        >
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-600">{parseFloat(product.price).toFixed(2)} €</div>
                          {product.variants && product.variants.length > 0 && (
                            <div className="text-xs text-purple-600 mt-1">
                              🎨 {product.variants.length} déclinaison(s)
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Produit sans déclinaison : afficher quantité et prix */}
                {selectedProduct && !hasProductVariants && (
                  <>
                    <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Quantité" className="p-3 border rounded-lg" />
                    <input type="number" step="0.01" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} placeholder="Prix unitaire" className="p-3 border rounded-lg" />
                  </>
                )}

                {/* Produit avec déclinaisons : message informatif */}
                {hasProductVariants && (
                  <div className="md:col-span-2 flex items-center gap-2 p-3 bg-purple-50 rounded-lg border-2 border-purple-300">
                    <span className="text-purple-700 font-semibold text-sm">
                      Ce produit a {currentProduct.variants.length} déclinaison(s). Cliquez sur "Ajouter" pour sélectionner les quantités.
                    </span>
                  </div>
                )}

                <button onClick={addItemToOrder} disabled={!selectedProduct} className={`px-6 py-3 rounded-lg flex items-center justify-center gap-2 ${selectedProduct ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
                  <Plus size={18} />{hasProductVariants ? 'Sélectionner' : 'Ajouter'}
                </button>
              </div>

              {orderItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold">Produits dans la commande :</h4>
                  {orderItems.map(item => (
                    <div key={item.id} className="flex items-center gap-3 bg-blue-50 p-3 rounded border">
                      <span className="text-2xl font-bold text-blue-600 min-w-[40px]">{item.quantity}</span>
                      <div className="flex-1">
                        <span className="font-medium text-gray-800">
                          {item.name}
                          {item.variant && <span className="text-purple-600 font-semibold"> ({item.variant})</span>}
                        </span>
                      </div>
                      <span className="font-bold text-lg">{(item.price * item.quantity).toFixed(2)} €</span>
                      <button onClick={() => removeItemFromOrder(item.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <span className="text-xl font-bold">Total</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)} €
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {orderItems.length > 0 && (
          <button onClick={createOrder} className="w-full bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 font-bold text-lg">
            ✅ Créer la commande
          </button>
        )}
      </div>
    );
  };

  const renderOrdersTab = () => {
    const selectedOrders = getSelectedPendingOrdersArray();
    const selectedCount = selectedOrders.length;
    const canMerge = canMergePendingOrders();

    const ordersByClient = {};
    pendingOrders.forEach(order => {
      if (!ordersByClient[order.client_id]) {
        ordersByClient[order.client_id] = [];
      }
      ordersByClient[order.client_id].push(order);
    });

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-blue-600">📦 Commandes en attente</h2>

          {selectedCount > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-700">
                {selectedCount} commande{selectedCount > 1 ? 's' : ''} sélectionnée{selectedCount > 1 ? 's' : ''}
              </span>
              {selectedCount > 1 && (
                <button
                  onClick={mergePendingOrders}
                  disabled={!canMerge}
                  className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 ${canMerge
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  🔀 Fusionner les commandes
                </button>
              )}
              {!canMerge && selectedCount > 1 && (
                <span className="text-sm text-red-600">⚠️ Même client requis</span>
              )}
            </div>
          )}
        </div>

        {pendingOrders.map(order => {
          const isSelected = selectedPendingOrders[order.id];
          const clientOrders = ordersByClient[order.client_id] || [];
          const showMergeHint = clientOrders.length > 1;

          return (
            <div
              key={order.id}
              className={`p-6 rounded-lg shadow-md border-l-4 mb-4 transition-all ${isSelected
                ? 'border-purple-500 bg-purple-50'
                : 'bg-white border-blue-500'
                }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex items-center pt-1">
                  <input
                    type="checkbox"
                    checked={isSelected || false}
                    onChange={() => togglePendingOrderSelection(order.id)}
                    className="w-5 h-5 cursor-pointer"
                  />
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-blue-600">Commande #{order.id}</h3>
                      <p className="text-gray-700 font-semibold text-lg">{order.client_name}</p>
                      {showMergeHint && (
                        <p className="text-sm text-purple-600 mt-1">
                          💡 {clientOrders.length} commandes en attente pour ce client
                        </p>
                      )}
                      <p className="text-sm text-gray-600 mt-2">📅 {new Date(order.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <button onClick={() => deleteOrder(order.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 size={20} />
                    </button>
                  </div>
                  <div className="space-y-2 mb-4">
                    {groupItemsByProduct(order.items).map(groupedItem => (
                      <div
                        key={groupedItem.id}
                        className={`flex items-center gap-3 p-3 rounded border transition-all ${groupedItem.picked
                          ? 'bg-green-100 border-green-300'
                          : 'bg-blue-50 border-blue-200'
                          }`}
                      >
                        <span className={`text-2xl font-bold min-w-[40px] ${groupedItem.picked ? 'text-green-600' : 'text-blue-600'}`}>{groupedItem.totalQuantity}</span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">
                            {groupedItem.name}
                            <span className="text-purple-600 font-semibold ml-2">
                              {groupedItem.variants.map((v, idx) => (
                                <span key={v.id}>
                                  {v.variant !== 'Standard' ? v.variant : ''}{v.variant !== 'Standard' && '×'}{v.quantity}
                                  {idx < groupedItem.variants.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </span>
                          </div>
                          {groupedItem.picked && (
                            <p className="text-xs text-green-700 font-semibold mt-1">✓ Produit saisi</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-sm text-gray-600">{groupedItem.price.toFixed(2)} € × {groupedItem.totalQuantity}</p>
                            <p className="font-bold text-lg">{groupedItem.totalPrice.toFixed(2)} €</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t mb-4">
                    <span className="text-xl font-bold">Total</span>
                    <span className="text-2xl font-bold text-blue-600">{parseFloat(order.total).toFixed(2)} €</span>
                  </div>

                  {/* Formulaire d'ajout de produit */}
                  {addingProductToOrder === order.id ? (
                    <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300 mb-4">
                      <h4 className="font-bold mb-3 text-green-800">➕ Ajouter un produit</h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                          <div className="relative">
                            <input
                              type="text"
                              value={addProductForm.productSearch}
                              onChange={(e) => {
                                const filteredProducts = products.filter(p =>
                                  p.name.toLowerCase().includes(e.target.value.toLowerCase())
                                );
                                setAddProductForm({ ...addProductForm, productSearch: e.target.value, selectedProduct: '' });
                                setShowAddProductSuggestions(true);
                              }}
                              onFocus={() => setShowAddProductSuggestions(true)}
                              placeholder="Rechercher..."
                              className="w-full p-2 border rounded-lg"
                            />
                            {showAddProductSuggestions && addProductForm.productSearch && (
                              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {products.filter(p => p.name.toLowerCase().includes(addProductForm.productSearch.toLowerCase())).map(product => (
                                  <div
                                    key={product.id}
                                    onClick={() => {
                                      setAddProductForm({
                                        ...addProductForm,
                                        selectedProduct: product.id.toString(),
                                        productSearch: product.name,
                                        customPrice: product.price.toString(),
                                        selectedVariant: ''
                                      });
                                      setShowAddProductSuggestions(false);
                                    }}
                                    className="p-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                                  >
                                    <div className="font-medium text-sm">{product.name}</div>
                                    <div className="text-xs text-gray-600">{parseFloat(product.price).toFixed(2)} €</div>
                                    {product.variants && product.variants.length > 0 && (
                                      <div className="text-xs text-purple-600">🎨 {product.variants.length} déclinaison(s)</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {addProductForm.selectedProduct && products.find(p => p.id === parseInt(addProductForm.selectedProduct))?.variants?.length > 0 && (
                            <select
                              value={addProductForm.selectedVariant}
                              onChange={(e) => {
                                const product = products.find(p => p.id === parseInt(addProductForm.selectedProduct));
                                const variant = product.variants.find(v => v.name === e.target.value);
                                setAddProductForm({
                                  ...addProductForm,
                                  selectedVariant: e.target.value,
                                  customPrice: variant ? (product.price + (variant.priceAdjustment || 0)).toString() : product.price.toString()
                                });
                              }}
                              className="p-2 border rounded-lg"
                            >
                              <option value="">-- Déclinaison --</option>
                              {products.find(p => p.id === parseInt(addProductForm.selectedProduct)).variants.map((variant, idx) => (
                                <option key={idx} value={variant.name}>
                                  {variant.name} {variant.priceAdjustment !== 0 && `(${variant.priceAdjustment > 0 ? '+' : ''}${variant.priceAdjustment.toFixed(2)} €)`}
                                </option>
                              ))}
                            </select>
                          )}

                          <input
                            type="number"
                            min="1"
                            value={addProductForm.quantity}
                            onChange={(e) => setAddProductForm({ ...addProductForm, quantity: e.target.value })}
                            placeholder="Quantité"
                            className="p-2 border rounded-lg"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={addProductForm.customPrice}
                            onChange={(e) => setAddProductForm({ ...addProductForm, customPrice: e.target.value })}
                            placeholder="Prix"
                            className="p-2 border rounded-lg"
                          />
                          <button
                            onClick={() => addProductToExistingOrder(order.id)}
                            disabled={!addProductForm.selectedProduct}
                            className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${addProductForm.selectedProduct
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                          >
                            <Plus size={16} />Ajouter
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            setAddingProductToOrder(null);
                            setAddProductForm({ productSearch: '', selectedProduct: '', selectedVariant: '', quantity: 1, customPrice: '' });
                          }}
                          className="text-gray-600 hover:text-gray-800 text-sm"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingProductToOrder(order.id)}
                      className="w-full mb-4 bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 flex items-center justify-center gap-2 font-semibold"
                    >
                      <Plus size={18} />Ajouter un produit
                    </button>
                  )}

                  <button onClick={() => updateOrderStatus(order.id, 'packed')} className="w-full bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2 font-bold">
                    <Package size={20} />Mettre en carton
                  </button>
                  {order.items.some((item, idx) =>
                    order.items.findIndex(i => i.productId === item.productId && i.price === item.price) !== idx
                  ) && (
                      <button onClick={() => mergeOrderProducts(order.id)} className="w-full mt-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 font-bold">
                        🔀 Fusionner les produits identiques
                      </button>
                    )}
                </div>
              </div>
            </div>
          );
        })}
        {pendingOrders.length === 0 && <div className="text-center py-12 text-gray-500">Aucune commande en attente</div>}
      </div>
    );
  };

  const renderPackedTab = () => {
    const selectedOrders = getSelectedPackedOrdersArray();
    const selectedCount = selectedOrders.length;
    const canMerge = canMergeOrders();

    const ordersByClient = {};
    packedOrders.forEach(order => {
      if (!ordersByClient[order.client_id]) {
        ordersByClient[order.client_id] = [];
      }
      ordersByClient[order.client_id].push(order);
    });

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-orange-600">📦 Commandes mises en carton</h2>

          {selectedCount > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-700">
                {selectedCount} commande{selectedCount > 1 ? 's' : ''} sélectionnée{selectedCount > 1 ? 's' : ''}
              </span>
              {selectedCount > 1 && (
                <button
                  onClick={mergePackedOrders}
                  disabled={!canMerge}
                  className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 ${canMerge
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  🔀 Fusionner les commandes
                </button>
              )}
              {!canMerge && selectedCount > 1 && (
                <span className="text-sm text-red-600">⚠️ Même client requis</span>
              )}
            </div>
          )}
        </div>

        {/* Modale de confirmation d'expédition */}
        {showShippingForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-lg font-bold mb-4 text-green-600">📦 Expédition de la commande #{shippingForm.orderId}</h3>
              <p className="text-gray-700 mb-6">Voulez-vous confirmer l'expédition de cette commande ?</p>
              <div className="flex gap-3">
                <button
                  onClick={shipOrderWithTracking}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-bold flex items-center justify-center gap-2"
                >
                  <Send size={20} />Confirmer l'expédition
                </button>
                <button
                  onClick={() => {
                    setShowShippingForm(false);
                    setShippingForm({ orderId: null, carrier: '', trackingNumbers: [''] });
                  }}
                  className="bg-gray-400 text-white px-6 py-3 rounded-lg hover:bg-gray-500"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {packedOrders.map(order => {
          const isSelected = selectedPackedOrders[order.id];
          const clientOrders = ordersByClient[order.client_id] || [];
          const showMergeHint = clientOrders.length > 1;
          const client = clients.find(c => c.id === order.client_id);

          return (
            <div
              key={order.id}
              className={`bg-white p-6 rounded-lg shadow-md border-l-4 mb-4 transition-all ${isSelected
                ? 'border-purple-500 bg-purple-50'
                : 'border-orange-500'
                }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex items-center pt-1">
                  <input
                    type="checkbox"
                    checked={isSelected || false}
                    onChange={() => togglePackedOrderSelection(order.id)}
                    className="w-5 h-5 cursor-pointer"
                  />
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-orange-600">Commande #{order.id}</h3>
                      <p className="text-gray-700"><strong>{order.client_name}</strong> - {order.client_email}</p>
                      {showMergeHint && (
                        <p className="text-sm text-purple-600 mt-1">
                          💡 {clientOrders.length} commandes en carton pour ce client
                        </p>
                      )}

                      {/* Adresse avec possibilité de changer */}
                      {changingPackedAddress === order.id ? (
                        <div className="mt-2 space-y-2">
                          <p className="text-sm font-semibold">Choisir une autre adresse :</p>
                          {client?.addresses?.map((addr, index) => (
                            <button
                              key={index}
                              onClick={() => changePackedOrderAddress(order.id, index)}
                              className="w-full text-left p-3 border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                            >
                              <p className="font-semibold text-sm">{addr.label}</p>
                              <p className="text-xs text-gray-600">{addr.address}</p>
                            </button>
                          ))}
                          <button
                            onClick={() => setChangingPackedAddress(null)}
                            className="text-gray-600 hover:text-gray-800 text-sm"
                          >
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <div className="bg-gray-50 p-3 rounded border">
                            <p className="text-sm font-semibold">{order.address_label}</p>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{order.client_address}</p>
                          </div>
                          <button
                            onClick={() => setChangingPackedAddress(order.id)}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm mt-2"
                          >
                            <MapPin size={16} />Changer d'adresse
                          </button>
                        </div>
                      )}

                      <span className="inline-block mt-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold">📦 Mis en carton</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => exportOrderToPDF(order)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        <Download size={18} />
                      </button>
                      <button onClick={() => deleteOrder(order.id)} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {groupItemsByProduct(order.items).map(groupedItem => (
                      <div key={groupedItem.id} className="flex items-center gap-3 bg-orange-50 p-3 rounded border border-orange-200">
                        <span className="text-2xl font-bold text-orange-600 min-w-[40px]">{groupedItem.totalQuantity}</span>
                        <div className="flex-1">
                          <span className="font-medium text-gray-800">
                            {groupedItem.name}
                            <span className="text-purple-600 font-semibold ml-2">
                              {groupedItem.variants.map((v, idx) => (
                                <span key={v.id}>
                                  {v.variant !== 'Standard' ? v.variant : ''}{v.variant !== 'Standard' && '×'}{v.quantity}
                                  {idx < groupedItem.variants.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-sm text-gray-600">{groupedItem.price.toFixed(2)} € × {groupedItem.totalQuantity}</p>
                            <p className="font-bold text-lg">{groupedItem.totalPrice.toFixed(2)} €</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t mb-4">
                    <span className="text-xl font-bold">Total</span>
                    <span className="text-2xl font-bold text-blue-600">{parseFloat(order.total).toFixed(2)} €</span>
                  </div>

                  <button
                    onClick={() => {
                      setShippingForm({ orderId: order.id, carrier: '', trackingNumbers: [''] });
                      setShowShippingForm(true);
                    }}
                    className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-bold"
                  >
                    <Send size={20} />Expédier la commande
                  </button>
                  {order.items.some((item, idx) =>
                    order.items.findIndex(i => i.productId === item.productId && i.price === item.price) !== idx
                  ) && (
                      <button onClick={() => mergeOrderProducts(order.id)} className="w-full mt-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 font-bold">
                        🔀 Fusionner les produits identiques
                      </button>
                    )}
                </div>
              </div>
            </div>
          );
        })}
        {packedOrders.length === 0 && <div className="text-center py-12 text-gray-500">Aucune commande en carton</div>}
      </div>
    );
  };

  const generatePDF = (order) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yPosition = 20;

    // Fonction helper pour ajouter du texte centré
    const addCenteredText = (text, y, fontSize = 12) => {
      doc.setFontSize(fontSize);
      const textWidth = doc.getTextWidth(text);
      doc.text(text, (pageWidth - textWidth) / 2, y);
    };

    // En-tête
    doc.setFont('helvetica', 'bold');
    addCenteredText('BON DE COMMANDE', yPosition, 18);
    yPosition += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    addCenteredText(`Commande #${order.id}`, yPosition);
    yPosition += 12;

    // Ligne de séparation
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Informations client
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Informations client', margin, yPosition);
    yPosition += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Nom : ${order.client_name}`, margin + 5, yPosition);
    yPosition += 5;
    doc.text(`Email : ${order.client_email}`, margin + 5, yPosition);
    yPosition += 10;

    // Adresse de livraison
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Adresse de livraison', margin, yPosition);
    yPosition += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(order.address_label, margin + 5, yPosition);
    yPosition += 5;

    // Découper l'adresse en lignes
    const addressLines = order.client_address.split('\n');
    addressLines.forEach(line => {
      doc.text(line, margin + 5, yPosition);
      yPosition += 5;
    });
    yPosition += 5;

    // Détails de la commande
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Détails de la commande', margin, yPosition);
    yPosition += 8;

    // En-tête du tableau
    doc.setFillColor(16, 185, 129);
    doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Qté', margin + 5, yPosition);
    doc.text('Produit', margin + 25, yPosition);
    doc.text('Prix unit.', pageWidth - margin - 55, yPosition);
    doc.text('Total', pageWidth - margin - 25, yPosition);
    yPosition += 8;

    // Lignes du tableau (regroupées par produit)
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    const groupedItems = groupItemsByProduct(order.items);

    groupedItems.forEach((groupedItem, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      // Alternance de couleur de fond
      if (index % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 8, 'F');
      }

      doc.setFont('helvetica', 'bold');
      doc.text(groupedItem.totalQuantity.toString(), margin + 5, yPosition);
      doc.setFont('helvetica', 'normal');

      // Nom du produit avec variantes
      let productName = groupedItem.name;
      const variantsText = groupedItem.variants
        .map(v => v.variant !== 'Standard' ? `${v.variant}x${v.quantity}` : `${v.quantity}`)
        .join(', ');
      if (variantsText && groupedItem.variants.some(v => v.variant !== 'Standard')) {
        productName += ` (${variantsText})`;
      }

      doc.text(productName, margin + 25, yPosition);
      doc.text(`${groupedItem.price.toFixed(2)} €`, pageWidth - margin - 55, yPosition);
      doc.setFont('helvetica', 'bold');
      doc.text(`${groupedItem.totalPrice.toFixed(2)} €`, pageWidth - margin - 25, yPosition);
      yPosition += 8;
    });

    yPosition += 5;

    // Total
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Total :', pageWidth - margin - 60, yPosition);
    doc.setTextColor(16, 185, 129);
    doc.text(`${parseFloat(order.total).toFixed(2)} €`, pageWidth - margin - 25, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 10;

    // Informations d'expédition
    if (order.shipped_date) {
      yPosition += 5;
      doc.setFillColor(209, 250, 229);
      doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 25, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      yPosition += 2;
      doc.text(`Date de commande : ${new Date(order.date).toLocaleDateString('fr-FR')}`, margin + 5, yPosition);
      yPosition += 6;
      doc.text(`Date d'expédition : ${new Date(order.shipped_date).toLocaleDateString('fr-FR')}`, margin + 5, yPosition);
      yPosition += 6;

      if (order.carrier) {
        doc.text(`Transporteur : ${order.carrier}`, margin + 5, yPosition);
        yPosition += 6;
      }

      if (order.tracking_numbers && order.tracking_numbers.length > 0) {
        doc.text(`Numéros de suivi : ${order.tracking_numbers.join(', ')}`, margin + 5, yPosition);
      }
    }

    // Pied de page
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    const footerText = `Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`;
    addCenteredText(footerText, doc.internal.pageSize.getHeight() - 10, 8);

    // Télécharger le PDF
    doc.save(`Commande_${order.id}_${order.client_name.replace(/\s/g, '_')}.pdf`);
  };

  const renderShippedTab = () => {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6 text-green-600">📬 Commandes expédiées</h2>
        {shippedOrders.sort((a, b) => new Date(b.shipped_date) - new Date(a.shipped_date)).map(order => (
          <div key={order.id} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500 mb-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-green-600">Commande #{order.id}</h3>
                <p className="text-gray-700"><strong>{order.client_name}</strong> - {order.client_email}</p>
                <div className="mt-2 bg-gray-50 p-3 rounded border">
                  <p className="text-sm font-semibold">{order.address_label}</p>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{order.client_address}</p>
                </div>

                {/* Infos d'expédition */}
                {order.carrier && (
                  <div className="mt-3 bg-green-50 p-3 rounded border border-green-200">
                    <p className="text-sm font-semibold text-green-800 mb-2">🚚 Transporteur : {order.carrier}</p>
                    {order.tracking_numbers && order.tracking_numbers.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-600">Numéros de suivi :</p>
                        {order.tracking_numbers.map((trackingNum, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-xs bg-white px-2 py-1 rounded border font-mono">
                              📦 {trackingNum}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <p className="text-sm text-gray-600 mt-2">📅 Commandé : {new Date(order.date).toLocaleDateString('fr-FR')}</p>
                <p className="text-sm text-green-600 font-semibold">🚚 Expédié : {new Date(order.shipped_date).toLocaleDateString('fr-FR')}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">✅ Expédié</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => generatePDF(order)} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2">
                  <Download size={18} />PDF
                </button>
                <button onClick={() => sendShippingEmail(order)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <Send size={18} />Email
                </button>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              {groupItemsByProduct(order.items).map(groupedItem => (
                <div key={groupedItem.id} className="flex items-center gap-3 bg-green-50 p-3 rounded border border-green-200">
                  <span className="text-2xl font-bold text-green-600 min-w-[40px]">{groupedItem.totalQuantity}</span>
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">
                      {groupedItem.name}
                      <span className="text-purple-600 font-semibold ml-2">
                        {groupedItem.variants.map((v, idx) => (
                          <span key={v.id}>
                            {v.variant !== 'Standard' ? v.variant : ''}{v.variant !== 'Standard' && '×'}{v.quantity}
                            {idx < groupedItem.variants.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </span>
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{groupedItem.price.toFixed(2)} € × {groupedItem.totalQuantity}</p>
                    <p className="font-bold text-lg">{groupedItem.totalPrice.toFixed(2)} €</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-xl font-bold">Total</span>
              <span className="text-2xl font-bold text-blue-600">{parseFloat(order.total).toFixed(2)} €</span>
            </div>
          </div>
        ))}
        {shippedOrders.length === 0 && <div className="text-center py-12 text-gray-500">Aucune commande expédiée</div>}
      </div>
    );
  };

  const renderClientsTab = () => {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6 text-blue-600">👥 Clients</h2>
        <button onClick={() => setShowNewClientForm(!showNewClientForm)} className="mb-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus size={20} />Nouveau client
        </button>

        {showNewClientForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6 space-y-4">
            <input type="text" placeholder="Nom" value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} className="w-full p-3 border rounded-lg" />
            <input type="email" placeholder="Email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} className="w-full p-3 border rounded-lg" />
            <button onClick={addClient} className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-bold">Ajouter le client</button>
          </div>
        )}

        <div className="space-y-4">
          {clients.map(client => {
            const clientOrders = orders.filter(o => o.client_id === client.id);
            const balance = getClientBalance(client.id);

            return (
              <div key={client.id} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{client.name}</h3>
                    <p className="text-gray-600">{client.email}</p>
                    <p className="text-sm text-gray-500 mt-2">{clientOrders.length} commande(s)</p>
                    <p className={`text-lg font-bold mt-2 ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Solde : {balance.toFixed(2)} € {balance >= 0 ? '💰' : '⚠️'}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="font-bold mb-2 flex items-center gap-2"><MapPin size={18} />Adresses</h4>
                  {client.addresses && client.addresses.length > 0 ? (
                    <div className="space-y-2">
                      {client.addresses.map((addr, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded border">
                          {editingClientAddress === `${client.id}-${index}` ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editClientAddressForm.label}
                                onChange={(e) => setEditClientAddressForm({ ...editClientAddressForm, label: e.target.value })}
                                className="w-full p-2 border rounded"
                                placeholder="Label"
                              />
                              <textarea
                                value={editClientAddressForm.address}
                                onChange={(e) => setEditClientAddressForm({ ...editClientAddressForm, address: e.target.value })}
                                className="w-full p-2 border rounded"
                                rows="3"
                                placeholder="Adresse"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => updateClientAddress(client.id, index, editClientAddressForm.label, editClientAddressForm.address)}
                                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-1"
                                >
                                  <Check size={16} />Enregistrer
                                </button>
                                <button
                                  onClick={() => setEditingClientAddress(null)}
                                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                                >
                                  Annuler
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-start">
                              <div className="flex items-start gap-2 flex-1">
                                <button
                                  onClick={() => toggleFavoriteAddress(client.id, index)}
                                  className="mt-1"
                                >
                                  <Star
                                    size={18}
                                    className={addr.favorite ? 'text-yellow-500' : 'text-gray-300'}
                                    fill={addr.favorite ? 'currentColor' : 'none'}
                                  />
                                </button>
                                <div className="flex-1">
                                  <p className="font-semibold">{addr.label}</p>
                                  <p className="text-sm text-gray-600 whitespace-pre-line">{addr.address}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setEditingClientAddress(`${client.id}-${index}`);
                                    setEditClientAddressForm({ label: addr.label, address: addr.address });
                                  }}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Edit size={16} />
                                </button>
                                <button onClick={() => deleteClientAddress(client.id, index)} className="text-red-600 hover:text-red-800">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Aucune adresse</p>
                  )}
                  <button onClick={() => {
                    const label = prompt('Label de l\'adresse :');
                    const address = prompt('Adresse complète :');
                    if (label && address) addClientAddress(client.id, label, address);
                  }} className="mt-2 text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm">
                    <Plus size={16} />Ajouter une adresse
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderBalanceTab = () => {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6 text-blue-600">💰 Gestion des soldes</h2>

        <button onClick={() => setShowNewPaymentForm(!showNewPaymentForm)} className="mb-4 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2">
          <Plus size={20} />Enregistrer un paiement
        </button>

        {showNewPaymentForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6 space-y-4">
            <select value={newPayment.clientId} onChange={(e) => setNewPayment({ ...newPayment, clientId: e.target.value })} className="w-full p-3 border rounded-lg">
              <option value="">-- Sélectionner un client --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input type="number" step="0.01" placeholder="Montant" value={newPayment.amount} onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })} className="w-full p-3 border rounded-lg" />
            <input type="date" value={newPayment.date} onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })} className="w-full p-3 border rounded-lg" />
            <input type="text" placeholder="Note (optionnel)" value={newPayment.note} onChange={(e) => setNewPayment({ ...newPayment, note: e.target.value })} className="w-full p-3 border rounded-lg" />
            <button onClick={addPayment} className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-bold">Enregistrer</button>
          </div>
        )}

        <div className="space-y-4">
          {clients.map(client => {
            const balance = getClientBalance(client.id);
            const clientOrders = orders.filter(o => o.client_id === client.id);
            const clientPayments = payments.filter(p => p.client_id === client.id);
            const totalOrders = clientOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);
            const totalPayments = clientPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

            return (
              <div key={client.id} className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4">{client.name}</h3>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600">Total commandes</p>
                    <p className="text-2xl font-bold text-red-600">{totalOrders.toFixed(2)} €</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600">Total paiements</p>
                    <p className="text-2xl font-bold text-green-600">{totalPayments.toFixed(2)} €</p>
                  </div>
                  <div className={`p-4 rounded-lg text-center ${balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                    <p className="text-sm text-gray-600">Solde</p>
                    <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      {balance.toFixed(2)} €
                    </p>
                  </div>
                </div>

                {clientPayments.length > 0 && (
                  <div>
                    <h4 className="font-bold mb-2">Historique des paiements</h4>
                    <div className="space-y-2">
                      {clientPayments.sort((a, b) => new Date(b.date) - new Date(a.date)).map(payment => (
                        <div key={payment.id} className="flex justify-between items-center bg-green-50 p-3 rounded border">
                          <div>
                            <span className="font-bold">{parseFloat(payment.amount).toFixed(2)} €</span>
                            <span className="text-sm text-gray-600 ml-2">- {new Date(payment.date).toLocaleDateString('fr-FR')}</span>
                            {payment.note && <p className="text-sm text-gray-500">{payment.note}</p>}
                          </div>
                          <button onClick={() => deletePayment(payment.id)} className="text-red-600 hover:text-red-800">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderProductsTab = () => {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6 text-blue-600">💰 Catalogue produits</h2>

        <button onClick={() => setShowNewProductForm(!showNewProductForm)} className="mb-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus size={20} />Nouveau produit
        </button>

        {showNewProductForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6 space-y-4">
            <input type="text" placeholder="Nom du produit" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="w-full p-3 border rounded-lg" />
            <input type="number" step="0.01" placeholder="Prix de base" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} className="w-full p-3 border rounded-lg" />

            {/* Option pour ajouter des déclinaisons */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="hasVariants"
                checked={hasVariants}
                onChange={(e) => {
                  setHasVariants(e.target.checked);
                  if (!e.target.checked) {
                    setProductVariants([{ name: '', priceAdjustment: 0 }]);
                  }
                }}
                className="w-5 h-5 cursor-pointer"
              />
              <label htmlFor="hasVariants" className="font-semibold cursor-pointer">Ce produit a des déclinaisons (tailles, couleurs, etc.)</label>
            </div>

            {hasVariants && (
              <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                <h4 className="font-bold mb-3 text-purple-800">🎨 Déclinaisons du produit</h4>
                <p className="text-sm text-gray-600 mb-3">Ajoutez des variantes (ex: 38, 39, 40 pour des chaussures). L'ajustement de prix est optionnel.</p>

                <div className="space-y-2">
                  {productVariants.map((variant, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) => updateVariant(index, 'name', e.target.value)}
                        placeholder="Nom (ex: 42, Rouge, M...)"
                        className="flex-1 p-2 border rounded-lg"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={variant.priceAdjustment}
                        onChange={(e) => updateVariant(index, 'priceAdjustment', e.target.value)}
                        placeholder="Ajustement prix (±)"
                        className="w-40 p-2 border rounded-lg"
                      />
                      {productVariants.length > 1 && (
                        <button
                          onClick={() => removeVariant(index)}
                          className="bg-red-100 text-red-600 px-3 py-2 rounded-lg hover:bg-red-200"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                      {index === productVariants.length - 1 && (
                        <button
                          onClick={addVariantField}
                          className="bg-purple-100 text-purple-600 px-3 py-2 rounded-lg hover:bg-purple-200 flex items-center gap-1"
                        >
                          <Plus size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={addProduct} className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-bold">Ajouter le produit</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(product => (
            <div key={product.id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{product.name}</h3>
                  <p className="text-2xl font-bold text-blue-600 mt-2">{parseFloat(product.price).toFixed(2)} €</p>

                  {product.variants && product.variants.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-semibold text-purple-600 mb-2">🎨 Déclinaisons :</p>
                      <div className="flex flex-wrap gap-1">
                        {product.variants.map((variant, idx) => (
                          <span key={idx} className="inline-block text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                            {variant.name}
                            {variant.priceAdjustment !== 0 && (
                              <span className="font-semibold">
                                {' '}({variant.priceAdjustment > 0 ? '+' : ''}{variant.priceAdjustment.toFixed(2)} €)
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={() => deleteProduct(product.id)} className="text-red-600 hover:text-red-800">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
        {products.length === 0 && <div className="text-center py-12 text-gray-500">Aucun produit dans le catalogue</div>}
      </div>
    );
  };

  const renderPaymentTab = () => {
    // Vue détaillée d'un client
    if (selectedPaymentClient) {
      const client = paymentClients.find(c => c.id === selectedPaymentClient);
      const clientOrders = paymentOrders.filter(o => o.client_id === selectedPaymentClient);
      const clientTransactions = paymentTransactions.filter(t => t.client_id === selectedPaymentClient);
      const balance = getPaymentClientBalance(selectedPaymentClient);
      const totalOrders = clientOrders.reduce((sum, o) => sum + parseFloat(o.amount), 0);
      const totalPayments = clientTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

      return (
        <div>
          <button
            onClick={() => setSelectedPaymentClient(null)}
            className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← Retour au dashboard
          </button>

          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">{client.name}</h2>
                <p className={`text-4xl font-bold mt-3 ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Solde: {balance.toFixed(2)} €
                </p>
              </div>
              <button
                onClick={() => deletePaymentClient(client.id)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Total commandes</p>
                <p className="text-2xl font-bold text-red-600">{totalOrders.toFixed(2)} €</p>
                <p className="text-sm text-gray-500 mt-1">{clientOrders.length} commande(s)</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Total paiements</p>
                <p className="text-2xl font-bold text-green-600">{totalPayments.toFixed(2)} €</p>
                <p className="text-sm text-gray-500 mt-1">{clientTransactions.length} paiement(s)</p>
              </div>
              <div className={`p-4 rounded-lg text-center ${balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                <p className="text-sm text-gray-600">Reste à payer</p>
                <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {Math.abs(balance).toFixed(2)} €
                </p>
              </div>
            </div>
          </div>

          {/* Commandes et Paiements en 2 colonnes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Colonne Commandes */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">📦 Commandes</h3>
                <button
                  onClick={() => {
                    setNewPaymentOrder({ ...newPaymentOrder, clientId: client.id.toString() });
                    setShowNewPaymentOrder(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus size={18} />Nouvelle
                </button>
              </div>

              {showNewPaymentOrder && (
                <div className="bg-blue-50 p-4 rounded-lg mb-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Référence"
                    value={newPaymentOrder.reference}
                    onChange={(e) => setNewPaymentOrder({ ...newPaymentOrder, reference: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Numéro de commande"
                    value={newPaymentOrder.orderNumber}
                    onChange={(e) => setNewPaymentOrder({ ...newPaymentOrder, orderNumber: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Montant"
                    value={newPaymentOrder.amount}
                    onChange={(e) => setNewPaymentOrder({ ...newPaymentOrder, amount: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                  />
                  <input
                    type="date"
                    value={newPaymentOrder.date}
                    onChange={(e) => setNewPaymentOrder({ ...newPaymentOrder, date: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="shipped"
                      checked={newPaymentOrder.shipped}
                      onChange={(e) => setNewPaymentOrder({ ...newPaymentOrder, shipped: e.target.checked })}
                      className="w-5 h-5 cursor-pointer"
                    />
                    <label htmlFor="shipped" className="cursor-pointer">Commande expédiée</label>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addPaymentOrder} className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                      Ajouter
                    </button>
                    <button onClick={() => setShowNewPaymentOrder(false)} className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500">
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {clientOrders.sort((a, b) => new Date(b.date) - new Date(a.date)).map(order => (
                  editingPaymentOrder === order.id ? (
                    // Formulaire d'édition
                    <div key={order.id} className="bg-blue-50 p-4 rounded-lg space-y-3 border-2 border-blue-300">
                      <input
                        type="text"
                        placeholder="Référence"
                        value={editPaymentOrderForm.reference}
                        onChange={(e) => setEditPaymentOrderForm({ ...editPaymentOrderForm, reference: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="Numéro de commande"
                        value={editPaymentOrderForm.orderNumber}
                        onChange={(e) => setEditPaymentOrderForm({ ...editPaymentOrderForm, orderNumber: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Montant"
                        value={editPaymentOrderForm.amount}
                        onChange={(e) => setEditPaymentOrderForm({ ...editPaymentOrderForm, amount: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                      />
                      <input
                        type="date"
                        value={editPaymentOrderForm.date}
                        onChange={(e) => setEditPaymentOrderForm({ ...editPaymentOrderForm, date: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`edit-shipped-${order.id}`}
                          checked={editPaymentOrderForm.shipped}
                          onChange={(e) => setEditPaymentOrderForm({ ...editPaymentOrderForm, shipped: e.target.checked })}
                          className="w-5 h-5 cursor-pointer"
                        />
                        <label htmlFor={`edit-shipped-${order.id}`} className="cursor-pointer">Commande expédiée</label>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={updatePaymentOrder} className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                          <Check size={18} className="inline mr-1" />Enregistrer
                        </button>
                        <button onClick={cancelEditingPaymentOrder} className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500">
                          <X size={18} className="inline mr-1" />Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Affichage normal
                    <div key={order.id} className="flex items-center justify-between bg-gray-50 p-4 rounded border">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg">#{order.order_number}</span>
                          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">{order.reference}</span>
                          {order.shipped && <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">✓ Expédiée</span>}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{new Date(order.date).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-red-600">{parseFloat(order.amount).toFixed(2)} €</span>
                        <button onClick={() => startEditingPaymentOrder(order)} className="text-blue-600 hover:text-blue-800">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => deletePaymentOrder(order.id)} className="text-red-600 hover:text-red-800">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  )
                ))}
                {clientOrders.length === 0 && (
                  <p className="text-center text-gray-500 py-4">Aucune commande</p>
                )}
              </div>
            </div>

            {/* Colonne Paiements */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">💰 Paiements</h3>
                <button
                  onClick={() => {
                    setNewPaymentTransaction({ ...newPaymentTransaction, clientId: client.id.toString() });
                    setShowNewPaymentTransaction(true);
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Plus size={18} />Nouveau
                </button>
              </div>

              {showNewPaymentTransaction && (
                <div className="bg-green-50 p-4 rounded-lg mb-4 space-y-3">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Montant"
                    value={newPaymentTransaction.amount}
                    onChange={(e) => setNewPaymentTransaction({ ...newPaymentTransaction, amount: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                  />
                  <input
                    type="date"
                    value={newPaymentTransaction.date}
                    onChange={(e) => setNewPaymentTransaction({ ...newPaymentTransaction, date: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Note (optionnel)"
                    value={newPaymentTransaction.note}
                    onChange={(e) => setNewPaymentTransaction({ ...newPaymentTransaction, note: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                  />
                  <div className="flex gap-2">
                    <button onClick={addPaymentTransaction} className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                      Ajouter
                    </button>
                    <button onClick={() => setShowNewPaymentTransaction(false)} className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500">
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {clientTransactions.sort((a, b) => new Date(b.date) - new Date(a.date)).map(transaction => (
                  editingPaymentTransaction === transaction.id ? (
                    // Formulaire d'édition
                    <div key={transaction.id} className="bg-green-50 p-4 rounded-lg space-y-3 border-2 border-green-300">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Montant"
                        value={editPaymentTransactionForm.amount}
                        onChange={(e) => setEditPaymentTransactionForm({ ...editPaymentTransactionForm, amount: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                      />
                      <input
                        type="date"
                        value={editPaymentTransactionForm.date}
                        onChange={(e) => setEditPaymentTransactionForm({ ...editPaymentTransactionForm, date: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="Note (optionnel)"
                        value={editPaymentTransactionForm.note}
                        onChange={(e) => setEditPaymentTransactionForm({ ...editPaymentTransactionForm, note: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                      />
                      <div className="flex gap-2">
                        <button onClick={updatePaymentTransaction} className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                          <Check size={18} className="inline mr-1" />Enregistrer
                        </button>
                        <button onClick={cancelEditingPaymentTransaction} className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500">
                          <X size={18} className="inline mr-1" />Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Affichage normal
                    <div key={transaction.id} className="flex items-center justify-between bg-green-50 p-4 rounded border">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg text-green-600">{parseFloat(transaction.amount).toFixed(2)} €</span>
                          <span className="text-sm text-gray-600">- {new Date(transaction.date).toLocaleDateString('fr-FR')}</span>
                        </div>
                        {transaction.note && <p className="text-sm text-gray-500 mt-1">{transaction.note}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => startEditingPaymentTransaction(transaction)} className="text-blue-600 hover:text-blue-800">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => deletePaymentTransaction(transaction.id)} className="text-red-600 hover:text-red-800">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  )
                ))}
                {clientTransactions.length === 0 && (
                  <p className="text-center text-gray-500 py-4">Aucun paiement</p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Dashboard des clients
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6 text-blue-600">💳 Suivi des paiements</h2>

        <button
          onClick={() => setShowNewPaymentClient(true)}
          className="mb-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />Nouveau client
        </button>

        {showNewPaymentClient && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6 space-y-4">
            <input
              type="text"
              placeholder="Nom du client"
              value={newPaymentClient.name}
              onChange={(e) => setNewPaymentClient({ name: e.target.value })}
              className="w-full p-3 border rounded-lg"
            />
            <div className="flex gap-2">
              <button onClick={addPaymentClient} className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 font-bold">
                Ajouter
              </button>
              <button onClick={() => setShowNewPaymentClient(false)} className="bg-gray-400 text-white px-4 py-3 rounded-lg hover:bg-gray-500">
                Annuler
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paymentClients.map(client => {
            const balance = getPaymentClientBalance(client.id);
            const clientOrders = paymentOrders.filter(o => o.client_id === client.id);
            const clientTransactions = paymentTransactions.filter(t => t.client_id === client.id);

            return (
              <div
                key={client.id}
                onClick={() => setSelectedPaymentClient(client.id)}
                className={`bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-all border-2 ${balance < 0 ? 'border-red-300' : 'border-green-300'
                  }`}
              >
                <h3 className="text-xl font-bold mb-3">{client.name}</h3>
                <p className={`text-3xl font-bold mb-3 ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {balance.toFixed(2)} €
                </p>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>📦 {clientOrders.length} commande(s)</p>
                  <p>💰 {clientTransactions.length} paiement(s)</p>
                </div>
              </div>
            );
          })}
        </div>

        {paymentClients.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aucun client enregistré
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">GESTION</h1>

            {/* Boutons de navigation principaux */}
            <div className="flex gap-3">
              <button
                onClick={() => setActiveMode('commande')}
                className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${activeMode === 'commande'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                <Package size={20} />
                Gestion Commandes
              </button>
              <button
                onClick={() => setActiveMode('paiement')}
                className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${activeMode === 'paiement'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                <CreditCard size={20} />
                Suivi Paiements
              </button>
            </div>
          </div>
        </div>

        {/* Menu des onglets - Visible uniquement en mode commande */}
        {activeMode === 'commande' && (
          <div className="bg-white rounded-lg shadow-md mb-4 overflow-x-auto">
            <div className="flex border-b">
              <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm ${activeTab === 'dashboard' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>
                📊 Dashboard
              </button>
              <button onClick={() => setActiveTab('new-order')} className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm ${activeTab === 'new-order' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>
                <Plus size={18} />Nouvelle
              </button>
              <button onClick={() => setActiveTab('orders')} className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm ${activeTab === 'orders' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>
                <Package size={18} />Commandes ({pendingOrders.length})
              </button>
              <button onClick={() => setActiveTab('packed')} className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm ${activeTab === 'packed' ? 'border-b-2 border-orange-600 text-orange-600' : 'text-gray-600'}`}>
                <Package size={18} />Carton ({packedOrders.length})
              </button>
              <button onClick={() => setActiveTab('shipped')} className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm ${activeTab === 'shipped' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-600'}`}>
                <Check size={18} />Expédiés ({shippedOrders.length})
              </button>
              <button onClick={() => setActiveTab('clients')} className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm ${activeTab === 'clients' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>
                <Users size={18} />Clients ({clients.length})
              </button>
              <button onClick={() => setActiveTab('balance')} className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm ${activeTab === 'balance' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>
                <CreditCard size={18} />Solde
              </button>
              <button onClick={() => setActiveTab('products')} className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm ${activeTab === 'products' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>
                💰 Produits ({products.length})
              </button>
            </div>
          </div>
        )}

        <div>
          {activeMode === 'commande' && (
            <>
              {activeTab === 'dashboard' && renderDashboardTab()}
              {activeTab === 'new-order' && renderNewOrderTab()}
              {activeTab === 'orders' && renderOrdersTab()}
              {activeTab === 'packed' && renderPackedTab()}
              {activeTab === 'shipped' && renderShippedTab()}
              {activeTab === 'clients' && renderClientsTab()}
              {activeTab === 'balance' && renderBalanceTab()}
              {activeTab === 'products' && renderProductsTab()}
            </>
          )}

          {activeMode === 'paiement' && renderPaymentTab()}
        </div>

        {/* Modale de sélection rapide des déclinaisons */}
        {showVariantsModal && variantsModalProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* En-tête */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold">{variantsModalProduct.name}</h3>
                    <p className="text-purple-100 mt-1">Prix de base: {variantsModalProduct.price.toFixed(2)} €</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowVariantsModal(false);
                      setVariantsModalProduct(null);
                      setVariantsQuantities({});
                    }}
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Corps de la modale avec scroll */}
              <div className="flex-1 overflow-y-auto p-6">
                <p className="text-gray-600 mb-4 text-sm">
                  Sélectionnez les quantités pour chaque déclinaison que vous souhaitez ajouter à la commande :
                </p>

                <div className="space-y-3">
                  {variantsModalProduct.variants.map((variant, index) => {
                    const variantPrice = variantsModalProduct.price + (variant.priceAdjustment || 0);
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200 hover:border-purple-400 transition-all"
                      >
                        <div className="flex-1">
                          <p className="font-bold text-lg text-gray-800">{variant.name}</p>
                          <p className="text-sm text-gray-600">
                            Prix: {variantPrice.toFixed(2)} €
                            {variant.priceAdjustment !== 0 && (
                              <span className="ml-2 text-purple-600 font-semibold">
                                ({variant.priceAdjustment > 0 ? '+' : ''}{variant.priceAdjustment.toFixed(2)} €)
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <label className="text-sm font-semibold text-gray-600">Quantité:</label>
                          <input
                            type="number"
                            min="0"
                            value={variantsQuantities[index] || 0}
                            onChange={(e) => updateVariantQuantity(index, e.target.value)}
                            className="w-24 p-2 border-2 border-purple-300 rounded-lg text-center font-bold text-lg focus:border-purple-500 focus:outline-none"
                          />
                        </div>

                        {variantsQuantities[index] > 0 && (
                          <div className="text-right min-w-[100px]">
                            <p className="text-sm text-gray-500">Total</p>
                            <p className="font-bold text-xl text-green-600">
                              {(variantPrice * variantsQuantities[index]).toFixed(2)} €
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Total global */}
                {Object.values(variantsQuantities).some(q => q > 0) && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">Total de la sélection</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {Object.entries(variantsQuantities).filter(([, qty]) => qty > 0).length} déclinaison(s) sélectionnée(s)
                        </p>
                      </div>
                      <p className="text-3xl font-bold text-green-600">
                        {Object.entries(variantsQuantities).reduce((total, [index, qty]) => {
                          if (qty > 0) {
                            const variant = variantsModalProduct.variants[parseInt(index)];
                            const price = variantsModalProduct.price + (variant.priceAdjustment || 0);
                            return total + (price * qty);
                          }
                          return total;
                        }, 0).toFixed(2)} €
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Pied de page */}
              <div className="p-6 bg-gray-50 border-t flex gap-3">
                <button
                  onClick={() => {
                    setShowVariantsModal(false);
                    setVariantsModalProduct(null);
                    setVariantsQuantities({});
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-semibold transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={addVariantsToOrder}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 font-bold transition-all shadow-lg"
                >
                  Ajouter à la commande
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;