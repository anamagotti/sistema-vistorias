import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST(request: Request) {
  try {
    const { inspection, items, origin } = await request.json()

    // Tentar ler a logo e converter para base64
    let logoSrc = `${origin}/logo.png`
    try {
      // Tentativa 1: Sistema de arquivos local (funciona localmente)
      const logoPath = path.join(process.cwd(), "public", "logo.png")
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath)
        const base64Logo = logoBuffer.toString("base64")
        logoSrc = `data:image/png;base64,${base64Logo}`
      } else {
        // Tentativa 2: Fetch da URL pública (funciona na Vercel se o arquivo não estiver no disco local da function)
        // Adicionamos um timeout para não travar se a rede estiver lenta
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)
        
        const response = await fetch(`${origin}/logo.png`, { signal: controller.signal })
        clearTimeout(timeoutId)

        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const base64Logo = buffer.toString("base64")
          logoSrc = `data:image/png;base64,${base64Logo}`
        }
      }
    } catch (e) {
      console.error("Erro ao processar logo:", e)
      // Mantém a URL original como fallback
    }

    // Agrupar itens por categoria
    const groupedItems = items.reduce((acc: Record<string, typeof items>, item: (typeof items)[0]) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category].push(item)
      return acc
    }, {})

    // Criar HTML para o PDF
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              padding: 40px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #f97316;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #9a3412;
              font-size: 28px;
              margin-bottom: 5px;
            }
            .header p {
              color: #c2410c;
              font-size: 14px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin-bottom: 30px;
            }
            .info-item {
              background: #fef3c7;
              padding: 15px;
              border-radius: 8px;
            }
            .info-label {
              font-size: 12px;
              color: #92400e;
              margin-bottom: 5px;
            }
            .info-value {
              font-size: 16px;
              font-weight: bold;
              color: #78350f;
            }
            .score-section {
              background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
              padding: 20px;
              border-radius: 12px;
              margin-bottom: 30px;
              text-align: center;
            }
            .score-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin-top: 15px;
            }
            .score-item {
              background: white;
              padding: 15px;
              border-radius: 8px;
            }
            .score-label {
              font-size: 11px;
              color: #78350f;
              margin-bottom: 5px;
            }
            .score-value {
              font-size: 24px;
              font-weight: bold;
              color: #9a3412;
            }
            .rating-badge {
              display: inline-block;
              padding: 8px 20px;
              border-radius: 20px;
              font-weight: bold;
              font-size: 18px;
              margin-top: 10px;
            }
            .rating-excelente { background: #22c55e; color: white; }
            .rating-bom { background: #3b82f6; color: white; }
            .rating-ruim { background: #ef4444; color: white; }
            .category {
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .category-title {
              background: #f97316;
              color: white;
              padding: 12px 15px;
              border-radius: 8px 8px 0 0;
              font-size: 16px;
              font-weight: bold;
            }
            .category-items {
              border: 2px solid #f97316;
              border-top: none;
              border-radius: 0 0 8px 8px;
            }
            .item {
              padding: 15px;
              border-bottom: 1px solid #fed7aa;
            }
            .item:last-child {
              border-bottom: none;
            }
            .item-header {
              display: flex;
              justify-content: space-between;
              align-items: start;
              margin-bottom: 8px;
            }
            .item-name {
              font-weight: bold;
              color: #1f2937;
              flex: 1;
            }
            .item-points {
              font-size: 12px;
              color: #6b7280;
              margin-top: 3px;
            }
            .status-badge {
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: bold;
            }
            .status-ok {
              background: #dcfce7;
              color: #166534;
            }
            .status-no {
              background: #fee2e2;
              color: #991b1b;
            }
            .item-details {
              margin-top: 10px;
              padding: 10px;
              background: #f9fafb;
              border-radius: 6px;
              font-size: 13px;
            }
            .item-details strong {
              color: #374151;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
              border-top: 2px solid #f97316;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${logoSrc}" alt="Bar do Português" style="max-height: 80px; margin-bottom: 10px;" />
            <p>Check List de Supervisão</p>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Franquia</div>
              <div class="info-value">${inspection.franchises?.name || "N/A"}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Setor</div>
              <div class="info-value">${inspection.sector.toUpperCase()}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Data da Vistoria</div>
              <div class="info-value">${new Date(inspection.inspection_date).toLocaleDateString("pt-BR")}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Responsável pela Vistoria</div>
              <div class="info-value">${inspection.users?.full_name || inspection.users?.email || "N/A"}</div>
            </div>
          </div>

          <div class="score-section">
            <h2>Resultado da Vistoria</h2>
            <span class="rating-badge rating-${inspection.rating.toLowerCase().includes("excelente") ? "excelente" : inspection.rating.toLowerCase().includes("bom") ? "bom" : "ruim"}">
              ${inspection.rating}
            </span>
            <div class="score-grid">
              <div class="score-item">
                <div class="score-label">Pontos Possíveis</div>
                <div class="score-value">${inspection.total_points}</div>
              </div>
              <div class="score-item">
                <div class="score-label">Pontos Alcançados</div>
                <div class="score-value">${inspection.points_achieved}</div>
              </div>
              <div class="score-item">
                <div class="score-label">Percentual</div>
                <div class="score-value">${inspection.percentage.toFixed(1)}%</div>
              </div>
              <div class="score-item">
                <div class="score-label">Aproveitamento</div>
                <div class="score-value">${inspection.rating}</div>
              </div>
            </div>
          </div>

          ${Object.entries(groupedItems)
            .map(
              ([category, categoryItems]: [string, any]) => `
            <div class="category">
              <div class="category-title">${category}</div>
              <div class="category-items">
                ${categoryItems
                  .map(
                    (item: any) => `
                  <div class="item">
                    <div class="item-header">
                      <div>
                        <div class="item-name">${item.item_name}</div>
                        <div class="item-points">${item.points} pontos</div>
                      </div>
                      <span class="status-badge status-${item.status.toLowerCase()}">${item.status}</span>
                    </div>
                    ${
                      item.observation || item.responsible
                        ? `
                      <div class="item-details">
                        ${item.observation ? `<div><strong>Observação:</strong> ${item.observation}</div>` : ""}
                        ${item.responsible ? `<div style="margin-top: 5px;"><strong>Responsável:</strong> ${item.responsible}</div>` : ""}
                      </div>
                    `
                        : ""
                    }
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
          `,
            )
            .join("")}

          <div class="footer">
            <p>Relatório gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
            <p>Bar do Português - Sistema de Vistorias Automatizado</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `

    return NextResponse.json({ html })
  } catch (error) {
    console.error("[v0] Error generating PDF:", error)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}
