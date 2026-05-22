<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Facture - Commande #{{ $order->id }}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #1f2937;
      background: #f5f5f5;
      padding: 40px 20px;
      line-height: 1.6;
    }
    .container {
      max-width: 850px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header-top {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-brand { font-size: 32px; font-weight: 700; margin-bottom: 8px; }
    .header-subtitle { font-size: 14px; opacity: 0.9; }
    .header-date { text-align: right; font-size: 14px; }
    .header-date-value { font-size: 18px; font-weight: 700; margin-top: 4px; }
    .content { padding: 40px; }
    .info-row { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .info-box { background: #f9fafb; padding: 16px; border-radius: 8px; border-left: 4px solid #667eea; }
    .info-label { font-size: 11px; color: #6b7280; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 6px; }
    .timing-banner {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      padding: 24px;
      border-radius: 8px;
      margin-bottom: 32px;
    }
    .timing-item { display: inline-block; margin-right: 32px; }
    .timing-label { font-size: 12px; opacity: 0.95; }
    .timing-value { font-size: 24px; font-weight: 700; margin-top: 4px; }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #1f2937;
      margin: 24px 0 16px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    th {
      background: #f3f4f6;
      padding: 12px 16px;
      text-align: left;
      font-weight: 700;
      font-size: 12px;
      color: #6b7280;
      border-bottom: 2px solid #e5e7eb;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      padding: 14px 16px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    tbody tr:hover { background: #f9fafb; }
    .qty-col { text-align: center; width: 80px; }
    .price-col { text-align: right; width: 120px; }
    .total-row {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      font-weight: 700;
    }
    .total-section {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 24px;
      border-radius: 8px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .total-label { font-size: 16px; font-weight: 600; }
    .total-amount { font-size: 42px; font-weight: 700; }
    .payment-info { background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #16a34a; margin-bottom: 24px; }
    .payment-item { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; }
    .payment-label { font-weight: 600; color: #6b7280; }
    .payment-value { font-weight: 700; color: #1f2937; }
    .footer {
      background: #f9fafb;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer-text { font-size: 13px; color: #6b7280; margin: 4px 0; }
    .actions {
      text-align: center;
      padding: 24px;
      background: #f5f5f5;
      border-top: 1px solid #e5e7eb;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      font-size: 14px;
    }
    .btn:hover { opacity: 0.95; }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; border-radius: 0; }
      .actions { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-top">
      <div>
        <div class="header-brand">{{ $order->restaurant?->name ?? 'Restaurant' }}</div>
        <div class="header-subtitle">FACTURE DE COMMANDE</div>
      </div>
      <div class="header-date">
        <div class="header-subtitle">Commandée le</div>
        <div class="header-date-value">{{ $order->created_at->format('d/m/Y') }}</div>
        <div class="header-subtitle" style="margin-top:8px">à {{ $order->created_at->format('H:i') }}</div>
      </div>
    </div>

    <div class="content">
      <div class="info-row">
        <div class="info-box">
          <div class="info-label">Commande n°</div>
          <div class="info-value">#{{ $order->id }}</div>
        </div>
        <div class="info-box">
          <div class="info-label">Type</div>
          <div class="info-value" style="font-size: 14px;">{{ $order->order_type === 'sur_place' ? '🍽️ Sur place' : '🛍️ À emporter' }}</div>
        </div>
        <div class="info-box">
          <div class="info-label">Téléphone</div>
          <div class="info-value" style="font-size: 14px;">{{ $order->customer_phone ?? 'N/A' }}</div>
        </div>
        @if($order->table_id && $order->table)
        <div class="info-box">
          <div class="info-label">Table</div>
          <div class="info-value">{{ $order->table->name }}</div>
        </div>
        @endif
      </div>

      <div class="timing-banner">
        <div class="timing-item">
          <div class="timing-label">⏱️ TEMPS DE PRÉPARATION</div>
          <div class="timing-value">{{ $order->estimated_prep_minutes }} min</div>
        </div>
        @if($order->promised_ready_at)
        <div class="timing-item">
          <div class="timing-label">🎯 HEURE PROMISE</div>
          <div class="timing-value">{{ $order->promised_ready_at->format('H:i') }}</div>
        </div>
        @endif
      </div>

      <h3 class="section-title">📦 DÉTAIL DES ARTICLES</h3>
      <table>
        <thead>
          <tr>
            <th>Produit</th>
            <th class="qty-col">Quantité</th>
            <th class="price-col">Prix unitaire</th>
            <th class="price-col">Total</th>
          </tr>
        </thead>
        <tbody>
          @foreach($order->items as $item)
            <tr>
              <td>{{ $item->product_name }}</td>
              <td class="qty-col">{{ $item->quantity }}</td>
              <td class="price-col">{{ number_format($item->unit_price, 0, ',', ' ') }} F</td>
              <td class="price-col" style="font-weight: 700;">{{ number_format($item->unit_price * $item->quantity, 0, ',', ' ') }} F</td>
            </tr>
          @endforeach
        </tbody>
      </table>

      <div class="total-section">
        <div class="total-label">💰 MONTANT TOTAL</div>
        <div class="total-amount">{{ number_format($order->total, 0, ',', ' ') }} F</div>
      </div>

      <h3 class="section-title">💳 PAIEMENT</h3>
      <div class="payment-info">
        <div class="payment-item">
          <span class="payment-label">Moyen de paiement:</span>
          <span class="payment-value">{{ $payment?->method === 'fedapay' ? '🏦 Fedapay' : ($payment?->method ?? '⏳ En attente') }}</span>
        </div>
        <div class="payment-item">
          <span class="payment-label">Statut:</span>
          <span class="payment-value">
            @if($payment?->status === 'confirmee')
              ✅ Confirmé
            @elseif($payment?->status === 'echec')
              ❌ Échoué
            @else
              ⏳ {{ $payment?->status ?? 'En attente' }}
            @endif
          </span>
        </div>
        @if($payment?->confirmed_at)
        <div class="payment-item" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(0,0,0,0.1);">
          <span class="payment-label">Confirmé le:</span>
          <span class="payment-value">{{ $payment->confirmed_at->format('d/m/Y à H:i') }}</span>
        </div>
        @endif
      </div>

    </div>

    <div class="footer">
      <div class="footer-text">✓ Merci de votre commande!</div>
      <div class="footer-text">Conservez cette facture à titre de preuve d'achat</div>
      <div class="footer-text" style="margin-top: 12px; font-size: 11px; opacity: 0.7;">Facture générée le {{ now()->format('d/m/Y à H:i') }}</div>
    </div>

    <div class="actions">
      <button class="btn" onclick="window.print();return false;">🖨️ Imprimer / Enregistrer en PDF</button>
    </div>
  </div>
</body>
</html>
