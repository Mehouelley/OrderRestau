<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Ticket cuisine - Commande #{{ $order->id }}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      font-family: Arial, Helvetica, sans-serif;
      background: #f4f6f8;
      color: #111827;
    }
    .ticket {
      max-width: 760px;
      margin: 0 auto;
      background: #fff;
      border: 2px solid #111827;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(15, 23, 42, 0.12);
    }
    .top {
      background: #111827;
      color: #fff;
      padding: 24px;
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
    }
    .brand { font-size: 28px; font-weight: 900; letter-spacing: 0.5px; }
    .sub { font-size: 12px; opacity: 0.8; margin-top: 4px; }
    .badge {
      display: inline-block;
      padding: 6px 10px;
      border-radius: 999px;
      background: #f59e0b;
      color: #111827;
      font-weight: 800;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }
    .content { padding: 24px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    .box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 14px;
    }
    .label { font-size: 11px; font-weight: 800; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .value { margin-top: 6px; font-size: 18px; font-weight: 900; color: #111827; }
    .timebox {
      margin: 18px 0 20px;
      padding: 18px;
      border-radius: 14px;
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      border: 1px solid #f59e0b;
    }
    .time-row { display: flex; flex-wrap: wrap; gap: 24px; }
    .time-item { min-width: 180px; }
    .time-item .label { color: #92400e; }
    .time-item .value { font-size: 26px; color: #111827; }
    .section-title {
      margin: 22px 0 12px;
      font-size: 15px;
      font-weight: 900;
      letter-spacing: 0.4px;
      text-transform: uppercase;
    }
    .items { display: grid; gap: 10px; }
    .item {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 12px 14px;
      background: #fff;
    }
    .item-name { font-size: 16px; font-weight: 800; }
    .item-meta { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .qty {
      min-width: 72px;
      text-align: center;
      align-self: center;
      background: #111827;
      color: white;
      border-radius: 999px;
      padding: 8px 10px;
      font-weight: 900;
    }
    .instructions {
      border-left: 4px solid #f59e0b;
      background: #fffbeb;
      padding: 14px 16px;
      border-radius: 10px;
      color: #92400e;
      font-weight: 700;
    }
    .footer {
      padding: 18px 24px 26px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
    .print-btn {
      border: 0;
      border-radius: 12px;
      padding: 12px 16px;
      font-weight: 800;
      background: #111827;
      color: white;
      cursor: pointer;
    }
    @media print {
      body { background: white; padding: 0; }
      .ticket { box-shadow: none; border-radius: 0; border: 0; }
      .footer { display: none; }
    }
    @media (max-width: 700px) {
      .grid { grid-template-columns: 1fr 1fr; }
      .top { flex-direction: column; }
      .time-row { gap: 12px; }
      .item { flex-direction: column; }
      .qty { width: fit-content; }
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="top">
      <div>
        <div class="brand">TICKET CUISINE</div>
        <div class="sub">{{ $order->restaurant?->name ?? 'Restaurant' }}</div>
      </div>
      <div style="text-align:right;">
        <div class="badge">{{ $order->status }}</div>
        <div class="sub" style="margin-top:10px;">Commande #{{ $order->id }}</div>
      </div>
    </div>

    <div class="content">
      <div class="grid">
        <div class="box">
          <div class="label">Table</div>
          <div class="value">{{ $order->table?->name ?? 'Emporter' }}</div>
        </div>
        <div class="box">
          <div class="label">Type</div>
          <div class="value" style="font-size:16px;">{{ $order->order_type === 'sur_place' ? 'Sur place' : 'A emporter' }}</div>
        </div>
        <div class="box">
          <div class="label">Arrivée</div>
          <div class="value" style="font-size:16px;">{{ $order->created_at->format('H:i') }}</div>
        </div>
        <div class="box">
          <div class="label">Préparation</div>
          <div class="value" style="font-size:16px;">{{ $order->estimated_prep_minutes }} min</div>
        </div>
      </div>

      <div class="timebox">
        <div class="time-row">
          <div class="time-item">
            <div class="label">Heure promise</div>
            <div class="value">{{ $order->promised_ready_at?->format('H:i') ?? 'N/A' }}</div>
          </div>
          <div class="time-item">
            <div class="label">Statut actuel</div>
            <div class="value" style="font-size:20px;">{{ strtoupper($order->status) }}</div>
          </div>
        </div>
      </div>

      @if($order->special_instructions)
        <div class="section-title">Consignes</div>
        <div class="instructions">{{ $order->special_instructions }}</div>
      @endif

      <div class="section-title">Articles à préparer</div>
      <div class="items">
        @foreach($order->items as $item)
          <div class="item">
            <div>
              <div class="item-name">{{ $item->product_name }}</div>
              <div class="item-meta">Commande #{{ $order->id }} · Table {{ $order->table?->name ?? 'Emporter' }}</div>
            </div>
            <div class="qty">x{{ $item->quantity }}</div>
          </div>
        @endforeach
      </div>
    </div>

    <div class="footer">
      <div>
        <div style="font-weight:800;">À envoyer à {{ $order->table?->name ?? 'client emporter' }}</div>
        <div style="font-size:12px;color:#6b7280;">Respecter l'heure promise pour éviter le retard.</div>
      </div>
      <button class="print-btn" onclick="window.print(); return false;">Imprimer le ticket</button>
    </div>
  </div>
</body>
</html>
