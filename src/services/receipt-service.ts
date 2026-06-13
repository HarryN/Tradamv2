import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, OrderItem } from '@/types';

export const generateReceiptPDF = async (
  order: Order, 
  items: OrderItem[], 
  role: 'buyer' | 'seller',
  language: 'en' | 'fr' = 'en'
) => {
  try {
    const isFr = language === 'fr';
    
    // Translation Map
    const labels = {
      title: isFr ? (role === 'buyer' ? 'Reçu de Paiement' : 'Reçu de Vente') : (role === 'buyer' ? 'Payment Receipt' : 'Sales Receipt'),
      orderId: isFr ? 'ID Commande:' : 'Order ID:',
      date: isFr ? 'Date:' : 'Date:',
      status: isFr ? 'Statut:' : 'Status:',
      paymentRef: isFr ? 'Réf. Paiement:' : 'Payment Ref:',
      accountDetails: isFr ? 'Détails du Compte:' : 'Account Details:',
      accountName: isFr ? 'Nom du Compte:' : 'Account Name:',
      momoNumber: isFr ? 'Numéro MoMo:' : 'MoMo Number:',
      product: isFr ? 'Produit' : 'Product',
      qty: isFr ? 'Qté' : 'Qty',
      unitPrice: isFr ? 'Prix Unitaire' : 'Unit Price',
      total: isFr ? 'Total' : 'Total',
      totalPaid: isFr ? 'Total Payé:' : 'Total Paid:',
      sellerSubtotal: isFr ? 'Sous-total Vendeur:' : 'Seller Subtotal:',
      thankYou: isFr ? 'Merci d\'utiliser Tradam. Pour tout litige, veuillez utiliser les outils de la plateforme.' : 'Thank you for using Tradam. For any disputes, please use the platform tools.',
      computerGenerated: isFr ? 'Ceci est un reçu généré par ordinateur et ne nécessite pas de signature.' : 'This is a computer-generated receipt and does not require a signature.'
    };

    console.log('Generating PDF for order:', order.id, 'in', language);
    const doc = new jsPDF();
    
    // Branding
    doc.setFontSize(24);
    doc.setTextColor(79, 70, 229); // Primary color
    doc.text('TRADAM', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(isFr ? 'Votre Marché Local de Confiance' : 'Your Trusted Local Marketplace', 105, 26, { align: 'center' });
    
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 35, 190, 35);
    
    // Title
    doc.setFontSize(16);
    doc.setTextColor(33, 33, 33);
    doc.text(labels.title, 20, 45);
    
    // Info Block
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(labels.orderId, 20, 55);
    doc.setFont('helvetica', 'bold');
    doc.text(String(order.id || 'N/A'), 50, 55);
    
    doc.setFont('helvetica', 'normal');
    doc.text(labels.date, 20, 62);
    const dateStr = order.created_at ? new Date(order.created_at).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US') : new Date().toLocaleString();
    doc.text(dateStr, 50, 62);
    
    doc.text(labels.status, 20, 69);
    doc.setFont('helvetica', 'bold');
    doc.text(String(order.status || 'unknown').toUpperCase(), 50, 69);
    
    doc.setFont('helvetica', 'normal');
    if (order.payment_reference) {
      doc.text(labels.paymentRef, 20, 76);
      doc.text(String(order.payment_reference), 50, 76);
    }

    // MoMo Details (Real feel)
    const momoY = order.payment_reference ? 83 : 76;
    doc.setFont('helvetica', 'bold');
    doc.text(labels.accountDetails, 20, momoY);
    doc.setFont('helvetica', 'normal');
    
    const momoName = order.buyer?.display_name || order.buyer?.email || (isFr ? 'Client Apprécié' : 'Valued Customer');
    const momoPhone = order.payment_phone || 'N/A';
    
    doc.text(`${labels.accountName} ${momoName}`, 20, momoY + 7);
    doc.text(`${labels.momoNumber} ${momoPhone}`, 20, momoY + 14);

    // Items Table
    const tableData = (items || []).map((item) => [
      String(item.product?.title || item.product_id || (isFr ? 'Produit Inconnu' : 'Unknown Product')),
      String(item.quantity || 0),
      `${(item.unit_price ?? 0).toLocaleString()} FCFA`,
      `${((item.quantity ?? 0) * (item.unit_price ?? 0)).toLocaleString()} FCFA`
    ]);
    
    const sellerTotal = (items || []).reduce((sum, item) => sum + (item.quantity ?? 0) * (item.unit_price ?? 0), 0);

    autoTable(doc, {
      startY: momoY + 25,
      head: [[labels.product, labels.qty, labels.unitPrice, labels.total]],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
      margin: { left: 20, right: 20 }
    });
    
    // Summary
    const finalY = (doc as any).lastAutoTable?.finalY || 150;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    if (role === 'buyer') {
      doc.text(`${labels.totalPaid} ${(order.total_price || 0).toLocaleString()} FCFA`, 190, finalY + 15, { align: 'right' });
    } else {
      doc.text(`${labels.sellerSubtotal} ${sellerTotal.toLocaleString()} FCFA`, 190, finalY + 15, { align: 'right' });
    }
    
    // Terms & Conditions
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    const footerY = finalY + 45;
    doc.text(labels.thankYou, 105, footerY, { align: 'center' });
    doc.text(labels.computerGenerated, 105, footerY + 5, { align: 'center' });
    
    const fileName = `${isFr ? 'Recu' : 'Receipt'}-${String(order.id || 'order').substring(0, 8)}.pdf`;
    doc.save(fileName);
    console.log('PDF saved successfully:', fileName);
  } catch (error: any) {
    console.error('Failed to generate PDF:', error);
    alert('Failed to generate PDF receipt: ' + (error.message || 'Unknown error'));
  }
};
