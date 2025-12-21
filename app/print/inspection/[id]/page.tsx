import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import PrintTrigger from "./print-trigger"

export default async function PrintInspectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Buscar vistoria
  const { data: inspection, error } = await supabase
    .from("inspections")
    .select("*, franchises(name)")
    .eq("id", id)
    .single()

  if (error || !inspection) {
    notFound()
  }

  // Buscar dados do inspetor
  const { data: inspector } = await supabase
    .from("users")
    .select("full_name, email")
    .eq("id", inspection.inspector_id)
    .single()

  const inspectionWithUser = {
    ...inspection,
    users: inspector
  }

  // Buscar itens
  const { data: items } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("inspection_id", id)
    .order("created_at")

  // Agrupar itens
  const groupedItems = items?.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category].push(item)
      return acc
    },
    {} as Record<string, any[]>,
  ) || {}

  const ratingClass = inspection.rating.toLowerCase().includes("excelente") 
    ? "rating-excelente" 
    : inspection.rating.toLowerCase().includes("bom") 
      ? "rating-bom" 
      : "rating-ruim"

  return (
    <div className="print-container">
      <PrintTrigger />
      <style dangerouslySetInnerHTML={{ __html: `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: Arial, sans-serif; 
          padding: 20px; 
          color: #333; 
          background: white;
        }
        @media print { 
          body { padding: 0; } 
          .no-print { display: none; }
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
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
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
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
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
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
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
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
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
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
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
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
          border-top: 2px solid #f97316;
          padding-top: 20px;
        }
      `}} />

      <div className="header">
        <img src="/logo.png" alt="Bar do Português" style={{ maxHeight: '80px', marginBottom: '10px' }} />
        <p>Check List de Supervisão</p>
      </div>

      <div className="info-grid">
        <div className="info-item">
          <div className="info-label">Franquia</div>
          <div className="info-value">{inspection.franchises?.name || "N/A"}</div>
        </div>
        <div className="info-item">
          <div className="info-label">Setor</div>
          <div className="info-value">{inspection.sector.toUpperCase()}</div>
        </div>
        <div className="info-item">
          <div className="info-label">Data da Vistoria</div>
          <div className="info-value">{new Date(inspection.inspection_date).toLocaleDateString("pt-BR")}</div>
        </div>
        <div className="info-item">
          <div className="info-label">Responsável pela Vistoria</div>
          <div className="info-value">{inspectionWithUser.users?.full_name || inspectionWithUser.users?.email || "N/A"}</div>
        </div>
      </div>

      <div className="score-section">
        <h2>Resultado da Vistoria</h2>
        <span className={`rating-badge ${ratingClass}`}>
          {inspection.rating}
        </span>
        <div className="score-grid">
          <div className="score-item">
            <div className="score-label">Pontos Possíveis</div>
            <div className="score-value">{inspection.total_points}</div>
          </div>
          <div className="score-item">
            <div className="score-label">Pontos Alcançados</div>
            <div className="score-value">{inspection.points_achieved}</div>
          </div>
          <div className="score-item">
            <div className="score-label">Percentual</div>
            <div className="score-value">{inspection.percentage.toFixed(1)}%</div>
          </div>
          <div className="score-item">
            <div className="score-label">Aproveitamento</div>
            <div className="score-value">{inspection.rating}</div>
          </div>
        </div>
      </div>

      {Object.entries(groupedItems).map(([category, categoryItems]) => (
        <div key={category} className="category">
          <div className="category-title">{category}</div>
          <div className="category-items">
            {categoryItems.map((item: any) => (
              <div key={item.id} className="item">
                <div className="item-header">
                  <div>
                    <div className="item-name">{item.item_name}</div>
                    <div className="item-points">{item.points} pontos</div>
                  </div>
                  <span className={`status-badge status-${item.status.toLowerCase()}`}>{item.status}</span>
                </div>
                {(item.observation || item.responsible || (item.photos && item.photos.length > 0) || item.photo_url) && (
                  <div className="item-details">
                    {item.observation && <div><strong>Observação:</strong> {item.observation}</div>}
                    {item.responsible && <div style={{ marginTop: '5px' }}><strong>Responsável:</strong> {item.responsible}</div>}
                    {((item.photos && item.photos.length > 0) || item.photo_url) && (
                      <div style={{ marginTop: '10px' }}>
                        <strong>Fotos:</strong><br/>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '5px' }}>
                          {item.photos && item.photos.length > 0 ? (
                            item.photos.map((photo: string, idx: number) => (
                              <img 
                                key={idx}
                                src={photo} 
                                alt={`Foto ${idx + 1}`}
                                style={{ 
                                  maxWidth: '200px', 
                                  maxHeight: '200px', 
                                  borderRadius: '4px', 
                                  border: '1px solid #ddd',
                                  objectFit: 'cover'
                                }} 
                              />
                            ))
                          ) : item.photo_url ? (
                             <img 
                              src={item.photo_url} 
                              alt="Foto da vistoria"
                              style={{ 
                                maxWidth: '200px', 
                                maxHeight: '200px', 
                                borderRadius: '4px', 
                                border: '1px solid #ddd',
                                objectFit: 'cover'
                              }} 
                            />
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="footer">
        <p>Relatório gerado em {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")}</p>
        <p>Bar do Português - Sistema de Vistorias Automatizado</p>
      </div>
    </div>
  )
}
